/**
 * Sistema de Base de Datos para Feature Flags - PLAYTEST
 * Gestión de persistencia en localStorage con estructura avanzada
 */

export class FeatureFlagsDatabase {
  constructor() {
    this.STORAGE_KEYS = {
      FEATURE_FLAGS: 'playtest_feature_flags',
      FEATURE_LOGS: 'playtest_feature_logs',
      AB_TESTS: 'playtest_ab_tests',
      SCHEDULES: 'playtest_feature_schedules',
      ROLLBACK_HISTORY: 'playtest_rollback_history',
      USER_SEGMENTS: 'playtest_user_segments',
      PERFORMANCE_METRICS: 'playtest_performance_metrics'
    };

    this.initializeDatabase();
  }

  // Inicializar base de datos
  initializeDatabase() {
    try {
      // Verificar si ya existe configuración
      const existingFlags = this.getFeatureFlags();
      if (!existingFlags || Object.keys(existingFlags).length === 0) {
        this.migrateFromLegacyConfig();
      }

      // Limpiar datos antiguos (>30 días)
      this.cleanupOldData();

      // Validar integridad de datos
      this.validateDataIntegrity();

    } catch (error) {
      console.error('Error initializing feature flags database:', error);
      this.resetToDefaults();
    }
  }

  // Migración desde configuración legacy
  migrateFromLegacyConfig() {
    try {
      // Buscar configuraciones existentes del sistema
      const legacyConfig = {
        chat_enabled: localStorage.getItem('chat_enabled') === 'true',
        competition_enabled: localStorage.getItem('competition_enabled') === 'true',
        luminarias_enabled: localStorage.getItem('luminarias_enabled') === 'true'
      };

      const migratedFlags = this.convertLegacyToNewFormat(legacyConfig);
      this.saveFeatureFlags(migratedFlags);

      this.logAction('MIGRATION', 'system', 'Migrated legacy configuration', {
        legacy_config: legacyConfig,
        migrated_flags: Object.keys(migratedFlags).length
      });

    } catch (error) {
      console.error('Migration failed:', error);
      this.resetToDefaults();
    }
  }

  // Convertir configuración legacy a nuevo formato
  convertLegacyToNewFormat(legacyConfig) {
    const { DEFAULT_FEATURE_FLAGS } = require('./feature-flags-config.js');
    const newFlags = { ...DEFAULT_FEATURE_FLAGS };

    // Mapear configuraciones legacy a nuevos flags
    if (legacyConfig.chat_enabled === false) {
      newFlags['communication.chat.enabled'] = false;
    }
    if (legacyConfig.competition_enabled === false) {
      newFlags['competition.duels.enabled'] = false;
      newFlags['competition.tournaments.enabled'] = false;
    }

    return newFlags;
  }

  // Obtener todos los feature flags
  getFeatureFlags() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.FEATURE_FLAGS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading feature flags:', error);
      return {};
    }
  }

  // Guardar feature flags
  saveFeatureFlags(flags) {
    try {
      const flagsWithMetadata = {
        ...flags,
        _metadata: {
          last_updated: new Date().toISOString(),
          version: '1.0.0',
          checksum: this.generateChecksum(flags)
        }
      };

      localStorage.setItem(
        this.STORAGE_KEYS.FEATURE_FLAGS, 
        JSON.stringify(flagsWithMetadata)
      );

      return true;
    } catch (error) {
      console.error('Error saving feature flags:', error);
      return false;
    }
  }

  // Obtener flag específico con fallback
  getFeatureFlag(flagKey, fallback = false) {
    try {
      const flags = this.getFeatureFlags();
      
      if (flags.hasOwnProperty(flagKey)) {
        return flags[flagKey];
      }

      // Verificar dependencias antes del fallback
      const dependencies = this.getFlagDependencies(flagKey);
      if (dependencies.length > 0) {
        const dependenciesMet = dependencies.every(dep => this.getFeatureFlag(dep, false));
        return dependenciesMet ? fallback : false;
      }

      return fallback;
    } catch (error) {
      console.error(`Error getting feature flag ${flagKey}:`, error);
      return fallback;
    }
  }

  // Actualizar flag específico
  updateFeatureFlag(flagKey, enabled, metadata = {}) {
    try {
      const flags = this.getFeatureFlags();
      const oldValue = flags[flagKey];

      // Validar dependencias antes del cambio
      if (!enabled) {
        const dependentFlags = this.getDependentFlags(flagKey);
        if (dependentFlags.length > 0) {
          throw new Error(`Cannot disable ${flagKey}. Required by: ${dependentFlags.join(', ')}`);
        }
      } else {
        const dependencies = this.getFlagDependencies(flagKey);
        const unmetDependencies = dependencies.filter(dep => !this.getFeatureFlag(dep, false));
        if (unmetDependencies.length > 0) {
          throw new Error(`Cannot enable ${flagKey}. Missing dependencies: ${unmetDependencies.join(', ')}`);
        }
      }

      // Actualizar flag
      flags[flagKey] = enabled;
      
      // Guardar cambios
      if (this.saveFeatureFlags(flags)) {
        // Registrar cambio en logs
        this.logAction('UPDATE_FLAG', metadata.user_id || 'system', `${flagKey}: ${oldValue} → ${enabled}`, {
          flag_key: flagKey,
          old_value: oldValue,
          new_value: enabled,
          user_impact: this.calculateUserImpact(flagKey),
          dependencies_checked: true,
          ...metadata
        });

        // Disparar evento de cambio
        this.dispatchFlagChangeEvent(flagKey, enabled, oldValue);

        return { success: true, old_value: oldValue, new_value: enabled };
      }

      throw new Error('Failed to save changes');

    } catch (error) {
      console.error(`Error updating feature flag ${flagKey}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Actualización masiva de flags
  batchUpdateFlags(updates, metadata = {}) {
    try {
      const flags = this.getFeatureFlags();
      const changes = [];
      const errors = [];

      // Validar todos los cambios primero
      for (const { flagKey, enabled } of updates) {
        try {
          if (!enabled) {
            const dependentFlags = this.getDependentFlags(flagKey);
            if (dependentFlags.length > 0) {
              errors.push(`Cannot disable ${flagKey}. Required by: ${dependentFlags.join(', ')}`);
              continue;
            }
          } else {
            const dependencies = this.getFlagDependencies(flagKey);
            const unmetDependencies = dependencies.filter(dep => !flags[dep]);
            if (unmetDependencies.length > 0) {
              errors.push(`Cannot enable ${flagKey}. Missing dependencies: ${unmetDependencies.join(', ')}`);
              continue;
            }
          }

          changes.push({
            flagKey,
            oldValue: flags[flagKey],
            newValue: enabled
          });

        } catch (error) {
          errors.push(`${flagKey}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Aplicar todos los cambios
      changes.forEach(({ flagKey, newValue }) => {
        flags[flagKey] = newValue;
      });

      // Guardar cambios
      if (this.saveFeatureFlags(flags)) {
        // Registrar cambios en batch
        this.logAction('BATCH_UPDATE', metadata.user_id || 'system', `Updated ${changes.length} flags`, {
          changes: changes.map(c => ({ flag: c.flagKey, old: c.oldValue, new: c.newValue })),
          total_changes: changes.length,
          ...metadata
        });

        // Disparar eventos para cada cambio
        changes.forEach(({ flagKey, newValue, oldValue }) => {
          this.dispatchFlagChangeEvent(flagKey, newValue, oldValue);
        });

        return { success: true, changes: changes.length };
      }

      throw new Error('Failed to save batch changes');

    } catch (error) {
      console.error('Error in batch update:', error);
      return { success: false, error: error.message };
    }
  }

  // Sistema de A/B Testing
  createABTest(config) {
    try {
      const testId = this.generateId();
      const abTest = {
        id: testId,
        name: config.name,
        description: config.description,
        flag_key: config.flagKey,
        variants: config.variants, // [{ name: 'control', percentage: 50 }, { name: 'treatment', percentage: 50 }]
        start_date: config.startDate || new Date().toISOString(),
        end_date: config.endDate,
        success_metrics: config.successMetrics || [],
        user_segment: config.userSegment || 'all_users',
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: config.userId,
        results: {
          total_users: 0,
          variant_performance: {},
          statistical_significance: null,
          winning_variant: null
        }
      };

      const abTests = this.getABTests();
      abTests[testId] = abTest;
      
      localStorage.setItem(this.STORAGE_KEYS.AB_TESTS, JSON.stringify(abTests));

      this.logAction('CREATE_AB_TEST', config.userId, `Created A/B test: ${config.name}`, {
        test_id: testId,
        flag_key: config.flagKey,
        variants: config.variants.length
      });

      return { success: true, test_id: testId };

    } catch (error) {
      console.error('Error creating A/B test:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener tests A/B
  getABTests() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.AB_TESTS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading A/B tests:', error);
      return {};
    }
  }

  // Determinar variante para usuario en A/B test
  getUserVariant(testId, userId) {
    try {
      const abTests = this.getABTests();
      const test = abTests[testId];
      
      if (!test || test.status !== 'active') {
        return null;
      }

      // Usar hash del userId para asignación consistente
      const userHash = this.hashString(userId + testId) % 100;
      let cumulativePercentage = 0;

      for (const variant of test.variants) {
        cumulativePercentage += variant.percentage;
        if (userHash < cumulativePercentage) {
          return variant.name;
        }
      }

      return test.variants[0].name; // fallback
    } catch (error) {
      console.error('Error getting user variant:', error);
      return null;
    }
  }

  // Sistema de programación
  scheduleFeatureChange(config) {
    try {
      const scheduleId = this.generateId();
      const schedule = {
        id: scheduleId,
        flag_key: config.flagKey,
        action: config.action, // 'enable' | 'disable'
        scheduled_time: config.scheduledTime,
        rollout_strategy: config.rolloutStrategy || 'immediate',
        rollout_percentage: config.rolloutPercentage || 100,
        user_segment: config.userSegment || 'all_users',
        created_at: new Date().toISOString(),
        created_by: config.userId,
        status: 'pending', // 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'
        rollback_config: config.rollbackConfig || null
      };

      const schedules = this.getSchedules();
      schedules[scheduleId] = schedule;
      
      localStorage.setItem(this.STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));

      this.logAction('SCHEDULE_FEATURE', config.userId, `Scheduled ${config.action} for ${config.flagKey}`, {
        schedule_id: scheduleId,
        scheduled_time: config.scheduledTime,
        rollout_strategy: config.rolloutStrategy
      });

      return { success: true, schedule_id: scheduleId };

    } catch (error) {
      console.error('Error scheduling feature change:', error);
      return { success: false, error: error.message };
    }
  }

  // Sistema de rollback
  createRollbackPoint(description, userId) {
    try {
      const rollbackId = this.generateId();
      const currentFlags = this.getFeatureFlags();
      
      const rollbackPoint = {
        id: rollbackId,
        description,
        flags_snapshot: { ...currentFlags },
        created_at: new Date().toISOString(),
        created_by: userId,
        metrics_before: this.captureMetrics()
      };

      const rollbackHistory = this.getRollbackHistory();
      rollbackHistory[rollbackId] = rollbackPoint;
      
      // Mantener solo últimos 50 puntos de rollback
      const sortedHistory = Object.values(rollbackHistory)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50);

      const cleanHistory = {};
      sortedHistory.forEach(point => {
        cleanHistory[point.id] = point;
      });

      localStorage.setItem(this.STORAGE_KEYS.ROLLBACK_HISTORY, JSON.stringify(cleanHistory));

      this.logAction('CREATE_ROLLBACK_POINT', userId, description, {
        rollback_id: rollbackId,
        flags_count: Object.keys(currentFlags).length
      });

      return { success: true, rollback_id: rollbackId };

    } catch (error) {
      console.error('Error creating rollback point:', error);
      return { success: false, error: error.message };
    }
  }

  // Ejecutar rollback
  executeRollback(rollbackId, userId, reason) {
    try {
      const rollbackHistory = this.getRollbackHistory();
      const rollbackPoint = rollbackHistory[rollbackId];

      if (!rollbackPoint) {
        throw new Error('Rollback point not found');
      }

      const currentFlags = this.getFeatureFlags();
      const targetFlags = rollbackPoint.flags_snapshot;

      // Guardar estado actual antes del rollback
      this.createRollbackPoint(`Pre-rollback snapshot - ${reason}`, 'system');

      // Aplicar configuración del rollback
      if (this.saveFeatureFlags(targetFlags)) {
        this.logAction('EXECUTE_ROLLBACK', userId, `Rolled back to ${rollbackPoint.description}`, {
          rollback_id: rollbackId,
          reason,
          changes_count: this.countFlagDifferences(currentFlags, targetFlags),
          rollback_timestamp: rollbackPoint.created_at
        });

        // Disparar eventos para todos los cambios
        this.dispatchRollbackEvent(rollbackId, currentFlags, targetFlags);

        return { success: true, changes: this.getFlagChanges(currentFlags, targetFlags) };
      }

      throw new Error('Failed to apply rollback configuration');

    } catch (error) {
      console.error('Error executing rollback:', error);
      return { success: false, error: error.message };
    }
  }

  // Métodos de utilidad
  getFlagDependencies(flagKey) {
    const { FEATURE_FLAGS_CONFIG } = require('./feature-flags-config.js');
    
    for (const group of Object.values(FEATURE_FLAGS_CONFIG)) {
      for (const [key, config] of Object.entries(group.features || {})) {
        if (key === flagKey) {
          return config.dependencies || [];
        }
      }
    }
    return [];
  }

  getDependentFlags(flagKey) {
    const { FEATURE_FLAGS_CONFIG } = require('./feature-flags-config.js');
    const dependentFlags = [];
    
    for (const group of Object.values(FEATURE_FLAGS_CONFIG)) {
      for (const [key, config] of Object.entries(group.features || {})) {
        if ((config.dependencies || []).includes(flagKey)) {
          dependentFlags.push(key);
        }
      }
    }
    return dependentFlags;
  }

  calculateUserImpact(flagKey) {
    const { FEATURE_FLAGS_CONFIG } = require('./feature-flags-config.js');
    
    for (const group of Object.values(FEATURE_FLAGS_CONFIG)) {
      for (const [key, config] of Object.entries(group.features || {})) {
        if (key === flagKey) {
          return config.impact_users || 'unknown';
        }
      }
    }
    return 'unknown';
  }

  // Registrar acciones en logs
  logAction(action, userId, description, metadata = {}) {
    try {
      const logs = this.getLogs();
      const logEntry = {
        id: this.generateId(),
        action,
        user_id: userId,
        description,
        metadata,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        session_id: this.getSessionId()
      };

      logs.push(logEntry);

      // Mantener solo últimos 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      localStorage.setItem(this.STORAGE_KEYS.FEATURE_LOGS, JSON.stringify(logs));

    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  // Obtener logs
  getLogs() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.FEATURE_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }

  // Obtener programaciones
  getSchedules() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SCHEDULES);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading schedules:', error);
      return {};
    }
  }

  // Obtener historial de rollback
  getRollbackHistory() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.ROLLBACK_HISTORY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading rollback history:', error);
      return {};
    }
  }

  // Utilidades privadas
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('playtest_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('playtest_session_id', sessionId);
    }
    return sessionId;
  }

  generateChecksum(data) {
    return btoa(JSON.stringify(data)).slice(0, 16);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  countFlagDifferences(flags1, flags2) {
    const keys = new Set([...Object.keys(flags1), ...Object.keys(flags2)]);
    let differences = 0;
    keys.forEach(key => {
      if (flags1[key] !== flags2[key]) differences++;
    });
    return differences;
  }

  getFlagChanges(oldFlags, newFlags) {
    const changes = [];
    const keys = new Set([...Object.keys(oldFlags), ...Object.keys(newFlags)]);
    
    keys.forEach(key => {
      if (oldFlags[key] !== newFlags[key]) {
        changes.push({
          flag_key: key,
          old_value: oldFlags[key],
          new_value: newFlags[key]
        });
      }
    });
    
    return changes;
  }

  captureMetrics() {
    return {
      timestamp: new Date().toISOString(),
      performance: performance.now(),
      memory: navigator.deviceMemory || 'unknown',
      connection: navigator.connection?.effectiveType || 'unknown'
    };
  }

  dispatchFlagChangeEvent(flagKey, newValue, oldValue) {
    const event = new CustomEvent('featureFlagChanged', {
      detail: { flagKey, newValue, oldValue, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
  }

  dispatchRollbackEvent(rollbackId, oldFlags, newFlags) {
    const event = new CustomEvent('featureFlagsRolledBack', {
      detail: { rollbackId, changes: this.getFlagChanges(oldFlags, newFlags) }
    });
    window.dispatchEvent(event);
  }

  cleanupOldData() {
    // Limpiar logs antiguos (>30 días)
    const logs = this.getLogs();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredLogs = logs.filter(log => new Date(log.timestamp) > thirtyDaysAgo);
    
    if (filteredLogs.length !== logs.length) {
      localStorage.setItem(this.STORAGE_KEYS.FEATURE_LOGS, JSON.stringify(filteredLogs));
    }
  }

  validateDataIntegrity() {
    const flags = this.getFeatureFlags();
    const metadata = flags._metadata;
    
    if (metadata) {
      const currentChecksum = this.generateChecksum(
        Object.fromEntries(Object.entries(flags).filter(([k]) => k !== '_metadata'))
      );
      
      if (metadata.checksum !== currentChecksum) {
        console.warn('Feature flags data integrity check failed');
        this.logAction('INTEGRITY_WARNING', 'system', 'Data integrity check failed', {
          expected_checksum: metadata.checksum,
          actual_checksum: currentChecksum
        });
      }
    }
  }

  resetToDefaults() {
    const { DEFAULT_FEATURE_FLAGS } = require('./feature-flags-config.js');
    this.saveFeatureFlags(DEFAULT_FEATURE_FLAGS);
    
    this.logAction('RESET_TO_DEFAULTS', 'system', 'Reset all flags to default values', {
      reason: 'Data corruption or initialization failure'
    });
  }
}

// Instancia singleton
export const featureFlagsDB = new FeatureFlagsDatabase();