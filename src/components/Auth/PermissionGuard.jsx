import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

/**
 * Componente de guardia para verificar permisos y features
 * Controla el acceso a rutas y componentes basado en roles y feature flags
 */
const PermissionGuard = ({
  children,
  requiredRoles = [],
  requiredFeatures = [],
  requireAll = false, // Si true, requiere TODOS los roles/features, si false, requiere AL MENOS UNO
  fallback = null,
  onAccessDenied = null
}) => {
  const { user, userRoles, hasRole, hasAnyRole } = useAuthContext();
  const { isFeatureEnabled, areAllFeaturesEnabled, isAnyFeatureEnabled } = useFeatureFlags();

  // Verificar autenticación básica
  if (!user) {
    if (onAccessDenied) onAccessDenied('not_authenticated');
    return fallback;
  }

  // Verificar roles si se especifican
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requireAll 
      ? requiredRoles.every(role => hasRole(role))
      : requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRoles) {
      if (onAccessDenied) onAccessDenied('insufficient_roles', { required: requiredRoles, current: userRoles });
      return fallback;
    }
  }

  // Verificar features si se especifican
  if (requiredFeatures.length > 0) {
    const hasRequiredFeatures = requireAll
      ? areAllFeaturesEnabled(requiredFeatures)
      : isAnyFeatureEnabled(requiredFeatures);
    
    if (!hasRequiredFeatures) {
      if (onAccessDenied) onAccessDenied('features_disabled', { required: requiredFeatures });
      return fallback;
    }
  }

  // Si pasa todas las verificaciones, renderizar children
  return children;
};

export default PermissionGuard;

/**
 * Hook para verificar permisos sin renderizar componente
 */
export const usePermissionCheck = () => {
  const { user, hasRole, hasAnyRole } = useAuthContext();
  const { isFeatureEnabled, areAllFeaturesEnabled, isAnyFeatureEnabled } = useFeatureFlags();

  const checkPermission = (options = {}) => {
    const {
      requiredRoles = [],
      requiredFeatures = [],
      requireAll = false
    } = options;

    // Verificar autenticación
    if (!user) return { allowed: false, reason: 'not_authenticated' };

    // Verificar roles
    if (requiredRoles.length > 0) {
      const hasRequiredRoles = requireAll 
        ? requiredRoles.every(role => hasRole(role))
        : requiredRoles.some(role => hasRole(role));
      
      if (!hasRequiredRoles) {
        return { allowed: false, reason: 'insufficient_roles', details: { requiredRoles } };
      }
    }

    // Verificar features
    if (requiredFeatures.length > 0) {
      const hasRequiredFeatures = requireAll
        ? areAllFeaturesEnabled(requiredFeatures)
        : isAnyFeatureEnabled(requiredFeatures);
      
      if (!hasRequiredFeatures) {
        return { allowed: false, reason: 'features_disabled', details: { requiredFeatures } };
      }
    }

    return { allowed: true };
  };

  return { checkPermission };
};

/**
 * Componente HOC para envolver componentes con verificación de permisos
 */
export const withPermissions = (WrappedComponent, permissionConfig) => {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGuard {...permissionConfig}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
};

/**
 * Hook para verificar múltiples permisos
 */
export const useMultiplePermissions = (permissionSets) => {
  const { checkPermission } = usePermissionCheck();

  return permissionSets.map(permissionSet => ({
    ...permissionSet,
    ...checkPermission(permissionSet)
  }));
};