/**
 * Integración Principal del Sistema de Feature Flags - PLAYTEST
 * Módulo que conecta todos los componentes y proporciona una API unificada
 */

import { featureFlagsDB } from './feature-flags-database.js';
import { featureFlagsAPI } from './feature-flags-api.js';
import { abTestingEngine } from './feature-flags-ab-testing.js';
import { featureFlagsScheduler } from './feature-flags-scheduler.js';
import { autoRollbackSystem } from './feature-flags-rollback.js';
import { FEATURE_FLAGS_CONFIG, DEFAULT_FEATURE_FLAGS } from './feature-flags-config.js';

export class PlayTestFeatureFlags {
  constructor() {
    this.initialized = false;
    this.currentUser = null;
    this.configuration = null;
    this.eventListeners = new Map();
    
    // Referencias a subsistemas
    this.database = featureFlagsDB;
    this.api = featureFlagsAPI;
    this.abTesting = abTestingEngine;
    this.scheduler = featureFlagsScheduler;
    this.rollback = autoRollbackSystem;
    
    this.initializeSystem();
  }

  async initializeSystem() {
    try {
      console.log('🎛️ Initializing PLAYTEST Feature Flags System...');
      
      // 1. Inicializar configuración
      await this.loadConfiguration();
      
      // 2. Detectar usuario actual
      await this.detectCurrentUser();
      
      // 3. Migrar datos si es necesario
      await this.performMigrations();
      
      // 4. Configurar integración con localStorage existente
      await this.setupLocalStorageIntegration();
      
      // 5. Inicializar todos los subsistemas
      await this.initializeSubsystems();
      
      // 6. Configurar interceptores globales
      this.setupGlobalInterceptors();
      
      // 7. Registrar service worker para notificaciones
      await this.registerServiceWorker();
      
      this.initialized = true;
      
      console.log('✅ PLAYTEST Feature Flags System initialized successfully');
      
      // Disparar evento de inicialización
      this.dispatchEvent('systemInitialized', {
        timestamp: new Date().toISOString(),
        user: this.currentUser,
        totalFlags: Object.keys(this.getAllFlags()).length
      });
      
    } catch (error) {
      console.error('❌ Error initializing Feature Flags System:', error);
      this.handleInitializationError(error);
    }
  }

  async loadConfiguration() {
    // Cargar configuración desde localStorage o usar defaults
    const storedConfig = localStorage.getItem('playtest_feature_flags_config');
    
    if (storedConfig) {
      try {
        this.configuration = JSON.parse(storedConfig);
        console.log('📖 Loaded configuration from localStorage');
      } catch (error) {
        console.warn('⚠️ Failed to parse stored configuration, using defaults');
        this.configuration = this.getDefaultConfiguration();
      }
    } else {
      this.configuration = this.getDefaultConfiguration();
      this.saveConfiguration();
    }
  }

  getDefaultConfiguration() {
    return {
      version: '1.0.0',
      environment: this.detectEnvironment(),
      rollback: {
        enabled: true,
        auto_rollback: true,
        monitoring_interval: 30000, // 30 segundos
        cooldown_period: 600000 // 10 minutos
      },
      ab_testing: {
        enabled: true,
        auto_winner_detection: true,
        min_sample_size: 100,
        significance_level: 0.05
      },
      scheduling: {
        enabled: true,
        health_checks: true,
        notifications: true
      },
      logging: {
        level: 'info',
        retention_days: 30,
        max_entries: 10000
      },
      performance: {
        cache_enabled: true,
        batch_updates: true,
        lazy_loading: true
      }
    };
  }

  detectEnvironment() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'development';
    } else if (window.location.hostname.includes('staging') || window.location.hostname.includes('test')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  async detectCurrentUser() {
    try {
      // Intentar obtener usuario desde tokens de autenticación
      const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
      
      if (token) {
        const userData = this.decodeJWTToken(token);
        this.currentUser = {
          id: userData.id || userData.user_id || 'unknown',
          email: userData.email || 'unknown',
          username: userData.username || userData.nickname || 'unknown',
          role: userData.role || 'user',
          segment: this.determineUserSegment(userData)
        };
      } else {
        // Usuario anónimo
        this.currentUser = {
          id: this.generateAnonymousId(),
          email: 'anonymous',
          username: 'anonymous',
          role: 'anonymous',
          segment: 'anonymous_users'
        };
      }
      
      console.log('👤 Current user detected:', this.currentUser);
      
    } catch (error) {
      console.warn('⚠️ Error detecting current user:', error);
      this.currentUser = {
        id: this.generateAnonymousId(),
        email: 'unknown',
        username: 'unknown',
        role: 'unknown',
        segment: 'unknown_users'
      };
    }
  }

  decodeJWTToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.warn('Failed to decode JWT token:', error);
      return {};
    }
  }

  determineUserSegment(userData) {
    // Lógica para determinar segmento de usuario
    if (userData.role === 'admin' || userData.role === 'administrator') {
      return 'admins';
    } else if (userData.role === 'creator' || userData.role === 'teacher') {
      return 'creators';
    } else if (userData.premium || userData.plan === 'premium') {
      return 'premium_users';
    } else if (this.isNewUser(userData)) {
      return 'new_users';
    } else {
      return 'regular_users';
    }
  }

  isNewUser(userData) {
    const createdAt = userData.created_at || userData.createdAt;
    if (!createdAt) return false;
    
    const userCreation = new Date(createdAt);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return userCreation > thirtyDaysAgo;
  }

  generateAnonymousId() {
    let anonymousId = localStorage.getItem('playtest_anonymous_id');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('playtest_anonymous_id', anonymousId);
    }
    return anonymousId;
  }

  async performMigrations() {
    const currentVersion = this.configuration.version;
    const migrationHistory = JSON.parse(localStorage.getItem('playtest_migration_history') || '[]');
    
    // Migración v1.0.0: Consolidar flags dispersos
    if (!migrationHistory.includes('v1.0.0_consolidation')) {
      await this.migrateToConsolidatedFlags();
      migrationHistory.push('v1.0.0_consolidation');
    }
    
    // Migración v1.0.0: Configurar defaults
    if (!migrationHistory.includes('v1.0.0_defaults')) {
      await this.setupDefaultFlags();
      migrationHistory.push('v1.0.0_defaults');
    }
    
    localStorage.setItem('playtest_migration_history', JSON.stringify(migrationHistory));
  }

  async migrateToConsolidatedFlags() {
    console.log('🔄 Migrating to consolidated feature flags...');
    
    // Buscar flags dispersos en localStorage
    const legacyFlags = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('_enabled') || key.includes('_active') || key.includes('feature_'))) {
        const value = localStorage.getItem(key);
        if (value === 'true' || value === 'false') {
          legacyFlags[key] = value === 'true';
        }
      }
    }
    
    if (Object.keys(legacyFlags).length > 0) {
      console.log(`📦 Found ${Object.keys(legacyFlags).length} legacy flags to migrate`);
      
      // Mapear a nuevo sistema
      const migratedFlags = this.mapLegacyFlags(legacyFlags);
      
      // Aplicar migración
      const currentFlags = this.database.getFeatureFlags();
      const mergedFlags = { ...DEFAULT_FEATURE_FLAGS, ...currentFlags, ...migratedFlags };
      
      this.database.saveFeatureFlags(mergedFlags);
      
      // Log de migración
      this.database.logAction(
        'MIGRATION_CONSOLIDATION',
        'system',
        `Migrated ${Object.keys(legacyFlags).length} legacy flags`,
        {
          legacy_flags: Object.keys(legacyFlags),
          migrated_flags: Object.keys(migratedFlags)
        }
      );
    }
  }

  mapLegacyFlags(legacyFlags) {
    const mapping = {
      'chat_enabled': 'communication.chat.enabled',
      'competition_enabled': 'competition.duels.enabled',
      'tournament_enabled': 'competition.tournaments.enabled',
      'ai_enabled': 'ai.content_generation.enabled',
      'notifications_enabled': 'notifications.web_push.enabled',
      'analytics_enabled': 'advanced_tools.detailed_analytics.enabled'
    };
    
    const migratedFlags = {};
    
    for (const [legacyKey, modernKey] of Object.entries(mapping)) {
      if (legacyFlags.hasOwnProperty(legacyKey)) {
        migratedFlags[modernKey] = legacyFlags[legacyKey];
      }
    }
    
    return migratedFlags;
  }

  async setupDefaultFlags() {
    console.log('⚙️ Setting up default feature flags...');
    
    const currentFlags = this.database.getFeatureFlags();
    const mergedFlags = { ...DEFAULT_FEATURE_FLAGS, ...currentFlags };
    
    this.database.saveFeatureFlags(mergedFlags);
    
    console.log(`✅ Configured ${Object.keys(DEFAULT_FEATURE_FLAGS).length} default flags`);
  }

  async setupLocalStorageIntegration() {
    // Configurar compatibilidad con sistemas existentes de PLAYTEST
    
    // 1. Integrar con sistema de usuarios
    this.integrateWithUserSystem();
    
    // 2. Integrar con sistema de luminarias
    this.integrateWithLuminariasSystem();
    
    // 3. Integrar con sistema de chat
    this.integrateWithChatSystem();
    
    // 4. Configurar cache inteligente
    this.setupIntelligentCaching();
  }

  integrateWithUserSystem() {
    // Escuchar cambios en autenticación
    this.watchLocalStorageKey('playtest_auth_token', (newValue) => {
      if (newValue !== this.currentUser?.token) {
        this.detectCurrentUser();
        this.dispatchEvent('userChanged', { user: this.currentUser });
      }
    });
    
    this.watchLocalStorageKey('authToken', (newValue) => {
      if (newValue !== this.currentUser?.token) {
        this.detectCurrentUser();
        this.dispatchEvent('userChanged', { user: this.currentUser });
      }
    });
  }

  integrateWithLuminariasSystem() {
    // Verificar si sistema de luminarias está activo
    const luminariasEnabled = this.isFeatureEnabled('monetization.currency_conversion.enabled');
    
    if (luminariasEnabled) {
      // Configurar sincronización con sistema de luminarias
      this.watchLocalStorageKey('user_luminarias', (newValue) => {
        this.dispatchEvent('luminariasChanged', { 
          amount: newValue,
          user: this.currentUser 
        });
      });
    }
  }

  integrateWithChatSystem() {
    // Verificar si chat está habilitado
    const chatEnabled = this.isFeatureEnabled('communication.chat.enabled');
    
    if (!chatEnabled) {
      // Deshabilitar funciones de chat si feature flag está off
      this.disableChatFeatures();
    }
  }

  disableChatFeatures() {
    // Ocultar elementos de chat en la UI
    const chatElements = document.querySelectorAll('[data-feature="chat"]');
    chatElements.forEach(element => {
      element.style.display = 'none';
    });
    
    // Disparar evento para notificar a componentes
    this.dispatchEvent('chatDisabled', {
      reason: 'Feature flag disabled',
      timestamp: new Date().toISOString()
    });
  }

  setupIntelligentCaching() {
    if (!this.configuration.performance.cache_enabled) return;
    
    // Cache de flags con invalidación inteligente
    this.flagsCache = new Map();
    this.cacheTimestamps = new Map();
    
    // Invalidar cache cuando cambian los flags
    this.addEventListener('flagChanged', () => {
      this.flagsCache.clear();
      this.cacheTimestamps.clear();
    });
  }

  async initializeSubsystems() {
    console.log('🔧 Initializing subsystems...');
    
    // Los subsistemas ya se inicializan automáticamente al importarse
    // Aquí configuramos la integración entre ellos
    
    // 1. Configurar API con usuario actual
    this.api.setAuthToken(localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken'));
    
    // 2. Configurar A/B testing con usuario actual
    if (this.configuration.ab_testing.enabled) {
      console.log('🧪 A/B Testing enabled');
    }
    
    // 3. Configurar scheduler si está habilitado
    if (this.configuration.scheduling.enabled) {
      console.log('📅 Scheduling enabled');
    }
    
    // 4. Configurar rollback automático
    if (this.configuration.rollback.enabled) {
      console.log('🔄 Auto-rollback enabled');
    }
    
    console.log('✅ All subsystems initialized');
  }

  setupGlobalInterceptors() {
    // Interceptar todas las llamadas de feature flags
    const originalGetFeatureFlag = this.database.getFeatureFlag.bind(this.database);
    
    this.database.getFeatureFlag = (flagKey, fallback = false) => {
      // Verificar cache primero
      if (this.configuration.performance.cache_enabled) {
        const cached = this.getCachedFlag(flagKey);
        if (cached !== null) return cached;
      }
      
      // Obtener valor efectivo (considerando A/B tests)
      let value = this.abTesting.getEffectiveFeatureValue(flagKey, this.currentUser?.id, fallback);
      
      // Aplicar cache
      if (this.configuration.performance.cache_enabled) {
        this.setCachedFlag(flagKey, value);
      }
      
      // Registrar uso del flag
      this.trackFeatureUsage(flagKey, value);
      
      return value;
    };
    
    // Interceptar actualizaciones de flags
    const originalUpdateFlag = this.api.updateFlag.bind(this.api);
    
    this.api.updateFlag = async (flagKey, enabled, metadata = {}) => {
      // Agregar metadata del sistema
      const enrichedMetadata = {
        ...metadata,
        user_id: this.currentUser?.id,
        user_segment: this.currentUser?.segment,
        environment: this.configuration.environment,
        timestamp: new Date().toISOString()
      };
      
      // Ejecutar actualización original
      const result = await originalUpdateFlag(flagKey, enabled, enrichedMetadata);
      
      if (result.success) {
        // Invalidar cache
        this.invalidateFlagCache(flagKey);
        
        // Disparar evento
        this.dispatchEvent('flagChanged', {
          flagKey,
          newValue: enabled,
          oldValue: !enabled,
          user: this.currentUser
        });
      }
      
      return result;
    };
  }

  getCachedFlag(flagKey) {
    if (!this.flagsCache.has(flagKey)) return null;
    
    const timestamp = this.cacheTimestamps.get(flagKey);
    const maxAge = 5 * 60 * 1000; // 5 minutos
    
    if (Date.now() - timestamp > maxAge) {
      this.flagsCache.delete(flagKey);
      this.cacheTimestamps.delete(flagKey);
      return null;
    }
    
    return this.flagsCache.get(flagKey);
  }

  setCachedFlag(flagKey, value) {
    this.flagsCache.set(flagKey, value);
    this.cacheTimestamps.set(flagKey, Date.now());
  }

  invalidateFlagCache(flagKey) {
    this.flagsCache.delete(flagKey);
    this.cacheTimestamps.delete(flagKey);
  }

  trackFeatureUsage(flagKey, value) {
    // Registrar uso para analytics
    const usage = {
      flag_key: flagKey,
      value: value,
      user_id: this.currentUser?.id,
      user_segment: this.currentUser?.segment,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      user_agent: navigator.userAgent
    };
    
    // Guardar en localStorage con rotación
    this.saveUsageAnalytics(usage);
    
    // Disparar evento personalizado
    const event = new CustomEvent('featureFlagUsed', {
      detail: { flagKey, value, userId: this.currentUser?.id, action: 'read' }
    });
    window.dispatchEvent(event);
  }

  saveUsageAnalytics(usage) {
    const key = 'playtest_feature_usage_analytics';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    existing.push(usage);
    
    // Mantener solo últimas 1000 entradas
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator && this.configuration.notifications?.enabled) {
      try {
        const registration = await navigator.serviceWorker.register('/feature-flags-sw.js');
        console.log('📱 Service Worker registered for feature flags notifications');
        
        // Configurar notificaciones de rollback
        this.addEventListener('autoRollbackExecuted', (event) => {
          this.sendNotification('Feature Flag Rollback', {
            body: `${event.detail.flag_key} was automatically rolled back`,
            icon: '/images/warning-icon.png',
            tag: 'rollback-notification'
          });
        });
        
      } catch (error) {
        console.warn('Failed to register service worker:', error);
      }
    }
  }

  async sendNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  watchLocalStorageKey(key, callback) {
    let lastValue = localStorage.getItem(key);
    
    setInterval(() => {
      const currentValue = localStorage.getItem(key);
      if (currentValue !== lastValue) {
        callback(currentValue);
        lastValue = currentValue;
      }
    }, 1000);
  }

  handleInitializationError(error) {
    // Log del error
    console.error('Feature Flags initialization failed:', error);
    
    // Intentar modo degradado
    this.enableDegradedMode();
    
    // Notificar error
    this.dispatchEvent('initializationError', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  enableDegradedMode() {
    console.warn('🚨 Enabling degraded mode - basic functionality only');
    
    // Usar solo flags por defecto
    this.configuration = this.getDefaultConfiguration();
    this.initialized = true;
    
    // Deshabilitar subsistemas avanzados
    this.configuration.ab_testing.enabled = false;
    this.configuration.rollback.enabled = false;
    this.configuration.scheduling.enabled = false;
  }

  // API Pública Principal

  // Verificar si feature está habilitado
  isFeatureEnabled(flagKey, fallback = false) {
    if (!this.initialized) {
      console.warn(`Feature flags not initialized, using fallback for ${flagKey}`);
      return fallback;
    }
    
    return this.database.getFeatureFlag(flagKey, fallback);
  }

  // Obtener todos los flags
  getAllFlags() {
    return this.database.getFeatureFlags();
  }

  // Verificar múltiples flags
  checkFeatures(flagKeys) {
    const results = {};
    for (const flagKey of flagKeys) {
      results[flagKey] = this.isFeatureEnabled(flagKey);
    }
    return results;
  }

  // Verificar si grupo está habilitado
  isGroupEnabled(groupName) {
    const groupConfig = FEATURE_FLAGS_CONFIG[groupName];
    if (!groupConfig || !groupConfig.features) return false;
    
    const groupFlags = Object.keys(groupConfig.features);
    return groupFlags.some(flagKey => this.isFeatureEnabled(flagKey));
  }

  // Obtener configuración de usuario
  getUserConfig() {
    return {
      user: this.currentUser,
      environment: this.configuration.environment,
      flags_enabled: Object.keys(this.getAllFlags()).filter(key => 
        !key.startsWith('_') && this.isFeatureEnabled(key)
      ).length,
      ab_tests_active: this.abTesting ? this.abTesting.getActiveTests().length : 0
    };
  }

  // Métodos de administración
  async updateFlag(flagKey, enabled, metadata = {}) {
    return await this.api.updateFlag(flagKey, enabled, {
      ...metadata,
      updated_by: this.currentUser?.id || 'system'
    });
  }

  async createABTest(config) {
    if (!this.configuration.ab_testing.enabled) {
      return { success: false, error: 'A/B testing is disabled' };
    }
    
    return await this.abTesting.createTest({
      ...config,
      userId: this.currentUser?.id
    });
  }

  async scheduleFeatureChange(config) {
    if (!this.configuration.scheduling.enabled) {
      return { success: false, error: 'Scheduling is disabled' };
    }
    
    return await this.scheduler.scheduleFeatureChange({
      ...config,
      userId: this.currentUser?.id
    });
  }

  // Eventos y listeners
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  removeEventListener(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Utilidades
  saveConfiguration() {
    localStorage.setItem('playtest_feature_flags_config', JSON.stringify(this.configuration));
  }

  getSystemInfo() {
    return {
      version: this.configuration.version,
      initialized: this.initialized,
      environment: this.configuration.environment,
      user: this.currentUser,
      subsystems: {
        database: !!this.database,
        api: !!this.api,
        ab_testing: this.configuration.ab_testing.enabled,
        scheduler: this.configuration.scheduling.enabled,
        rollback: this.configuration.rollback.enabled
      },
      statistics: {
        total_flags: Object.keys(this.getAllFlags()).length,
        enabled_flags: Object.keys(this.getAllFlags()).filter(key => 
          !key.startsWith('_') && this.isFeatureEnabled(key)
        ).length,
        active_ab_tests: this.abTesting ? this.abTesting.getActiveTests().length : 0,
        pending_schedules: this.scheduler ? this.scheduler.getActiveSchedules().length : 0
      }
    };
  }

  // Debug y desarrollo
  getDebugInfo() {
    return {
      ...this.getSystemInfo(),
      cache_stats: {
        cached_flags: this.flagsCache ? this.flagsCache.size : 0,
        cache_enabled: this.configuration.performance.cache_enabled
      },
      recent_events: this.getRecentEvents(),
      performance_metrics: this.getPerformanceMetrics()
    };
  }

  getRecentEvents() {
    // Retornar eventos recientes para debugging
    return this.database.getLogs().slice(-10);
  }

  getPerformanceMetrics() {
    return {
      initialization_time: this.initializationTime || null,
      flag_lookup_count: this.flagLookupCount || 0,
      cache_hit_rate: this.calculateCacheHitRate()
    };
  }

  calculateCacheHitRate() {
    if (!this.cacheHits || !this.cacheMisses) return 0;
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }
}

// Crear instancia global
export const playTestFeatureFlags = new PlayTestFeatureFlags();

// Exportar para uso global
window.PlayTestFeatureFlags = playTestFeatureFlags;

// Configurar acceso global para compatibilidad
window.isFeatureEnabled = (flagKey, fallback = false) => 
  playTestFeatureFlags.isFeatureEnabled(flagKey, fallback);

window.checkFeatures = (flagKeys) => 
  playTestFeatureFlags.checkFeatures(flagKeys);

window.isGroupEnabled = (groupName) => 
  playTestFeatureFlags.isGroupEnabled(groupName);

console.log('🎛️ PLAYTEST Feature Flags System loaded and ready!');