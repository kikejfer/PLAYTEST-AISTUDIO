/**
 * Sistema de carga dinámica del header reutilizable
 * Carga el header-component.html y reemplaza los placeholders
 */

// Configuración de los paneles
const PANEL_CONFIGS = {
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

/**
 * Carga el header dinámicamente
 * @param {string} panelType - Tipo de panel (PAP, PAS, PCC, PPF, PJG)
 * @param {string} containerId - ID del contenedor donde inyectar el header
 */
async function loadHeader(panelType, containerId = 'header-container') {
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
        
        // Reemplazar placeholders con los valores específicos del panel
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
        
        // Agregar clase al body para manejar el padding
        document.body.classList.add('with-fixed-header');
        
        // Cargar los modales después del header
        await loadModals();
        
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
function initializeHeader() {
    // Buscar metadatos del panel en el HTML
    const panelMeta = document.querySelector('meta[name="panel-type"]');
    const containerMeta = document.querySelector('meta[name="header-container"]');
    
    if (panelMeta) {
        const panelType = panelMeta.getAttribute('content');
        const containerId = containerMeta ? containerMeta.getAttribute('content') : 'header-container';
        
        loadHeader(panelType, containerId);
    } else {
        console.warn('No se encontró metadato panel-type. El header debe cargarse manualmente.');
    }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
} else {
    initializeHeader();
}

// Exportar funciones para uso manual
window.loadHeader = loadHeader;
window.PANEL_CONFIGS = PANEL_CONFIGS;