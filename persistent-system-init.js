/**
 * Inicializador del Sistema Persistente - PLAYTEST
 * Carga e inicializa todos los servicios de persistencia en PostgreSQL
 */

// Importar todos los servicios persistentes
import { persistentAPI } from './persistent-api-service.js';
import { featureFlagsAPI } from './feature-flags-api-persistent.js';
import { dataMigrationClient } from './data-migration-client.js';

class PersistentSystemInitializer {
    constructor() {
        this.initialized = false;
        this.services = {
            persistentAPI,
            featureFlagsAPI,
            dataMigrationClient
        };
        
        this.initPromise = null;
        this.authCheckInterval = null;
    }
    
    async initialize() {
        if (this.initialized) {
            console.log('✅ Sistema persistente ya inicializado');
            return true;
        }
        
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = this.performInitialization();
        return this.initPromise;
    }
    
    async performInitialization() {
        try {
            console.log('🚀 Inicializando sistema persistente PLAYTEST...');
            
            // 1. Verificar conectividad con el backend (no crítico)
            const backendAvailable = await this.checkBackendConnectivity();
            
            // 2. Configurar autenticación
            this.setupAuthentication();
            
            // 3. Verificar token existente
            const token = localStorage.getItem('authToken');
            if (token) {
                this.configureServicesWithToken(token);
                
                // 4. Verificar migración si hay usuario autenticado
                await this.checkAndPerformMigration();
            }
            
            // 5. Configurar event listeners
            this.setupEventListeners();
            
            // 6. Configurar monitoreo de autenticación
            this.setupAuthMonitoring();
            
            this.initialized = true;
            console.log('✅ Sistema persistente inicializado correctamente');
            
            // Disparar evento de inicialización
            window.dispatchEvent(new CustomEvent('persistentSystemInitialized', {
                detail: { timestamp: new Date().toISOString() }
            }));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando sistema persistente:', error);
            this.initPromise = null;
            return false;
        }
    }
    
    async checkBackendConnectivity() {
        try {
            console.log('🔗 Verificando conectividad con backend...');
            
            // Usar el servicio persistente para obtener la URL correcta
            const baseURL = this.services.persistentAPI.baseURL;
            const healthURL = baseURL.replace('/api', '/health');
            
            const response = await fetch(healthURL, {
                method: 'GET',
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`Backend health check failed: ${response.status}`);
            }
            
            const health = await response.json();
            console.log('✅ Backend conectado:', health);
            
        } catch (error) {
            console.warn('⚠️ Backend no disponible, usando modo de fallback local');
            // No lanzar error, permitir que el sistema funcione en modo offline
            return false;
        }
    }
    
    setupAuthentication() {
        // Configurar interceptores para manejar tokens expirados
        this.setupTokenInterceptors();
        
        // Monitorear cambios en localStorage del token
        this.monitorTokenChanges();
    }
    
    setupTokenInterceptors() {
        // Interceptor global para fetch
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            try {
                const response = await originalFetch(url, options);
                
                // Si recibimos 401, el token expiró
                if (response.status === 401 && options.headers?.Authorization) {
                    console.log('🔐 Token expirado, limpiando autenticación...');
                    this.handleTokenExpiration();
                }
                
                return response;
            } catch (error) {
                throw error;
            }
        };
    }
    
    monitorTokenChanges() {
        let lastToken = localStorage.getItem('authToken');
        
        setInterval(() => {
            const currentToken = localStorage.getItem('authToken');
            
            if (currentToken !== lastToken) {
                if (currentToken) {
                    console.log('🔑 Nuevo token detectado, configurando servicios...');
                    this.configureServicesWithToken(currentToken);
                    
                    // Verificar migración para usuario recién autenticado
                    this.checkAndPerformMigration();
                    
                    // Disparar evento
                    window.dispatchEvent(new CustomEvent('userAuthenticated', {
                        detail: { token: currentToken, timestamp: new Date().toISOString() }
                    }));
                    
                } else if (lastToken) {
                    console.log('🔓 Token eliminado, limpiando servicios...');
                    this.clearServicesAuthentication();
                    
                    // Disparar evento
                    window.dispatchEvent(new CustomEvent('userLoggedOut', {
                        detail: { timestamp: new Date().toISOString() }
                    }));
                }
                
                lastToken = currentToken;
            }
        }, 1000); // Verificar cada segundo
    }
    
    configureServicesWithToken(token) {
        // Configurar token en todos los servicios
        persistentAPI.setAuthToken(token);
        
        console.log('✅ Token configurado en todos los servicios');
    }
    
    clearServicesAuthentication() {
        // Limpiar autenticación de todos los servicios
        persistentAPI.setAuthToken(null);
        
        // Limpiar caches
        persistentAPI.clearAllCache();
        featureFlagsAPI.clearAllCache();
        
        console.log('🧹 Autenticación limpiada de todos los servicios');
    }
    
    handleTokenExpiration() {
        // Limpiar token
        localStorage.removeItem('authToken');
        
        // Limpiar servicios
        this.clearServicesAuthentication();
        
        // Disparar evento de expiración
        window.dispatchEvent(new CustomEvent('tokenExpired', {
            detail: { timestamp: new Date().toISOString() }
        }));
        
        // Redirigir al login si es necesario
        if (window.location.pathname !== '/login.html') {
            console.log('🔄 Redirigiendo al login por token expirado...');
            setTimeout(() => {
                window.location.href = '/login.html?reason=token_expired';
            }, 1000);
        }
    }
    
    async checkAndPerformMigration() {
        try {
            const migrationStatus = dataMigrationClient.getMigrationStatus();
            
            if (!migrationStatus.completed) {
                console.log('🔄 Iniciando migración automática de datos...');
                await dataMigrationClient.performFullMigration();
            } else {
                console.log('✅ Datos ya migrados anteriormente');
            }
        } catch (error) {
            console.warn('⚠️ Error verificando migración:', error);
        }
    }
    
    setupEventListeners() {
        // Listener para when the page is about to unload
        window.addEventListener('beforeunload', () => {
            // Limpiar intervalos y recursos
            if (this.authCheckInterval) {
                clearInterval(this.authCheckInterval);
            }
        });
        
        // Listener para cambios de visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                // Página visible otra vez, verificar conectividad
                this.verifyServicesHealth();
            }
        });
        
        // Listener para errores globales
        window.addEventListener('error', (event) => {
            if (event.error?.message?.includes('PostgreSQL') || 
                event.error?.message?.includes('persistent')) {
                console.warn('⚠️ Error relacionado con persistencia:', event.error);
                
                // Track error for analytics
                persistentAPI.trackEvent('system_error', 'persistence', {
                    error_message: event.error.message,
                    error_stack: event.error.stack
                });
            }
        });
    }
    
    setupAuthMonitoring() {
        // Verificar estado de autenticación periódicamente
        this.authCheckInterval = setInterval(async () => {
            const token = localStorage.getItem('authToken');
            
            if (token && this.initialized) {
                try {
                    // Hacer una llamada simple para verificar que el token sigue válido
                    const response = await fetch('/api/users/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (!response.ok) {
                        console.log('🔐 Token no válido detectado en verificación periódica');
                        this.handleTokenExpiration();
                    }
                } catch (error) {
                    console.warn('⚠️ Error verificando token:', error);
                }
            }
        }, 5 * 60 * 1000); // Verificar cada 5 minutos
    }
    
    async verifyServicesHealth() {
        try {
            // Verificar conectividad básica
            await this.checkBackendConnectivity();
            
            // Verificar servicios específicos si hay token
            const token = localStorage.getItem('authToken');
            if (token) {
                // Test básico de cada servicio
                await persistentAPI.getAllFeatureFlags();
                
                console.log('✅ Verificación de salud de servicios completada');
            }
            
        } catch (error) {
            console.warn('⚠️ Problemas detectados en verificación de salud:', error);
        }
    }
    
    // Método para obtener información del sistema
    getSystemInfo() {
        return {
            initialized: this.initialized,
            services: Object.keys(this.services),
            authToken: !!localStorage.getItem('authToken'),
            migrationStatus: dataMigrationClient.getMigrationStatus(),
            backendConnected: true // Se establecería en false si hay problemas de conectividad
        };
    }
    
    // Método para reinicializar el sistema
    async reinitialize() {
        console.log('🔄 Reinicializando sistema persistente...');
        
        // Limpiar estado actual
        this.initialized = false;
        this.initPromise = null;
        
        // Limpiar intervalos
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        
        // Reinicializar
        return await this.initialize();
    }
    
    // Métodos de utilidad para desarrollo/debugging
    async forceMigration() {
        if (!this.initialized) {
            throw new Error('Sistema no inicializado');
        }
        return await dataMigrationClient.forceMigration();
    }
    
    clearAllData() {
        if (confirm('¿Estás seguro de que quieres limpiar todos los datos persistentes?')) {
            persistentAPI.clearAllCache();
            featureFlagsAPI.clearAllCache();
            
            // Limpiar localStorage relacionado con migración
            Object.values(dataMigrationClient.migrationKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('🧹 Datos persistentes limpiados');
        }
    }
}

// Instancia singleton
export const persistentSystemInit = new PersistentSystemInitializer();

// Auto-inicialización cuando se carga el script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 DOM cargado, inicializando sistema persistente...');
    await persistentSystemInit.initialize();
});

// Hacer disponible globalmente para debugging
window.persistentSystemInit = persistentSystemInit;
window.persistentServices = {
    persistentAPI,
    featureFlagsAPI,
    dataMigrationClient
};

// Función de utilidad para verificar si el sistema está listo
export function isPersistentSystemReady() {
    return persistentSystemInit.initialized;
}

// Función de utilidad para esperar a que el sistema esté listo
export function waitForPersistentSystem() {
    return new Promise((resolve) => {
        if (persistentSystemInit.initialized) {
            resolve(true);
        } else {
            const listener = () => {
                window.removeEventListener('persistentSystemInitialized', listener);
                resolve(true);
            };
            window.addEventListener('persistentSystemInitialized', listener);
        }
    });
}

export default PersistentSystemInitializer;