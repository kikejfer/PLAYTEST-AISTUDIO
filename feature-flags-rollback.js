/**
 * Sistema de Rollback Automático - PLAYTEST
 * Monitoreo y reversión automática de cambios problemáticos
 */

import { featureFlagsDB } from './feature-flags-database.js';
import { featureFlagsAPI } from './feature-flags-api.js';

export class AutoRollbackSystem {
  constructor() {
    this.monitoringActive = false;
    this.rollbackTriggers = new Map();
    this.activeMonitors = new Map();
    this.rollbackHistory = [];
    
    this.initializeRollbackSystem();
  }

  async initializeRollbackSystem() {
    try {
      // Configurar triggers por defecto
      this.setupDefaultTriggers();
      
      // Cargar configuración personalizada
      await this.loadRollbackConfig();
      
      // Iniciar monitoreo
      this.startMonitoring();
      
      // Configurar cleanup automático
      this.setupCleanup();
      
      console.log('🔄 Auto Rollback System initialized successfully');
    } catch (error) {
      console.error('Error initializing rollback system:', error);
    }
  }

  setupDefaultTriggers() {
    // Trigger por tasa de errores alta
    this.rollbackTriggers.set('error_rate', {
      name: 'High Error Rate',
      description: 'Trigger rollback when error rate exceeds threshold',
      threshold: 0.05, // 5%
      window_minutes: 10,
      min_samples: 50,
      enabled: true,
      severity: 'high'
    });

    // Trigger por tiempo de respuesta lento
    this.rollbackTriggers.set('response_time', {
      name: 'Slow Response Time',
      description: 'Trigger rollback when response time is too slow',
      threshold: 2000, // 2 segundos
      window_minutes: 5,
      min_samples: 20,
      enabled: true,
      severity: 'medium'
    });

    // Trigger por quejas de usuarios
    this.rollbackTriggers.set('user_complaints', {
      name: 'User Complaints',
      description: 'Trigger rollback when too many user complaints',
      threshold: 10, // 10 quejas
      window_minutes: 30,
      min_samples: 5,
      enabled: true,
      severity: 'high'
    });

    // Trigger por caída en conversiones
    this.rollbackTriggers.set('conversion_drop', {
      name: 'Conversion Rate Drop',
      description: 'Trigger rollback when conversion rate drops significantly',
      threshold: 0.2, // 20% de caída
      window_minutes: 60,
      min_samples: 100,
      enabled: true,
      severity: 'high'
    });

    // Trigger por excepciones de JavaScript
    this.rollbackTriggers.set('js_exceptions', {
      name: 'JavaScript Exceptions',
      description: 'Trigger rollback when JS exceptions spike',
      threshold: 0.1, // 10%
      window_minutes: 5,
      min_samples: 10,
      enabled: true,
      severity: 'high'
    });
  }

  async loadRollbackConfig() {
    try {
      const config = localStorage.getItem('playtest_rollback_config');
      if (config) {
        const customConfig = JSON.parse(config);
        
        // Aplicar configuración personalizada
        for (const [triggerId, triggerConfig] of Object.entries(customConfig.triggers || {})) {
          this.rollbackTriggers.set(triggerId, {
            ...this.rollbackTriggers.get(triggerId),
            ...triggerConfig
          });
        }
      }
    } catch (error) {
      console.error('Error loading rollback config:', error);
    }
  }

  startMonitoring() {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    
    // Monitoreo cada 30 segundos
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCheck();
    }, 30 * 1000);

    // Escuchar eventos del sistema
    this.setupEventListeners();
    
    console.log('🔍 Rollback monitoring started');
  }

  stopMonitoring() {
    if (!this.monitoringActive) return;
    
    this.monitoringActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log('🔍 Rollback monitoring stopped');
  }

  setupEventListeners() {
    // Escuchar cambios de feature flags
    window.addEventListener('featureFlagChanged', (event) => {
      this.onFeatureFlagChanged(event.detail);
    });

    // Escuchar errores de JavaScript
    window.addEventListener('error', (event) => {
      this.recordJSException(event);
    });

    // Escuchar errores de promesas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      this.recordJSException(event);
    });

    // Escuchar eventos de performance
    if ('PerformanceObserver' in window) {
      this.setupPerformanceMonitoring();
    }
  }

  setupPerformanceMonitoring() {
    try {
      // Monitorear navegación
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric('navigation', entry);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

      // Monitorear recursos
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric('resource', entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

    } catch (error) {
      console.error('Error setting up performance monitoring:', error);
    }
  }

  onFeatureFlagChanged(detail) {
    const { flagKey, newValue, oldValue } = detail;
    
    // Crear monitor para el flag cambiado
    const monitorId = this.createFlagMonitor(flagKey, newValue, oldValue);
    
    // Programar verificación inicial después de 2 minutos
    setTimeout(() => {
      this.checkFlagHealth(monitorId);
    }, 2 * 60 * 1000);
    
    console.log(`🔍 Started monitoring flag: ${flagKey} (${oldValue} → ${newValue})`);
  }

  createFlagMonitor(flagKey, newValue, oldValue) {
    const monitorId = `monitor_${flagKey}_${Date.now()}`;
    
    const monitor = {
      id: monitorId,
      flag_key: flagKey,
      new_value: newValue,
      old_value: oldValue,
      created_at: new Date().toISOString(),
      status: 'active',
      metrics: {
        error_count: 0,
        total_requests: 0,
        avg_response_time: 0,
        user_complaints: 0,
        js_exceptions: 0
      },
      triggers_fired: [],
      rollback_eligible: true
    };
    
    this.activeMonitors.set(monitorId, monitor);
    return monitorId;
  }

  async performMonitoringCheck() {
    try {
      // Verificar cada monitor activo
      for (const [monitorId, monitor] of this.activeMonitors) {
        await this.checkFlagHealth(monitorId);
      }
      
      // Limpiar monitores antiguos (>24 horas)
      this.cleanupOldMonitors();
      
    } catch (error) {
      console.error('Error in monitoring check:', error);
    }
  }

  async checkFlagHealth(monitorId) {
    const monitor = this.activeMonitors.get(monitorId);
    if (!monitor || monitor.status !== 'active') return;

    try {
      // Recopilar métricas actuales
      const currentMetrics = await this.collectMetrics(monitor.flag_key);
      
      // Actualizar métricas del monitor
      monitor.metrics = { ...monitor.metrics, ...currentMetrics };
      monitor.last_check = new Date().toISOString();
      
      // Verificar cada trigger
      for (const [triggerId, trigger] of this.rollbackTriggers) {
        if (!trigger.enabled) continue;
        
        const triggerResult = await this.evaluateTrigger(trigger, monitor);
        
        if (triggerResult.fired) {
          monitor.triggers_fired.push({
            trigger_id: triggerId,
            fired_at: new Date().toISOString(),
            reason: triggerResult.reason,
            severity: trigger.severity,
            metrics: triggerResult.metrics
          });
          
          console.warn(`🚨 Rollback trigger fired: ${trigger.name} for ${monitor.flag_key}`);
          
          // Evaluar si ejecutar rollback
          if (await this.shouldExecuteRollback(monitor, trigger)) {
            await this.executeAutoRollback(monitorId, triggerResult);
          }
        }
      }
      
    } catch (error) {
      console.error(`Error checking health for monitor ${monitorId}:`, error);
    }
  }

  async collectMetrics(flagKey) {
    // Simular recolección de métricas reales
    // En implementación real, esto se conectaría a sistemas de monitoreo
    
    const metrics = {
      timestamp: new Date().toISOString(),
      error_rate: Math.random() * 0.1, // 0-10%
      avg_response_time: 500 + Math.random() * 1500, // 500-2000ms
      total_requests: Math.floor(Math.random() * 1000) + 100,
      user_complaints: Math.floor(Math.random() * 5),
      js_exceptions: Math.floor(Math.random() * 10),
      conversion_rate: 0.05 + Math.random() * 0.1 // 5-15%
    };
    
    // Guardar métricas históricas
    this.saveMetricsHistory(flagKey, metrics);
    
    return metrics;
  }

  async evaluateTrigger(trigger, monitor) {
    const result = {
      fired: false,
      reason: '',
      metrics: monitor.metrics
    };
    
    switch (trigger.name) {
      case 'High Error Rate':
        if (monitor.metrics.error_rate > trigger.threshold && 
            monitor.metrics.total_requests >= trigger.min_samples) {
          result.fired = true;
          result.reason = `Error rate ${(monitor.metrics.error_rate * 100).toFixed(2)}% exceeds threshold ${(trigger.threshold * 100).toFixed(2)}%`;
        }
        break;
        
      case 'Slow Response Time':
        if (monitor.metrics.avg_response_time > trigger.threshold && 
            monitor.metrics.total_requests >= trigger.min_samples) {
          result.fired = true;
          result.reason = `Response time ${monitor.metrics.avg_response_time.toFixed(0)}ms exceeds threshold ${trigger.threshold}ms`;
        }
        break;
        
      case 'User Complaints':
        if (monitor.metrics.user_complaints > trigger.threshold) {
          result.fired = true;
          result.reason = `User complaints ${monitor.metrics.user_complaints} exceed threshold ${trigger.threshold}`;
        }
        break;
        
      case 'Conversion Rate Drop':
        const historicalConversion = await this.getHistoricalConversionRate(monitor.flag_key);
        if (historicalConversion > 0) {
          const dropPercentage = (historicalConversion - monitor.metrics.conversion_rate) / historicalConversion;
          if (dropPercentage > trigger.threshold && 
              monitor.metrics.total_requests >= trigger.min_samples) {
            result.fired = true;
            result.reason = `Conversion rate dropped ${(dropPercentage * 100).toFixed(2)}% from historical average`;
          }
        }
        break;
        
      case 'JavaScript Exceptions':
        const exceptionRate = monitor.metrics.js_exceptions / monitor.metrics.total_requests;
        if (exceptionRate > trigger.threshold && 
            monitor.metrics.total_requests >= trigger.min_samples) {
          result.fired = true;
          result.reason = `JS exception rate ${(exceptionRate * 100).toFixed(2)}% exceeds threshold ${(trigger.threshold * 100).toFixed(2)}%`;
        }
        break;
    }
    
    return result;
  }

  async shouldExecuteRollback(monitor, trigger) {
    // Verificar si hay múltiples triggers de alta severidad
    const highSeverityTriggers = monitor.triggers_fired.filter(t => t.severity === 'high');
    
    if (highSeverityTriggers.length >= 2) {
      return true; // Múltiples problemas críticos
    }
    
    if (trigger.severity === 'high' && monitor.triggers_fired.length >= 1) {
      return true; // Un problema crítico confirmado
    }
    
    // Verificar cooldown period para evitar rollbacks frecuentes
    const recentRollbacks = this.rollbackHistory.filter(rb => {
      const rollbackTime = new Date(rb.executed_at);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      return rollbackTime > tenMinutesAgo && rb.flag_key === monitor.flag_key;
    });
    
    if (recentRollbacks.length > 0) {
      console.log(`🕐 Rollback skipped for ${monitor.flag_key} - cooldown period active`);
      return false;
    }
    
    return false;
  }

  async executeAutoRollback(monitorId, triggerResult) {
    const monitor = this.activeMonitors.get(monitorId);
    if (!monitor) return;

    try {
      console.log(`🔄 Executing auto rollback for ${monitor.flag_key}`);
      
      // Crear punto de rollback antes de revertir
      const rollbackPoint = featureFlagsDB.createRollbackPoint(
        `Auto rollback for ${monitor.flag_key} - ${triggerResult.reason}`,
        'auto_rollback_system'
      );
      
      // Revertir al valor anterior
      const result = await featureFlagsAPI.updateFlag(
        monitor.flag_key,
        monitor.old_value,
        {
          user_id: 'auto_rollback_system',
          source: 'automatic_rollback',
          monitor_id: monitorId,
          trigger_reason: triggerResult.reason,
          rollback_point_id: rollbackPoint.rollback_id
        }
      );
      
      if (result.success) {
        // Registrar rollback exitoso
        const rollbackRecord = {
          id: this.generateRollbackId(),
          flag_key: monitor.flag_key,
          reverted_from: monitor.new_value,
          reverted_to: monitor.old_value,
          trigger_reason: triggerResult.reason,
          trigger_metrics: triggerResult.metrics,
          executed_at: new Date().toISOString(),
          monitor_id: monitorId,
          rollback_point_id: rollbackPoint.rollback_id,
          status: 'success'
        };
        
        this.rollbackHistory.push(rollbackRecord);
        this.saveRollbackHistory();
        
        // Actualizar estado del monitor
        monitor.status = 'rolled_back';
        monitor.rollback_executed_at = new Date().toISOString();
        monitor.rollback_reason = triggerResult.reason;
        
        // Log del evento
        featureFlagsDB.logAction(
          'AUTO_ROLLBACK_EXECUTED',
          'auto_rollback_system',
          `Auto rollback executed for ${monitor.flag_key}: ${triggerResult.reason}`,
          {
            monitor_id: monitorId,
            flag_key: monitor.flag_key,
            trigger_reason: triggerResult.reason,
            reverted_from: monitor.new_value,
            reverted_to: monitor.old_value,
            rollback_id: rollbackRecord.id
          }
        );
        
        // Enviar notificaciones de emergencia
        await this.sendRollbackNotification(monitor, rollbackRecord);
        
        // Deshabilitar monitoreo para este flag temporalmente
        this.disableMonitoringTemporarily(monitor.flag_key);
        
        console.log(`✅ Auto rollback completed for ${monitor.flag_key}`);
        
      } else {
        console.error(`❌ Auto rollback failed for ${monitor.flag_key}:`, result.error);
        
        // Registrar fallo de rollback
        const failedRollback = {
          id: this.generateRollbackId(),
          flag_key: monitor.flag_key,
          trigger_reason: triggerResult.reason,
          executed_at: new Date().toISOString(),
          status: 'failed',
          error: result.error
        };
        
        this.rollbackHistory.push(failedRollback);
        this.saveRollbackHistory();
        
        // Enviar alerta crítica
        await this.sendCriticalAlert(monitor, failedRollback);
      }
      
    } catch (error) {
      console.error('Error executing auto rollback:', error);
      
      // Registrar error
      const errorRollback = {
        id: this.generateRollbackId(),
        flag_key: monitor.flag_key,
        trigger_reason: triggerResult.reason,
        executed_at: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
      
      this.rollbackHistory.push(errorRollback);
      this.saveRollbackHistory();
    }
  }

  disableMonitoringTemporarily(flagKey) {
    // Deshabilitar monitoreo por 30 minutos para evitar rollbacks frecuentes
    setTimeout(() => {
      console.log(`🔍 Re-enabling monitoring for ${flagKey}`);
    }, 30 * 60 * 1000);
    
    // Marcar monitores activos como temporalmente deshabilitados
    for (const [monitorId, monitor] of this.activeMonitors) {
      if (monitor.flag_key === flagKey && monitor.status === 'active') {
        monitor.status = 'temporarily_disabled';
        monitor.disabled_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }
    }
  }

  async sendRollbackNotification(monitor, rollbackRecord) {
    const notification = {
      type: 'auto_rollback_executed',
      severity: 'high',
      title: `🔄 Auto Rollback Executed`,
      message: `Feature flag ${monitor.flag_key} was automatically rolled back due to: ${rollbackRecord.trigger_reason}`,
      details: {
        flag_key: monitor.flag_key,
        reverted_from: monitor.new_value,
        reverted_to: monitor.old_value,
        trigger_reason: rollbackRecord.trigger_reason,
        executed_at: rollbackRecord.executed_at,
        monitor_id: monitor.id
      }
    };
    
    console.log('🚨 Rollback Notification:', notification);
    
    // Implementar envío real de notificaciones
    // await this.notificationService.sendEmergencyNotification(notification);
    
    // Disparar evento para la UI
    const event = new CustomEvent('autoRollbackExecuted', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  async sendCriticalAlert(monitor, failedRollback) {
    const alert = {
      type: 'rollback_failed',
      severity: 'critical',
      title: `🚨 CRITICAL: Auto Rollback Failed`,
      message: `Failed to rollback feature flag ${monitor.flag_key}. Manual intervention required!`,
      details: {
        flag_key: monitor.flag_key,
        trigger_reason: failedRollback.trigger_reason,
        error: failedRollback.error,
        executed_at: failedRollback.executed_at
      }
    };
    
    console.error('🚨 CRITICAL ALERT:', alert);
    
    // Implementar envío de alertas críticas
    // await this.notificationService.sendCriticalAlert(alert);
  }

  recordJSException(event) {
    // Registrar excepción de JavaScript
    const exception = {
      timestamp: new Date().toISOString(),
      message: event.reason?.message || event.message || 'Unknown error',
      filename: event.filename || 'Unknown file',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
      stack: event.reason?.stack || event.error?.stack || '',
      user_agent: navigator.userAgent
    };
    
    // Actualizar métricas de monitores activos
    for (const [monitorId, monitor] of this.activeMonitors) {
      if (monitor.status === 'active') {
        monitor.metrics.js_exceptions++;
      }
    }
    
    // Guardar excepción para análisis
    this.saveExceptionHistory(exception);
  }

  recordPerformanceMetric(type, entry) {
    const metric = {
      timestamp: new Date().toISOString(),
      type: type,
      name: entry.name,
      duration: entry.duration,
      start_time: entry.startTime,
      entry_type: entry.entryType
    };
    
    // Actualizar métricas de monitores activos
    for (const [monitorId, monitor] of this.activeMonitors) {
      if (monitor.status === 'active') {
        if (type === 'navigation') {
          monitor.metrics.avg_response_time = entry.duration;
        }
        monitor.metrics.total_requests++;
      }
    }
    
    // Guardar métrica para análisis
    this.savePerformanceHistory(metric);
  }

  // Métodos de persistencia
  saveRollbackHistory() {
    // Mantener solo últimos 100 rollbacks
    const recentHistory = this.rollbackHistory.slice(-100);
    localStorage.setItem('playtest_rollback_history', JSON.stringify(recentHistory));
  }

  saveMetricsHistory(flagKey, metrics) {
    const key = `playtest_metrics_${flagKey}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    existing.push(metrics);
    
    // Mantener solo últimas 24 horas de métricas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = existing.filter(m => new Date(m.timestamp) > twentyFourHoursAgo);
    
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  saveExceptionHistory(exception) {
    const existing = JSON.parse(localStorage.getItem('playtest_js_exceptions') || '[]');
    existing.push(exception);
    
    // Mantener solo últimas 1000 excepciones
    const recent = existing.slice(-1000);
    localStorage.setItem('playtest_js_exceptions', JSON.stringify(recent));
  }

  savePerformanceHistory(metric) {
    const existing = JSON.parse(localStorage.getItem('playtest_performance_metrics') || '[]');
    existing.push(metric);
    
    // Mantener solo últimas 1000 métricas
    const recent = existing.slice(-1000);
    localStorage.setItem('playtest_performance_metrics', JSON.stringify(recent));
  }

  // Métodos de utilidad
  async getHistoricalConversionRate(flagKey) {
    const key = `playtest_metrics_${flagKey}`;
    const metrics = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (metrics.length === 0) return 0;
    
    const totalConversion = metrics.reduce((sum, m) => sum + (m.conversion_rate || 0), 0);
    return totalConversion / metrics.length;
  }

  cleanupOldMonitors() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [monitorId, monitor] of this.activeMonitors) {
      const monitorAge = new Date(monitor.created_at);
      if (monitorAge < twentyFourHoursAgo) {
        this.activeMonitors.delete(monitorId);
      }
    }
  }

  setupCleanup() {
    // Limpiar datos antiguos cada hora
    setInterval(() => {
      this.cleanupOldMonitors();
      this.cleanupOldData();
    }, 60 * 60 * 1000); // 1 hora
  }

  cleanupOldData() {
    // Limpiar métricas, excepciones y datos de performance antiguos
    const keys = ['playtest_js_exceptions', 'playtest_performance_metrics'];
    
    for (const key of keys) {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const filtered = data.filter(item => new Date(item.timestamp) > sevenDaysAgo);
      
      if (filtered.length !== data.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    }
  }

  generateRollbackId() {
    return `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // API pública
  getRollbackHistory() {
    return [...this.rollbackHistory];
  }

  getActiveMonitors() {
    return Array.from(this.activeMonitors.values());
  }

  getTriggerConfig() {
    return Object.fromEntries(this.rollbackTriggers);
  }

  updateTriggerConfig(triggerId, config) {
    const existing = this.rollbackTriggers.get(triggerId);
    if (existing) {
      this.rollbackTriggers.set(triggerId, { ...existing, ...config });
      this.saveRollbackConfig();
      return true;
    }
    return false;
  }

  saveRollbackConfig() {
    const config = {
      triggers: Object.fromEntries(this.rollbackTriggers),
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('playtest_rollback_config', JSON.stringify(config));
  }

  getSystemHealth() {
    const activeMonitorsCount = this.activeMonitors.size;
    const recentRollbacks = this.rollbackHistory.filter(rb => {
      const rollbackTime = new Date(rb.executed_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return rollbackTime > oneHourAgo;
    });
    
    return {
      monitoring_active: this.monitoringActive,
      active_monitors: activeMonitorsCount,
      recent_rollbacks: recentRollbacks.length,
      total_rollbacks: this.rollbackHistory.length,
      health_status: recentRollbacks.length === 0 ? 'healthy' : 
                    recentRollbacks.length < 3 ? 'warning' : 'critical'
    };
  }
}

// Instancia singleton
export const autoRollbackSystem = new AutoRollbackSystem();