/**
 * Sistema de validación de roles centralizado
 * Asegura que los usuarios accedan solo a paneles permitidos para su rol
 */

/**
 * Valida si el usuario actual puede acceder al panel especificado
 * @param {string} requiredRole - Rol requerido para acceder al panel
 * @param {string} panelName - Nombre del panel para logging
 * @returns {boolean} True si puede acceder, false si no
 */
function validatePanelAccess(requiredRole, panelName = 'panel') {
    try {
        console.log(`🔒 Validando acceso a ${panelName}...`);
        
        // Obtener token
        const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
        if (!token) {
            console.error('❌ No se encontró token de autenticación');
            redirectToLogin('Token no encontrado');
            return false;
        }
        
        // Decodificar JWT para obtener roles
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRoles = payload.roles || [];
        const userId = payload.userId || payload.user_id || payload.id;
        const nickname = payload.nickname || 'Usuario';
        
        console.log('🔍 Datos del token:', {
            userId,
            nickname,
            roles: userRoles,
            requiredRole,
            panelName
        });
        
        // Normalizar roles para comparación
        const normalizedUserRoles = userRoles.map(role => normalizeRoleName(role));
        const normalizedRequiredRole = normalizeRoleName(requiredRole);
        
        console.log('🔍 Roles normalizados:', {
            userRoles: normalizedUserRoles,
            requiredRole: normalizedRequiredRole
        });
        
        // Verificar si el usuario tiene el rol requerido
        const hasRequiredRole = normalizedUserRoles.includes(normalizedRequiredRole);
        
        if (hasRequiredRole) {
            console.log(`✅ Acceso autorizado a ${panelName} para usuario ${nickname}`);
            return true;
        } else {
            console.error(`❌ Acceso denegado a ${panelName} para usuario ${nickname}`, {
                userRoles: normalizedUserRoles,
                requiredRole: normalizedRequiredRole
            });
            showAccessDeniedMessage(panelName, normalizedUserRoles);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error validando acceso al panel:', error);
        redirectToLogin('Error de validación');
        return false;
    }
}

/**
 * Normaliza nombres de roles para comparación consistente
 * @param {string} role - Nombre del rol a normalizar
 * @returns {string} Rol normalizado
 */
function normalizeRoleName(role) {
    if (!role) return '';
    
    const normalizations = {
        'admin_principal': 'administrador_principal',
        'admin_secundario': 'administrador_secundario',
        'creador_contenido': 'creador',
        'profesor_creador': 'creador'
    };
    
    const lowercaseRole = role.toLowerCase();
    return normalizations[lowercaseRole] || lowercaseRole;
}

/**
 * Obtiene el panel correcto para el rol del usuario
 * @returns {string} URL del panel correcto
 */
function getCorrectPanelForUser() {
    try {
        const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
        if (!token) return 'index.html';
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRoles = payload.roles || [];
        
        // Prioridad de paneles basada en roles
        const roleToPanelMapping = {
            'administrador_principal': 'admin-principal-panel.html',
            'admin_principal': 'admin-principal-panel.html',
            'administrador_secundario': 'admin-secundario-panel.html', 
            'admin_secundario': 'admin-secundario-panel.html',
            'creador': 'creators-panel-content.html',
            'creador_contenido': 'creators-panel-content.html',
            'profesor_creador': 'creators-panel-content.html',
            'profesor': 'teachers-panel-schedules.html',
            'jugador': 'jugadores-panel-gaming.html'
        };
        
        // Buscar el panel correcto basado en la prioridad de roles
        const priorityOrder = ['administrador_principal', 'admin_principal', 'administrador_secundario', 'admin_secundario', 'creador', 'creador_contenido', 'profesor_creador', 'profesor', 'jugador'];
        
        for (const role of priorityOrder) {
            if (userRoles.includes(role)) {
                return roleToPanelMapping[role];
            }
        }
        
        // Si no tiene roles, permitir acceso a index para que pueda usar "Modificar Roles"
        console.log('❌ Usuario sin roles - debe usar Modificar Roles en el header');
        return 'index.html';
        
    } catch (error) {
        console.error('Error determinando panel correcto:', error);
        return 'index.html';
    }
}

/**
 * Muestra mensaje de acceso denegado y redirige al panel correcto
 * @param {string} attemptedPanel - Panel al que intentó acceder
 * @param {Array} userRoles - Roles del usuario
 */
function showAccessDeniedMessage(attemptedPanel, userRoles) {
    const correctPanel = getCorrectPanelForUser();
    
    const message = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
        ">
            <div style="
                background: #1B263B;
                padding: 2rem;
                border-radius: 12px;
                border: 2px solid #EF4444;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🚫</div>
                <h2 style="color: #EF4444; margin: 0 0 1rem 0;">Acceso Denegado</h2>
                <p style="margin: 0 0 1rem 0; color: #E0E1DD;">
                    No tienes permisos para acceder a este panel.
                </p>
                <p style="margin: 0 0 1.5rem 0; color: #778DA9; font-size: 0.9rem;">
                    Tus roles actuales: ${userRoles.join(', ')}
                </p>
                <button onclick="window.location.href='${correctPanel}'" style="
                    background: #3B82F6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-right: 0.5rem;
                ">
                    Ir al Panel Correcto
                </button>
                <button onclick="window.location.href='index.html'" style="
                    background: #6B7280;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                    Volver al Login
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', message);
}

/**
 * Redirige al login con mensaje de error
 * @param {string} reason - Razón de la redirección
 */
function redirectToLogin(reason) {
    console.log(`🔄 Redirigiendo al login: ${reason}`);
    
    // Limpiar tokens
    localStorage.removeItem('playtest_auth_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    localStorage.removeItem('activeRole');
    
    // Redirigir con parámetro de error
    setTimeout(() => {
        window.location.href = `index.html?error=${encodeURIComponent(reason)}`;
    }, 1500);
}

/**
 * Inicializa la validación automática del panel actual
 */
function initializePanelValidation() {
    // Obtener el tipo de panel de los metadatos
    const panelMeta = document.querySelector('meta[name="panel-type"]');
    if (!panelMeta) {
        console.warn('No se encontró metadato panel-type');
        return;
    }
    
    const panelType = panelMeta.getAttribute('content');
    const panelMapping = {
        'PAP': { role: 'administrador_principal', name: 'Administrador Principal' },
        'PAS': { role: 'administrador_secundario', name: 'Administrador Secundario' },
        'PCC': { role: 'creador', name: 'Creador de Contenido' },
        'PPF': { role: 'profesor', name: 'Profesor' },
        'PJG': { role: 'jugador', name: 'Jugador' }
    };
    
    const panelInfo = panelMapping[panelType];
    if (!panelInfo) {
        console.warn(`Tipo de panel desconocido: ${panelType}`);
        return;
    }
    
    // Validar acceso
    const hasAccess = validatePanelAccess(panelInfo.role, panelInfo.name);
    if (!hasAccess) {
        // El acceso fue denegado, la función ya maneja la redirección
        return;
    }
    
    console.log(`✅ Validación de panel completada: ${panelInfo.name}`);
}

// Auto-inicializar la validación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePanelValidation);
} else {
    initializePanelValidation();
}

// Exportar funciones para uso manual
window.validatePanelAccess = validatePanelAccess;
window.getCorrectPanelForUser = getCorrectPanelForUser;