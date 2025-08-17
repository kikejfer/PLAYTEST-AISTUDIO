/**
 * React Hooks Personalizados para Feature Flags - PLAYTEST
 * Sistema completo de hooks para gestión de funcionalidades
 */

import { useState, useEffect, useCallback, useMemo, useContext, createContext, useRef } from 'react';
import { featureFlagsDB } from './feature-flags-database.js';
import { featureFlagsAPI } from './feature-flags-api.js';
import { FEATURE_FLAGS_CONFIG, FEATURE_GROUPS } from './feature-flags-config.js';

// Context para compartir estado de feature flags
const FeatureFlagsContext = createContext({
  flags: {},
  loading: false,
  error: null,
  refreshFlags: () => {},
  updateFlag: () => {},
  abTests: {},
  userSegment: 'all_users'
});

// Provider del contexto
export const FeatureFlagsProvider = ({ children, userSegment = 'all_users', userId = null }) => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abTests, setAbTests] = useState({});
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const refreshTimeoutRef = useRef(null);

  // Función para refrescar flags
  const refreshFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allFlags = featureFlagsDB.getFeatureFlags();
      const currentAbTests = featureFlagsDB.getABTests();

      // Aplicar lógica de A/B testing
      const processedFlags = { ...allFlags };
      for (const [testId, test] of Object.entries(currentAbTests)) {
        if (test.status === 'active' && userId) {
          const userVariant = featureFlagsDB.getUserVariant(testId, userId);
          if (userVariant && test.variants) {
            const variant = test.variants.find(v => v.name === userVariant);
            if (variant && variant.flag_override) {
              processedFlags[test.flag_key] = variant.flag_override;
            }
          }
        }
      }

      setFlags(processedFlags);
      setAbTests(currentAbTests);
      setLastRefresh(Date.now());

    } catch (err) {
      console.error('Error refreshing feature flags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Función para actualizar un flag específico
  const updateFlag = useCallback(async (flagKey, enabled, metadata = {}) => {
    try {
      const result = await featureFlagsAPI.updateFlag(flagKey, enabled, {
        ...metadata,
        user_id: userId,
        user_segment: userSegment
      });

      if (result.success) {
        await refreshFlags();
        return { success: true };
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (err) {
      console.error(`Error updating flag ${flagKey}:`, err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [refreshFlags, userId, userSegment]);

  // Inicializar y configurar auto-refresh
  useEffect(() => {
    refreshFlags();

    // Auto-refresh cada 5 minutos
    const interval = setInterval(refreshFlags, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshFlags]);

  // Escuchar eventos de cambios de flags
  useEffect(() => {
    const handleFlagChange = (event) => {
      const { flagKey, newValue } = event.detail;
      setFlags(prev => ({
        ...prev,
        [flagKey]: newValue
      }));
    };

    const handleRollback = () => {
      refreshFlags();
    };

    window.addEventListener('featureFlagChanged', handleFlagChange);
    window.addEventListener('featureFlagsRolledBack', handleRollback);

    return () => {
      window.removeEventListener('featureFlagChanged', handleFlagChange);
      window.removeEventListener('featureFlagsRolledBack', handleRollback);
    };
  }, [refreshFlags]);

  const contextValue = {
    flags,
    loading,
    error,
    refreshFlags,
    updateFlag,
    abTests,
    userSegment,
    userId,
    lastRefresh
  };

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Hook para usar el contexto
export const useFeatureFlagsContext = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlagsContext must be used within a FeatureFlagsProvider');
  }
  return context;
};

// Hook principal para verificar feature flags
export const useFeatureFlag = (flagKey, fallback = false) => {
  const { flags, loading, error, refreshFlags, updateFlag } = useFeatureFlagsContext();
  const [localLoading, setLocalLoading] = useState(false);

  const enabled = useMemo(() => {
    if (loading) return fallback;
    return featureFlagsDB.getFeatureFlag(flagKey, fallback);
  }, [flags, flagKey, fallback, loading]);

  const toggle = useCallback(async (metadata = {}) => {
    setLocalLoading(true);
    try {
      const result = await updateFlag(flagKey, !enabled, metadata);
      return result;
    } finally {
      setLocalLoading(false);
    }
  }, [flagKey, enabled, updateFlag]);

  const enable = useCallback(async (metadata = {}) => {
    if (enabled) return { success: true, message: 'Already enabled' };
    
    setLocalLoading(true);
    try {
      const result = await updateFlag(flagKey, true, metadata);
      return result;
    } finally {
      setLocalLoading(false);
    }
  }, [flagKey, enabled, updateFlag]);

  const disable = useCallback(async (metadata = {}) => {
    if (!enabled) return { success: true, message: 'Already disabled' };
    
    setLocalLoading(true);
    try {
      const result = await updateFlag(flagKey, false, metadata);
      return result;
    } finally {
      setLocalLoading(false);
    }
  }, [flagKey, enabled, updateFlag]);

  return {
    enabled,
    loading: loading || localLoading,
    error,
    refresh: refreshFlags,
    toggle,
    enable,
    disable
  };
};

// Hook para gestión de grupos de features
export const useFeatureGroup = (groupName) => {
  const { flags, loading, error, updateFlag } = useFeatureFlagsContext();
  const [localLoading, setLocalLoading] = useState(false);

  const groupConfig = FEATURE_FLAGS_CONFIG[groupName];
  const groupFeatures = useMemo(() => {
    if (!groupConfig || !groupConfig.features) return {};
    
    const features = {};
    for (const flagKey of Object.keys(groupConfig.features)) {
      features[flagKey] = featureFlagsDB.getFeatureFlag(flagKey, false);
    }
    return features;
  }, [flags, groupConfig]);

  const enabledCount = useMemo(() => {
    return Object.values(groupFeatures).filter(Boolean).length;
  }, [groupFeatures]);

  const totalCount = useMemo(() => {
    return Object.keys(groupFeatures).length;
  }, [groupFeatures]);

  const groupEnabled = useMemo(() => {
    return enabledCount > 0;
  }, [enabledCount]);

  const anyEnabled = useMemo(() => {
    return enabledCount > 0;
  }, [enabledCount]);

  const allEnabled = useMemo(() => {
    return enabledCount === totalCount;
  }, [enabledCount, totalCount]);

  const status = useMemo(() => {
    if (enabledCount === 0) return 'disabled';
    if (enabledCount === totalCount) return 'enabled';
    return 'partial';
  }, [enabledCount, totalCount]);

  const enableGroup = useCallback(async (metadata = {}) => {
    if (!groupConfig || !groupConfig.features) {
      return { success: false, error: 'Group not found' };
    }

    setLocalLoading(true);
    try {
      const updates = Object.keys(groupConfig.features).map(flagKey => ({
        flagKey,
        enabled: true
      }));

      const result = await featureFlagsAPI.batchUpdateFlags(updates, {
        ...metadata,
        action: 'enable_group',
        group_name: groupName
      });

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLocalLoading(false);
    }
  }, [groupName, groupConfig]);

  const disableGroup = useCallback(async (metadata = {}) => {
    if (!groupConfig || !groupConfig.features) {
      return { success: false, error: 'Group not found' };
    }

    setLocalLoading(true);
    try {
      const updates = Object.keys(groupConfig.features).map(flagKey => ({
        flagKey,
        enabled: false
      }));

      const result = await featureFlagsAPI.batchUpdateFlags(updates, {
        ...metadata,
        action: 'disable_group',
        group_name: groupName
      });

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLocalLoading(false);
    }
  }, [groupName, groupConfig]);

  return {
    groupEnabled,
    anyEnabled,
    allEnabled,
    features: groupFeatures,
    enabledCount,
    totalCount,
    status,
    loading: loading || localLoading,
    error,
    enableGroup,
    disableGroup,
    config: groupConfig
  };
};

// Hook para gestión de dependencias
export const useFeatureDependencies = (flagKey) => {
  const { flags, loading } = useFeatureFlagsContext();
  const [validation, setValidation] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);

  const dependencies = useMemo(() => {
    return featureFlagsDB.getFlagDependencies(flagKey);
  }, [flagKey]);

  const dependentFlags = useMemo(() => {
    return featureFlagsDB.getDependentFlags(flagKey);
  }, [flagKey]);

  const missingDependencies = useMemo(() => {
    return dependencies.filter(dep => !featureFlagsDB.getFeatureFlag(dep, false));
  }, [dependencies, flags]);

  const activeDependents = useMemo(() => {
    return dependentFlags.filter(dep => featureFlagsDB.getFeatureFlag(dep, false));
  }, [dependentFlags, flags]);

  const canEnable = useMemo(() => {
    return missingDependencies.length === 0;
  }, [missingDependencies]);

  const canDisable = useMemo(() => {
    return activeDependents.length === 0;
  }, [activeDependents]);

  const validateChange = useCallback(async (intendedValue) => {
    setValidationLoading(true);
    try {
      const result = await featureFlagsAPI.validateDependencies(flagKey, intendedValue);
      setValidation(result);
      return result;
    } catch (err) {
      console.error('Error validating dependencies:', err);
      setValidation({ 
        validation: { can_change: false, issues: [{ message: err.message }] } 
      });
      return null;
    } finally {
      setValidationLoading(false);
    }
  }, [flagKey]);

  return {
    dependencies,
    dependentFlags,
    missingDependencies,
    activeDependents,
    canEnable,
    canDisable,
    validation,
    validateChange,
    loading: loading || validationLoading
  };
};

// Hook para rollout progresivo
export const useFeatureRollout = (flagKey, userId) => {
  const { flags, abTests } = useFeatureFlagsContext();
  const [rolloutStatus, setRolloutStatus] = useState(null);

  const baseEnabled = useMemo(() => {
    return featureFlagsDB.getFeatureFlag(flagKey, false);
  }, [flags, flagKey]);

  const userInABTest = useMemo(() => {
    if (!userId) return null;

    for (const test of Object.values(abTests)) {
      if (test.flag_key === flagKey && test.status === 'active') {
        const variant = featureFlagsDB.getUserVariant(test.id, userId);
        return { test, variant };
      }
    }
    return null;
  }, [abTests, flagKey, userId]);

  const effectiveEnabled = useMemo(() => {
    if (userInABTest) {
      const { test, variant } = userInABTest;
      const variantConfig = test.variants.find(v => v.name === variant);
      if (variantConfig && variantConfig.hasOwnProperty('flag_override')) {
        return variantConfig.flag_override;
      }
    }
    return baseEnabled;
  }, [baseEnabled, userInABTest]);

  const inRollout = useMemo(() => {
    return userInABTest !== null;
  }, [userInABTest]);

  const percentage = useMemo(() => {
    if (!userInABTest) return 100;
    const { variant, test } = userInABTest;
    const variantConfig = test.variants.find(v => v.name === variant);
    return variantConfig ? variantConfig.percentage : 0;
  }, [userInABTest]);

  const userInSegment = useMemo(() => {
    if (!userInABTest) return true;
    const { test } = userInABTest;
    // Lógica simplificada de segmentación
    return test.user_segment === 'all_users' || test.user_segment === 'test_segment';
  }, [userInABTest]);

  return {
    enabled: effectiveEnabled,
    baseEnabled,
    inRollout,
    percentage,
    userInSegment,
    abTestInfo: userInABTest,
    rolloutStatus
  };
};

// Hook para métricas de performance
export const useFeatureMetrics = (flagKey) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const metricsRef = useRef({});

  const trackUsage = useCallback((action = 'view', metadata = {}) => {
    const timestamp = Date.now();
    const sessionId = featureFlagsDB.getSessionId();
    
    if (!metricsRef.current[flagKey]) {
      metricsRef.current[flagKey] = {
        first_used: timestamp,
        usage_count: 0,
        actions: []
      };
    }

    metricsRef.current[flagKey].usage_count++;
    metricsRef.current[flagKey].actions.push({
      action,
      timestamp,
      metadata
    });

    metricsRef.current[flagKey].last_used = timestamp;

    // Guardar en localStorage cada 10 usos para optimizar performance
    if (metricsRef.current[flagKey].usage_count % 10 === 0) {
      const existingMetrics = JSON.parse(
        localStorage.getItem('playtest_feature_metrics') || '{}'
      );
      
      existingMetrics[flagKey] = metricsRef.current[flagKey];
      
      localStorage.setItem(
        'playtest_feature_metrics', 
        JSON.stringify(existingMetrics)
      );
    }
  }, [flagKey]);

  const getMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const stored = JSON.parse(
        localStorage.getItem('playtest_feature_metrics') || '{}'
      );
      
      const flagMetrics = stored[flagKey] || {
        first_used: null,
        last_used: null,
        usage_count: 0,
        actions: []
      };

      // Combinar con métricas en memoria
      if (metricsRef.current[flagKey]) {
        flagMetrics.usage_count += metricsRef.current[flagKey].usage_count;
        flagMetrics.actions = [
          ...flagMetrics.actions,
          ...metricsRef.current[flagKey].actions
        ];
        
        if (metricsRef.current[flagKey].first_used && 
            (!flagMetrics.first_used || metricsRef.current[flagKey].first_used < flagMetrics.first_used)) {
          flagMetrics.first_used = metricsRef.current[flagKey].first_used;
        }
        
        if (metricsRef.current[flagKey].last_used && 
            (!flagMetrics.last_used || metricsRef.current[flagKey].last_used > flagMetrics.last_used)) {
          flagMetrics.last_used = metricsRef.current[flagKey].last_used;
        }
      }

      setMetrics(flagMetrics);
      return flagMetrics;
    } catch (err) {
      console.error('Error getting feature metrics:', err);
      setMetrics(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [flagKey]);

  useEffect(() => {
    getMetrics();
  }, [getMetrics]);

  return {
    metrics,
    loading,
    trackUsage,
    refreshMetrics: getMetrics
  };
};

// Hook para debugging y desarrollo
export const useFeatureDebug = () => {
  const { flags, abTests, loading, error } = useFeatureFlagsContext();
  const [debugInfo, setDebugInfo] = useState({});

  const getAllDebugInfo = useCallback(() => {
    const info = {
      total_flags: Object.keys(flags).filter(k => !k.startsWith('_')).length,
      enabled_flags: Object.entries(flags).filter(([k, v]) => !k.startsWith('_') && v).map(([k]) => k),
      disabled_flags: Object.entries(flags).filter(([k, v]) => !k.startsWith('_') && !v).map(([k]) => k),
      active_ab_tests: Object.values(abTests).filter(test => test.status === 'active').length,
      groups_status: {},
      dependency_issues: []
    };

    // Análisis por grupos
    for (const [groupName, groupConfig] of Object.entries(FEATURE_FLAGS_CONFIG)) {
      const groupFlags = Object.keys(groupConfig.features || {});
      const enabledInGroup = groupFlags.filter(flag => flags[flag]).length;
      
      info.groups_status[groupName] = {
        total: groupFlags.length,
        enabled: enabledInGroup,
        status: enabledInGroup === 0 ? 'disabled' : 
                enabledInGroup === groupFlags.length ? 'enabled' : 'partial'
      };
    }

    // Análisis de dependencias
    for (const [flagKey, enabled] of Object.entries(flags)) {
      if (flagKey.startsWith('_')) continue;
      
      if (enabled) {
        const dependencies = featureFlagsDB.getFlagDependencies(flagKey);
        const unmetDeps = dependencies.filter(dep => !flags[dep]);
        
        if (unmetDeps.length > 0) {
          info.dependency_issues.push({
            flag: flagKey,
            missing_dependencies: unmetDeps,
            severity: 'error'
          });
        }
      }
    }

    setDebugInfo(info);
    return info;
  }, [flags, abTests]);

  const exportConfiguration = useCallback(() => {
    const config = {
      timestamp: new Date().toISOString(),
      flags,
      ab_tests: abTests,
      groups_config: FEATURE_FLAGS_CONFIG,
      debug_info: debugInfo,
      logs: featureFlagsDB.getLogs().slice(-50) // Últimos 50 logs
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playtest-feature-flags-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [flags, abTests, debugInfo]);

  const validateSystem = useCallback(() => {
    const issues = [];
    
    // Validar integridad de datos
    const metadata = flags._metadata;
    if (!metadata) {
      issues.push({
        type: 'warning',
        message: 'Missing metadata in flags configuration'
      });
    }

    // Validar dependencias circulares
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (flagKey) => {
      if (recursionStack.has(flagKey)) return true;
      if (visited.has(flagKey)) return false;
      
      visited.add(flagKey);
      recursionStack.add(flagKey);
      
      const dependencies = featureFlagsDB.getFlagDependencies(flagKey);
      for (const dep of dependencies) {
        if (hasCycle(dep)) return true;
      }
      
      recursionStack.delete(flagKey);
      return false;
    };

    for (const flagKey of Object.keys(flags)) {
      if (!flagKey.startsWith('_') && hasCycle(flagKey)) {
        issues.push({
          type: 'error',
          message: `Circular dependency detected involving ${flagKey}`
        });
      }
    }

    return issues;
  }, [flags]);

  useEffect(() => {
    if (!loading && !error) {
      getAllDebugInfo();
    }
  }, [flags, abTests, loading, error, getAllDebugInfo]);

  return {
    debugInfo,
    getAllDebugInfo,
    exportConfiguration,
    validateSystem,
    loading,
    error
  };
};

// Hook para administración
export const useFeatureAdmin = () => {
  const { refreshFlags } = useFeatureFlagsContext();
  const [adminLoading, setAdminLoading] = useState(false);

  const createRollbackPoint = useCallback(async (description, userId) => {
    setAdminLoading(true);
    try {
      const result = featureFlagsDB.createRollbackPoint(description, userId);
      return result;
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const executeRollback = useCallback(async (rollbackId, reason, userId) => {
    setAdminLoading(true);
    try {
      const result = await featureFlagsAPI.executeRollback(rollbackId, reason, userId);
      if (result.success) {
        await refreshFlags();
      }
      return result;
    } finally {
      setAdminLoading(false);
    }
  }, [refreshFlags]);

  const getRollbackHistory = useCallback(async () => {
    try {
      const result = await featureFlagsAPI.getRollbackHistory();
      return result;
    } catch (err) {
      console.error('Error getting rollback history:', err);
      return { rollback_points: [] };
    }
  }, []);

  const getLogs = useCallback(async (filters = {}) => {
    try {
      const result = await featureFlagsAPI.getLogs(filters);
      return result;
    } catch (err) {
      console.error('Error getting logs:', err);
      return { logs: [] };
    }
  }, []);

  const scheduleFeature = useCallback(async (config) => {
    setAdminLoading(true);
    try {
      const result = await featureFlagsAPI.scheduleFlag(config);
      return result;
    } finally {
      setAdminLoading(false);
    }
  }, []);

  return {
    createRollbackPoint,
    executeRollback,
    getRollbackHistory,
    getLogs,
    scheduleFeature,
    loading: adminLoading
  };
};

// Hook compuesto para usar múltiples funcionalidades
export const useFeatureFlags = (flagKeys = []) => {
  const results = {};
  
  if (Array.isArray(flagKeys)) {
    flagKeys.forEach(flagKey => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      results[flagKey] = useFeatureFlag(flagKey);
    });
  } else {
    // Si se pasa un solo flag como string
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[flagKeys] = useFeatureFlag(flagKeys);
  }

  return results;
};