/**
 * Sistema de Activación Programada - PLAYTEST
 * Gestión de cambios programados y rollouts graduales
 */

import { featureFlagsDB } from './feature-flags-database.js';
import { featureFlagsAPI } from './feature-flags-api.js';

export class FeatureFlagsScheduler {
  constructor() {
    this.activeSchedules = new Map();
    this.rolloutProcesses = new Map();
    this.schedulerInterval = null;
    
    this.initializeScheduler();
  }

  async initializeScheduler() {
    try {
      // Cargar programaciones pendientes
      await this.loadPendingSchedules();
      
      // Iniciar el planificador
      this.startScheduler();
      
      // Configurar limpieza automática
      this.setupAutoCleanup();
      
      console.log('📅 Feature Flags Scheduler initialized successfully');
    } catch (error) {
      console.error('Error initializing scheduler:', error);
    }
  }

  async loadPendingSchedules() {
    const schedules = featureFlagsDB.getSchedules();
    const pendingSchedules = Object.values(schedules).filter(schedule => 
      schedule.status === 'pending' && new Date(schedule.scheduled_time) > new Date()
    );

    for (const schedule of pendingSchedules) {
      this.activeSchedules.set(schedule.id, schedule);
    }

    console.log(`Loaded ${pendingSchedules.length} pending schedules`);
  }

  startScheduler() {
    // Verificar cada minuto si hay programaciones que ejecutar
    this.schedulerInterval = setInterval(() => {
      this.checkScheduledTasks();
    }, 60 * 1000); // 1 minuto

    console.log('📅 Scheduler started - checking every minute');
  }

  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log('📅 Scheduler stopped');
    }
  }

  // Programar cambio de feature flag
  async scheduleFeatureChange(config) {
    try {
      // Validar configuración
      const validation = this.validateScheduleConfig(config);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Crear programación
      const schedule = {
        id: this.generateScheduleId(),
        flag_key: config.flagKey,
        action: config.action, // 'enable', 'disable', 'toggle'
        scheduled_time: config.scheduledTime,
        rollout_strategy: config.rolloutStrategy || 'immediate',
        rollout_percentage: config.rolloutPercentage || 100,
        rollout_duration_minutes: config.rolloutDurationMinutes || 60,
        user_segment: config.userSegment || 'all_users',
        created_at: new Date().toISOString(),
        created_by: config.userId,
        status: 'pending',
        notifications: config.notifications || [],
        rollback_config: config.rollbackConfig || null,
        dependencies_check: config.checkDependencies !== false,
        metadata: config.metadata || {}
      };

      // Guardar en base de datos
      const result = featureFlagsDB.scheduleFeatureChange(schedule);
      
      if (result.success) {
        // Agregar a programaciones activas
        this.activeSchedules.set(result.schedule_id, schedule);
        
        // Log del evento
        featureFlagsDB.logAction(
          'FEATURE_SCHEDULED', 
          config.userId, 
          `Scheduled ${config.action} for ${config.flagKey} at ${config.scheduledTime}`, 
          {
            schedule_id: result.schedule_id,
            flag_key: config.flagKey,
            scheduled_time: config.scheduledTime,
            rollout_strategy: config.rolloutStrategy
          }
        );

        // Programar notificaciones previas si están configuradas
        this.schedulePreNotifications(schedule);

        return { 
          success: true, 
          schedule_id: result.schedule_id,
          execution_time: config.scheduledTime
        };
      }

      return result;
    } catch (error) {
      console.error('Error scheduling feature change:', error);
      return { success: false, error: error.message };
    }
  }

  // Validar configuración de programación
  validateScheduleConfig(config) {
    const errors = [];
    
    if (!config.flagKey) {
      errors.push('Flag key is required');
    }
    
    if (!config.action || !['enable', 'disable', 'toggle'].includes(config.action)) {
      errors.push('Valid action is required (enable, disable, toggle)');
    }
    
    if (!config.scheduledTime) {
      errors.push('Scheduled time is required');
    }
    
    const scheduledDate = new Date(config.scheduledTime);
    if (scheduledDate <= new Date()) {
      errors.push('Scheduled time must be in the future');
    }
    
    if (config.rolloutPercentage && (config.rolloutPercentage < 1 || config.rolloutPercentage > 100)) {
      errors.push('Rollout percentage must be between 1 and 100');
    }
    
    if (config.rolloutDurationMinutes && config.rolloutDurationMinutes < 1) {
      errors.push('Rollout duration must be at least 1 minute');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Verificar tareas programadas
  async checkScheduledTasks() {
    const now = new Date();
    
    for (const [scheduleId, schedule] of this.activeSchedules) {
      const scheduledTime = new Date(schedule.scheduled_time);
      
      if (scheduledTime <= now && schedule.status === 'pending') {
        await this.executeScheduledTask(scheduleId);
      }
    }
  }

  // Ejecutar tarea programada
  async executeScheduledTask(scheduleId) {
    const schedule = this.activeSchedules.get(scheduleId);
    if (!schedule) return;

    try {
      // Actualizar estado a 'executing'
      await this.updateScheduleStatus(scheduleId, 'executing');
      
      // Log inicio de ejecución
      featureFlagsDB.logAction(
        'SCHEDULE_EXECUTING', 
        'scheduler', 
        `Executing scheduled task: ${schedule.action} for ${schedule.flag_key}`, 
        { schedule_id: scheduleId }
      );

      // Verificar dependencias si está configurado
      if (schedule.dependencies_check) {
        const dependencyCheck = await this.validateDependencies(schedule);
        if (!dependencyCheck.valid) {
          await this.handleDependencyFailure(scheduleId, dependencyCheck.issues);
          return;
        }
      }

      // Ejecutar según estrategia de rollout
      let result;
      switch (schedule.rollout_strategy) {
        case 'immediate':
          result = await this.executeImmediateRollout(schedule);
          break;
        case 'gradual':
          result = await this.executeGradualRollout(schedule);
          break;
        case 'canary':
          result = await this.executeCanaryRollout(schedule);
          break;
        default:
          result = await this.executeImmediateRollout(schedule);
      }

      if (result.success) {
        await this.updateScheduleStatus(scheduleId, 'completed');
        
        // Enviar notificaciones de éxito
        await this.sendNotifications(schedule, 'success', result);
        
        // Remover de programaciones activas
        this.activeSchedules.delete(scheduleId);
        
        featureFlagsDB.logAction(
          'SCHEDULE_COMPLETED', 
          'scheduler', 
          `Completed scheduled task: ${schedule.action} for ${schedule.flag_key}`, 
          { 
            schedule_id: scheduleId,
            execution_result: result
          }
        );
      } else {
        await this.handleExecutionFailure(scheduleId, result.error);
      }

    } catch (error) {
      console.error(`Error executing scheduled task ${scheduleId}:`, error);
      await this.handleExecutionFailure(scheduleId, error.message);
    }
  }

  // Rollout inmediato
  async executeImmediateRollout(schedule) {
    try {
      const targetValue = this.calculateTargetValue(schedule);
      
      const result = await featureFlagsAPI.updateFlag(
        schedule.flag_key, 
        targetValue, 
        {
          user_id: 'scheduler',
          source: 'scheduled_change',
          schedule_id: schedule.id,
          rollout_strategy: 'immediate'
        }
      );

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Rollout gradual
  async executeGradualRollout(schedule) {
    try {
      const rolloutId = this.generateRolloutId();
      const targetValue = this.calculateTargetValue(schedule);
      
      // Crear proceso de rollout gradual
      const rolloutProcess = {
        id: rolloutId,
        schedule_id: schedule.id,
        flag_key: schedule.flag_key,
        target_value: targetValue,
        current_percentage: 0,
        target_percentage: schedule.rollout_percentage || 100,
        duration_minutes: schedule.rollout_duration_minutes || 60,
        user_segment: schedule.user_segment,
        start_time: new Date().toISOString(),
        status: 'running',
        steps: []
      };

      this.rolloutProcesses.set(rolloutId, rolloutProcess);
      
      // Iniciar rollout gradual
      await this.startGradualRollout(rolloutId);
      
      return { 
        success: true, 
        rollout_id: rolloutId,
        message: 'Gradual rollout started'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Iniciar rollout gradual
  async startGradualRollout(rolloutId) {
    const rollout = this.rolloutProcesses.get(rolloutId);
    if (!rollout) return;

    const steps = this.calculateRolloutSteps(rollout);
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Esperar al tiempo del paso
      await this.sleep(step.delay_minutes * 60 * 1000);
      
      // Ejecutar paso
      await this.executeRolloutStep(rolloutId, step);
      
      // Verificar métricas después del paso
      const healthCheck = await this.performHealthCheck(rollout.flag_key);
      
      if (!healthCheck.healthy) {
        // Detener rollout y hacer rollback
        await this.emergencyRollback(rolloutId, healthCheck.issues);
        break;
      }
      
      rollout.current_percentage = step.percentage;
      rollout.steps.push({
        ...step,
        executed_at: new Date().toISOString(),
        health_check: healthCheck
      });
    }
    
    // Marcar rollout como completado
    rollout.status = 'completed';
    rollout.completed_at = new Date().toISOString();
  }

  // Calcular pasos del rollout
  calculateRolloutSteps(rollout) {
    const totalSteps = 5; // Rollout en 5 pasos
    const stepPercentage = rollout.target_percentage / totalSteps;
    const stepDelay = rollout.duration_minutes / totalSteps;
    
    const steps = [];
    for (let i = 1; i <= totalSteps; i++) {
      steps.push({
        step_number: i,
        percentage: Math.min(stepPercentage * i, rollout.target_percentage),
        delay_minutes: i === 1 ? 0 : stepDelay,
        description: `Step ${i}: ${Math.round(stepPercentage * i)}% rollout`
      });
    }
    
    return steps;
  }

  // Ejecutar paso de rollout
  async executeRolloutStep(rolloutId, step) {
    const rollout = this.rolloutProcesses.get(rolloutId);
    if (!rollout) return;

    // Simular aplicación gradual por porcentaje de usuarios
    // En implementación real, esto se manejaría con lógica de segmentación
    
    featureFlagsDB.logAction(
      'ROLLOUT_STEP', 
      'scheduler', 
      `Executing rollout step ${step.step_number} for ${rollout.flag_key}`, 
      {
        rollout_id: rolloutId,
        step: step,
        current_percentage: step.percentage
      }
    );

    // Si es el último paso, aplicar el cambio completo
    if (step.percentage >= rollout.target_percentage) {
      await featureFlagsAPI.updateFlag(
        rollout.flag_key, 
        rollout.target_value, 
        {
          user_id: 'scheduler',
          source: 'gradual_rollout_final',
          rollout_id: rolloutId
        }
      );
    }
  }

  // Rollout canary (a pequeño grupo de usuarios primero)
  async executeCanaryRollout(schedule) {
    try {
      // Aplicar a 5% de usuarios primero
      const canaryResult = await this.executeGradualRollout({
        ...schedule,
        rollout_percentage: 5,
        rollout_duration_minutes: 30
      });

      if (!canaryResult.success) {
        return canaryResult;
      }

      // Monitorear métricas por 30 minutos
      await this.sleep(30 * 60 * 1000); // 30 minutos
      
      const healthCheck = await this.performHealthCheck(schedule.flag_key);
      
      if (healthCheck.healthy) {
        // Si el canary es exitoso, continuar con rollout completo
        return await this.executeGradualRollout({
          ...schedule,
          rollout_percentage: 100,
          rollout_duration_minutes: 60
        });
      } else {
        // Si hay problemas, hacer rollback
        await this.emergencyRollback(canaryResult.rollout_id, healthCheck.issues);
        return { 
          success: false, 
          error: 'Canary rollout failed health check',
          issues: healthCheck.issues
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Calcular valor objetivo del flag
  calculateTargetValue(schedule) {
    const currentValue = featureFlagsDB.getFeatureFlag(schedule.flag_key, false);
    
    switch (schedule.action) {
      case 'enable':
        return true;
      case 'disable':
        return false;
      case 'toggle':
        return !currentValue;
      default:
        return currentValue;
    }
  }

  // Validar dependencias antes de ejecutar
  async validateDependencies(schedule) {
    try {
      const targetValue = this.calculateTargetValue(schedule);
      const validation = await featureFlagsAPI.validateDependencies(
        schedule.flag_key, 
        targetValue
      );
      
      return {
        valid: validation.validation.can_change,
        issues: validation.validation.issues || []
      };
    } catch (error) {
      return {
        valid: false,
        issues: [{ message: error.message }]
      };
    }
  }

  // Realizar verificación de salud del sistema
  async performHealthCheck(flagKey) {
    // Implementar verificaciones de salud específicas
    const checks = {
      error_rate: await this.checkErrorRate(flagKey),
      response_time: await this.checkResponseTime(flagKey),
      user_complaints: await this.checkUserComplaints(flagKey)
    };

    const healthyChecks = Object.values(checks).filter(check => check.healthy);
    const healthy = healthyChecks.length === Object.keys(checks).length;

    return {
      healthy,
      checks,
      issues: Object.values(checks)
        .filter(check => !check.healthy)
        .map(check => check.issue)
    };
  }

  async checkErrorRate(flagKey) {
    // Simular verificación de tasa de errores
    const errorRate = Math.random() * 0.1; // 0-10%
    return {
      healthy: errorRate < 0.05, // <5% es saludable
      metric: 'error_rate',
      value: errorRate,
      threshold: 0.05,
      issue: errorRate >= 0.05 ? 'Error rate too high' : null
    };
  }

  async checkResponseTime(flagKey) {
    // Simular verificación de tiempo de respuesta
    const responseTime = Math.random() * 2000; // 0-2000ms
    return {
      healthy: responseTime < 1000, // <1s es saludable
      metric: 'response_time',
      value: responseTime,
      threshold: 1000,
      issue: responseTime >= 1000 ? 'Response time too slow' : null
    };
  }

  async checkUserComplaints(flagKey) {
    // Simular verificación de quejas de usuarios
    const complaints = Math.floor(Math.random() * 10); // 0-10 quejas
    return {
      healthy: complaints < 5, // <5 quejas es saludable
      metric: 'user_complaints',
      value: complaints,
      threshold: 5,
      issue: complaints >= 5 ? 'Too many user complaints' : null
    };
  }

  // Rollback de emergencia
  async emergencyRollback(rolloutId, issues) {
    const rollout = this.rolloutProcesses.get(rolloutId);
    if (!rollout) return;

    try {
      // Detener rollout
      rollout.status = 'failed';
      rollout.failed_at = new Date().toISOString();
      rollout.failure_reason = issues;

      // Revertir flag a valor anterior
      const currentValue = featureFlagsDB.getFeatureFlag(rollout.flag_key, false);
      const revertValue = !rollout.target_value; // Valor opuesto al objetivo
      
      await featureFlagsAPI.updateFlag(
        rollout.flag_key, 
        revertValue, 
        {
          user_id: 'scheduler',
          source: 'emergency_rollback',
          rollout_id: rolloutId,
          reason: 'Health check failed'
        }
      );

      featureFlagsDB.logAction(
        'EMERGENCY_ROLLBACK', 
        'scheduler', 
        `Emergency rollback for ${rollout.flag_key} due to health check failure`, 
        {
          rollout_id: rolloutId,
          issues: issues,
          reverted_to: revertValue
        }
      );

      // Notificar a administradores
      await this.sendEmergencyNotification(rollout, issues);

    } catch (error) {
      console.error('Error in emergency rollback:', error);
    }
  }

  // Manejar fallos de dependencias
  async handleDependencyFailure(scheduleId, issues) {
    await this.updateScheduleStatus(scheduleId, 'failed');
    
    const schedule = this.activeSchedules.get(scheduleId);
    
    featureFlagsDB.logAction(
      'SCHEDULE_DEPENDENCY_FAILED', 
      'scheduler', 
      `Scheduled task failed dependency check: ${schedule.flag_key}`, 
      {
        schedule_id: scheduleId,
        dependency_issues: issues
      }
    );

    await this.sendNotifications(schedule, 'dependency_failure', { issues });
    this.activeSchedules.delete(scheduleId);
  }

  // Manejar fallos de ejecución
  async handleExecutionFailure(scheduleId, error) {
    await this.updateScheduleStatus(scheduleId, 'failed');
    
    const schedule = this.activeSchedules.get(scheduleId);
    
    featureFlagsDB.logAction(
      'SCHEDULE_EXECUTION_FAILED', 
      'scheduler', 
      `Scheduled task execution failed: ${schedule.flag_key}`, 
      {
        schedule_id: scheduleId,
        error: error
      }
    );

    await this.sendNotifications(schedule, 'execution_failure', { error });
    this.activeSchedules.delete(scheduleId);
  }

  // Actualizar estado de programación
  async updateScheduleStatus(scheduleId, status) {
    const schedules = featureFlagsDB.getSchedules();
    if (schedules[scheduleId]) {
      schedules[scheduleId].status = status;
      schedules[scheduleId].updated_at = new Date().toISOString();
      
      localStorage.setItem(featureFlagsDB.STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    }
  }

  // Programar notificaciones previas
  schedulePreNotifications(schedule) {
    if (!schedule.notifications || schedule.notifications.length === 0) return;

    const scheduledTime = new Date(schedule.scheduled_time);
    
    for (const notification of schedule.notifications) {
      const notificationTime = new Date(scheduledTime.getTime() - notification.minutes_before * 60 * 1000);
      
      if (notificationTime > new Date()) {
        setTimeout(() => {
          this.sendPreNotification(schedule, notification);
        }, notificationTime.getTime() - Date.now());
      }
    }
  }

  // Enviar notificación previa
  async sendPreNotification(schedule, notification) {
    const message = `Recordatorio: El cambio programado para ${schedule.flag_key} se ejecutará en ${notification.minutes_before} minutos`;
    
    console.log(`📅 Pre-notification: ${message}`);
    
    // Implementar envío real de notificaciones (email, Slack, etc.)
    // await this.notificationService.send(notification.recipients, message);
  }

  // Enviar notificaciones
  async sendNotifications(schedule, type, data) {
    const messages = {
      success: `✅ Cambio programado ejecutado exitosamente: ${schedule.flag_key}`,
      dependency_failure: `❌ Cambio programado falló por dependencias: ${schedule.flag_key}`,
      execution_failure: `❌ Cambio programado falló en ejecución: ${schedule.flag_key}`
    };

    const message = messages[type] || `Evento de programación: ${schedule.flag_key}`;
    
    console.log(`📩 Notification: ${message}`);
    
    // Implementar envío real de notificaciones
  }

  // Enviar notificación de emergencia
  async sendEmergencyNotification(rollout, issues) {
    const message = `🚨 EMERGENCIA: Rollback automático ejecutado para ${rollout.flag_key} por problemas de salud del sistema`;
    
    console.log(`🚨 Emergency notification: ${message}`);
    console.log('Issues:', issues);
    
    // Implementar envío de notificaciones de emergencia
  }

  // Cancelar programación
  async cancelSchedule(scheduleId, userId, reason) {
    try {
      const schedule = this.activeSchedules.get(scheduleId);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }

      await this.updateScheduleStatus(scheduleId, 'cancelled');
      this.activeSchedules.delete(scheduleId);

      featureFlagsDB.logAction(
        'SCHEDULE_CANCELLED', 
        userId, 
        `Cancelled scheduled task: ${schedule.flag_key}`, 
        {
          schedule_id: scheduleId,
          reason: reason
        }
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Configurar limpieza automática
  setupAutoCleanup() {
    // Limpiar programaciones completadas/fallidas cada día
    setInterval(() => {
      this.cleanupOldSchedules();
    }, 24 * 60 * 60 * 1000); // 24 horas
  }

  cleanupOldSchedules() {
    const schedules = featureFlagsDB.getSchedules();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    let cleaned = 0;
    for (const [id, schedule] of Object.entries(schedules)) {
      if (['completed', 'failed', 'cancelled'].includes(schedule.status)) {
        const scheduleDate = new Date(schedule.scheduled_time);
        if (scheduleDate < sevenDaysAgo) {
          delete schedules[id];
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      localStorage.setItem(featureFlagsDB.STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
      console.log(`🧹 Cleaned up ${cleaned} old schedules`);
    }
  }

  // Utilidades
  generateScheduleId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRolloutId() {
    return `rollout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API pública
  getActiveSchedules() {
    return Array.from(this.activeSchedules.values());
  }

  getScheduleById(scheduleId) {
    return this.activeSchedules.get(scheduleId);
  }

  getActiveRollouts() {
    return Array.from(this.rolloutProcesses.values());
  }

  getRolloutById(rolloutId) {
    return this.rolloutProcesses.get(rolloutId);
  }

  getScheduleStats() {
    const schedules = featureFlagsDB.getSchedules();
    const stats = {
      total: Object.keys(schedules).length,
      pending: 0,
      executing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    for (const schedule of Object.values(schedules)) {
      stats[schedule.status] = (stats[schedule.status] || 0) + 1;
    }

    return stats;
  }
}

// Instancia singleton
export const featureFlagsScheduler = new FeatureFlagsScheduler();