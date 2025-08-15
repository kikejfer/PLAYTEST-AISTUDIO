// Servicio de Navegación para Sistema de Comunicación PLAYTEST
// Integración automática de botones de soporte y notificaciones

class NavigationService {
    constructor() {
        this.currentUser = null;
        this.userRoles = [];
        this.unreadNotifications = 0;
        this.supportButtons = null;
        this.notificationBadge = null;
        this.pollingInterval = null;
        
        // Configuración
        this.config = {
            pollingIntervalMs: 30000, // 30 segundos
            supportButtonSelectors: [
                '#support-button',
                '.support-button',
                '[data-support-button]'
            ]
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            this.injectSupportButtons();
            this.startNotificationPolling();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error inicializando NavigationService:', error);
        }
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            // Cargar perfil de usuario
            const userResponse = await fetch('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (userResponse.ok) {
                this.currentUser = await userResponse.json();
            }

            // Cargar roles del usuario
            const rolesResponse = await fetch('/api/roles/my-roles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (rolesResponse.ok) {
                this.userRoles = await rolesResponse.json();
            }

        } catch (error) {
            console.warn('Error cargando datos de usuario:', error);
        }
    }

    injectSupportButtons() {
        if (!this.currentUser) return;

        // Crear HTML de botones de soporte
        const supportHTML = this.generateSupportButtonsHTML();
        
        // Buscar ubicaciones para insertar botones
        this.insertSupportButtons(supportHTML);
        
        // Configurar event listeners
        this.setupSupportButtonEvents();
    }

    generateSupportButtonsHTML() {
        const hasAdminRoles = this.userRoles.some(role => 
            ['administrador_principal', 'administrador_secundario'].includes(role.name)
        );

        return `
            <div class="playtest-support-nav" id="playtest-support-nav">
                <!-- Botón principal de Soporte Técnico -->
                <div class="support-button-container">
                    <button class="support-btn support-btn-primary" onclick="NavigationService.instance.openGlobalSupport()">
                        <span class="support-icon">🛠️</span>
                        <span class="support-text">Soporte Técnico</span>
                    </button>
                </div>

                <!-- Botón de Mis Tickets con badge de notificaciones -->
                <div class="support-button-container">
                    <button class="support-btn support-btn-secondary" onclick="NavigationService.instance.openTicketsList()">
                        <span class="support-icon">📋</span>
                        <span class="support-text">Mis Tickets</span>
                        <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
                    </button>
                </div>

                <!-- Botones para administradores -->
                ${hasAdminRoles ? `
                <div class="support-button-container admin-only">
                    <button class="support-btn support-btn-admin" onclick="NavigationService.instance.openAdminPanel()">
                        <span class="support-icon">⚙️</span>
                        <span class="support-text">Panel Admin</span>
                    </button>
                </div>
                ` : ''}

                <!-- Botón de notificaciones rápidas -->
                <div class="support-button-container">
                    <button class="support-btn support-btn-notifications" onclick="NavigationService.instance.toggleNotifications()">
                        <span class="support-icon">🔔</span>
                        <span class="notification-count" id="notification-count">0</span>
                    </button>
                    
                    <!-- Panel desplegable de notificaciones -->
                    <div class="notifications-dropdown" id="notifications-dropdown" style="display: none;">
                        <div class="notifications-header">
                            <h4>Notificaciones Recientes</h4>
                            <button class="btn-mark-all-read" onclick="NavigationService.instance.markAllAsRead()">
                                Marcar todas
                            </button>
                        </div>
                        <div class="notifications-list" id="notifications-list">
                            <div class="loading">Cargando...</div>
                        </div>
                        <div class="notifications-footer">
                            <button onclick="NavigationService.instance.openTicketsList()">Ver todos los tickets</button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                /* Estilos para navegación de soporte */
                .playtest-support-nav {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .support-button-container {
                    position: relative;
                }

                .support-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    background: white;
                    color: #333;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .support-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }

                .support-btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .support-btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .support-btn-admin {
                    background: #28a745;
                    color: white;
                }

                .support-btn-notifications {
                    padding: 8px 12px;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    position: relative;
                }

                .support-icon {
                    font-size: 16px;
                }

                .support-text {
                    font-size: 13px;
                    font-weight: 600;
                }

                .notification-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #dc3545;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 11px;
                    font-weight: 600;
                    min-width: 18px;
                    text-align: center;
                }

                .notification-count {
                    font-size: 12px;
                    font-weight: 600;
                    color: #667eea;
                }

                .notifications-dropdown {
                    position: absolute;
                    top: 50px;
                    right: 0;
                    width: 350px;
                    max-width: 90vw;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    border: 1px solid #e1e8ed;
                    z-index: 1000;
                    overflow: hidden;
                }

                .notifications-header {
                    padding: 15px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e1e8ed;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .notifications-header h4 {
                    margin: 0;
                    color: #333;
                    font-size: 16px;
                }

                .btn-mark-all-read {
                    background: none;
                    border: none;
                    color: #667eea;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .btn-mark-all-read:hover {
                    background: #f0f0f0;
                }

                .notifications-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .notification-item-mini {
                    padding: 12px 15px;
                    border-bottom: 1px solid #f0f0f0;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .notification-item-mini:hover {
                    background: #f8f9fa;
                }

                .notification-item-mini.unread {
                    background: #e3f2fd;
                    border-left: 3px solid #2196f3;
                }

                .notification-title-mini {
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 2px;
                    color: #333;
                }

                .notification-message-mini {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 4px;
                }

                .notification-time-mini {
                    font-size: 11px;
                    color: #999;
                }

                .notifications-footer {
                    padding: 10px 15px;
                    background: #f8f9fa;
                    border-top: 1px solid #e1e8ed;
                    text-align: center;
                }

                .notifications-footer button {
                    background: none;
                    border: none;
                    color: #667eea;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-weight: 600;
                }

                .notifications-footer button:hover {
                    background: #f0f0f0;
                }

                .loading {
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 13px;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .playtest-support-nav {
                        gap: 8px;
                    }

                    .support-btn {
                        padding: 6px 12px;
                        font-size: 12px;
                    }

                    .support-text {
                        display: none;
                    }

                    .notifications-dropdown {
                        width: 300px;
                        right: -100px;
                    }
                }

                /* Ocultar en pantallas muy pequeñas */
                @media (max-width: 480px) {
                    .support-text {
                        display: none;
                    }
                    
                    .admin-only {
                        display: none;
                    }
                }
            </style>
        `;
    }

    insertSupportButtons(html) {
        // Estrategia 1: Buscar contenedores existentes
        const possibleContainers = [
            '#navigation',
            '.navigation',
            '#header',
            '.header',
            '#navbar',
            '.navbar',
            '#menu',
            '.menu',
            '.header-actions',
            '.nav-actions'
        ];

        let inserted = false;
        for (const selector of possibleContainers) {
            const container = document.querySelector(selector);
            if (container) {
                container.insertAdjacentHTML('beforeend', html);
                inserted = true;
                break;
            }
        }

        // Estrategia 2: Crear contenedor propio si no se encuentra ubicación
        if (!inserted) {
            // Buscar body o crear contenedor flotante
            const body = document.body;
            if (body) {
                const floatingContainer = document.createElement('div');
                floatingContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                `;
                floatingContainer.innerHTML = html;
                body.appendChild(floatingContainer);
            }
        }
    }

    setupSupportButtonEvents() {
        // Ya configurado mediante onclick en HTML
        // Aquí podemos agregar eventos adicionales si es necesario
    }

    async startNotificationPolling() {
        await this.updateNotifications();
        
        this.pollingInterval = setInterval(async () => {
            await this.updateNotifications();
        }, this.config.pollingIntervalMs);
    }

    async updateNotifications() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/communication/notifications?limit=5&unreadOnly=true', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateNotificationUI(data.notifications, data.unreadCount);
            }
        } catch (error) {
            console.warn('Error actualizando notificaciones:', error);
        }
    }

    updateNotificationUI(notifications, unreadCount) {
        // Actualizar badge de tickets
        const notificationBadge = document.getElementById('notification-badge');
        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                notificationBadge.style.display = 'block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }

        // Actualizar contador de notificaciones
        const notificationCount = document.getElementById('notification-count');
        if (notificationCount) {
            notificationCount.textContent = unreadCount > 99 ? '99+' : unreadCount;
        }

        // Actualizar lista de notificaciones
        this.updateNotificationsList(notifications);
    }

    updateNotificationsList(notifications) {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '<div class="loading">No hay notificaciones nuevas</div>';
            return;
        }

        const notificationsHTML = notifications.map(notification => `
            <div class="notification-item-mini ${!notification.is_read ? 'unread' : ''}" 
                 onclick="NavigationService.instance.handleNotificationClick('${notification.id}', '${notification.action_url || '#'}')">
                <div class="notification-title-mini">${notification.title}</div>
                <div class="notification-message-mini">${notification.message}</div>
                <div class="notification-time-mini">${this.formatRelativeTime(notification.created_at)}</div>
            </div>
        `).join('');

        notificationsList.innerHTML = notificationsHTML;
    }

    formatRelativeTime(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    }

    // Métodos de navegación
    openGlobalSupport() {
        window.location.href = 'support-form.html?type=global';
    }

    openBlockSupport(blockId) {
        window.location.href = `support-form.html?type=block&blockId=${blockId}`;
    }

    openTicketsList() {
        window.location.href = 'tickets-list.html';
    }

    openTicket(ticketId) {
        window.location.href = `ticket-chat.html?ticketId=${ticketId}`;
    }

    openAdminPanel() {
        const isMainAdmin = this.userRoles.some(role => role.name === 'administrador_principal');
        if (isMainAdmin) {
            window.location.href = 'admin-principal-panel.html';
        } else {
            window.location.href = 'admin-secundario-panel.html';
        }
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display !== 'none';
            dropdown.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                // Cargar notificaciones al abrir
                this.loadNotificationsForDropdown();
            }
        }
    }

    async loadNotificationsForDropdown() {
        try {
            const response = await fetch('/api/communication/notifications?limit=10', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateNotificationsList(data.notifications);
            }
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        }
    }

    async handleNotificationClick(notificationId, actionUrl) {
        try {
            // Marcar como leída
            await fetch(`/api/communication/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            // Cerrar dropdown
            const dropdown = document.getElementById('notifications-dropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }

            // Actualizar notificaciones
            await this.updateNotifications();

            // Navegar si hay URL
            if (actionUrl && actionUrl !== '#') {
                window.location.href = actionUrl;
            }

        } catch (error) {
            console.error('Error manejando click de notificación:', error);
        }
    }

    async markAllAsRead() {
        try {
            await fetch('/api/communication/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            await this.updateNotifications();

        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    }

    setupEventListeners() {
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('notifications-dropdown');
            const button = document.querySelector('.support-btn-notifications');
            
            if (dropdown && button && 
                !dropdown.contains(event.target) && 
                !button.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Método para crear botón de reporte específico de bloque
    static createBlockReportButton(blockId, blockName) {
        const button = document.createElement('button');
        button.className = 'btn btn-report-block';
        button.innerHTML = '🚨 Reportar Problema';
        button.onclick = () => {
            if (NavigationService.instance) {
                NavigationService.instance.openBlockSupport(blockId);
            } else {
                window.location.href = `support-form.html?type=block&blockId=${blockId}`;
            }
        };

        button.style.cssText = `
            background: #dc3545;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 5px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 10px;
            transition: all 0.3s ease;
        `;

        button.onmouseover = () => {
            button.style.background = '#c82333';
            button.style.transform = 'translateY(-1px)';
        };

        button.onmouseout = () => {
            button.style.background = '#dc3545';
            button.style.transform = 'translateY(0)';
        };

        return button;
    }

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        const supportNav = document.getElementById('playtest-support-nav');
        if (supportNav) {
            supportNav.remove();
        }
    }
}

// Auto-inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si hay un usuario autenticado
    const token = localStorage.getItem('authToken');
    if (token) {
        NavigationService.instance = new NavigationService();
    }
});

// Cleanup al cerrar la página
window.addEventListener('beforeunload', () => {
    if (NavigationService.instance) {
        NavigationService.instance.destroy();
    }
});

// Exportar para uso global
window.NavigationService = NavigationService;