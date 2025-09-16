// Navigation Service - Inyección automática de navegación y soporte
// Sistema de navegación contextual para LumiQuiz/PlayTest

class NavigationService {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.supportEnabled = true;
        this.notificationsEnabled = true;
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // Inicialización principal
    init() {
        console.log('🧭 NavigationService initializing...');
        
        try {
            this.detectCurrentUser();
            this.detectCurrentRole();
            this.injectNavigationElements();
            this.setupEventListeners();
            
            console.log('✅ NavigationService initialized successfully');
        } catch (error) {
            console.error('❌ NavigationService initialization failed:', error);
        }
    }

    // Detectar usuario actual
    detectCurrentUser() {
        try {
            const session = localStorage.getItem('gameSession') || localStorage.getItem('playtest_session');
            if (session) {
                this.currentUser = JSON.parse(session);
                console.log('👤 Current user detected:', this.currentUser.nickname || 'Unknown');
            }
        } catch (error) {
            console.warn('⚠️ Could not detect current user:', error);
        }
    }

    // Detectar rol actual
    detectCurrentRole() {
        try {
            this.currentRole = localStorage.getItem('activeRole');
            if (!this.currentRole) {
                // Detectar por URL
                const url = window.location.pathname;
                if (url.includes('admin-principal')) this.currentRole = 'ADP';
                else if (url.includes('admin-secundario')) this.currentRole = 'ADS';
                else if (url.includes('support')) this.currentRole = 'SPT';
                else if (url.includes('creators')) this.currentRole = 'PCC';
                else if (url.includes('profesores') || url.includes('teachers')) this.currentRole = 'PPF';
                else if (url.includes('jugadores') || url.includes('players')) this.currentRole = 'JGD';
            }
            console.log('🎭 Current role detected:', this.currentRole || 'Unknown');
        } catch (error) {
            console.warn('⚠️ Could not detect current role:', error);
        }
    }

    // Inyectar elementos de navegación
    injectNavigationElements() {
        this.injectSupportButtons();
        this.injectNotificationDropdown();
        this.injectQuickNavigation();
    }

    // Inyectar botones de soporte
    injectSupportButtons() {
        if (!this.supportEnabled) return;

        // Buscar ubicación ideal en el DOM
        const targetContainers = [
            '.user-header',
            '.header',
            '.container',
            'body'
        ];

        let targetContainer = null;
        for (const selector of targetContainers) {
            targetContainer = document.querySelector(selector);
            if (targetContainer) break;
        }

        if (!targetContainer) return;

        // Crear botón de soporte contextual
        const supportButton = this.createSupportButton();
        
        // Inyectar de forma no intrusiva
        if (targetContainer.classList.contains('user-header')) {
            // Si hay header de usuario, agregar al lado del logout
            const logoutBtn = targetContainer.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.parentNode.insertBefore(supportButton, logoutBtn);
            } else {
                targetContainer.appendChild(supportButton);
            }
        } else {
            // Crear contenedor flotante
            const floatingContainer = document.createElement('div');
            floatingContainer.className = 'navigation-service-floating';
            floatingContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                gap: 10px;
            `;
            floatingContainer.appendChild(supportButton);
            document.body.appendChild(floatingContainer);
        }
    }

    // Crear botón de soporte
    createSupportButton() {
        const button = document.createElement('button');
        button.className = 'nav-support-btn';
        button.innerHTML = '🆘 Soporte';
        button.style.cssText = `
            background: #10B981;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.3s ease;
            margin-right: 10px;
        `;
        
        button.onmouseover = () => button.style.background = '#059669';
        button.onmouseout = () => button.style.background = '#10B981';
        
        button.onclick = () => this.openSupportPanel();
        
        return button;
    }

    // Inyectar dropdown de notificaciones
    injectNotificationDropdown() {
        if (!this.notificationsEnabled || !this.currentUser) return;

        // Implementación simplificada - puede expandirse
        console.log('📢 Notification dropdown ready');
    }

    // Inyectar navegación rápida
    injectQuickNavigation() {
        // Navegación contextual según rol
        const quickNavLinks = this.getQuickNavForRole();
        if (quickNavLinks.length === 0) return;

        console.log('🚀 Quick navigation ready:', quickNavLinks);
    }

    // Obtener navegación rápida por rol
    getQuickNavForRole() {
        const navMap = {
            'ADP': [
                { text: 'Gestión Usuarios', url: '/admin-principal-panel.html' },
                { text: 'Sistema', url: '/admin-principal-panel.html' }
            ],
            'ADS': [
                { text: 'Usuarios Asignados', url: '/admin-secundario-panel.html' },
                { text: 'Reportes', url: '/admin-secundario-panel.html' }
            ],
            'SPT': [
                { text: 'Tickets', url: '/support-panel.html' },
                { text: 'FAQ', url: '/support-panel.html' }
            ],
            'PCC': [
                { text: 'Crear Contenido', url: '/creators-panel-content.html' },
                { text: 'Analytics', url: '/creators-panel-analytics.html' },
                { text: 'Jugadores', url: '/creators-panel-players.html' }
            ],
            'PPF': [
                { text: 'Estudiantes', url: '/teachers-panel-students.html' },
                { text: 'Horarios', url: '/teachers-panel-schedules.html' },
                { text: 'Funcionalidades', url: '/profesores-panel-funcionalidades.html' }
            ],
            'JGD': [
                { text: 'Jugar', url: '/jugadores-panel-gaming.html' },
                { text: 'Perfil', url: '/jugadores-panel-gaming.html' }
            ]
        };

        return navMap[this.currentRole] || [];
    }

    // Configurar event listeners
    setupEventListeners() {
        // Escuchar cambios de rol
        window.addEventListener('storage', (e) => {
            if (e.key === 'activeRole') {
                this.currentRole = e.newValue;
                console.log('🎭 Role changed to:', this.currentRole);
                this.refresh();
            }
        });

        // Escuchar cambios de usuario
        window.addEventListener('storage', (e) => {
            if (e.key === 'gameSession' || e.key === 'playtest_session') {
                this.detectCurrentUser();
                console.log('👤 User session changed');
                this.refresh();
            }
        });
    }

    // Abrir panel de soporte
    openSupportPanel() {
        // Determinar URL de soporte según rol
        const supportUrls = {
            'ADP': '/admin-principal-panel.html',
            'ADS': '/admin-secundario-panel.html',
            'SPT': '/support-panel.html',
            'PCC': '/creators-panel-content.html',
            'PPF': '/profesores-panel-funcionalidades.html',
            'JGD': '/jugadores-panel-gaming.html'
        };

        const supportUrl = supportUrls[this.currentRole] || '/index.html';
        
        // Mostrar modal o redirigir
        if (confirm('¿Necesitas ayuda? Te dirigiremos al panel de soporte.')) {
            window.location.href = supportUrl;
        }
    }

    // Refrescar servicio
    refresh() {
        // Limpiar elementos existentes
        const existingElements = document.querySelectorAll('.nav-support-btn, .navigation-service-floating');
        existingElements.forEach(el => el.remove());
        
        // Reinicializar
        this.injectNavigationElements();
    }

    // Método público para obtener estado
    getStatus() {
        return {
            user: this.currentUser?.nickname || 'Unknown',
            role: this.currentRole || 'Unknown',
            supportEnabled: this.supportEnabled,
            notificationsEnabled: this.notificationsEnabled
        };
    }
}

// Inicializar servicio automáticamente
const navigationService = new NavigationService();

// ============== GLOBAL UTILITIES ==============

// Global getCurrentUser function - prevents redeclaration errors
window.getCurrentUser = function() {
    try {
        // Check for authentication token first
        const authToken = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
        if (!authToken) {
            console.warn('🔐 No authentication token found. User may not be logged in.');
            // Don't return null immediately - check for session anyway for compatibility
        }

        // Get session data
        const session = localStorage.getItem('gameSession') || localStorage.getItem('playtest_session');
        if (session) {
            const userData = JSON.parse(session);
            
            // Add auth token info if available
            if (authToken) {
                userData._hasAuthToken = true;
                userData._authToken = authToken.substring(0, 20) + '...'; // Only show start for debugging
            }
            
            return userData;
        }

        console.warn('📝 No session data found in localStorage');
        return null;
        
    } catch (error) {
        console.error('❌ Error getting current user:', error);
        return null;
    }
};

// Mark that global getCurrentUser is available
window._getCurrentUserGlobalDefined = true;

// Exportar para uso global
window.NavigationService = NavigationService;
window.navigationService = navigationService;

console.log('🧭 Navigation Service loaded successfully');
console.log('👤 Global getCurrentUser function defined');