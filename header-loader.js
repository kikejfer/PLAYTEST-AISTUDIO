/**
 * Sistema de carga dinámica del header reutilizable
 * Carga el header-component.html y reemplaza los placeholders
 */

// Configuración de los paneles (solo declarar si no existe)
if (!window.PANEL_CONFIGS) {
    window.PANEL_CONFIGS = {
        'PAP': {
            title: 'PANEL ADMINISTRADOR PRINCIPAL',
            role: 'Administrador Principal'
        },
        'PAS': {
            title: 'PANEL ADMINISTRADOR SECUNDARIO',
            role: 'Administrador Secundario'
        },
        'PCC': {
            title: 'PANEL CREADOR DE CONTENIDO',
            role: 'Creador de Contenido'
        },
        'PPF': {
            title: 'PANEL PROFESOR',
            role: 'Profesor'
        },
        'PJG': {
            title: 'PANEL JUGADOR',
            role: 'Jugador'
        }
    };
}

// Prevent multiple header loads
let isHeaderLoading = false;
let isHeaderLoaded = false;

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
        // Prevent multiple simultaneous loads
        if (isHeaderLoading) {
            console.log('🔄 HEADER DEBUG - Header already loading, skipping');
            return;
        }
        
        if (isHeaderLoaded) {
            console.log('🔄 HEADER DEBUG - Header already loaded, skipping');
            return;
        }
        
        isHeaderLoading = true;
        console.log('🚀 HEADER DEBUG - Starting header load for panel:', panelType);
        
        // Verificar que el tipo de panel sea válido
        if (!window.PANEL_CONFIGS[panelType]) {
            throw new Error(`Tipo de panel no válido: ${panelType}`);
        }

        const config = window.PANEL_CONFIGS[panelType];
        
        // Cargar el template del header
        const response = await fetch('header-component.html');
        if (!response.ok) {
            throw new Error(`Error al cargar header: ${response.status}`);
        }
        
        let headerHTML = await response.text();
        
        // Procesar datos del usuario con valores por defecto
        const userInfo = {
            name: userData.name || 'Cargando...',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            luminarias: userData.luminarias || 0,
            roles: userData.roles || [],
            activeRole: userData.activeRole || panelType
        };
        
        // Generar inicial del usuario basada en su nombre
        const userInitial = userInfo.name && userInfo.name !== 'Cargando...' 
            ? userInfo.name.charAt(0).toUpperCase() 
            : '?';
        
        // Reemplazar placeholders con los valores específicos del panel y usuario
        const currentRoleName = getCurrentRoleName(userInfo);
        headerHTML = headerHTML
            .replace(/\{\{PANEL_TITLE\}\}/g, config.title)
            .replace(/\{\{USER_ROLE\}\}/g, currentRoleName)
            .replace(/\{\{AVATAR_INITIAL\}\}/g, userInitial);
        
        // Inyectar en el contenedor
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Contenedor no encontrado: ${containerId}`);
        }
        
        container.innerHTML = headerHTML;
        
        // Actualizar datos del usuario después de inyectar el HTML
        updateUserData(userInfo);
        
        // Inicializar selector de roles
        const roleSelectorContainer = document.getElementById('role-selector-container');
        
        // DEBUG: Verificar datos del usuario para troubleshoot
        console.log('🔍 DEBUG Header Usuario Completo:', {
            userInfo,
            name: userInfo.name,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            fullName: [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' '),
            rolesCount: userInfo.roles.length,
            roles: userInfo.roles,
            activeRole: userInfo.activeRole,
            container: !!roleSelectorContainer
        });
        
        // Mostrar selector de roles basado en roles reales del usuario
        if (userInfo.roles.length > 1) {
            console.log('✅ Múltiples roles detectados, inicializando selector');
            initializeRoleSelector(userInfo.roles, userInfo.activeRole);
            
            // Mostrar el contenedor del selector
            if (roleSelectorContainer) {
                roleSelectorContainer.style.display = 'block';
                console.log('✅ Contenedor del selector mostrado');
            }
        } else if (userInfo.roles.length === 1) {
            console.log(`ℹ️ Usuario tiene solo 1 rol: ${userInfo.roles[0].name}`);
            // Ocultar el selector si solo hay un rol
            if (roleSelectorContainer) {
                roleSelectorContainer.style.display = 'none';
                console.log('🔒 Contenedor del selector oculto (solo 1 rol)');
            }
        } else {
            console.log('❌ No se detectaron roles válidos');
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
        
        
        // Mark header as loaded
        isHeaderLoaded = true;
        console.log('✅ HEADER DEBUG - Header load completed successfully');

    } catch (error) {
        console.error('Error al cargar el header:', error);
        
        // Fallback: crear header básico
        createFallbackHeader(panelType, containerId);
        
        // Mark as loaded even on error to prevent endless retries
        isHeaderLoaded = true;
        console.log('❌ HEADER DEBUG - Header load failed, marked as loaded to prevent retries');
    } finally {
        // Always clear the loading flag
        isHeaderLoading = false;
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
        
        // Verificar qué modales se cargaron
        const modalElements = document.querySelectorAll('[id$="-modal"]');
        
    } catch (error) {
        console.error('❌ ERROR: al cargar los modales:', error);
    }
}

/**
 * Crea un header básico como fallback en caso de error
 * @param {string} panelType - Tipo de panel
 * @param {string} containerId - ID del contenedor
 */
function createFallbackHeader(panelType, containerId) {
    const config = window.PANEL_CONFIGS[panelType] || {
        title: 'PANEL DESCONOCIDO',
        role: 'Usuario'
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
        
        // Agregar roles adicionales para prueba si solo tiene uno (para header existente)
        if (userData.roles && userData.roles.length === 1) {
            const currentRole = userData.roles[0];
            const allRoles = [
                { code: 'PAP', name: 'Administrador Principal', panel: 'admin-principal-panel.html' },
                { code: 'PAS', name: 'Administrador Secundario', panel: 'admin-secundario-panel.html' },
                { code: 'PCC', name: 'Creador de Contenido', panel: 'creators-panel-content.html' },
                { code: 'PPF', name: 'Profesor', panel: 'teachers-panel-schedules.html' },
                { code: 'PJG', name: 'Jugador', panel: 'jugadores-panel-gaming.html' }
            ];
            
            userData.roles = allRoles.filter(role => role.code !== currentRole.code);
            userData.roles.unshift(currentRole);
        }
        
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

// Prevent multiple simultaneous calls
let userDataPromise = null;

/**
 * Obtiene los datos del usuario actual desde tu sistema real
 * @returns {Object} userData
 */
async function getUserData() {
    // If there's already a getUserData call in progress, return that promise
    if (userDataPromise) {
        console.log('🔄 HEADER DEBUG - Using existing getUserData promise');
        return userDataPromise;
    }
    
    console.log('🚀 HEADER DEBUG - Starting new getUserData call');
    
    // Create the promise and store it
    userDataPromise = getUserDataInternal();
    
    try {
        const result = await userDataPromise;
        return result;
    } finally {
        // Clear the promise when done (success or error)
        userDataPromise = null;
    }
}

async function getUserDataInternal() {
    try {
        // Leer roles directamente del JWT token (como lo hace el panel)
        const tokenRoles = getTokenRoles();
        const userRoles = getUserRolesFromSystem({ roles: tokenRoles }, {});
        
        // Intentar obtener datos del usuario desde tu API
        let profile = {};
        let session = {};
        
        // Wait for apiDataService to be fully initialized
        if (window.apiDataService && window.apiDataService.getUserProfile && typeof window.apiDataService.getUserProfile === 'function') {
            try {
                console.log('🔄 HEADER DEBUG - Waiting for API service...');
                profile = await window.apiDataService.getUserProfile();
                console.log('✅ HEADER DEBUG - API Success:', {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    nickname: profile.nickname
                });
            } catch (error) {
                console.warn('⚠️ Error obteniendo profile de API:', error);
                console.log('❌ HEADER DEBUG - API Failed, using fallback');
            }
        } else {
            console.warn('❌ HEADER DEBUG - apiDataService not ready, waiting...');
            // Wait a bit for apiDataService to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try again after waiting
            if (window.apiDataService && window.apiDataService.getUserProfile && typeof window.apiDataService.getUserProfile === 'function') {
                try {
                    console.log('🔄 HEADER DEBUG - Retry after wait...');
                    profile = await window.apiDataService.getUserProfile();
                    console.log('✅ HEADER DEBUG - API Success (retry):', {
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        nickname: profile.nickname
                    });
                } catch (error) {
                    console.warn('⚠️ Error obteniendo profile de API (retry):', error);
                    console.log('❌ HEADER DEBUG - API Failed after retry, using session data');
                }
            } else {
                console.log('❌ HEADER DEBUG - apiDataService still not ready, using session data');
            }
        }
        
        // Obtener sesión actual para datos adicionales
        session = JSON.parse(localStorage.getItem('playtest_session') || '{}');
        
        // DEBUG: Verificar datos del perfil del usuario
        console.log('🔍 DEBUG API Profile Data:', {
            profile,
            session,
            nickname: profile.nickname,
            firstName: profile.firstName,
            lastName: profile.lastName,
            roles: profile.roles
        });
        
        // DEBUG: Verificar detección de roles desde JWT
        console.log('🔍 DEBUG Role Detection:', {
            tokenRoles: tokenRoles,
            detectedActiveRole: detectRoleFromToken(),
            mappedUserRoles: userRoles,
            storedActiveRole: localStorage.getItem('activeRole')
        });
        
        return {
            name: profile.nickname || session.nickname || 'Usuario',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            luminarias: profile.luminarias || profile.stats?.luminarias || 0,
            roles: userRoles,
            activeRole: localStorage.getItem('activeRole') || detectRoleFromToken() || userRoles[0]?.code || null
        };
        
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
        'admin_principal': { code: 'PAP', name: 'Administrador Principal', panel: 'admin-principal-panel.html' },
        'administrador_secundario': { code: 'PAS', name: 'Administrador Secundario', panel: 'admin-secundario-panel.html' },
        'admin_secundario': { code: 'PAS', name: 'Administrador Secundario', panel: 'admin-secundario-panel.html' },
        'creador': { code: 'PCC', name: 'Creador de Contenido', panel: 'creators-panel-content.html' },
        'creador_contenido': { code: 'PCC', name: 'Creador de Contenido', panel: 'creators-panel-content.html' },
        'profesor_creador': { code: 'PCC', name: 'Creador de Contenido', panel: 'creators-panel-content.html' },
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
    
    // NO ASIGNAR ROLES POR DEFECTO
    // Los usuarios deben obtener roles específicamente desde la base de datos
    // Si no tienen roles, se les debe permitir usar el modal de "Modificar Roles"
    if (roles.length === 0) {
        console.log('⚠️ Usuario sin roles detectados - debe asignar roles manualmente');
        // No agregar ningún rol por defecto
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
    
    // Prioridad de roles para detección automática (roles administrativos tienen prioridad)
    const rolePriority = ['administrador_principal', 'admin_principal', 'administrador_secundario', 'admin_secundario', 'creador', 'creador_contenido', 'profesor_creador', 'profesor', 'jugador'];
    
    // DEBUG: Log para troubleshoot
    console.log('🔍 DEBUG Role Detection - Token roles:', tokenRoles);
    console.log('🔍 DEBUG Role Detection - Priority order:', rolePriority);
    
    for (const priorityRole of rolePriority) {
        if (tokenRoles.includes(priorityRole)) {
            const roleMapping = {
                'administrador_principal': 'PAP',
                'admin_principal': 'PAP',
                'administrador_secundario': 'PAS',
                'admin_secundario': 'PAS',
                'creador': 'PCC',
                'creador_contenido': 'PCC',
                'profesor_creador': 'PCC',
                'profesor': 'PPF',
                'jugador': 'PJG'
            };
            console.log(`✅ DEBUG Role Detection - Selected role: ${priorityRole} -> ${roleMapping[priorityRole]}`);
            return roleMapping[priorityRole];
        }
    }
    
    console.log('❌ DEBUG Role Detection - No matching role found');
    return null; // No rol por defecto - usuario debe asignar roles manualmente
}

/**
 * Fallback: obtener datos desde localStorage
 * @returns {Object} userData
 */
function getUserDataFromLocalStorage() {
    const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');
    const storedActiveRole = localStorage.getItem('activeRole');
    
    return {
        name: session.nickname || 'Usuario',
        firstName: '',
        lastName: '',
        luminarias: 0,
        roles: [], // No roles por defecto - el usuario debe asignarlos
        activeRole: storedActiveRole || null
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
    const userFullNameElement = document.getElementById('user-full-name');
    const userLuminariasElement = document.getElementById('user-luminarias');
    const userAvatarElement = document.getElementById('user-avatar');
    
    // Actualizar nickname
    if (userNameElement) {
        userNameElement.textContent = userInfo.name;
    }
    
    // Actualizar nombre (solo first_name)
    if (userFullNameElement) {
        console.log('🔍 DEBUG First Name Update:', {
            firstName: userInfo.firstName,
            element: !!userFullNameElement
        });
        userFullNameElement.textContent = userInfo.firstName || '';
    }
    
    if (userLuminariasElement) {
        userLuminariasElement.textContent = userInfo.luminarias.toString();
    }
    
    // Actualizar inicial del avatar basada en el nombre del usuario
    if (userAvatarElement && userInfo.name) {
        const initial = userInfo.name.charAt(0).toUpperCase();
        userAvatarElement.textContent = initial;
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

    // Funciones globales para los modales
    window.closeRoleModificationModal = closeRoleModificationModal;
    window.saveRoleModifications = saveRoleModifications;
    window.closePersonalDataModal = closePersonalDataModal;
    window.savePersonalData = savePersonalData;
    window.toggleEditPersonalData = toggleEditPersonalData;
    
    // Funciones para abrir modales (se conectan con modals-component.html)
    window.openIntroductionModal = function() {
        openModal('introduction-modal');
        closeUserDropdown();
    };
    
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
        // Crear modal de datos personales
        createPersonalDataModal();
        closeUserDropdown();
    };
    
    window.openRoleModificationModal = function() {
        // Crear modal de modificación de roles
        createRoleModificationModal();
        closeUserDropdown();
    };
    
    window.openTopicDevelopmentModal = function() {
        openModal('topic-development-modal');
        closeUserDropdown();
    };
    
    window.openLuminariasModal = function() {
        openModal('luminarias-modal');
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

// Funciones globales para manejar modales
window.openModal = function(modalId) {
    
    // Si es el modal de introducción, usar función simple
    if (modalId === 'introduction-modal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            return;
        }
    }
    
    // Para todos los otros modales: reemplazar completamente con estructura de introduction
    const introModal = document.getElementById('introduction-modal');
    const targetModal = document.getElementById(modalId);
    
    if (!introModal || !targetModal) {
        console.error(`❌ No se encontró modal de introducción o modal objetivo: ${modalId}`);
        return;
    }
    
    // Verificar si introduction-modal funciona correctamente
    
    // CLAVE: Mostrar temporalmente el introduction-modal para que tenga dimensiones correctas al clonarlo
    const wasVisible = introModal.style.display === 'flex';
    if (!wasVisible) {
        introModal.style.display = 'flex';
        // Forzar recálculo de dimensiones
        introModal.offsetHeight;
    }
    
    
    // Clonar completamente el modal de introducción (ahora con dimensiones correctas)
    const clonedModal = introModal.cloneNode(true);
    
    // Ocultar el introduction-modal original si no estaba visible
    if (!wasVisible) {
        introModal.style.display = 'none';
    }
    clonedModal.id = modalId;
    
    // Verificar si el modal original tiene contenido problemático
    const originalModalBody = targetModal.querySelector('.modal-body');
    const clonedModalBody = clonedModal.querySelector('.modal-body');
    
    if (originalModalBody && clonedModalBody) {
        // Si es uno de los modales que sabemos que fallan, usar contenido simple de prueba
        if (['game-modes-modal', 'topic-development-modal', 'luminarias-modal'].includes(modalId)) {
            clonedModalBody.innerHTML = `
                <div style="padding: 2rem; text-align: center; min-height: 400px;">
                    <h2 style="color: #3B82F6; margin-bottom: 2rem;">⚠️ Modal en Mantenimiento</h2>
                    <p style="color: #E0E1DD; font-size: 1.2rem; margin-bottom: 2rem;">
                        Este modal está siendo reparado. Contenido temporal activo.
                    </p>
                    <div style="background: #1B263B; padding: 2rem; border-radius: 12px; border: 1px solid #415A77;">
                        <h3 style="color: #FFB347; margin-bottom: 1rem;">${modalId.replace('-modal', '').replace('-', ' ').toUpperCase()}</h3>
                        <p style="color: #778DA9;">Funcionalidad temporalmente deshabilitada mientras se solucionan problemas de renderizado.</p>
                        <div style="margin-top: 2rem;">
                            <button onclick="closeModal('${modalId}')" style="background: #3B82F6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                                Cerrar Modal
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Para modales que funcionan, usar contenido original
            clonedModalBody.innerHTML = originalModalBody.innerHTML;
        }
    }
    
    // Actualizar el botón de cerrar para que use el ID correcto
    const closeButton = clonedModal.querySelector('button[onclick*="closeModal"]');
    if (closeButton) {
        closeButton.setAttribute('onclick', `closeModal('${modalId}')`);
    }
    
    // Reemplazar el modal original con el clonado
    targetModal.parentNode.replaceChild(clonedModal, targetModal);
    
    // Mostrar el modal clonado
    clonedModal.style.display = 'flex';
    
};


window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

// Configurar eventos globales para modales (solo una vez)
if (!window.modalEventsConfigured) {
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') || event.target.classList.contains('modal-backdrop') || event.target.id.endsWith('-modal')) {
            const modalId = event.target.id;
            if (modalId && modalId.endsWith('-modal')) {
                closeModal(modalId);
            }
        }
    });

    // Cerrar modal con tecla Escape
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('[id$="-modal"][style*="flex"], [id$="-modal"][style*="block"]');
            openModals.forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
    
    window.modalEventsConfigured = true;
}

// Funciones de navegación para modal de Introducción
window.nextIntroductionScreen = function() {
    const screens = ['introduction-screen-1', 'introduction-screen-2', 'introduction-screen-3', 'introduction-screen-4', 'introduction-screen-5'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a siguiente pantalla
    if (currentScreen < screens.length - 1) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen + 1]).style.display = 'block';
        
        // Actualizar botones y indicadores
        updateIntroductionNavigation(currentScreen + 1);
    }
};

window.previousIntroductionScreen = function() {
    const screens = ['introduction-screen-1', 'introduction-screen-2', 'introduction-screen-3', 'introduction-screen-4', 'introduction-screen-5'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a pantalla anterior
    if (currentScreen > 0) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen - 1]).style.display = 'block';
        
        // Actualizar botones e indicadores
        updateIntroductionNavigation(currentScreen - 1);
    }
};

// Función auxiliar para actualizar navegación del modal de introducción
function updateIntroductionNavigation(screenIndex) {
    const totalScreens = 5;
    
    // Actualizar botones
    const prevBtn = document.getElementById('prev-introduction-btn');
    const nextBtn = document.getElementById('next-introduction-btn');
    if (prevBtn) prevBtn.style.display = screenIndex > 0 ? 'inline-block' : 'none';
    if (nextBtn) nextBtn.style.display = screenIndex < totalScreens - 1 ? 'inline-block' : 'none';
    
    // Actualizar indicadores (dots)
    for (let i = 1; i <= totalScreens; i++) {
        const dot = document.getElementById(`intro-dot-${i}`);
        if (dot) {
            dot.style.background = i === screenIndex + 1 ? '#3B82F6' : '#415A77';
        }
    }
}

// Funciones de navegación para modal de Desarrollo de Temarios
window.nextTopicScreen = function() {
    const screens = ['topic-screen-1', 'topic-screen-2', 'topic-screen-3', 'topic-screen-4', 'topic-screen-5', 'topic-screen-6'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a siguiente pantalla
    if (currentScreen < screens.length - 1) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen + 1]).style.display = 'block';
        
        // Actualizar botones y indicadores
        updateTopicNavigation(currentScreen + 1);
    }
};

window.previousTopicScreen = function() {
    const screens = ['topic-screen-1', 'topic-screen-2', 'topic-screen-3', 'topic-screen-4', 'topic-screen-5', 'topic-screen-6'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a pantalla anterior
    if (currentScreen > 0) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen - 1]).style.display = 'block';
        
        // Actualizar botones e indicadores
        updateTopicNavigation(currentScreen - 1);
    }
};

// Función auxiliar para actualizar navegación del modal de desarrollo de temarios
function updateTopicNavigation(screenIndex) {
    const totalScreens = 6;
    
    // Actualizar botones
    const prevBtn = document.getElementById('topic-prev-btn');
    const nextBtn = document.getElementById('topic-next-btn');
    if (prevBtn) prevBtn.style.display = screenIndex > 0 ? 'inline-block' : 'none';
    if (nextBtn) nextBtn.style.display = screenIndex < totalScreens - 1 ? 'inline-block' : 'none';
    
    // Actualizar indicadores (dots)
    for (let i = 1; i <= totalScreens; i++) {
        const dot = document.getElementById(`topic-dot-${i}`);
        if (dot) {
            dot.style.background = i === screenIndex + 1 ? '#3B82F6' : '#415A77';
        }
    }
}

// Funciones de navegación para modal de Luminarias
window.nextLuminariasScreen = function() {
    const screens = ['luminarias-screen-1', 'luminarias-screen-2', 'luminarias-screen-3', 'luminarias-screen-4', 'luminarias-screen-5', 'luminarias-screen-6'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a siguiente pantalla
    if (currentScreen < screens.length - 1) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen + 1]).style.display = 'block';
        
        // Actualizar botones y indicadores
        updateLuminariasNavigation(currentScreen + 1);
    }
};

window.previousLuminariasScreen = function() {
    const screens = ['luminarias-screen-1', 'luminarias-screen-2', 'luminarias-screen-3', 'luminarias-screen-4', 'luminarias-screen-5', 'luminarias-screen-6'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a pantalla anterior
    if (currentScreen > 0) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen - 1]).style.display = 'block';
        
        // Actualizar botones e indicadores
        updateLuminariasNavigation(currentScreen - 1);
    }
};

// Función auxiliar para actualizar navegación del modal de luminarias
function updateLuminariasNavigation(screenIndex) {
    const totalScreens = 6;
    
    // Actualizar botones
    const prevBtn = document.getElementById('luminarias-prev-btn');
    const nextBtn = document.getElementById('luminarias-next-btn');
    if (prevBtn) prevBtn.style.display = screenIndex > 0 ? 'inline-block' : 'none';
    if (nextBtn) nextBtn.style.display = screenIndex < totalScreens - 1 ? 'inline-block' : 'none';
    
    // Actualizar indicadores (dots)
    for (let i = 1; i <= totalScreens; i++) {
        const dot = document.getElementById(`luminarias-dot-${i}`);
        if (dot) {
            dot.style.background = i === screenIndex + 1 ? '#FFD700' : '#415A77';
        }
    }
}

// Funciones de navegación para modal de Niveles por Roles
window.nextRoleLevelScreen = function() {
    const screens = ['role-level-screen-1', 'role-level-screen-2', 'role-level-screen-3', 'role-level-screen-4', 'role-level-screen-5', 'role-level-screen-6', 'role-level-screen-7', 'role-level-screen-8', 'role-level-screen-9', 'role-level-screen-10', 'role-level-screen-11', 'role-level-screen-12', 'role-level-screen-13', 'role-level-screen-14', 'role-level-screen-15', 'role-level-screen-16', 'role-level-screen-17', 'role-level-screen-18', 'role-level-screen-19'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a siguiente pantalla
    if (currentScreen < screens.length - 1) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen + 1]).style.display = 'block';
        
        // Actualizar botones y contador
        updateRoleLevelNavigation(currentScreen + 1);
    }
};

window.previousRoleLevelScreen = function() {
    const screens = ['role-level-screen-1', 'role-level-screen-2', 'role-level-screen-3', 'role-level-screen-4', 'role-level-screen-5', 'role-level-screen-6', 'role-level-screen-7', 'role-level-screen-8', 'role-level-screen-9', 'role-level-screen-10', 'role-level-screen-11', 'role-level-screen-12', 'role-level-screen-13', 'role-level-screen-14', 'role-level-screen-15', 'role-level-screen-16', 'role-level-screen-17', 'role-level-screen-18', 'role-level-screen-19'];
    let currentScreen = 0;
    
    // Encontrar pantalla actual
    for (let i = 0; i < screens.length; i++) {
        const screen = document.getElementById(screens[i]);
        if (screen && screen.style.display !== 'none') {
            currentScreen = i;
            break;
        }
    }
    
    // Ir a pantalla anterior
    if (currentScreen > 0) {
        document.getElementById(screens[currentScreen]).style.display = 'none';
        document.getElementById(screens[currentScreen - 1]).style.display = 'block';
        
        // Actualizar botones y contador
        updateRoleLevelNavigation(currentScreen - 1);
    }
};

// Función auxiliar para actualizar navegación del modal de niveles por roles
function updateRoleLevelNavigation(screenIndex) {
    const totalScreens = 19;
    
    // Actualizar botones
    const prevBtn = document.getElementById('prev-role-level-btn');
    const nextBtn = document.getElementById('next-role-level-btn');
    if (prevBtn) prevBtn.style.display = screenIndex > 0 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = screenIndex < totalScreens - 1 ? 'block' : 'none';
    
    // Actualizar contador
    const counter = document.getElementById('role-level-counter');
    if (counter) {
        counter.textContent = `${screenIndex + 1} / ${totalScreens}`;
    }
}

/**
 * Crea y muestra un modal para modificar los roles del usuario
 */
function createRoleModificationModal() {
    // Remover modal existente si existe
    const existingModal = document.getElementById('role-modification-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'role-modification-modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        z-index: 2000;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    `;

    modal.innerHTML = `
        <div style="background: #1B263B; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); width: 100%; max-width: 500px; border: 1px solid #415A77;" onclick="event.stopPropagation();">
            <div style="padding: 2rem; position: relative;">
                <button onclick="closeRoleModificationModal()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #778DA9; cursor: pointer; font-size: 24px; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#415A77'" onmouseout="this.style.background='none'">×</button>
                
                <h2 style="color: #E0E1DD; margin: 0 0 1.5rem 0; font-size: 1.5rem; text-align: center;">🎭 Modificar Roles</h2>
                
                <div style="margin-bottom: 1.5rem;">
                    <p style="color: #778DA9; margin: 0 0 1rem 0; text-align: center; font-size: 0.9rem;">
                        Selecciona los roles que deseas adoptar. Puedes tener múltiples roles activos.
                    </p>
                </div>

                <div id="role-options-container" style="margin-bottom: 2rem;">
                    <!-- Las opciones de roles se cargan dinámicamente -->
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="saveRoleModifications()" id="save-roles-btn" style="background: #10B981; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10B981'">
                        Guardar Cambios
                    </button>
                    <button onclick="closeRoleModificationModal()" style="background: #6B7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#4B5563'" onmouseout="this.style.background='#6B7280'">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Agregar al DOM
    document.body.appendChild(modal);

    // Cargar opciones de roles
    loadRoleOptions();

    // Cerrar con Escape
    document.addEventListener('keydown', handleEscapeKey);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', closeRoleModificationModal);
}

/**
 * Carga las opciones de roles disponibles
 */
async function loadRoleOptions() {
    const container = document.getElementById('role-options-container');
    if (!container) return;

    try {
        // Obtener datos del usuario actual
        const token = localStorage.getItem('playtest_auth_token');
        if (!token) {
            container.innerHTML = '<p style="color: #DC2626; text-align: center;">Error: No se encontró token de autenticación</p>';
            return;
        }

        // Decodificar token para obtener roles actuales
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentRoles = payload.roles || [];

        // Definir todos los roles disponibles
        const availableRoles = [
            { id: 'jugador', name: '🎮 Jugador', description: 'Participa en partidas y duelos' },
            { id: 'creador', name: '🎨 Creador de Contenido', description: 'Crea bloques y monetiza contenido' },
            { id: 'profesor', name: '👨‍🏫 Profesor', description: 'Gestiona estudiantes y clases' }
        ];

        // Crear checkboxes para cada rol
        container.innerHTML = availableRoles.map(role => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid #415A77; border-radius: 0.5rem; margin-bottom: 0.75rem; transition: background 0.2s;" onmouseover="this.style.background='rgba(65, 90, 119, 0.1)'" onmouseout="this.style.background='transparent'">
                <input type="checkbox" id="role-${role.id}" ${currentRoles.includes(role.id) ? 'checked' : ''} style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                <div style="flex: 1;">
                    <label for="role-${role.id}" style="color: #E0E1DD; font-weight: 500; cursor: pointer; display: block; margin-bottom: 0.25rem;">${role.name}</label>
                    <p style="color: #778DA9; margin: 0; font-size: 0.875rem;">${role.description}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error cargando opciones de roles:', error);
        container.innerHTML = '<p style="color: #DC2626; text-align: center;">Error al cargar los roles disponibles</p>';
    }
}

/**
 * Guarda las modificaciones de roles
 */
async function saveRoleModifications() {
    const saveBtn = document.getElementById('save-roles-btn');
    if (!saveBtn) return;

    // Deshabilitar botón durante el proceso
    saveBtn.textContent = 'Guardando...';
    saveBtn.disabled = true;

    try {
        // Obtener roles seleccionados
        const checkboxes = document.querySelectorAll('#role-options-container input[type="checkbox"]');
        const selectedRoles = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.id.replace('role-', ''));

        if (selectedRoles.length === 0) {
            alert('Debes seleccionar al menos un rol');
            return;
        }

        // Enviar al backend
        const API_BASE_URL = window.location.hostname.includes('onrender.com') 
            ? 'https://playtest-backend.onrender.com' 
            : '';
            
        const token = localStorage.getItem('playtest_auth_token');
        
        // Debug logging
        console.log('🔍 Sending role update request:', {
            selectedRoles,
            API_BASE_URL,
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
        });
        
        if (!token) {
            throw new Error('No se encontró token de autenticación. Por favor, inicia sesión de nuevo.');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/users/update-roles`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roles: selectedRoles })
        });

        if (response.ok) {
            alert('Roles actualizados correctamente. La página se recargará para aplicar los cambios.');
            window.location.reload();
        } else {
            // Obtener el mensaje de error específico del servidor
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor' }));
            console.error('Error del servidor:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(errorData.error || `Error del servidor (${response.status}): ${response.statusText}`);
        }

    } catch (error) {
        console.error('Error guardando roles:', error);
        alert('Error al guardar los roles. Inténtalo de nuevo.');
    } finally {
        // Reactivar botón
        saveBtn.textContent = 'Guardar Cambios';
        saveBtn.disabled = false;
    }
}

/**
 * Cierra el modal de modificación de roles
 */
function closeRoleModificationModal() {
    const modal = document.getElementById('role-modification-modal');
    if (modal) {
        modal.remove();
    }
    document.removeEventListener('keydown', handleEscapeKey);
}

/**
 * Maneja la tecla Escape para cerrar el modal
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeRoleModificationModal();
        closePersonalDataModal();
    }
}

/**
 * Crea y muestra un modal para ver/editar datos personales del usuario
 */
function createPersonalDataModal() {
    // Remover modal existente si existe
    const existingModal = document.getElementById('personal-data-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'personal-data-modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        z-index: 2000;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    `;

    modal.innerHTML = `
        <div style="background: #1B263B; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); width: 100%; max-width: 600px; max-height: 80vh; border: 1px solid #415A77; overflow-y: auto;" onclick="event.stopPropagation();">
            <div style="padding: 2rem; position: relative;">
                <button onclick="closePersonalDataModal()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #778DA9; cursor: pointer; font-size: 24px; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#415A77'" onmouseout="this.style.background='none'">×</button>
                
                <h2 style="color: #E0E1DD; margin: 0 0 1.5rem 0; font-size: 1.5rem; text-align: center;">👤 Datos Personales</h2>
                
                <div id="personal-data-content" style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: center; align-items: center; padding: 2rem;">
                        <div style="color: #778DA9;">Cargando datos...</div>
                    </div>
                </div>

                <div id="personal-data-actions" style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="toggleEditPersonalData()" id="edit-personal-data-btn" style="background: #3B82F6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">
                        Editar
                    </button>
                    <button onclick="closePersonalDataModal()" style="background: #6B7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#4B5563'" onmouseout="this.style.background='#6B7280'">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Agregar al DOM
    document.body.appendChild(modal);

    // Cargar datos personales
    loadPersonalData();

    // Cerrar con Escape
    document.addEventListener('keydown', handleEscapeKeyPersonalData);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', closePersonalDataModal);
}

/**
 * Carga los datos personales del usuario
 */
async function loadPersonalData() {
    const contentContainer = document.getElementById('personal-data-content');
    if (!contentContainer) return;

    try {
        // Obtener token
        const token = localStorage.getItem('playtest_auth_token');
        if (!token) {
            contentContainer.innerHTML = '<p style="color: #DC2626; text-align: center;">Error: No se encontró token de autenticación</p>';
            return;
        }

        // Hacer petición al backend
        const API_BASE_URL = window.location.hostname.includes('onrender.com') 
            ? 'https://playtest-backend.onrender.com' 
            : '';
            
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener datos del usuario');
        }

        const userData = await response.json();
        
        // Renderizar datos en modo solo lectura
        renderPersonalDataView(userData);

    } catch (error) {
        console.error('Error cargando datos personales:', error);
        contentContainer.innerHTML = '<p style="color: #DC2626; text-align: center;">Error al cargar los datos personales</p>';
    }
}

/**
 * Renderiza los datos personales en modo solo lectura
 */
function renderPersonalDataView(userData) {
    const container = document.getElementById('personal-data-content');
    if (!container) return;

    const fields = [
        { key: 'nickname', label: 'Nickname', value: userData.nickname },
        { key: 'first_name', label: 'Nombre', value: userData.first_name || 'No especificado' },
        { key: 'last_name', label: 'Apellidos', value: userData.last_name || 'No especificado' },
        { key: 'email', label: 'Email', value: userData.email || 'No especificado' },
        { key: 'roles', label: 'Roles', value: Array.isArray(userData.roles) ? userData.roles.join(', ') : userData.role || 'No especificado' },
        { key: 'created_at', label: 'Fecha de registro', value: userData.created_at ? new Date(userData.created_at).toLocaleDateString('es-ES') : 'No disponible' }
    ];

    container.innerHTML = `
        <div style="display: grid; gap: 1rem;">
            ${fields.map(field => `
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; padding: 1rem; border: 1px solid #415A77; border-radius: 0.5rem; align-items: center;">
                    <label style="color: #778DA9; font-weight: 500; font-size: 0.9rem;">${field.label}:</label>
                    <span id="view-${field.key}" style="color: #E0E1DD; padding: 0.5rem; background: rgba(65, 90, 119, 0.1); border-radius: 0.375rem;">${field.value}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Guardar datos para edición
    window.currentUserData = userData;
}

/**
 * Renderiza los datos personales en modo edición
 */
function renderPersonalDataEdit(userData) {
    const container = document.getElementById('personal-data-content');
    if (!container) return;

    const editableFields = [
        { key: 'first_name', label: 'Nombre', value: userData.first_name || '', type: 'text' },
        { key: 'last_name', label: 'Apellidos', value: userData.last_name || '', type: 'text' },
        { key: 'email', label: 'Email', value: userData.email || '', type: 'email' }
    ];

    const readOnlyFields = [
        { key: 'nickname', label: 'Nickname', value: userData.nickname },
        { key: 'roles', label: 'Roles', value: Array.isArray(userData.roles) ? userData.roles.join(', ') : userData.role || 'No especificado' },
        { key: 'created_at', label: 'Fecha de registro', value: userData.created_at ? new Date(userData.created_at).toLocaleDateString('es-ES') : 'No disponible' }
    ];

    container.innerHTML = `
        <div style="display: grid; gap: 1rem;">
            <h3 style="color: #E0E1DD; margin: 0 0 0.5rem 0; font-size: 1.1rem; border-bottom: 1px solid #415A77; padding-bottom: 0.5rem;">Campos Editables</h3>
            ${editableFields.map(field => `
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; padding: 1rem; border: 1px solid #415A77; border-radius: 0.5rem; align-items: center;">
                    <label for="edit-${field.key}" style="color: #778DA9; font-weight: 500; font-size: 0.9rem;">${field.label}:</label>
                    <input 
                        type="${field.type}" 
                        id="edit-${field.key}" 
                        value="${field.value}" 
                        style="color: #E0E1DD; padding: 0.5rem; background: #0D1B2A; border: 1px solid #415A77; border-radius: 0.375rem; outline: none;" 
                        onfocus="this.style.borderColor='#3B82F6'" 
                        onblur="this.style.borderColor='#415A77'"
                    >
                </div>
            `).join('')}
            
            <h3 style="color: #E0E1DD; margin: 1.5rem 0 0.5rem 0; font-size: 1.1rem; border-bottom: 1px solid #415A77; padding-bottom: 0.5rem;">Información Solo Lectura</h3>
            ${readOnlyFields.map(field => `
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; padding: 1rem; border: 1px solid #415A77; border-radius: 0.5rem; align-items: center; opacity: 0.7;">
                    <label style="color: #778DA9; font-weight: 500; font-size: 0.9rem;">${field.label}:</label>
                    <span style="color: #E0E1DD; padding: 0.5rem; background: rgba(65, 90, 119, 0.05); border-radius: 0.375rem;">${field.value}</span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Alterna entre modo vista y edición
 */
function toggleEditPersonalData() {
    const editBtn = document.getElementById('edit-personal-data-btn');
    const actionsContainer = document.getElementById('personal-data-actions');
    
    if (!editBtn || !window.currentUserData) return;
    
    const isEditing = editBtn.textContent === 'Cancelar';
    
    if (isEditing) {
        // Cancelar edición - volver a modo vista
        renderPersonalDataView(window.currentUserData);
        editBtn.textContent = 'Editar';
        editBtn.style.background = '#3B82F6';
        
        // Restablecer acciones
        actionsContainer.innerHTML = `
            <button onclick="toggleEditPersonalData()" id="edit-personal-data-btn" style="background: #3B82F6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">
                Editar
            </button>
            <button onclick="closePersonalDataModal()" style="background: #6B7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#4B5563'" onmouseout="this.style.background='#6B7280'">
                Cerrar
            </button>
        `;
    } else {
        // Entrar en modo edición
        renderPersonalDataEdit(window.currentUserData);
        
        // Cambiar acciones
        actionsContainer.innerHTML = `
            <button onclick="savePersonalData()" id="save-personal-data-btn" style="background: #10B981; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10B981'">
                Guardar
            </button>
            <button onclick="toggleEditPersonalData()" id="edit-personal-data-btn" style="background: #EF4444; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#DC2626'" onmouseout="this.style.background='#EF4444'">
                Cancelar
            </button>
            <button onclick="closePersonalDataModal()" style="background: #6B7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#4B5563'" onmouseout="this.style.background='#6B7280'">
                Cerrar
            </button>
        `;
    }
}

/**
 * Guarda los datos personales modificados
 */
async function savePersonalData() {
    const saveBtn = document.getElementById('save-personal-data-btn');
    if (!saveBtn) return;

    // Deshabilitar botón durante el proceso
    saveBtn.textContent = 'Guardando...';
    saveBtn.disabled = true;

    try {
        // Obtener datos del formulario
        const firstName = document.getElementById('edit-first_name')?.value || '';
        const lastName = document.getElementById('edit-last_name')?.value || '';
        const email = document.getElementById('edit-email')?.value || '';

        // Validar email si se proporciona
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('El formato del email no es válido');
            return;
        }

        // Preparar datos para envío
        const updateData = {
            first_name: firstName,
            last_name: lastName,
            email: email
        };

        // Enviar al backend
        const API_BASE_URL = window.location.hostname.includes('onrender.com') 
            ? 'https://playtest-backend.onrender.com' 
            : '';
            
        const token = localStorage.getItem('playtest_auth_token');
        
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            window.currentUserData = updatedUser;
            
            alert('Datos personales actualizados correctamente');
            
            // Volver a modo vista
            renderPersonalDataView(updatedUser);
            toggleEditPersonalData();
        } else {
            throw new Error('Error del servidor');
        }

    } catch (error) {
        console.error('Error guardando datos personales:', error);
        alert('Error al guardar los datos personales. Inténtalo de nuevo.');
    } finally {
        // Reactivar botón
        saveBtn.textContent = 'Guardar';
        saveBtn.disabled = false;
    }
}

/**
 * Cierra el modal de datos personales
 */
function closePersonalDataModal() {
    const modal = document.getElementById('personal-data-modal');
    if (modal) {
        modal.remove();
    }
    document.removeEventListener('keydown', handleEscapeKeyPersonalData);
}

/**
 * Maneja la tecla Escape para cerrar el modal de datos personales
 */
function handleEscapeKeyPersonalData(event) {
    if (event.key === 'Escape') {
        closePersonalDataModal();
    }
}

// Exportar funciones para uso manual
window.loadHeader = loadHeader;
window.updateUserData = updateUserData;