# Sistema de Navegación Jerárquico Avanzado - PLAYTEST

## Descripción General

Sistema completo de navegación jerárquica con 6 pestañas diferenciadas por rol, funcionalidades expandibles multinivel, optimizaciones de rendimiento y arquitectura modular basada en React.

## 🎯 Características Principales

### Sistema de Pestañas Dinámicas (6 tipos)
1. **Administrador Principal** - Máximo privilegio con 4 secciones expandibles
2. **Administrador Secundario** - Gestión delegada con vista limitada
3. **Servicio Técnico** - Soporte especializado con dashboard de tickets
4. **Profesor/Creador** - Gestión de contenido con 5 pestañas especializadas
5. **Juego** - Universal, siempre visible para todos los usuarios
6. **Financiero** - Universal, diferenciado entre usuario y creador

### Lógica de Visualización por Roles
- **Pestañas contextuales**: Solo aparecen las correspondientes a los roles del usuario
- **Orden jerárquico**: Se muestran de mayor a menor privilegio
- **Navegación fluida**: Sin cambio de contexto entre paneles
- **Inicialización inteligente**: Los usuarios inician en la pestaña de rol superior

## 🏗️ Arquitectura de Componentes

### Componentes Principales

```
src/
├── components/
│   ├── Navigation/
│   │   ├── NavigationSystem.jsx      # Sistema principal de navegación
│   │   ├── TabButton.jsx            # Botones de pestañas con notificaciones
│   │   ├── NotificationBadge.jsx    # Badges con animaciones y prioridades
│   │   ├── SearchGlobal.jsx         # Búsqueda global con filtros
│   │   └── ShortcutsModal.jsx       # Modal de ayuda para shortcuts
│   ├── Auth/
│   │   └── PermissionGuard.jsx      # Guardia de permisos y features
│   └── UI/
│       ├── VirtualizedTable.jsx     # Tabla optimizada para grandes volúmenes
│       ├── ExpandableSection.jsx    # Secciones expandibles jerárquicas
│       └── LoadingSpinner.jsx       # Indicadores de carga contextuales
```

### Hooks Personalizados

```
src/hooks/
├── useNavigationState.js            # Estado de navegación y persistencia
├── useKeyboardShortcuts.js          # Atajos de teclado avanzados
├── useNotificationBadges.js         # Gestión de notificaciones en tiempo real
├── useFeatureFlags.js               # Sistema de feature flags modular
├── useInfiniteScroll.js             # Scroll infinito optimizado
└── useDebouncedCallback.js          # Optimización de callbacks
```

### Sistema de Routing Dinámico

```
src/routing/
└── DynamicRouter.jsx                # Router basado en roles y features
```

## 🔧 Implementación Técnica

### 1. Sistema de Navegación Principal

```jsx
// NavigationSystem.jsx - Configuración de pestañas
const TAB_CONFIGS = {
  administrador_principal: {
    id: 'admin-principal',
    label: 'Admin Principal',
    icon: 'crown',
    priority: 1,
    route: '/admin-principal',
    sections: ['administradores-secundarios', 'profesores-creadores', 'usuarios-jugadores', 'configuracion-modular']
  },
  // ... más configuraciones
};

// Pestañas universales
const UNIVERSAL_TABS = {
  juego: { id: 'juego', label: 'Juego', icon: 'gamepad', universal: true },
  financiero: { id: 'financiero', label: 'Financiero', icon: 'coins', universal: true }
};
```

### 2. Hooks de Estado de Navegación

```jsx
// useNavigationState.js - Gestión de estado persistente
export const useNavigationState = () => {
  const [activeTab, setActiveTab] = useState();
  const [expandedPanels, setExpandedPanels] = useState({});
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Funciones de gestión
  const togglePanel = useCallback((panelId, sectionId) => {
    // Lógica de expansión/colapso
  }, []);

  const expandPath = useCallback((path) => {
    // Expandir ruta completa jerárquica
  }, []);

  return {
    activeTab, setActiveTab,
    expandedPanels, togglePanel, expandPath,
    breadcrumbs, addBreadcrumb,
    favorites, toggleFavorite
  };
};
```

### 3. Sistema de Shortcuts

```jsx
// useKeyboardShortcuts.js - Atajos de teclado
export const useNavigationShortcuts = (navigationActions) => {
  const shortcuts = {
    'ctrl+1': () => navigationActions.switchToTab(0),
    'ctrl+2': () => navigationActions.switchToTab(1),
    'ctrl+shift+f': () => navigationActions.focusSearch(),
    'escape': () => navigationActions.clearSearch(),
    'alt+left': () => navigationActions.navigateBack(),
    'ctrl+shift+c': () => navigationActions.collapseAll()
  };

  useKeyboardShortcuts(shortcuts, { enableGlobal: true });
};
```

### 4. Feature Flags Modulares

```jsx
// useFeatureFlags.js - Sistema de configuración modular
const DEFAULT_FEATURES = {
  // Sistema de Competición
  competition_duels: true,
  competition_trivial: true,
  competition_tournaments: true,
  competition_rankings: true,
  
  // Sistema de Monetización
  monetization_plans: false,
  monetization_marketplace: true,
  monetization_luminarias: true,
  
  // Sistema de IA
  ai_question_generation: false,
  ai_suggestions: true,
  ai_analytics: true
  // ... 9 grupos totales
};

export const useFeatureFlags = () => {
  const isFeatureEnabled = useCallback((featureName) => {
    return features[featureName] === true;
  }, [features]);

  const getFeaturesByGroup = useCallback((groupPrefix) => {
    // Obtener features por grupo (ej: 'competition_')
  }, [features]);

  return { isFeatureEnabled, getFeaturesByGroup, updateFeatureFlags };
};
```

## 📱 Paneles Específicos por Rol

### Panel 1 - Administrador Principal

```jsx
// AdminPrincipalPanel.jsx - 4 secciones expandibles
const sections = [
  {
    id: 'administradores-secundarios',
    title: 'Administradores Secundarios',
    component: AdministradoresSecundarios,
    // Tabla con validación de usuarios y búsqueda por nickname
  },
  {
    id: 'profesores-creadores', 
    title: 'Profesores/Creadores',
    component: ProfesoresCreadores,
    // Sistema expandible multinivel: Profesor → Bloques → Temas → Preguntas
  },
  {
    id: 'usuarios-jugadores',
    title: 'Usuarios/Jugadores', 
    component: UsuariosJugadores,
    // Gestión con reasignación de admins y ordenación por Luminarias
  },
  {
    id: 'configuracion-modular',
    title: 'Configuración Modular',
    component: ConfiguracionModular,
    // Feature flags con 9 grupos, dependencias y rollback automático
  }
];
```

### Sistema de Feature Flags - 9 Grupos

```jsx
// ConfiguracionModular.jsx - 9 grupos de funcionalidades
const featureGroups = {
  competition: {
    title: 'Sistema de Competición',
    features: ['duels', 'trivial', 'tournaments', 'rankings'],
    dependencies: [],
    conflicts: []
  },
  monetization: {
    title: 'Sistema de Monetización', 
    features: ['plans', 'marketplace', 'luminarias'],
    dependencies: ['financial_system'],
    conflicts: []
  },
  ai: {
    title: 'Sistema de IA',
    features: ['question_generation', 'suggestions', 'analytics'],
    dependencies: ['tools_advanced_analytics'],
    conflicts: []
  },
  // ... hasta 9 grupos totales
};
```

### Panel 4 - Profesor/Creador (5 pestañas)

```jsx
// ProfesorPanel.jsx - 5 pestañas especializadas
const professorTabs = [
  {
    id: 'analytics-bloques',
    title: 'Analytics de Bloques',
    // Métricas en tiempo real, heatmaps, predicciones de IA
  },
  {
    id: 'gestion-retos',
    title: 'Gestión de Retos',
    // Configurador visual, seguimiento en vivo, gestión de premios
  },
  {
    id: 'gestion-torneos', 
    title: 'Gestión de Torneos',
    // Organizador completo, brackets dinámicos, distribución automática
  },
  {
    id: 'gestion-estudiantes',
    title: 'Gestión de Estudiantes', 
    // Vista 360°, análisis de progreso, herramientas de mentoring
  },
  {
    id: 'herramientas-creacion',
    title: 'Herramientas de Creación',
    // IA avanzada, plantillas, importador masivo, testing integrado
  }
];
```

## ⚡ Optimizaciones de Rendimiento

### 1. Virtualización de Tablas

```jsx
// VirtualizedTable.jsx - Para grandes volúmenes de datos
const VirtualizedTable = ({
  data = [],
  columns = [],
  height = 400,
  rowHeight = 50,
  virtualizationMode = 'window', // 'window' | 'virtual'
  overscan = 5
}) => {
  // Datos procesados memoizados
  const processedData = useMemo(() => {
    let result = [...data];
    // Aplicar filtros y ordenación
    return result;
  }, [data, filters, sortConfig]);

  // Infinite scroll
  const { isLoading, loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    onLoadMore,
    threshold: 5
  });

  return (
    <FixedSizeList
      height={height}
      itemCount={processedData.length}
      itemSize={rowHeight}
      overscanCount={overscan}
    >
      {RowRenderer}
    </FixedSizeList>
  );
};
```

### 2. Lazy Loading y Code Splitting

```jsx
// DynamicRouter.jsx - Carga bajo demanda
const AdminPrincipalPanel = React.lazy(() => import('../pages/AdminPrincipal/AdminPrincipalPanel'));
const ProfesorPanel = React.lazy(() => import('../pages/Profesor/ProfesorPanel'));
// ... más componentes lazy

const DynamicRouter = () => (
  <Suspense fallback={<LoadingSpinner size="large" overlay />}>
    <Routes>
      <Route path="/admin-principal/*" element={<AdminPrincipalPanel />} />
      {/* Rutas cargadas dinámicamente */}
    </Routes>
  </Suspense>
);
```

### 3. Debouncing y Throttling

```jsx
// useDebouncedCallback.js - Optimización de callbacks
export const useDebouncedCallback = (callback, delay = 300) => {
  const timeoutRef = useRef();
  
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Uso en búsqueda
const debouncedSearch = useDebouncedCallback((term) => {
  performSearch(term);
}, 300);
```

## 🔔 Sistema de Notificaciones Contextuales

### 1. Notificaciones en Tiempo Real

```jsx
// useNotificationBadges.js - WebSocket y polling
export const useNotificationBadges = () => {
  const [notifications, setNotifications] = useState({});
  
  // WebSocket para tiempo real
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/notifications?token=${user.token}`);
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => ({
        ...prev,
        [notification.context]: {
          count: (prev[notification.context]?.count || 0) + 1,
          items: [notification, ...prev[notification.context]?.items || []]
        }
      }));
    };
  }, [user]);

  const getNotificationCount = useCallback((context) => {
    return notifications[context]?.count || 0;
  }, [notifications]);

  const markAsRead = useCallback(async (context) => {
    // Marcar como leído en servidor y local
  }, []);

  return { notifications, getNotificationCount, markAsRead };
};
```

### 2. Badges con Prioridades

```jsx
// NotificationBadge.jsx - Badges animados
const NotificationBadge = ({ 
  count = 0, 
  priority = 'info', // 'critical', 'important', 'warning', 'info'
  animated = true 
}) => {
  const badgeVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.6, repeat: Infinity }
    }
  };

  return (
    <motion.div
      className={`notification-badge priority-${priority}`}
      animate={priority === 'critical' && animated ? 'pulse' : 'visible'}
      variants={badgeVariants}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
};
```

## 🔍 Sistema de Búsqueda Global

### Búsqueda Inteligente con Filtros

```jsx
// SearchGlobal.jsx - Buscador universal
const SearchGlobal = () => {
  const [results, setResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const searchFilters = {
    all: { label: 'Todo', contexts: ['users', 'blocks', 'questions', 'classes'] },
    users: { label: 'Usuarios', contexts: ['users'] },
    content: { label: 'Contenido', contexts: ['blocks', 'questions'] },
    education: { label: 'Educación', contexts: ['classes', 'teachers'] }
  };

  const performSearch = useDebouncedCallback(async (term, filter) => {
    const contexts = searchFilters[filter].contexts.join(',');
    const response = await fetch(`/api/search/global?q=${term}&contexts=${contexts}`);
    const data = await response.json();
    setResults(data.results);
  }, 300);

  // Navegación con teclado
  useKeyboardShortcuts({
    'ArrowDown': () => setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)),
    'ArrowUp': () => setSelectedIndex(prev => Math.max(prev - 1, -1)),
    'Enter': () => handleResultSelect(results[selectedIndex])
  });

  return (
    <div className="search-global">
      {/* Interface de búsqueda con resultados contextuales */}
    </div>
  );
};
```

## 🚀 Configuración e Instalación

### 1. Dependencias Requeridas

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "framer-motion": "^9.0.0",
    "react-window": "^1.8.8",
    "react-virtual": "^2.10.4"
  }
}
```

### 2. Configuración del Provider Principal

```jsx
// App.jsx - Configuración de providers
import { FeatureFlagsProvider } from './hooks/useFeatureFlags';
import { NavigationProvider } from './contexts/NavigationContext';

function App() {
  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <NavigationProvider>
          <Router>
            <NavigationSystem />
            <DynamicRouter />
          </Router>
        </NavigationProvider>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}
```

### 3. Configuración de Estilos

```scss
// NavigationSystem.scss - Variables principales
:root {
  --nav-height: 60px;
  --tab-height: 40px;
  --transition-speed: 0.3s;
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  
  // Colores de prioridad de notificaciones
  --priority-critical: #dc3545;
  --priority-important: #fd7e14;
  --priority-warning: #ffc107;
  --priority-info: #17a2b8;
}

.navigation-system {
  height: var(--nav-height);
  background: white;
  border-bottom: 1px solid #e9ecef;
  z-index: 1000;
}

.notification-badge {
  &.priority-critical {
    background: var(--priority-critical);
    animation: pulse 1.5s infinite;
  }
  
  &.priority-important {
    background: var(--priority-important);
  }
}
```

## 📚 API Endpoints Requeridos

### Endpoints del Sistema

```javascript
// Navegación y permisos
GET  /api/user/roles                    // Roles del usuario actual
GET  /api/navigation/available-routes   // Rutas disponibles por rol

// Feature flags
GET  /api/admin/feature-flags          // Obtener configuración actual
PUT  /api/admin/feature-flags          // Actualizar features (solo admin)
GET  /api/admin/feature-flags/stats    // Estadísticas de uso

// Notificaciones
GET  /api/notifications/badges         // Contadores por contexto
POST /api/notifications/mark-read      // Marcar como leído
WebSocket: ws://host/notifications     // Notificaciones en tiempo real

// Búsqueda global
GET  /api/search/global               // Búsqueda universal con filtros

// Gestión de usuarios (Admin Principal)
GET  /api/admin/administradores-secundarios  // Lista de admins secundarios
POST /api/admin/administradores-secundarios  // Crear admin secundario
DELETE /api/admin/administradores-secundarios/:id  // Remover admin

GET  /api/admin/search-users          // Buscar usuarios por nickname
```

## 🔧 Personalización y Extensión

### 1. Agregar Nueva Pestaña de Rol

```jsx
// Extender TAB_CONFIGS en NavigationSystem.jsx
const TAB_CONFIGS = {
  // ... pestañas existentes
  nuevo_rol: {
    id: 'nuevo-rol',
    label: 'Nuevo Rol',
    icon: 'star',
    priority: 5,
    route: '/nuevo-rol',
    sections: ['seccion-1', 'seccion-2']
  }
};

// Crear componente del panel
const NuevoRolPanel = React.lazy(() => import('../pages/NuevoRol/NuevoRolPanel'));

// Agregar a DynamicRouter.jsx
const roleRoutes = [
  // ... rutas existentes
  {
    path: '/nuevo-rol/*',
    element: <NuevoRolPanel />,
    roles: ['nuevo_rol'],
    features: ['nuevo_rol_feature']
  }
];
```

### 2. Agregar Nuevo Feature Flag

```jsx
// Extender DEFAULT_FEATURES en useFeatureFlags.js
const DEFAULT_FEATURES = {
  // ... features existentes
  nuevo_sistema_feature1: false,
  nuevo_sistema_feature2: true
};

// Usar en componentes
const MiComponente = () => {
  const { isFeatureEnabled } = useFeatureFlags();
  
  if (!isFeatureEnabled('nuevo_sistema_feature1')) {
    return <FeatureDisabledMessage />;
  }
  
  return <ComponenteCompleto />;
};
```

### 3. Personalizar Shortcuts

```jsx
// Extender shortcuts en useKeyboardShortcuts.js
const customShortcuts = {
  'ctrl+shift+n': () => navigationActions.openNewModal(),
  'alt+f': () => navigationActions.toggleFavorites(),
  'ctrl+k': () => navigationActions.quickActions()
};

useKeyboardShortcuts(customShortcuts);
```

## 📊 Métricas y Monitoreo

### Tracking de Uso del Sistema

```jsx
// useNavigationAnalytics.js - Hook para métricas
export const useNavigationAnalytics = () => {
  const trackTabSwitch = useCallback((fromTab, toTab) => {
    analytics.track('navigation_tab_switch', {
      from: fromTab,
      to: toTab,
      timestamp: Date.now()
    });
  }, []);

  const trackPanelExpansion = useCallback((panelId, expanded) => {
    analytics.track('panel_expansion', {
      panel: panelId,
      expanded,
      timestamp: Date.now()
    });
  }, []);

  const trackShortcutUsage = useCallback((shortcut) => {
    analytics.track('shortcut_used', {
      shortcut,
      timestamp: Date.now()
    });
  }, []);

  return { trackTabSwitch, trackPanelExpansion, trackShortcutUsage };
};
```

## 🛠️ Troubleshooting y Debugging

### Herramientas de Debug

```jsx
// NavigationDebugger.jsx - Panel de debug (solo desarrollo)
const NavigationDebugger = () => {
  const { 
    activeTab, 
    expandedPanels, 
    breadcrumbs, 
    favorites 
  } = useNavigationState();
  
  const { features } = useFeatureFlags();
  const { notifications } = useNotificationBadges();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="navigation-debugger">
      <h3>Navigation Debug</h3>
      <pre>{JSON.stringify({
        activeTab,
        expandedPanels,
        breadcrumbs,
        favorites,
        features,
        notifications
      }, null, 2)}</pre>
    </div>
  );
};
```

### Logging Centralizado

```jsx
// navigationLogger.js - Sistema de logs
export const navigationLogger = {
  info: (message, data) => {
    console.log(`[NAVIGATION] ${message}`, data);
  },
  
  warn: (message, data) => {
    console.warn(`[NAVIGATION] ${message}`, data);
  },
  
  error: (message, error) => {
    console.error(`[NAVIGATION] ${message}`, error);
    // Enviar a servicio de logging en producción
  }
};
```

---

**Sistema de Navegación Jerárquico Avanzado - PLAYTEST**  
*Arquitectura escalable y modular para experiencias de usuario superiores*