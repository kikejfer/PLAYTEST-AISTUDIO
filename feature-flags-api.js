/**
 * API REST para Gestión de Feature Flags - PLAYTEST
 * Sistema completo de endpoints para administración de configuración
 */

import { featureFlagsDB } from './feature-flags-database.js';
import { FEATURE_FLAGS_CONFIG, FEATURE_GROUPS } from './feature-flags-config.js';

export class FeatureFlagsAPI {
  constructor() {
    this.baseUrl = '/api/feature-flags';
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.authToken = null;
  }

  // Configurar autenticación
  setAuthToken(token) {
    this.authToken = token;
  }

  // Interceptores de request
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  // Interceptores de response
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // Método genérico para hacer requests
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
          ...options.headers
        },
        ...options
      };

      // Aplicar interceptores de request
      for (const interceptor of this.requestInterceptors) {
        await interceptor(config);
      }

      // Simular llamada API usando localStorage
      const response = await this.simulateAPICall(endpoint, config);

      // Aplicar interceptores de response
      for (const interceptor of this.responseInterceptors) {
        await interceptor(response);
      }

      return response;

    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Simular llamadas API usando localStorage
  async simulateAPICall(endpoint, config) {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));

    const method = config.method || 'GET';
    const body = config.body ? JSON.parse(config.body) : null;

    try {
      switch (true) {
        // GET /api/feature-flags - Obtener configuración completa
        case endpoint === '' && method === 'GET':
          return this.handleGetAllFlags();

        // GET /api/feature-flags/groups - Obtener grupos de funcionalidades
        case endpoint === '/groups' && method === 'GET':
          return this.handleGetGroups();

        // GET /api/feature-flags/group/{groupName} - Obtener grupo específico
        case endpoint.startsWith('/group/') && method === 'GET':
          const groupName = endpoint.split('/')[2];
          return this.handleGetGroup(groupName);

        // POST /api/feature-flags - Crear nuevo flag
        case endpoint === '' && method === 'POST':
          return this.handleCreateFlag(body);

        // PUT /api/feature-flags/{flagId} - Actualizar flag
        case endpoint.match(/^\/[^\/]+$/) && method === 'PUT':
          const flagKey = endpoint.substring(1);
          return this.handleUpdateFlag(flagKey, body);

        // DELETE /api/feature-flags/{flagId} - Eliminar flag
        case endpoint.match(/^\/[^\/]+$/) && method === 'DELETE':
          const flagToDelete = endpoint.substring(1);
          return this.handleDeleteFlag(flagToDelete);

        // POST /api/feature-flags/batch-update - Actualización masiva
        case endpoint === '/batch-update' && method === 'POST':
          return this.handleBatchUpdate(body);

        // POST /api/feature-flags/rollback/{timestamp} - Rollback
        case endpoint.startsWith('/rollback/') && method === 'POST':
          const rollbackId = endpoint.split('/')[2];
          return this.handleRollback(rollbackId, body);

        // POST /api/feature-flags/validate-dependencies - Validar dependencias
        case endpoint === '/validate-dependencies' && method === 'POST':
          return this.handleValidateDependencies(body);

        // GET /api/feature-flags/dependency-tree - Árbol de dependencias
        case endpoint === '/dependency-tree' && method === 'GET':
          return this.handleGetDependencyTree();

        // A/B Testing endpoints
        case endpoint === '/ab-test/start' && method === 'POST':
          return this.handleStartABTest(body);

        case endpoint === '/ab-test/stop' && method === 'POST':
          return this.handleStopABTest(body);

        case endpoint.startsWith('/ab-test/results/') && method === 'GET':
          const testId = endpoint.split('/')[3];
          return this.handleGetABTestResults(testId);

        // Programación endpoints
        case endpoint === '/schedule' && method === 'POST':
          return this.handleScheduleFlag(body);

        case endpoint.startsWith('/schedule/') && method === 'DELETE':
          const scheduleId = endpoint.split('/')[2];
          return this.handleDeleteSchedule(scheduleId);

        // Logs y auditoría
        case endpoint === '/logs' && method === 'GET':
          const queryParams = new URLSearchParams(endpoint.split('?')[1] || '');
          return this.handleGetLogs(queryParams);

        case endpoint === '/rollback-history' && method === 'GET':
          return this.handleGetRollbackHistory();

        default:
          throw new Error(`Endpoint not found: ${method} ${endpoint}`);
      }

    } catch (error) {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ 
          error: error.message,
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  // Handlers para endpoints específicos

  handleGetAllFlags() {
    const flags = featureFlagsDB.getFeatureFlags();
    const abTests = featureFlagsDB.getABTests();
    const schedules = featureFlagsDB.getSchedules();

    return {
      ok: true,
      status: 200,
      json: async () => ({
        flags,
        active_ab_tests: Object.values(abTests).filter(test => test.status === 'active').length,
        pending_schedules: Object.values(schedules).filter(schedule => schedule.status === 'pending').length,
        total_flags: Object.keys(flags).filter(k => !k.startsWith('_')).length,
        metadata: flags._metadata || null
      })
    };
  }

  handleGetGroups() {
    const flags = featureFlagsDB.getFeatureFlags();
    const groups = {};

    for (const [groupName, groupConfig] of Object.entries(FEATURE_FLAGS_CONFIG)) {
      const groupFlags = {};
      let enabledCount = 0;

      for (const flagKey of Object.keys(groupConfig.features || {})) {
        const enabled = featureFlagsDB.getFeatureFlag(flagKey, false);
        groupFlags[flagKey] = enabled;
        if (enabled) enabledCount++;
      }

      groups[groupName] = {
        ...groupConfig,
        flags: groupFlags,
        enabled_count: enabledCount,
        total_count: Object.keys(groupConfig.features || {}).length,
        status: enabledCount === 0 ? 'disabled' : 
                enabledCount === Object.keys(groupConfig.features || {}).length ? 'enabled' : 'partial'
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ groups })
    };
  }

  handleGetGroup(groupName) {
    const groupConfig = FEATURE_FLAGS_CONFIG[groupName];
    if (!groupConfig) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ 
          error: `Group '${groupName}' not found`,
          code: 'GROUP_NOT_FOUND'
        })
      };
    }

    const flags = {};
    for (const flagKey of Object.keys(groupConfig.features || {})) {
      flags[flagKey] = {
        enabled: featureFlagsDB.getFeatureFlag(flagKey, false),
        dependencies: featureFlagsDB.getFlagDependencies(flagKey),
        dependent_flags: featureFlagsDB.getDependentFlags(flagKey),
        user_impact: featureFlagsDB.calculateUserImpact(flagKey)
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        group: {
          ...groupConfig,
          flags
        }
      })
    };
  }

  handleUpdateFlag(flagKey, body) {
    const { enabled, metadata = {} } = body;
    const result = featureFlagsDB.updateFeatureFlag(flagKey, enabled, metadata);

    if (result.success) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          flag_key: flagKey,
          old_value: result.old_value,
          new_value: result.new_value,
          timestamp: new Date().toISOString()
        })
      };
    } else {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: result.error,
          code: 'UPDATE_FAILED',
          flag_key: flagKey
        })
      };
    }
  }

  handleBatchUpdate(body) {
    const { updates, metadata = {} } = body;
    const result = featureFlagsDB.batchUpdateFlags(updates, metadata);

    if (result.success) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          changes_applied: result.changes,
          timestamp: new Date().toISOString()
        })
      };
    } else {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Batch update failed',
          errors: result.errors || [result.error],
          code: 'BATCH_UPDATE_FAILED'
        })
      };
    }
  }

  handleValidateDependencies(body) {
    const { flag_key, intended_value } = body;
    const dependencies = featureFlagsDB.getFlagDependencies(flag_key);
    const dependentFlags = featureFlagsDB.getDependentFlags(flag_key);
    
    const validation = {
      can_change: true,
      issues: [],
      warnings: []
    };

    if (!intended_value) {
      // Verificar si hay flags que dependen de este
      const activeDependents = dependentFlags.filter(dep => 
        featureFlagsDB.getFeatureFlag(dep, false)
      );
      
      if (activeDependents.length > 0) {
        validation.can_change = false;
        validation.issues.push({
          type: 'DEPENDENCY_VIOLATION',
          message: `Cannot disable ${flag_key}. Required by: ${activeDependents.join(', ')}`,
          affected_flags: activeDependents
        });
      }
    } else {
      // Verificar dependencias no cumplidas
      const unmetDependencies = dependencies.filter(dep => 
        !featureFlagsDB.getFeatureFlag(dep, false)
      );
      
      if (unmetDependencies.length > 0) {
        validation.can_change = false;
        validation.issues.push({
          type: 'MISSING_DEPENDENCIES',
          message: `Cannot enable ${flag_key}. Missing dependencies: ${unmetDependencies.join(', ')}`,
          missing_dependencies: unmetDependencies
        });
      }
    }

    // Calcular impacto de usuarios
    const userImpact = featureFlagsDB.calculateUserImpact(flag_key);
    if (userImpact === 'all_users') {
      validation.warnings.push({
        type: 'HIGH_IMPACT',
        message: 'This change will affect all users',
        severity: 'high'
      });
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        flag_key,
        intended_value,
        validation,
        dependencies,
        dependent_flags: dependentFlags,
        user_impact: userImpact
      })
    };
  }

  handleGetDependencyTree() {
    const tree = {};
    
    for (const [groupName, groupConfig] of Object.entries(FEATURE_FLAGS_CONFIG)) {
      tree[groupName] = {};
      
      for (const flagKey of Object.keys(groupConfig.features || {})) {
        tree[groupName][flagKey] = {
          dependencies: featureFlagsDB.getFlagDependencies(flagKey),
          dependent_flags: featureFlagsDB.getDependentFlags(flagKey),
          enabled: featureFlagsDB.getFeatureFlag(flagKey, false)
        };
      }
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ dependency_tree: tree })
    };
  }

  handleStartABTest(body) {
    const result = featureFlagsDB.createABTest(body);

    if (result.success) {
      return {
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          test_id: result.test_id,
          message: 'A/B test started successfully'
        })
      };
    } else {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: result.error,
          code: 'AB_TEST_CREATION_FAILED'
        })
      };
    }
  }

  handleStopABTest(body) {
    const { test_id, reason, winning_variant } = body;
    const abTests = featureFlagsDB.getABTests();
    
    if (!abTests[test_id]) {
      return {
        ok: false,
        status: 404,
        json: async () => ({
          error: 'A/B test not found',
          code: 'TEST_NOT_FOUND'
        })
      };
    }

    abTests[test_id].status = 'completed';
    abTests[test_id].end_date = new Date().toISOString();
    abTests[test_id].stop_reason = reason;
    abTests[test_id].results.winning_variant = winning_variant;

    localStorage.setItem(featureFlagsDB.STORAGE_KEYS.AB_TESTS, JSON.stringify(abTests));

    featureFlagsDB.logAction('STOP_AB_TEST', body.user_id || 'system', `Stopped A/B test: ${test_id}`, {
      test_id,
      reason,
      winning_variant
    });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        test_id,
        winning_variant,
        message: 'A/B test stopped successfully'
      })
    };
  }

  handleGetABTestResults(testId) {
    const abTests = featureFlagsDB.getABTests();
    const test = abTests[testId];

    if (!test) {
      return {
        ok: false,
        status: 404,
        json: async () => ({
          error: 'A/B test not found',
          code: 'TEST_NOT_FOUND'
        })
      };
    }

    // Simular resultados de A/B test
    const mockResults = {
      ...test.results,
      total_users: Math.floor(Math.random() * 1000) + 100,
      variant_performance: test.variants.reduce((acc, variant) => {
        acc[variant.name] = {
          users: Math.floor(Math.random() * 500) + 50,
          conversion_rate: Math.random() * 0.3 + 0.1,
          engagement_rate: Math.random() * 0.8 + 0.2
        };
        return acc;
      }, {}),
      statistical_significance: Math.random() > 0.5 ? 'significant' : 'not_significant',
      confidence_interval: 95,
      p_value: Math.random() * 0.1
    };

    return {
      ok: true,
      status: 200,
      json: async () => ({
        test_id: testId,
        test_config: test,
        results: mockResults,
        recommendations: this.generateABTestRecommendations(mockResults)
      })
    };
  }

  handleScheduleFlag(body) {
    const result = featureFlagsDB.scheduleFeatureChange(body);

    if (result.success) {
      return {
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          schedule_id: result.schedule_id,
          message: 'Feature change scheduled successfully'
        })
      };
    } else {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: result.error,
          code: 'SCHEDULE_FAILED'
        })
      };
    }
  }

  handleDeleteSchedule(scheduleId) {
    const schedules = featureFlagsDB.getSchedules();
    
    if (!schedules[scheduleId]) {
      return {
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Schedule not found',
          code: 'SCHEDULE_NOT_FOUND'
        })
      };
    }

    delete schedules[scheduleId];
    localStorage.setItem(featureFlagsDB.STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));

    featureFlagsDB.logAction('DELETE_SCHEDULE', 'user', `Deleted schedule: ${scheduleId}`, {
      schedule_id: scheduleId
    });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Schedule deleted successfully'
      })
    };
  }

  handleGetLogs(queryParams) {
    const logs = featureFlagsDB.getLogs();
    const limit = parseInt(queryParams.get('limit')) || 50;
    const offset = parseInt(queryParams.get('offset')) || 0;
    const action = queryParams.get('action');
    const userId = queryParams.get('user_id');
    const startDate = queryParams.get('start_date');
    const endDate = queryParams.get('end_date');

    let filteredLogs = [...logs];

    // Aplicar filtros
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.user_id === userId);
    }
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }

    // Ordenar por timestamp descendente
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        logs: paginatedLogs,
        total: filteredLogs.length,
        offset,
        limit,
        has_more: offset + limit < filteredLogs.length
      })
    };
  }

  handleGetRollbackHistory() {
    const rollbackHistory = featureFlagsDB.getRollbackHistory();
    const history = Object.values(rollbackHistory)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      ok: true,
      status: 200,
      json: async () => ({
        rollback_points: history,
        total: history.length
      })
    };
  }

  handleRollback(rollbackId, body) {
    const { reason, user_id } = body;
    const result = featureFlagsDB.executeRollback(rollbackId, user_id, reason);

    if (result.success) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          rollback_id: rollbackId,
          changes: result.changes,
          message: 'Rollback executed successfully'
        })
      };
    } else {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: result.error,
          code: 'ROLLBACK_FAILED'
        })
      };
    }
  }

  generateABTestRecommendations(results) {
    const recommendations = [];
    
    const variants = Object.entries(results.variant_performance);
    if (variants.length >= 2) {
      const bestVariant = variants.reduce((best, current) => 
        current[1].conversion_rate > best[1].conversion_rate ? current : best
      );

      recommendations.push({
        type: 'PERFORMANCE',
        message: `Variant '${bestVariant[0]}' shows highest conversion rate (${(bestVariant[1].conversion_rate * 100).toFixed(2)}%)`,
        confidence: results.statistical_significance === 'significant' ? 'high' : 'medium'
      });

      if (results.statistical_significance === 'significant') {
        recommendations.push({
          type: 'ACTION',
          message: `Consider implementing '${bestVariant[0]}' variant permanently`,
          confidence: 'high'
        });
      } else {
        recommendations.push({
          type: 'CONTINUE',
          message: 'Continue test for more statistically significant results',
          confidence: 'medium'
        });
      }
    }

    return recommendations;
  }

  // Métodos públicos para uso en componentes

  async getAllFlags() {
    const response = await this.makeRequest('');
    return response.json();
  }

  async getGroups() {
    const response = await this.makeRequest('/groups');
    return response.json();
  }

  async getGroup(groupName) {
    const response = await this.makeRequest(`/group/${groupName}`);
    return response.json();
  }

  async updateFlag(flagKey, enabled, metadata = {}) {
    const response = await this.makeRequest(`/${flagKey}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled, metadata })
    });
    return response.json();
  }

  async batchUpdateFlags(updates, metadata = {}) {
    const response = await this.makeRequest('/batch-update', {
      method: 'POST',
      body: JSON.stringify({ updates, metadata })
    });
    return response.json();
  }

  async validateDependencies(flagKey, intendedValue) {
    const response = await this.makeRequest('/validate-dependencies', {
      method: 'POST',
      body: JSON.stringify({ flag_key: flagKey, intended_value: intendedValue })
    });
    return response.json();
  }

  async getDependencyTree() {
    const response = await this.makeRequest('/dependency-tree');
    return response.json();
  }

  async startABTest(config) {
    const response = await this.makeRequest('/ab-test/start', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return response.json();
  }

  async stopABTest(testId, reason, winningVariant, userId) {
    const response = await this.makeRequest('/ab-test/stop', {
      method: 'POST',
      body: JSON.stringify({ 
        test_id: testId, 
        reason, 
        winning_variant: winningVariant,
        user_id: userId 
      })
    });
    return response.json();
  }

  async getABTestResults(testId) {
    const response = await this.makeRequest(`/ab-test/results/${testId}`);
    return response.json();
  }

  async scheduleFlag(config) {
    const response = await this.makeRequest('/schedule', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return response.json();
  }

  async deleteSchedule(scheduleId) {
    const response = await this.makeRequest(`/schedule/${scheduleId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  async getLogs(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await this.makeRequest(`/logs?${queryParams}`);
    return response.json();
  }

  async getRollbackHistory() {
    const response = await this.makeRequest('/rollback-history');
    return response.json();
  }

  async executeRollback(rollbackId, reason, userId) {
    const response = await this.makeRequest(`/rollback/${rollbackId}`, {
      method: 'POST',
      body: JSON.stringify({ reason, user_id: userId })
    });
    return response.json();
  }
}

// Instancia singleton
export const featureFlagsAPI = new FeatureFlagsAPI();

// Auto-configurar token si existe
const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
if (token) {
  featureFlagsAPI.setAuthToken(token);
}