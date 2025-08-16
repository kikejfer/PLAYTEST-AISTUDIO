import React, { useMemo, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PermissionGuard from '../components/Auth/PermissionGuard';

// Lazy loading de componentes para optimización
const AdminPrincipalPanel = React.lazy(() => import('../pages/AdminPrincipal/AdminPrincipalPanel'));
const AdminSecundarioPanel = React.lazy(() => import('../pages/AdminSecundario/AdminSecundarioPanel'));
const ServicioTecnicoPanel = React.lazy(() => import('../pages/ServicioTecnico/ServicioTecnicoPanel'));
const ProfesorPanel = React.lazy(() => import('../pages/Profesor/ProfesorPanel'));
const CreadorPanel = React.lazy(() => import('../pages/Creador/CreadorPanel'));
const JuegoPanel = React.lazy(() => import('../pages/Juego/JuegoPanel'));
const FinancieroPanel = React.lazy(() => import('../pages/Financiero/FinancieroPanel'));

// Páginas de error
const NotFound = React.lazy(() => import('../pages/Error/NotFound'));
const Unauthorized = React.lazy(() => import('../pages/Error/Unauthorized'));

/**
 * Router dinámico basado en roles y feature flags
 * Gestiona rutas automáticamente según permisos del usuario
 */
const DynamicRouter = () => {
  const { user, userRoles, hasRole } = useAuthContext();
  const { isFeatureEnabled } = useFeatureFlags();

  // Configuración de rutas por rol con dependencias de features
  const roleRoutes = useMemo(() => [
    {
      path: '/admin-principal/*',
      element: <AdminPrincipalPanel />,
      roles: ['administrador_principal'],
      features: [], // Siempre disponible
      priority: 1
    },
    {
      path: '/admin-secundario/*',
      element: <AdminSecundarioPanel />,
      roles: ['administrador_secundario'],
      features: [],
      priority: 2
    },
    {
      path: '/soporte/*',
      element: <ServicioTecnicoPanel />,
      roles: ['servicio_tecnico'],
      features: ['support_system'],
      priority: 3
    },
    {
      path: '/profesor/*',
      element: <ProfesorPanel />,
      roles: ['profesor'],
      features: ['teacher_tools'],
      priority: 4
    },
    {
      path: '/creador/*',
      element: <CreadorPanel />,
      roles: ['creador'],
      features: ['creator_tools'],
      priority: 4
    }
  ], []);

  // Rutas universales (disponibles para todos)
  const universalRoutes = useMemo(() => [
    {
      path: '/juego/*',
      element: <JuegoPanel />,
      features: ['game_system']
    },
    {
      path: '/financiero/*', 
      element: <FinancieroPanel />,
      features: ['financial_system']
    }
  ], []);

  // Filtrar rutas disponibles basado en roles y features
  const availableRoleRoutes = useMemo(() => {
    return roleRoutes.filter(route => {
      // Verificar si el usuario tiene el rol requerido
      const hasRequiredRole = route.roles.some(role => hasRole(role));
      
      // Verificar si las features están habilitadas
      const featuresEnabled = route.features.length === 0 || 
        route.features.every(feature => isFeatureEnabled(feature));
      
      return hasRequiredRole && featuresEnabled;
    }).sort((a, b) => a.priority - b.priority);
  }, [roleRoutes, hasRole, isFeatureEnabled]);

  // Filtrar rutas universales basado en features
  const availableUniversalRoutes = useMemo(() => {
    return universalRoutes.filter(route => {
      return route.features.length === 0 || 
        route.features.every(feature => isFeatureEnabled(feature));
    });
  }, [universalRoutes, isFeatureEnabled]);

  // Determinar ruta por defecto
  const defaultRoute = useMemo(() => {
    // Priorizar rutas de rol sobre universales
    if (availableRoleRoutes.length > 0) {
      return availableRoleRoutes[0].path.replace('/*', '');
    }
    
    // Si no hay rutas de rol, usar universales
    if (availableUniversalRoutes.length > 0) {
      return availableUniversalRoutes[0].path.replace('/*', '');
    }
    
    // Fallback
    return '/unauthorized';
  }, [availableRoleRoutes, availableUniversalRoutes]);

  // Componente para manejar redirección a ruta por defecto
  const DefaultRedirect = () => {
    return <Navigate to={defaultRoute} replace />;
  };

  return (
    <Suspense fallback={<LoadingSpinner size="large" overlay />}>
      <Routes>
        {/* Ruta raíz - redirección a página por defecto */}
        <Route path="/" element={<DefaultRedirect />} />
        
        {/* Rutas basadas en roles */}
        {availableRoleRoutes.map((route, index) => (
          <Route
            key={`role-${index}`}
            path={route.path}
            element={
              <PermissionGuard 
                requiredRoles={route.roles}
                requiredFeatures={route.features}
                fallback={<Navigate to="/unauthorized" replace />}
              >
                {route.element}
              </PermissionGuard>
            }
          />
        ))}
        
        {/* Rutas universales */}
        {availableUniversalRoutes.map((route, index) => (
          <Route
            key={`universal-${index}`}
            path={route.path}
            element={
              <PermissionGuard 
                requiredFeatures={route.features}
                fallback={<Navigate to="/unauthorized" replace />}
              >
                {route.element}
              </PermissionGuard>
            }
          />
        ))}
        
        {/* Rutas de error */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default DynamicRouter;

/**
 * Hook para obtener información de rutas disponibles
 */
export const useAvailableRoutes = () => {
  const { userRoles, hasRole } = useAuthContext();
  const { isFeatureEnabled } = useFeatureFlags();

  return useMemo(() => {
    const roleRoutes = [
      {
        id: 'admin-principal',
        path: '/admin-principal',
        label: 'Admin Principal',
        icon: 'crown',
        roles: ['administrador_principal'],
        features: []
      },
      {
        id: 'admin-secundario',
        path: '/admin-secundario', 
        label: 'Admin Secundario',
        icon: 'shield',
        roles: ['administrador_secundario'],
        features: []
      },
      {
        id: 'soporte',
        path: '/soporte',
        label: 'Soporte Técnico',
        icon: 'tools',
        roles: ['servicio_tecnico'],
        features: ['support_system']
      },
      {
        id: 'profesor',
        path: '/profesor',
        label: 'Panel Profesor',
        icon: 'graduation-cap',
        roles: ['profesor'],
        features: ['teacher_tools']
      },
      {
        id: 'creador',
        path: '/creador',
        label: 'Panel Creador', 
        icon: 'paint-brush',
        roles: ['creador'],
        features: ['creator_tools']
      }
    ];

    const universalRoutes = [
      {
        id: 'juego',
        path: '/juego',
        label: 'Juego',
        icon: 'gamepad',
        universal: true,
        features: ['game_system']
      },
      {
        id: 'financiero',
        path: '/financiero',
        label: 'Financiero',
        icon: 'coins',
        universal: true,
        features: ['financial_system']
      }
    ];

    // Filtrar rutas disponibles
    const availableRoleRoutes = roleRoutes.filter(route => {
      const hasRequiredRole = route.roles.some(role => hasRole(role));
      const featuresEnabled = route.features.length === 0 || 
        route.features.every(feature => isFeatureEnabled(feature));
      return hasRequiredRole && featuresEnabled;
    });

    const availableUniversalRoutes = universalRoutes.filter(route => {
      return route.features.length === 0 || 
        route.features.every(feature => isFeatureEnabled(feature));
    });

    return [...availableRoleRoutes, ...availableUniversalRoutes];
  }, [userRoles, hasRole, isFeatureEnabled]);
};