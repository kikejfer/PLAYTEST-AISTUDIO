/**
 * Cliente de Migración de Datos - PLAYTEST
 * Migra automáticamente datos de localStorage a PostgreSQL para usuarios existentes
 */

import { persistentAPI } from './persistent-api-service.js';
import { featureFlagsAPI } from './feature-flags-api-persistent.js';

class DataMigrationClient {
    constructor() {
        this.migrationStatus = {
            completed: false,
            inProgress: false,
            errors: []
        };
        
        this.migrationKeys = {
            MIGRATION_COMPLETED: 'playtest_migration_completed',
            MIGRATION_VERSION: 'playtest_migration_version',
            MIGRATION_DATE: 'playtest_migration_date'
        };
        
        this.currentMigrationVersion = '1.0.0';
        
        this.init();
    }
    
    init() {
        // Verificar si necesita migración al cargar la página
        this.checkMigrationNeeded();
        
        // Escuchar eventos de autenticación
        window.addEventListener('userAuthenticated', (event) => {
            this.onUserAuthenticated(event.detail);
        });
    }
    
    async checkMigrationNeeded() {
        try {
            const migrationCompleted = localStorage.getItem(this.migrationKeys.MIGRATION_COMPLETED);
            const migrationVersion = localStorage.getItem(this.migrationKeys.MIGRATION_VERSION);
            
            // Si nunca se ha hecho migración o la versión es antigua
            if (!migrationCompleted || migrationVersion !== this.currentMigrationVersion) {
                // Verificar si hay un token de autenticación válido
                const token = localStorage.getItem('authToken');
                if (token) {
                    await this.performFullMigration();
                }
            }
        } catch (error) {
            console.error('Error checking migration status:', error);
        }
    }
    
    async onUserAuthenticated(userInfo) {
        try {
            const migrationCompleted = localStorage.getItem(this.migrationKeys.MIGRATION_COMPLETED);
            if (!migrationCompleted) {
                await this.performFullMigration();
            }
        } catch (error) {
            console.error('Error on user authenticated migration:', error);
        }
    }
    
    async performFullMigration() {
        if (this.migrationStatus.inProgress) {
            console.log('⏳ Migración ya en progreso, esperando...');
            return;
        }
        
        try {
            this.migrationStatus.inProgress = true;
            console.log('🚀 Iniciando migración completa de datos...');
            
            // Mostrar indicador visual opcional
            this.showMigrationIndicator();
            
            const results = {
                featureFlags: await this.migrateFeatureFlags(),
                userPreferences: await this.migrateUserPreferences(),
                gameStates: await this.migrateGameStates(),
                searchHistory: await this.migrateSearchHistory(),
                analytics: await this.migrateAnalytics()
            };
            
            // Verificar resultados
            const successful = Object.values(results).filter(r => r.success).length;
            const failed = Object.values(results).filter(r => !r.success).length;
            
            if (failed === 0) {
                console.log(`✅ Migración completada: ${successful} categorías migradas`);
                this.markMigrationCompleted();
                this.notifyMigrationSuccess(results);
            } else {
                console.warn(`⚠️ Migración parcial: ${successful} exitosas, ${failed} fallidas`);
                this.migrationStatus.errors = results;
            }
            
        } catch (error) {
            console.error('❌ Error durante migración completa:', error);
            this.migrationStatus.errors.push(error);
        } finally {
            this.migrationStatus.inProgress = false;
            this.hideMigrationIndicator();
        }
    }
    
    async migrateFeatureFlags() {
        try {
            console.log('🚩 Migrando feature flags...');
            
            const localFlags = localStorage.getItem('playtest_feature_flags');
            if (!localFlags) {
                return { success: true, message: 'No feature flags to migrate' };
            }
            
            const flags = JSON.parse(localFlags);
            let migratedCount = 0;
            
            for (const [flagName, config] of Object.entries(flags)) {
                if (flagName.startsWith('_')) continue; // Skip metadata
                
                try {
                    let enabled = false;
                    let description = '';
                    let configData = {};
                    
                    if (typeof config === 'boolean') {
                        enabled = config;
                    } else if (config && typeof config === 'object') {
                        enabled = config.enabled || false;
                        description = config.description || '';
                        configData = config.config || {};
                    }
                    
                    const result = await featureFlagsAPI.updateFeatureFlag(flagName, enabled, {
                        migrated_from_localStorage: true,
                        migration_date: new Date().toISOString(),
                        description,
                        config: configData
                    });
                    
                    if (result.success) {
                        migratedCount++;
                    }
                } catch (error) {
                    console.warn(`Error migrando flag ${flagName}:`, error);
                }
            }
            
            // Marcar como migrado sin eliminar localStorage (por seguridad)
            localStorage.setItem('playtest_feature_flags_migrated', 'true');
            
            return { 
                success: true, 
                migratedCount,
                message: `${migratedCount} feature flags migrated` 
            };
            
        } catch (error) {
            console.error('Error migrando feature flags:', error);
            return { success: false, error: error.message };
        }
    }
    
    async migrateUserPreferences() {
        try {
            console.log('⚙️ Migrando preferencias de usuario...');
            
            const categories = ['ui', 'game', 'notification', 'privacy'];
            const preferences = {};
            let hasPreferences = false;
            
            for (const category of categories) {
                const key = `user_preferences_${category}`;
                const localPrefs = localStorage.getItem(key);
                
                if (localPrefs) {
                    try {
                        preferences[`${category}_preferences`] = JSON.parse(localPrefs);
                        hasPreferences = true;
                    } catch (error) {
                        console.warn(`Error parsing ${key}:`, error);
                    }
                }
            }
            
            // También buscar preferencias generales
            const generalPrefs = localStorage.getItem('user_preferences');
            if (generalPrefs) {
                try {
                    const parsed = JSON.parse(generalPrefs);
                    Object.assign(preferences, parsed);
                    hasPreferences = true;
                } catch (error) {
                    console.warn('Error parsing general preferences:', error);
                }
            }
            
            if (!hasPreferences) {
                return { success: true, message: 'No user preferences to migrate' };
            }
            
            const result = await persistentAPI.updateUserPreferences(preferences);
            
            if (result.success || !result.error) {
                localStorage.setItem('user_preferences_migrated', 'true');
                return { 
                    success: true, 
                    message: 'User preferences migrated successfully' 
                };
            }
            
            return result;
            
        } catch (error) {
            console.error('Error migrando preferencias:', error);
            return { success: false, error: error.message };
        }
    }
    
    async migrateGameStates() {
        try {
            console.log('🎮 Migrando estados de juego...');
            
            const gameStateKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('game_state_')) {
                    gameStateKeys.push(key);
                }
            }
            
            if (gameStateKeys.length === 0) {
                return { success: true, message: 'No game states to migrate' };
            }
            
            let migratedCount = 0;
            
            for (const key of gameStateKeys) {
                try {
                    const stateData = localStorage.getItem(key);
                    if (!stateData) continue;
                    
                    const parsed = JSON.parse(stateData);
                    const gameType = key.replace('game_state_', '');
                    
                    const migrationData = {
                        game_type: gameType,
                        current_state: parsed,
                        progress: parsed.progress || {},
                        auto_save: false, // Manual migration
                        session_id: `migrated_${Date.now()}`
                    };
                    
                    const result = await persistentAPI.saveGameState(migrationData);
                    
                    if (result.success) {
                        migratedCount++;
                        localStorage.setItem(`${key}_migrated`, 'true');
                    }
                    
                } catch (error) {
                    console.warn(`Error migrando ${key}:`, error);
                }
            }
            
            return { 
                success: true, 
                migratedCount,
                message: `${migratedCount} game states migrated` 
            };
            
        } catch (error) {
            console.error('Error migrando estados de juego:', error);
            return { success: false, error: error.message };
        }
    }
    
    async migrateSearchHistory() {
        try {
            console.log('🔍 Migrando historial de búsquedas...');
            
            const searchHistory = localStorage.getItem('search_history');
            if (!searchHistory) {
                return { success: true, message: 'No search history to migrate' };
            }
            
            const searches = JSON.parse(searchHistory);
            let migratedCount = 0;
            
            if (Array.isArray(searches)) {
                for (const search of searches.slice(0, 50)) { // Migrar solo las últimas 50
                    try {
                        const result = await persistentAPI.saveSearch(
                            search.query || search.search_query,
                            search.context || 'all',
                            search.filters || {},
                            search.results_count || 0
                        );
                        
                        if (result.success) {
                            migratedCount++;
                        }
                    } catch (error) {
                        console.warn('Error migrando búsqueda:', error);
                    }
                }
            }
            
            localStorage.setItem('search_history_migrated', 'true');
            
            return { 
                success: true, 
                migratedCount,
                message: `${migratedCount} searches migrated` 
            };
            
        } catch (error) {
            console.error('Error migrando historial de búsquedas:', error);
            return { success: false, error: error.message };
        }
    }
    
    async migrateAnalytics() {
        try {
            console.log('📊 Migrando datos de analytics...');
            
            // Buscar eventos de analytics en localStorage
            const analyticsKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('analytics_') || key.includes('event_'))) {
                    analyticsKeys.push(key);
                }
            }
            
            if (analyticsKeys.length === 0) {
                return { success: true, message: 'No analytics data to migrate' };
            }
            
            let migratedCount = 0;
            
            for (const key of analyticsKeys) {
                try {
                    const eventData = localStorage.getItem(key);
                    if (!eventData) continue;
                    
                    const parsed = JSON.parse(eventData);
                    
                    const result = await persistentAPI.trackEvent(
                        parsed.event_type || 'migration_event',
                        parsed.event_category || 'migration',
                        {
                            ...parsed,
                            migrated_from_localStorage: true,
                            original_key: key
                        }
                    );
                    
                    if (result.success) {
                        migratedCount++;
                        localStorage.setItem(`${key}_migrated`, 'true');
                    }
                    
                } catch (error) {
                    console.warn(`Error migrando analytics ${key}:`, error);
                }
            }
            
            return { 
                success: true, 
                migratedCount,
                message: `${migratedCount} analytics events migrated` 
            };
            
        } catch (error) {
            console.error('Error migrando analytics:', error);
            return { success: false, error: error.message };
        }
    }
    
    markMigrationCompleted() {
        localStorage.setItem(this.migrationKeys.MIGRATION_COMPLETED, 'true');
        localStorage.setItem(this.migrationKeys.MIGRATION_VERSION, this.currentMigrationVersion);
        localStorage.setItem(this.migrationKeys.MIGRATION_DATE, new Date().toISOString());
        
        this.migrationStatus.completed = true;
    }
    
    notifyMigrationSuccess(results) {
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('dataMigrationCompleted', {
            detail: { results, timestamp: new Date().toISOString() }
        }));
        
        // Track analytics event
        persistentAPI.trackEvent('data_migration_completed', 'system', {
            migration_version: this.currentMigrationVersion,
            results_summary: results
        });
    }
    
    showMigrationIndicator() {
        // Crear indicador visual opcional
        const indicator = document.createElement('div');
        indicator.id = 'migration-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    Migrando datos a PostgreSQL...
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(indicator);
    }
    
    hideMigrationIndicator() {
        const indicator = document.getElementById('migration-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Método para forzar migración (para desarrollo/testing)
    async forceMigration() {
        localStorage.removeItem(this.migrationKeys.MIGRATION_COMPLETED);
        localStorage.removeItem(this.migrationKeys.MIGRATION_VERSION);
        localStorage.removeItem(this.migrationKeys.MIGRATION_DATE);
        
        await this.performFullMigration();
    }
    
    // Obtener estado de migración
    getMigrationStatus() {
        return {
            ...this.migrationStatus,
            completed: localStorage.getItem(this.migrationKeys.MIGRATION_COMPLETED) === 'true',
            version: localStorage.getItem(this.migrationKeys.MIGRATION_VERSION),
            date: localStorage.getItem(this.migrationKeys.MIGRATION_DATE)
        };
    }
}

// Instancia singleton
export const dataMigrationClient = new DataMigrationClient();

// Hacer disponible globalmente
window.dataMigrationClient = dataMigrationClient;

export default DataMigrationClient;