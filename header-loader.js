/**
 * Sistema de carga dinámica del header reutilizable
 * Carga el header-component.html y reemplaza los placeholders
 */

// Configuración de los paneles (solo declarar si no existe)
const PANEL_CONFIGS = window.PANEL_CONFIGS || {
    'PAP': {
        title: 'PANEL ADMINISTRADOR PRINCIPAL',
        role: 'Administrador Principal',
        avatar: 'A'
    },
    'PAS': {
        title: 'PANEL ADMINISTRADOR SECUNDARIO',
        role: 'Administrador Secundario',
        avatar: 'A'
    },
    'PCC': {
        title: 'PANEL CREADOR DE CONTENIDO',
        role: 'Creador de Contenido',
        avatar: 'C'
    },
    'PPF': {
        title: 'PANEL PROFESOR',
        role: 'Profesor',
        avatar: 'P'
    },
    'PJG': {
        title: 'PANEL JUGADOR',
        role: 'Jugador',
        avatar: 'J'
    }
};

// Asegurar que esté disponible globalmente
if (!window.PANEL_CONFIGS) {
    window.PANEL_CONFIGS = PANEL_CONFIGS;
}

/**
 * Carga el header dinámicamente
 * @param {string} panelType - Tipo de panel (PAP, PAS, PCC, PPF, PJG)
 * @param {string} containerId - ID del contenedor donde inyectar el header
 * @param {Object} userData - Datos del usuario actual
 * @param {string} userData.name - Nombre del usuario
 * @param {number} userData.luminarias - Cantidad de luminarias del usuario
 * @param {Array} userData.roles - Array de roles del usuario [{code, name, panel}]
 * @param {string} userData.activeRole - Código del rol actualmente activo
 */
async function loadHeader(panelType, containerId = 'header-container', userData = {}) {
    try {
        // Verificar que el tipo de panel sea válido
        if (!PANEL_CONFIGS[panelType]) {
            throw new Error(`Tipo de panel no válido: ${panelType}`);
        }

        const config = PANEL_CONFIGS[panelType];
        
        // Cargar el template del header
        const response = await fetch('header-component.html');
        if (!response.ok) {
            throw new Error(`Error al cargar header: ${response.status}`);
        }
        
        let headerHTML = await response.text();
        
        // Procesar datos del usuario con valores por defecto
        const userInfo = {
            name: userData.name || 'Cargando...',
            luminarias: userData.luminarias || 0,
            roles: userData.roles || [],
            activeRole: userData.activeRole || panelType
        };
        
        // Reemplazar placeholders con los valores específicos del panel y usuario
        headerHTML = headerHTML
            .replace(/\{\{PANEL_TITLE\}\}/g, config.title)
            .replace(/\{\{USER_ROLE\}\}/g, config.role)
            .replace(/\{\{AVATAR_INITIAL\}\}/g, config.avatar);
        
        // Inyectar en el contenedor
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Contenedor no encontrado: ${containerId}`);
        }
        
        container.innerHTML = headerHTML;
        
        // Actualizar datos del usuario después de inyectar el HTML
        updateUserData(userInfo);
        
        // Inicializar selector de roles si el usuario tiene múltiples roles
        if (userInfo.roles.length > 1) {
            initializeRoleSelector(userInfo.roles, userInfo.activeRole);
        } else {
            // Ocultar selector si solo tiene un rol
            const roleSelectorContainer = document.getElementById('role-selector-container');
            if (roleSelectorContainer) {
                roleSelectorContainer.style.display = 'none';
            }
        }
        
        // Agregar clase al body para manejar el padding
        document.body.classList.add('with-fixed-header');
        
        // Cargar los modales después del header
        await loadModals();
        
        // Inicializar funciones del header
        initializeHeaderFunctions();
        
        console.log(`Header cargado exitosamente para panel ${panelType}`);
        
    } catch (error) {
        console.error('Error al cargar el header:', error);
        
        // Fallback: crear header básico
        createFallbackHeader(panelType, containerId);
    }
}

/**
 * Carga los modales de Modalidades de Juego y Niveles por Roles
 */
async function loadModals() {
    try {
        const response = await fetch('modals-component.html');
        if (!response.ok) {
            throw new Error(`Error al cargar modales: ${response.status}`);
        }
        
        const modalsHTML = await response.text();
        
        // Crear contenedor para modales si no existe
        let modalsContainer = document.getElementById('modals-container');
        if (!modalsContainer) {
            modalsContainer = document.createElement('div');
            modalsContainer.id = 'modals-container';
            document.body.appendChild(modalsContainer);
        }
        
        modalsContainer.innerHTML = modalsHTML;
        
        console.log('Modales cargados exitosamente');
        
    } catch (error) {
        console.error('Error al cargar los modales:', error);
    }
}

/**
 * Crea un header básico como fallback en caso de error
 * @param {string} panelType - Tipo de panel
 * @param {string} containerId - ID del contenedor
 */
function createFallbackHeader(panelType, containerId) {
    const config = PANEL_CONFIGS[panelType] || {
        title: 'PANEL DESCONOCIDO',
        role: 'Usuario',
        avatar: '?'
    };
    
    const fallbackHTML = `
        <div class="user-header">
            <div>
                <span>${config.title}</span>
            </div>
            <div>
                <button onclick="logout()">Cerrar Sesión</button>
            </div>
        </div>
    `;
    
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = fallbackHTML;
    }
}

/**
 * Inicializa el header automáticamente basado en metadatos de la página
 */
async function initializeHeader() {
    // Verificar si hay un sistema de header existente activo
    if (document.querySelector('.user-header') && !document.getElementById('header-container')) {
        console.info('🔄 Sistema de header existente detectado, header-loader.js en modo compatibilidad');
        // Solo agregar funciones de roles múltiples al sistema existente
        await enhanceExistingHeader();
        return;
    }
    
    // Buscar metadatos del panel en el HTML
    const panelMeta = document.querySelector('meta[name="panel-type"]');
    const containerMeta = document.querySelector('meta[name="header-container"]');
    
    if (panelMeta) {
        const panelType = panelMeta.getAttribute('content');
        const containerId = containerMeta ? containerMeta.getAttribute('content') : 'header-container';
        
        // Verificar que el contenedor existe
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`📦 Contenedor ${containerId} no encontrado, header-loader.js en espera`);
            return;
        }
        
        console.info('🚀 Inicializando header-loader.js para panel:', panelType);
        
        // Obtener datos del usuario de forma asíncrona
        const userData = await getUserData();
        
        loadHeader(panelType, containerId, userData);
    } else {
        console.warn('No se encontró metadato panel-type. El header debe cargarse manualmente.');
    }
}

/**
 * Mejora el header existente agregando funcionalidad de múltiples roles
 */
async function enhanceExistingHeader() {
    try {
        console.info('🔧 Mejorando header existente con sistema de roles múltiples');
        
        // Obtener datos del usuario
        const userData = await getUserData();
        
        // Si el usuario tiene múltiples roles, agregar selector
        if (userData.roles && userData.roles.length > 1) {
            await addRoleSelectorToExistingHeader(userData);
        }
        
        // Inicializar funciones del header si no existen
        if (!window.logout) {
            initializeHeaderFunctions();
        }
        
        console.info('✅ Header existente mejorado correctamente');
        
    } catch (error) {
        console.warn('⚠️ Error mejorando header existente:', error);
    }
}

/**
 * Agrega selector de roles al header existente
 */
async function addRoleSelectorToExistingHeader(userData) {
    const userHeader = document.querySelector('.user-header');
    if (!userHeader) return;
    
    // Buscar donde insertar el selector (antes del botón de logout)
    const logoutButton = userHeader.querySelector('button[onclick*="logout"]');
    const insertPoint = logoutButton ? logoutButton.parentNode : userHeader;
    
    // Crear el selector de roles
    const roleSelectorHTML = `
        <div style="position: relative; margin-right: 10px;" id="role-selector-container">
            <button id="role-selector-btn" onclick="toggleRoleSelector()" style="background: #2E5266; color: #E0E1DD; border: 1px solid #415A77; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s;" onmouseover="this.style.background='#415A77'" onmouseout="this.style.background='#2E5266'">
                <span id="current-role-name">${getCurrentRoleName(userData)}</span>
                <span style="font-size: 0.75rem;">▼</span>
            </button>
            <div id="role-selector-dropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.25rem; background: #1B263B; border: 1px solid #415A77; border-radius: 0.375rem; box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 2001; min-width: 200px;">
                <div id="role-options" style="padding: 0.25rem 0;">
                    <!-- Las opciones de rol se cargan dinámicamente -->
                </div>
            </div>
        </div>
    `;
    
    // Insertar antes del punto de inserción
    if (logoutButton) {
        logoutButton.insertAdjacentHTML('beforebegin', roleSelectorHTML);
    } else {
        insertPoint.insertAdjacentHTML('beforeend', roleSelectorHTML);
    }
    
    // Inicializar el selector con los roles
    initializeRoleSelector(userData.roles, userData.activeRole);
}

/**
 * Obtiene el nombre del rol actual para mostrar
 */
function getCurrentRoleName(userData) {
    if (!userData.roles || userData.roles.length === 0) return 'Usuario';
    
    const activeRole = userData.roles.find(role => role.code === userData.activeRole);
    return activeRole ? activeRole.name : userData.roles[0].name;
}

/**
 * Obtiene los datos del usuario actual desde tu sistema real
 * @returns {Object} userData
 */
async function getUserData() {
    try {
        // Intentar obtener datos del usuario desde tu API
        if (window.apiDataService) {
            const profile = await window.apiDataService.getUserProfile();
            
            // Obtener sesión actual para datos adicionales
            const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');
            
            // Mapear roles de tu sistema a códigos de panel
            const userRoles = getUserRolesFromSystem(profile, session);
            
            return {
                name: profile.nickname || session.nickname || 'Usuario',
                luminarias: profile.luminarias || profile.stats?.luminarias || 0,
                roles: userRoles,
                activeRole: localStorage.getItem('activeRole') || detectRoleFromToken() || userRoles[0]?.code || 'PJG'
            };
        }
        
        // Fallback: usar datos de localStorage si API no está disponible
        return getUserDataFromLocalStorage();
        
    } catch (error) {
        console.warn('⚠️ Error obteniendo datos del usuario:', error);
        return getUserDataFromLocalStorage();
    }
}

/**
 * Obtiene roles del usuario desde tu sistema actual
 * @param {Object} profile - Perfil del usuario de la API
 * @param {Object} session - Datos de sesión de localStorage
 * @returns {Array} Array de roles del usuario
 */
function getUserRolesFromSystem(profile, session) {
    const roles = [];
    
    // Detectar roles desde el token JWT decodificado
    const tokenRoles = getTokenRoles();
    
    // Mapeo de roles de tu sistema a códigos de panel
    const roleMapping = {
        'administrador_principal': { code: 'PAP', name: 'Administrador Principal', panel: 'admin-principal-panel.html' },
        'administrador_secundario': { code: 'PAS', name: 'Administrador Secundario', panel: 'admin-secundario-panel.html' },
        'creador': { code: 'PCC', name: 'Creador de Contenido', panel: 'creators-panel-content.html' },
        'creador_contenido': { code: 'PCC', name: 'Creador de Contenido', panel: 'creators-panel-content.html' },
        'profesor': { code: 'PPF', name: 'Profesor', panel: 'teachers-panel-schedules.html' },
        'jugador': { code: 'PJG', name: 'Jugador', panel: 'jugadores-panel-gaming.html' }
    };
    
    // Agregar roles detectados
    if (tokenRoles && tokenRoles.length > 0) {
        tokenRoles.forEach(role => {
            if (roleMapping[role]) {
                roles.push(roleMapping[role]);
            }
        });
    }
    
    // Si no se detectaron roles, asignar rol de jugador por defecto
    if (roles.length === 0) {
        roles.push(roleMapping['jugador']);
    }
    
    return roles;
}

/**
 * Obtiene roles del token JWT
 * @returns {Array} Array de roles del token
 */
function getTokenRoles() {
    try {
        const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
        if (!token) return [];
        
        // Decodificar JWT (solo la parte del payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.roles || [];
    } catch (error) {
        console.warn('⚠️ Error decodificando token JWT:', error);
        return [];
    }
}

/**
 * Detecta el rol activo desde el token JWT
 * @returns {string|null} Código del rol activo
 */
function detectRoleFromToken() {
    const tokenRoles = getTokenRoles();
    if (tokenRoles.length === 0) return null;
    
    // Prioridad de roles para detección automática
    const rolePriority = ['administrador_principal', 'administrador_secundario', 'profesor', 'creador', 'creador_contenido', 'jugador'];
    
    for (const priorityRole of rolePriority) {
        if (tokenRoles.includes(priorityRole)) {
            const roleMapping = {
                'administrador_principal': 'PAP',
                'administrador_secundario': 'PAS', 
                'creador': 'PCC',
                'creador_contenido': 'PCC',
                'profesor': 'PPF',
                'jugador': 'PJG'
            };
            return roleMapping[priorityRole];
        }
    }
    
    return null;
}

/**
 * Fallback: obtener datos desde localStorage
 * @returns {Object} userData
 */
function getUserDataFromLocalStorage() {
    const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');
    const storedActiveRole = localStorage.getItem('activeRole');
    
    return {
        name: session.nickname || 'Usuario Demo',
        luminarias: 0, // TODO: Implementar sistema de luminarias
        roles: [
            { code: 'PJG', name: 'Jugador', panel: 'jugadores-panel-gaming.html' }
        ],
        activeRole: storedActiveRole || 'PJG'
    };
}

/**
 * Detecta el tipo de panel actual basado en metadatos
 * @returns {string|null} Código del panel actual
 */
function getCurrentPanelType() {
    const panelMeta = document.querySelector('meta[name="panel-type"]');
    return panelMeta ? panelMeta.getAttribute('content') : null;
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
} else {
    initializeHeader();
}

/**
 * Actualiza los datos del usuario en el header ya cargado
 * @param {Object} userInfo - Información del usuario
 */
function updateUserData(userInfo) {
    const userNameElement = document.getElementById('user-name');
    const userLuminariasElement = document.getElementById('user-luminarias');
    
    if (userNameElement) {
        userNameElement.textContent = userInfo.name;
    }
    
    if (userLuminariasElement) {
        userLuminariasElement.textContent = userInfo.luminarias.toString();
    }
}

/**
 * Inicializa el selector de roles
 * @param {Array} roles - Array de roles disponibles
 * @param {string} activeRole - Rol actualmente activo
 */
function initializeRoleSelector(roles, activeRole) {
    const roleOptionsContainer = document.getElementById('role-options');
    const currentRoleNameElement = document.getElementById('current-role-name');
    
    if (!roleOptionsContainer || !currentRoleNameElement) return;
    
    // Limpiar opciones anteriores
    roleOptionsContainer.innerHTML = '';
    
    // Encontrar y mostrar el rol activo
    const currentRoleObj = roles.find(role => role.code === activeRole);
    if (currentRoleObj) {
        currentRoleNameElement.textContent = currentRoleObj.name;
    }
    
    // Crear opciones para cada rol
    roles.forEach(role => {
        const option = document.createElement('div');
        option.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            color: #E0E1DD;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.875rem;
            ${role.code === activeRole ? 'background: #415A77; font-weight: bold;' : ''}
        `;
        
        option.innerHTML = `
            <span>${role.name}</span>
            ${role.code === activeRole ? '<span style="color: #10B981;">✓</span>' : ''}
        `;
        
        // Solo permitir cambio si no es el rol actual
        if (role.code !== activeRole) {
            option.onmouseover = () => option.style.background = '#415A77';
            option.onmouseout = () => option.style.background = 'transparent';
            option.onclick = () => changeRole(role);
        }
        
        roleOptionsContainer.appendChild(option);
    });
}

/**
 * Cambia el rol activo del usuario
 * @param {Object} newRole - Objeto del nuevo rol {code, name, panel}
 */
function changeRole(newRole) {
    if (confirm(`¿Quieres cambiar a ${newRole.name}?`)) {
        // Guardar el nuevo rol activo (esto debería integrarse con tu sistema de sesión)
        localStorage.setItem('activeRole', newRole.code);
        
        // Redirigir al panel correspondiente
        window.location.href = newRole.panel;
    }
    
    // Cerrar el dropdown
    closeRoleSelector();
}

/**
 * Inicializa las funciones JavaScript del header
 */
function initializeHeaderFunctions() {
    // Función para mostrar/ocultar dropdown de usuario
    window.toggleUserDropdown = function() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    };
    
    // Función para cerrar dropdown de usuario
    window.closeUserDropdown = function() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    };
    
    // Función para mostrar/ocultar dropdown de selector de roles
    window.toggleRoleSelector = function() {
        const dropdown = document.getElementById('role-selector-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
        // Cerrar otros dropdowns
        closeUserDropdown();
    };
    
    // Función para cerrar dropdown de selector de roles
    window.closeRoleSelector = function() {
        const dropdown = document.getElementById('role-selector-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    };
    
    // Función para mostrar/ocultar submenu de explicación del juego
    window.toggleGameExplanationSubmenu = function() {
        const submenu = document.getElementById('game-explanation-submenu');
        if (submenu) {
            submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
        }
    };
    
    // Función de logout
    window.logout = function() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            // Limpiar datos de sesión
            localStorage.clear();
            sessionStorage.clear();
            // Redirigir al login
            window.location.href = 'index.html';
        }
    };
    
    // Funciones para abrir modales (se conectan con modals-component.html)
    window.openGameModesModal = function() {
        openModal('game-modes-modal');
        closeUserDropdown();
    };
    
    window.openRoleLevelsModal = function() {
        openModal('role-levels-modal');
        closeUserDropdown();
    };
    
    // Funciones placeholder para modales específicos de cada panel
    window.openPersonalDataModal = function() {
        alert('Modal de Datos Personales - Por implementar');
        closeUserDropdown();
    };
    
    window.openRoleModificationModal = function() {
        alert('Modal de Modificación de Roles - Por implementar');
        closeUserDropdown();
    };
    
    window.openTopicDevelopmentModal = function() {
        alert('Modal de Desarrollo de Temarios - Por implementar');
        closeUserDropdown();
    };
    
    window.openLuminariasModal = function() {
        alert('Modal de Luminarias - Por implementar');
        closeUserDropdown();
    };
    
    window.openPasswordChangeModal = function() {
        alert('Modal de Cambio de Contraseña - Por implementar');
        closeUserDropdown();
    };
    
    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', function(event) {
        const userDropdown = document.getElementById('user-dropdown');
        const userButton = document.getElementById('user-dropdown-btn');
        const roleDropdown = document.getElementById('role-selector-dropdown');
        const roleButton = document.getElementById('role-selector-btn');
        
        // Cerrar dropdown de usuario si click fuera
        if (userDropdown && userButton && !userButton.contains(event.target) && !userDropdown.contains(event.target)) {
            closeUserDropdown();
        }
        
        // Cerrar dropdown de roles si click fuera
        if (roleDropdown && roleButton && !roleButton.contains(event.target) && !roleDropdown.contains(event.target)) {
            closeRoleSelector();
        }
    });
}

// Exportar funciones para uso manual
window.loadHeader = loadHeader;
window.updateUserData = updateUserData;
window.PANEL_CONFIGS = PANEL_CONFIGS;