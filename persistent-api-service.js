/**
 * Servicio de API Persistente - PLAYTEST
 * Reemplaza localStorage con APIs de PostgreSQL para persistencia de datos
 */

class PersistentAPIService {
    constructor() {
        this.baseURL = this.getAPIBaseURL();
        this.token = localStorage.getItem('authToken') || null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        // Configurar headers por defecto
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        
        this.init();
    }
    
    getAPIBaseURL() {
        // Detectar entorno automáticamente
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        } else if (window.location.hostname.includes('onrender.com')) {
            // Si estamos en Render, usar la URL del backend de Render
            return 'https://playtest-backend.onrender.com/api';
        } else if (window.location.hostname.includes('playtest-frontend.onrender.com')) {
            // URL específica si tienes un dominio personalizado
            return 'https://playtest-backend.onrender.com/api';
        } else {
            // Fallback para desarrollo
            return 'http://localhost:3000/api';
        }
    }
    
    init() {
        // Limpiar cache periódicamente
        setInterval(() => {
            this.clearExpiredCache();
        }, this.cacheTimeout);
    }
    
    // ============= AUTENTICACIÓN =============
    
    setAuthToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }
    
    getAuthHeaders() {
        const headers = { ...this.defaultHeaders };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }
    
    // ============= FEATURE FLAGS =============
    
    async getFeatureFlag(flagName, fallback = false) {
        try {
            const cacheKey = `feature_flag_${flagName}`;
            const cached = this.getFromCache(cacheKey);
            if (cached !== null) return cached;
            
            const response = await fetch(`${this.baseURL}/feature-flags/${flagName}`, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const result = data.enabled || fallback;
                this.setCache(cacheKey, result);
                return result;
            }
            
            return fallback;
        } catch (error) {
            console.error('Error getting feature flag:', error);
            return fallback;
        }
    }
    
    async getAllFeatureFlags() {
        try {
            const cacheKey = 'all_feature_flags';
            const cached = this.getFromCache(cacheKey);
            if (cached !== null) return cached;
            
            const response = await fetch(`${this.baseURL}/feature-flags`, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setCache(cacheKey, data, 2 * 60 * 1000); // Cache por 2 minutos
                return data;
            }
            
            return {};
        } catch (error) {
            console.error('Error getting all feature flags:', error);
            return {};
        }
    }
    
    async updateFeatureFlag(flagName, enabled, metadata = {}) {
        try {
            const response = await fetch(`${this.baseURL}/feature-flags/${flagName}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ enabled, ...metadata })
            });
            
            if (response.ok) {
                // Limpiar cache relacionado
                this.invalidateCache(`feature_flag_${flagName}`);
                this.invalidateCache('all_feature_flags');
                return await response.json();
            }
            
            throw new Error('Failed to update feature flag');
        } catch (error) {
            console.error('Error updating feature flag:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ============= PREFERENCIAS DE USUARIO =============
    
    async getUserPreferences() {
        try {
            const cacheKey = 'user_preferences';
            const cached = this.getFromCache(cacheKey);
            if (cached !== null) return cached;
            
            const response = await fetch(`${this.baseURL}/user-preferences`, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setCache(cacheKey, data);
                return data;
            }
            
            return {
                ui_preferences: {},
                game_preferences: {},
                notification_preferences: {},
                privacy_preferences: {}
            };
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return {};
        }
    }
    
    async updateUserPreferences(preferences) {
        try {
            const response = await fetch(`${this.baseURL}/user-preferences`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(preferences)
            });
            
            if (response.ok) {
                this.invalidateCache('user_preferences');
                return await response.json();
            }
            
            throw new Error('Failed to update user preferences');
        } catch (error) {
            console.error('Error updating user preferences:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ============= ESTADOS DE JUEGO =============
    
    async saveGameState(gameData) {
        try {
            const response = await fetch(`${this.baseURL}/game-states`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(gameData)
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            throw new Error('Failed to save game state');
        } catch (error) {
            console.error('Error saving game state:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getGameStates(gameType = null) {
        try {
            const url = gameType 
                ? `${this.baseURL}/game-states?type=${gameType}`
                : `${this.baseURL}/game-states`;
                
            const response = await fetch(url, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return [];
        } catch (error) {
            console.error('Error getting game states:', error);
            return [];
        }
    }
    
    // ============= CONFIGURACIÓN DEL SISTEMA =============
    
    async getSystemConfig(configKey) {
        try {
            const cacheKey = `system_config_${configKey}`;
            const cached = this.getFromCache(cacheKey);
            if (cached !== null) return cached;
            
            const response = await fetch(`${this.baseURL}/system-config/${configKey}`, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setCache(cacheKey, data, 10 * 60 * 1000); // Cache por 10 minutos
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting system config:', error);
            return null;
        }
    }
    
    // ============= HISTORIAL DE BÚSQUEDAS =============
    
    async saveSearch(searchQuery, context = 'all', filters = {}, resultsCount = 0) {
        try {
            const response = await fetch(`${this.baseURL}/search-history`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    search_query: searchQuery,
                    search_context: context,
                    search_filters: filters,
                    results_count: resultsCount
                })
            });
            
            if (response.ok) {
                this.invalidateCache('search_history');
                return await response.json();
            }
            
            return { success: false };
        } catch (error) {
            console.error('Error saving search:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getSearchHistory(limit = 10) {
        try {
            const cacheKey = `search_history_${limit}`;
            const cached = this.getFromCache(cacheKey);
            if (cached !== null) return cached;
            
            const response = await fetch(`${this.baseURL}/search-history?limit=${limit}`, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setCache(cacheKey, data, 2 * 60 * 1000); // Cache por 2 minutos
                return data;
            }
            
            return [];
        } catch (error) {
            console.error('Error getting search history:', error);
            return [];
        }
    }
    
    // ============= ANALYTICS =============
    
    async trackEvent(eventType, eventCategory = 'general', eventData = {}) {
        try {
            const response = await fetch(`${this.baseURL}/analytics/events`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    event_type: eventType,
                    event_category: eventCategory,
                    event_data: eventData,
                    page_url: window.location.href,
                    user_agent: navigator.userAgent
                })
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return { success: false };
        } catch (error) {
            console.error('Error tracking event:', error);
            return { success: false, error: error.message };
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
    }
    
    // ============= UTILIDADES =============
    
    // Wrapper para métodos que antes usaban localStorage
    async getItem(key, fallback = null) {
        try {
            // Mapear keys de localStorage a métodos de API
            switch (key) {
                case 'playtest_feature_flags':
                    return await this.getAllFeatureFlags();
                case 'user_preferences':
                    return await this.getUserPreferences();
                case 'search_history':
                    return await this.getSearchHistory();
                default:
                    console.warn(`No API mapping for localStorage key: ${key}`);
                    return fallback;
            }
        } catch (error) {
            console.error(`Error getting ${key}:`, error);
            return fallback;
        }
    }
    
    async setItem(key, value) {
        try {
            switch (key) {
                case 'user_preferences':
                    return await this.updateUserPreferences(value);
                default:
                    console.warn(`No API mapping for localStorage key: ${key}`);
                    return { success: false };
            }
        } catch (error) {
            console.error(`Error setting ${key}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    // Método para migración gradual
    async migrateFromLocalStorage() {
        try {
            console.log('🔄 Iniciando migración desde localStorage...');
            
            // Migrar feature flags si existen en localStorage
            const localFlags = localStorage.getItem('playtest_feature_flags');
            if (localFlags) {
                const flags = JSON.parse(localFlags);
                console.log('📦 Migrando feature flags...');
                for (const [flagName, enabled] of Object.entries(flags)) {
                    if (typeof enabled === 'boolean') {
                        await this.updateFeatureFlag(flagName, enabled, { 
                            migrated_from_localStorage: true 
                        });
                    }
                }
                // No eliminar aún, solo marcar como migrado
                localStorage.setItem('playtest_feature_flags_migrated', 'true');
            }
            
            // Migrar preferencias si existen
            const localPrefs = localStorage.getItem('user_preferences');
            if (localPrefs) {
                console.log('⚙️ Migrando preferencias de usuario...');
                await this.updateUserPreferences(JSON.parse(localPrefs));
                localStorage.setItem('user_preferences_migrated', 'true');
            }
            
            console.log('✅ Migración completada');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error en migración:', error);
            return { success: false, error: error.message };
        }
    }
}

// Instancia singleton
export const persistentAPI = new PersistentAPIService();

// Hacer disponible globalmente para compatibilidad
window.persistentAPI = persistentAPI;

export default PersistentAPIService;