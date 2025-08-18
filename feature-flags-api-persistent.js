/**
 * API Persistente para Feature Flags - PLAYTEST
 * Versión actualizada que usa APIs de PostgreSQL en lugar de localStorage
 */

import { persistentAPI } from './persistent-api-service.js';

export class FeatureFlagsAPIPersistent {
    constructor() {
        this.baseUrl = '/api/feature-flags';
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutos
        this.subscriptions = new Set();
        
        this.init();
    }
    
    init() {
        // Auto-limpiar cache
        setInterval(() => {
            this.clearExpiredCache();
        }, this.cacheTimeout);
        
        // Escuchar eventos de cambios
        window.addEventListener('featureFlagChanged', (event) => {
            this.handleFlagChange(event.detail);
        });
    }
    
    // ============= OBTENER FEATURE FLAGS =============
    
    async getFeatureFlag(flagName, fallback = false) {
        try {
            return await persistentAPI.getFeatureFlag(flagName, fallback);
        } catch (error) {
            console.error(`Error getting feature flag ${flagName}:`, error);
            return fallback;
        }
    }
    
    async getAllFeatureFlags() {
        try {
            return await persistentAPI.getAllFeatureFlags();
        } catch (error) {
            console.error('Error getting all feature flags:', error);
            return {};
        }
    }
    
    async getFeatureFlagConfig(flagName) {
        try {
            const response = await fetch(`${this.baseUrl}/${flagName}`, {
                headers: persistentAPI.getAuthHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return null;
        } catch (error) {
            console.error(`Error getting flag config ${flagName}:`, error);
            return null;
        }
    }
    
    // ============= ACTUALIZAR FEATURE FLAGS =============
    
    async updateFeatureFlag(flagName, enabled, metadata = {}) {
        try {
            const result = await persistentAPI.updateFeatureFlag(flagName, enabled, metadata);
            
            if (result.success) {
                this.notifySubscribers('flag_updated', {
                    flagName,
                    enabled,
                    metadata
                });
                
                // Disparar evento personalizado
                window.dispatchEvent(new CustomEvent('featureFlagChanged', {
                    detail: { flagName, newValue: enabled, timestamp: new Date().toISOString() }
                }));
            }
            
            return result;
        } catch (error) {
            console.error(`Error updating feature flag ${flagName}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    async batchUpdateFlags(updates, metadata = {}) {
        try {
            const results = [];
            
            for (const update of updates) {
                const result = await this.updateFeatureFlag(
                    update.flagName, 
                    update.enabled, 
                    { ...metadata, batch_update: true }
                );
                results.push({ ...update, result });
            }
            
            const successful = results.filter(r => r.result.success);
            const failed = results.filter(r => !r.result.success);
            
            this.notifySubscribers('batch_update_completed', {
                successful: successful.length,
                failed: failed.length,
                results
            });
            
            return {
                success: failed.length === 0,
                successful: successful.length,
                failed: failed.length,
                results
            };
            
        } catch (error) {
            console.error('Error in batch update:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ============= GESTIÓN DE FLAGS =============
    
    async createFeatureFlag(flagData) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: persistentAPI.getAuthHeaders(),
                body: JSON.stringify(flagData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                this.notifySubscribers('flag_created', {
                    flagName: flagData.flag_name,
                    flagData
                });
                
                return result;
            }
            
            const error = await response.json();
            throw new Error(error.error || 'Failed to create feature flag');
            
        } catch (error) {
            console.error('Error creating feature flag:', error);
            return { success: false, error: error.message };
        }
    }
    
    async deleteFeatureFlag(flagName) {
        try {
            const response = await fetch(`${this.baseUrl}/${flagName}`, {
                method: 'DELETE',
                headers: persistentAPI.getAuthHeaders()
            });
            
            if (response.ok) {
                const result = await response.json();
                
                this.notifySubscribers('flag_deleted', { flagName });
                
                return result;
            }
            
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete feature flag');
            
        } catch (error) {
            console.error('Error deleting feature flag:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ============= UTILIDADES DE EVALUACIÓN =============
    
    async isFeatureEnabled(flagName, userId = null, context = {}) {
        try {
            const flag = await this.getFeatureFlag(flagName, false);
            
            if (typeof flag === 'boolean') {
                return flag;
            }
            
            if (flag && flag.enabled !== undefined) {
                // Evaluar condiciones adicionales si existen
                return this.evaluateFlagConditions(flag, userId, context);
            }
            
            return false;
        } catch (error) {
            console.error(`Error evaluating feature flag ${flagName}:`, error);
            return false;
        }
    }
    
    evaluateFlagConditions(flag, userId, context) {
        try {
            if (!flag.config) return flag.enabled;
            
            const config = flag.config;
            
            // Verificar porcentaje de usuarios
            if (config.target_percentage && userId) {
                const hash = this.hashUserId(userId);
                const userPercentile = hash % 100;
                if (userPercentile >= config.target_percentage) {
                    return false;
                }
            }
            
            // Verificar usuarios específicos
            if (config.target_users && userId) {
                const targetUsers = Array.isArray(config.target_users) 
                    ? config.target_users 
                    : [];
                if (!targetUsers.includes(userId)) {
                    return false;
                }
            }
            
            // Verificar fechas
            const now = new Date();
            if (config.start_date && new Date(config.start_date) > now) {
                return false;
            }
            if (config.end_date && new Date(config.end_date) < now) {
                return false;
            }
            
            // Verificar contexto personalizado
            if (config.context_rules && context) {
                return this.evaluateContextRules(config.context_rules, context);
            }
            
            return flag.enabled;
            
        } catch (error) {
            console.error('Error evaluating flag conditions:', error);
            return flag.enabled || false;
        }
    }
    
    evaluateContextRules(rules, context) {
        try {
            for (const rule of rules) {
                const { field, operator, value } = rule;
                const contextValue = context[field];
                
                switch (operator) {
                    case 'equals':
                        if (contextValue !== value) return false;
                        break;
                    case 'contains':
                        if (!contextValue || !contextValue.includes(value)) return false;
                        break;
                    case 'greater_than':
                        if (contextValue <= value) return false;
                        break;
                    case 'less_than':
                        if (contextValue >= value) return false;
                        break;
                    default:
                        console.warn(`Unknown operator: ${operator}`);
                }
            }
            return true;
        } catch (error) {
            console.error('Error evaluating context rules:', error);
            return false;
        }
    }
    
    // ============= SUSCRIPCIONES Y EVENTOS =============
    
    subscribe(callback) {
        this.subscriptions.add(callback);
        return () => this.subscriptions.delete(callback);
    }
    
    notifySubscribers(event, data) {
        this.subscriptions.forEach(callback => {
            try {
                callback({ event, data, timestamp: new Date().toISOString() });
            } catch (error) {
                console.error('Error in subscription callback:', error);
            }
        });
    }
    
    handleFlagChange(detail) {
        // Limpiar cache del flag que cambió
        this.invalidateCache(detail.flagName);
        
        this.notifySubscribers('flag_changed', detail);
    }
    
    // ============= ANÁLISIS Y MÉTRICAS =============
    
    async getFlagUsageStats(flagName, timeRange = '7d') {
        try {
            const response = await fetch(`${this.baseUrl}/${flagName}/stats?range=${timeRange}`, {
                headers: persistentAPI.getAuthHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return null;
        } catch (error) {
            console.error(`Error getting flag stats ${flagName}:`, error);
            return null;
        }
    }
    
    async getAllFlagsStats(timeRange = '7d') {
        try {
            const response = await fetch(`${this.baseUrl}/stats?range=${timeRange}`, {
                headers: persistentAPI.getAuthHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return {};
        } catch (error) {
            console.error('Error getting all flags stats:', error);
            return {};
        }
    }
    
    // ============= GESTIÓN DE CACHE =============
    
    setCache(key, value, ttl = this.cacheTimeout) {
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }
    
    invalidateCache(key) {
        this.cache.delete(key);
        
        // También invalidar cache en persistentAPI
        if (persistentAPI.invalidateCache) {
            persistentAPI.invalidateCache(`feature_flag_${key}`);
            persistentAPI.invalidateCache('all_feature_flags');
        }
    }
    
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now > cached.expires) {
                this.cache.delete(key);
            }
        }
    }
    
    clearAllCache() {
        this.cache.clear();
        if (persistentAPI.clearAllCache) {
            persistentAPI.clearAllCache();
        }
    }
    
    // ============= UTILIDADES =============
    
    hashUserId(userId) {
        let hash = 0;
        const str = String(userId);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // ============= MIGRACIÓN DESDE VERSIÓN ANTERIOR =============
    
    async migrateFromLocalStorageSystem() {
        try {
            console.log('🔄 Migrando sistema de feature flags...');
            
            // Usar migración del persistentAPI
            const result = await persistentAPI.migrateFromLocalStorage();
            
            if (result.success) {
                console.log('✅ Migración de feature flags completada');
                this.notifySubscribers('migration_completed', { 
                    system: 'feature_flags' 
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error en migración de feature flags:', error);
            return { success: false, error: error.message };
        }
    }
}

// Instancia singleton
export const featureFlagsAPI = new FeatureFlagsAPIPersistent();

// Hacer disponible globalmente
window.featureFlagsAPI = featureFlagsAPI;

export default FeatureFlagsAPIPersistent;