import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Contexto para feature flags
 */
const FeatureFlagsContext = createContext();

/**
 * Proveedor de feature flags con gestión centralizada
 */
export const FeatureFlagsProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Configuración por defecto de features
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
    ai_analytics: true,
    
    // Sistema de Comunicación
    communication_chat: true,
    communication_tickets: true,
    communication_email: true,
    
    // Sistema de Niveles
    levels_users: true,
    levels_creators: true,
    levels_progression: true,
    
    // Sistema de Retos
    challenges_custom: true,
    challenges_rewards: true,
    challenges_planning: true,
    
    // Sistema de Notificaciones
    notifications_push: true,
    notifications_email: true,
    notifications_badges: true,
    
    // Herramientas Avanzadas
    tools_advanced_analytics: false,
    tools_data_export: true,
    tools_bulk_operations: true,
    
    // App Móvil
    mobile_sync: false,
    mobile_notifications: false,
    mobile_offline: false,
    
    // Paneles específicos
    teacher_tools: true,
    creator_tools: true,
    support_system: true,
    financial_system: true,
    game_system: true
  };

  // Cargar feature flags desde el servidor
  const loadFeatureFlags = useCallback(async () => {
    if (!user) {
      setFeatures(DEFAULT_FEATURES);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/feature-flags', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeatures({ ...DEFAULT_FEATURES, ...data.features });
        setLastUpdate(data.lastUpdate);
      } else {
        // Fallback a configuración por defecto
        setFeatures(DEFAULT_FEATURES);
      }
    } catch (error) {
      console.error('Error cargando feature flags:', error);
      setFeatures(DEFAULT_FEATURES);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar al montar y cuando cambie el usuario
  useEffect(() => {
    loadFeatureFlags();
  }, [loadFeatureFlags]);

  // Configurar polling para actualizaciones automáticas
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(loadFeatureFlags, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [user, loadFeatureFlags]);

  // Función para verificar si una feature está habilitada
  const isFeatureEnabled = useCallback((featureName) => {
    return features[featureName] === true;
  }, [features]);

  // Función para verificar múltiples features (AND)
  const areAllFeaturesEnabled = useCallback((featureNames) => {
    return featureNames.every(name => isFeatureEnabled(name));
  }, [isFeatureEnabled]);

  // Función para verificar múltiples features (OR)
  const isAnyFeatureEnabled = useCallback((featureNames) => {
    return featureNames.some(name => isFeatureEnabled(name));
  }, [isFeatureEnabled]);

  // Función para obtener features por grupo
  const getFeaturesByGroup = useCallback((groupPrefix) => {
    const groupFeatures = {};
    Object.entries(features).forEach(([key, value]) => {
      if (key.startsWith(groupPrefix + '_')) {
        const featureName = key.replace(groupPrefix + '_', '');
        groupFeatures[featureName] = value;
      }
    });
    return groupFeatures;
  }, [features]);

  // Función para actualizar feature flags (solo admin)
  const updateFeatureFlags = useCallback(async (updates) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        const data = await response.json();
        setFeatures(data.features);
        setLastUpdate(data.lastUpdate);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error actualizando feature flags:', error);
      return false;
    }
  }, [user]);

  // Función para obtener estadísticas de uso de features
  const getFeatureStats = useCallback(async () => {
    if (!user) return null;

    try {
      const response = await fetch('/api/admin/feature-flags/stats', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }, [user]);

  const value = {
    features,
    loading,
    lastUpdate,
    isFeatureEnabled,
    areAllFeaturesEnabled,
    isAnyFeatureEnabled,
    getFeaturesByGroup,
    updateFeatureFlags,
    getFeatureStats,
    refresh: loadFeatureFlags
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

/**
 * Hook principal para usar feature flags
 */
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags debe usarse dentro de FeatureFlagsProvider');
  }
  return context;
};

/**
 * Hook para feature flags específico por grupo
 */
export const useFeatureGroup = (groupName) => {
  const { getFeaturesByGroup, isFeatureEnabled } = useFeatureFlags();
  
  const groupFeatures = getFeaturesByGroup(groupName);
  const isGroupEnabled = Object.values(groupFeatures).some(Boolean);
  const areAllGroupFeaturesEnabled = Object.values(groupFeatures).every(Boolean);

  return {
    features: groupFeatures,
    isGroupEnabled,
    areAllGroupFeaturesEnabled,
    isFeatureEnabled: (featureName) => isFeatureEnabled(`${groupName}_${featureName}`)
  };
};

/**
 * HOC para condicional renderizado basado en feature flags
 */
export const withFeatureFlag = (featureName, fallback = null) => {
  return function FeatureFlagWrapper(WrappedComponent) {
    return function FeatureFlagComponent(props) {
      const { isFeatureEnabled } = useFeatureFlags();
      
      if (!isFeatureEnabled(featureName)) {
        return fallback;
      }
      
      return <WrappedComponent {...props} />;
    };
  };
};

/**
 * Componente para renderizado condicional basado en features
 */
export const FeatureFlag = ({ 
  feature, 
  features, 
  requireAll = false, 
  children, 
  fallback = null 
}) => {
  const { isFeatureEnabled, areAllFeaturesEnabled, isAnyFeatureEnabled } = useFeatureFlags();

  let shouldRender = false;

  if (feature) {
    shouldRender = isFeatureEnabled(feature);
  } else if (features && features.length > 0) {
    shouldRender = requireAll 
      ? areAllFeaturesEnabled(features)
      : isAnyFeatureEnabled(features);
  }

  return shouldRender ? children : fallback;
};

/**
 * Hook para feature flags con A/B testing
 */
export const useABTest = (testName, variants = ['A', 'B']) => {
  const { user } = useAuthContext();
  const { isFeatureEnabled } = useFeatureFlags();
  
  const [variant, setVariant] = useState(variants[0]);

  useEffect(() => {
    if (!user || !isFeatureEnabled('ab_testing')) {
      return;
    }

    // Calcular variant basado en user ID y test name
    const hash = user.id.toString() + testName;
    const hashCode = hash.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const variantIndex = Math.abs(hashCode) % variants.length;
    setVariant(variants[variantIndex]);

    // Registrar participación en A/B test
    fetch('/api/ab-tests/participate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        testName,
        variant: variants[variantIndex],
        userId: user.id
      })
    }).catch(error => {
      console.error('Error registrando participación en A/B test:', error);
    });
  }, [user, testName, variants, isFeatureEnabled]);

  const trackConversion = useCallback((conversionType = 'default', value = 1) => {
    if (!user || !isFeatureEnabled('ab_testing')) return;

    fetch('/api/ab-tests/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        testName,
        variant,
        conversionType,
        value,
        userId: user.id
      })
    }).catch(error => {
      console.error('Error registrando conversión en A/B test:', error);
    });
  }, [user, testName, variant, isFeatureEnabled]);

  return {
    variant,
    isVariant: (variantName) => variant === variantName,
    trackConversion
  };
};