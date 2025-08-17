/**
 * Sistema de A/B Testing Integrado - PLAYTEST
 * Gestión completa de experimentos y análisis estadístico
 */

import { featureFlagsDB } from './feature-flags-database.js';
import { featureFlagsAPI } from './feature-flags-api.js';

export class ABTestingEngine {
  constructor() {
    this.runningTests = new Map();
    this.userAssignments = new Map();
    this.metricsCollector = new MetricsCollector();
    this.statisticalAnalyzer = new StatisticalAnalyzer();
    
    this.initializeEngine();
  }

  async initializeEngine() {
    try {
      // Cargar tests activos
      await this.loadActiveTests();
      
      // Configurar recolección de métricas
      this.setupMetricsCollection();
      
      // Programar análisis periódico
      this.schedulePeriodicAnalysis();
      
      console.log('🧪 A/B Testing Engine initialized successfully');
    } catch (error) {
      console.error('Error initializing A/B Testing Engine:', error);
    }
  }

  async loadActiveTests() {
    const tests = featureFlagsDB.getABTests();
    const activeTests = Object.values(tests).filter(test => test.status === 'active');
    
    for (const test of activeTests) {
      this.runningTests.set(test.id, test);
      
      // Verificar si el test ha expirado
      if (test.end_date && new Date(test.end_date) < new Date()) {
        await this.stopTest(test.id, 'expired', 'system');
      }
    }
    
    console.log(`Loaded ${activeTests.length} active A/B tests`);
  }

  // Crear nuevo test A/B
  async createTest(config) {
    try {
      // Validar configuración
      const validation = this.validateTestConfig(config);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Crear configuración completa del test
      const testConfig = {
        name: config.name,
        description: config.description || '',
        flagKey: config.flagKey,
        hypothesis: config.hypothesis || '',
        success_metrics: config.successMetrics || ['conversion_rate', 'engagement_rate'],
        start_date: config.startDate || new Date().toISOString(),
        end_date: config.endDate,
        target_sample_size: config.targetSampleSize || 1000,
        minimum_detectable_effect: config.minimumDetectableEffect || 0.05,
        statistical_power: config.statisticalPower || 0.8,
        significance_level: config.significanceLevel || 0.05,
        user_segment: config.userSegment || 'all_users',
        variants: this.createVariants(config),
        userId: config.userId
      };

      // Crear test en la base de datos
      const result = featureFlagsDB.createABTest(testConfig);
      
      if (result.success) {
        // Agregar a tests en ejecución
        const test = featureFlagsDB.getABTests()[result.test_id];
        this.runningTests.set(result.test_id, test);
        
        // Inicializar métricas
        this.metricsCollector.initializeTestMetrics(result.test_id, test);
        
        // Log del evento
        featureFlagsDB.logAction('AB_TEST_CREATED', config.userId, `Created A/B test: ${config.name}`, {
          test_id: result.test_id,
          flag_key: config.flagKey,
          variants_count: testConfig.variants.length,
          expected_duration: this.calculateExpectedDuration(testConfig)
        });

        return { 
          success: true, 
          test_id: result.test_id,
          estimated_completion: this.estimateCompletionDate(testConfig)
        };
      }

      return result;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      return { success: false, error: error.message };
    }
  }

  // Validar configuración de test
  validateTestConfig(config) {
    const errors = [];
    
    if (!config.name || config.name.length < 3) {
      errors.push('El nombre del test debe tener al menos 3 caracteres');
    }
    
    if (!config.flagKey) {
      errors.push('Debe especificar un feature flag');
    }
    
    if (config.variants && config.variants.length < 2) {
      errors.push('Se requieren al menos 2 variantes');
    }
    
    if (config.endDate && new Date(config.endDate) <= new Date()) {
      errors.push('La fecha de fin debe ser futura');
    }
    
    // Verificar que no haya tests activos para el mismo flag
    const existingTests = Array.from(this.runningTests.values());
    const conflictingTest = existingTests.find(test => 
      test.flag_key === config.flagKey && test.status === 'active'
    );
    
    if (conflictingTest) {
      errors.push(`Ya existe un test activo para el flag ${config.flagKey}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Crear variantes por defecto
  createVariants(config) {
    if (config.variants && config.variants.length > 0) {
      return config.variants;
    }

    // Variantes por defecto: control (50%) y treatment (50%)
    return [
      {
        name: 'control',
        description: 'Versión actual (sin cambios)',
        percentage: 50,
        flag_override: false
      },
      {
        name: 'treatment', 
        description: 'Nueva versión (con feature activado)',
        percentage: 50,
        flag_override: true
      }
    ];
  }

  // Asignar usuario a variante
  assignUserToVariant(testId, userId) {
    const test = this.runningTests.get(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    // Verificar asignación existente
    const assignmentKey = `${testId}_${userId}`;
    if (this.userAssignments.has(assignmentKey)) {
      return this.userAssignments.get(assignmentKey);
    }

    // Verificar segmento de usuario
    if (!this.isUserInSegment(userId, test.user_segment)) {
      return null;
    }

    // Asignar variante usando hash consistente
    const variant = featureFlagsDB.getUserVariant(testId, userId);
    
    if (variant) {
      const assignment = {
        test_id: testId,
        user_id: userId,
        variant: variant,
        assigned_at: new Date().toISOString()
      };
      
      this.userAssignments.set(assignmentKey, assignment);
      
      // Actualizar métricas del test
      this.metricsCollector.recordUserAssignment(testId, variant, userId);
      
      return assignment;
    }

    return null;
  }

  // Verificar si usuario está en segmento objetivo
  isUserInSegment(userId, segment) {
    switch (segment) {
      case 'all_users':
        return true;
      case 'new_users':
        // Lógica para usuarios nuevos (registrados hace menos de 30 días)
        return this.isNewUser(userId);
      case 'active_users':
        // Lógica para usuarios activos (han usado la plataforma en últimos 7 días)
        return this.isActiveUser(userId);
      case 'premium_users':
        // Lógica para usuarios premium
        return this.isPremiumUser(userId);
      default:
        return true;
    }
  }

  // Obtener valor efectivo de feature flag para usuario
  getEffectiveFeatureValue(flagKey, userId, fallback = false) {
    // Buscar test activo para este flag
    const activeTest = Array.from(this.runningTests.values()).find(test => 
      test.flag_key === flagKey && test.status === 'active'
    );

    if (activeTest && userId) {
      const assignment = this.assignUserToVariant(activeTest.id, userId);
      if (assignment) {
        const variant = activeTest.variants.find(v => v.name === assignment.variant);
        if (variant && variant.hasOwnProperty('flag_override')) {
          // Registrar exposición al experimento
          this.metricsCollector.recordExposure(activeTest.id, assignment.variant, userId);
          return variant.flag_override;
        }
      }
    }

    // Si no hay test activo, usar valor normal del flag
    return featureFlagsDB.getFeatureFlag(flagKey, fallback);
  }

  // Registrar evento de conversión
  recordConversion(testId, userId, eventType = 'primary_goal', metadata = {}) {
    const test = this.runningTests.get(testId);
    if (!test) return;

    const assignmentKey = `${testId}_${userId}`;
    const assignment = this.userAssignments.get(assignmentKey);
    
    if (assignment) {
      this.metricsCollector.recordConversion(testId, assignment.variant, userId, eventType, metadata);
      
      // Trigger análisis en tiempo real si se alcanza muestra significativa
      this.checkForSignificantResults(testId);
    }
  }

  // Detener test
  async stopTest(testId, reason = 'manual', userId = 'system', winningVariant = null) {
    try {
      const test = this.runningTests.get(testId);
      if (!test) {
        return { success: false, error: 'Test not found' };
      }

      // Realizar análisis final
      const finalResults = await this.performFinalAnalysis(testId);
      
      // Actualizar estado del test
      const abTests = featureFlagsDB.getABTests();
      abTests[testId].status = 'completed';
      abTests[testId].end_date = new Date().toISOString();
      abTests[testId].stop_reason = reason;
      abTests[testId].results = finalResults;
      abTests[testId].winning_variant = winningVariant || finalResults.recommended_variant;
      
      localStorage.setItem(featureFlagsDB.STORAGE_KEYS.AB_TESTS, JSON.stringify(abTests));

      // Remover de tests activos
      this.runningTests.delete(testId);

      // Aplicar resultado ganador si es automático
      if (winningVariant && reason === 'auto_winner') {
        await this.applyWinningVariant(testId, winningVariant);
      }

      // Log del evento
      featureFlagsDB.logAction('AB_TEST_STOPPED', userId, `Stopped A/B test: ${test.name}`, {
        test_id: testId,
        reason,
        winning_variant: winningVariant,
        total_participants: finalResults.total_participants,
        statistical_significance: finalResults.statistical_significance
      });

      return { 
        success: true, 
        results: finalResults,
        winning_variant: winningVariant || finalResults.recommended_variant
      };

    } catch (error) {
      console.error('Error stopping A/B test:', error);
      return { success: false, error: error.message };
    }
  }

  // Análisis final del test
  async performFinalAnalysis(testId) {
    const test = this.runningTests.get(testId);
    const metrics = this.metricsCollector.getTestMetrics(testId);
    
    const analysis = {
      test_id: testId,
      test_name: test.name,
      duration_days: this.calculateTestDuration(test),
      total_participants: metrics.total_participants,
      variants_performance: {},
      statistical_significance: null,
      confidence_level: test.significance_level || 0.05,
      recommended_variant: null,
      recommendations: []
    };

    // Analizar cada variante
    for (const variant of test.variants) {
      const variantMetrics = metrics.variants[variant.name] || {};
      
      analysis.variants_performance[variant.name] = {
        participants: variantMetrics.participants || 0,
        conversions: variantMetrics.conversions || 0,
        conversion_rate: variantMetrics.conversion_rate || 0,
        confidence_interval: this.statisticalAnalyzer.calculateConfidenceInterval(
          variantMetrics.conversions || 0,
          variantMetrics.participants || 0,
          analysis.confidence_level
        )
      };
    }

    // Análisis estadístico
    const variants = Object.keys(analysis.variants_performance);
    if (variants.length >= 2) {
      const controlVariant = variants[0];
      const treatmentVariant = variants[1];
      
      const statisticalTest = this.statisticalAnalyzer.performTTest(
        analysis.variants_performance[controlVariant],
        analysis.variants_performance[treatmentVariant]
      );

      analysis.statistical_significance = statisticalTest.is_significant;
      analysis.p_value = statisticalTest.p_value;
      analysis.effect_size = statisticalTest.effect_size;
      
      // Determinar variante ganadora
      if (statisticalTest.is_significant) {
        analysis.recommended_variant = statisticalTest.winner;
        analysis.recommendations.push({
          type: 'IMPLEMENT',
          message: `Implementar variante '${statisticalTest.winner}' permanentemente`,
          confidence: 'high',
          expected_improvement: `+${(statisticalTest.effect_size * 100).toFixed(2)}%`
        });
      } else {
        analysis.recommendations.push({
          type: 'CONTINUE',
          message: 'Continuar test para obtener resultados significativos',
          confidence: 'medium',
          required_sample_size: this.calculateRequiredSampleSize(test)
        });
      }
    }

    return analysis;
  }

  // Aplicar variante ganadora
  async applyWinningVariant(testId, winningVariant) {
    try {
      const test = this.runningTests.get(testId) || featureFlagsDB.getABTests()[testId];
      const variant = test.variants.find(v => v.name === winningVariant);
      
      if (variant && variant.hasOwnProperty('flag_override')) {
        const result = await featureFlagsAPI.updateFlag(
          test.flag_key, 
          variant.flag_override, 
          {
            user_id: 'ab_test_system',
            source: 'ab_test_winner',
            test_id: testId,
            winning_variant: winningVariant
          }
        );

        if (result.success) {
          featureFlagsDB.logAction(
            'AB_TEST_WINNER_APPLIED', 
            'system', 
            `Applied winning variant ${winningVariant} for flag ${test.flag_key}`, 
            {
              test_id: testId,
              flag_key: test.flag_key,
              winning_variant: winningVariant,
              new_value: variant.flag_override
            }
          );
        }

        return result;
      }

    } catch (error) {
      console.error('Error applying winning variant:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar resultados significativos en tiempo real
  async checkForSignificantResults(testId) {
    const test = this.runningTests.get(testId);
    if (!test || test.auto_stop !== true) return;

    const metrics = this.metricsCollector.getTestMetrics(testId);
    
    // Verificar muestra mínima
    if (metrics.total_participants < (test.target_sample_size || 1000) * 0.8) {
      return; // No hay suficiente muestra aún
    }

    // Realizar análisis intermedio
    const analysis = await this.performFinalAnalysis(testId);
    
    if (analysis.statistical_significance && analysis.p_value < 0.01) {
      // Resultados muy significativos, detener automáticamente
      await this.stopTest(testId, 'auto_significance', 'system', analysis.recommended_variant);
      
      // Notificar a administradores
      this.notifyTestCompletion(testId, analysis);
    }
  }

  // Configurar recolección de métricas
  setupMetricsCollection() {
    // Escuchar eventos de feature flag usage
    window.addEventListener('featureFlagUsed', (event) => {
      const { flagKey, userId, action } = event.detail;
      this.trackFeatureUsage(flagKey, userId, action);
    });

    // Escuchar eventos de conversión
    window.addEventListener('conversionEvent', (event) => {
      const { userId, eventType, metadata } = event.detail;
      this.trackConversionEvents(userId, eventType, metadata);
    });
  }

  // Programar análisis periódico
  schedulePeriodicAnalysis() {
    // Análisis cada hora para tests activos
    setInterval(() => {
      this.performPeriodicAnalysis();
    }, 60 * 60 * 1000); // 1 hora

    // Verificación de expiración cada 10 minutos
    setInterval(() => {
      this.checkExpiredTests();
    }, 10 * 60 * 1000); // 10 minutos
  }

  async performPeriodicAnalysis() {
    for (const [testId, test] of this.runningTests) {
      try {
        const metrics = this.metricsCollector.getTestMetrics(testId);
        
        // Actualizar resultados del test
        const abTests = featureFlagsDB.getABTests();
        if (abTests[testId]) {
          abTests[testId].results = {
            ...abTests[testId].results,
            total_participants: metrics.total_participants,
            last_updated: new Date().toISOString(),
            variants_performance: metrics.variants
          };
          
          localStorage.setItem(featureFlagsDB.STORAGE_KEYS.AB_TESTS, JSON.stringify(abTests));
        }

        // Verificar si debe detenerse automáticamente
        await this.checkForSignificantResults(testId);

      } catch (error) {
        console.error(`Error in periodic analysis for test ${testId}:`, error);
      }
    }
  }

  async checkExpiredTests() {
    const now = new Date();
    
    for (const [testId, test] of this.runningTests) {
      if (test.end_date && new Date(test.end_date) <= now) {
        await this.stopTest(testId, 'expired', 'system');
      }
    }
  }

  // Notificar finalización de test
  notifyTestCompletion(testId, analysis) {
    const event = new CustomEvent('abTestCompleted', {
      detail: { testId, analysis }
    });
    window.dispatchEvent(event);
  }

  // Métodos de utilidad
  calculateTestDuration(test) {
    const start = new Date(test.start_date);
    const end = test.end_date ? new Date(test.end_date) : new Date();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  calculateExpectedDuration(testConfig) {
    // Cálculo basado en muestra objetivo y tasa de conversión esperada
    const baselineConversion = 0.05; // 5% asumido
    const dailyTraffic = 100; // usuarios por día asumido
    const targetSample = testConfig.target_sample_size || 1000;
    
    return Math.ceil(targetSample / dailyTraffic);
  }

  estimateCompletionDate(testConfig) {
    const expectedDays = this.calculateExpectedDuration(testConfig);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + expectedDays);
    return completionDate.toISOString();
  }

  calculateRequiredSampleSize(test) {
    const alpha = test.significance_level || 0.05;
    const power = test.statistical_power || 0.8;
    const effect = test.minimum_detectable_effect || 0.05;
    
    // Fórmula simplificada para cálculo de muestra
    const zAlpha = 1.96; // para α = 0.05
    const zBeta = 0.84;  // para poder = 0.8
    const p = 0.05; // conversión base asumida
    
    const n = (2 * Math.pow(zAlpha + zBeta, 2) * p * (1 - p)) / Math.pow(effect, 2);
    return Math.ceil(n);
  }

  // Métodos auxiliares para segmentación
  isNewUser(userId) {
    // Implementar lógica de usuario nuevo
    const userRegistration = localStorage.getItem(`user_registration_${userId}`);
    if (!userRegistration) return false;
    
    const registrationDate = new Date(userRegistration);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return registrationDate > thirtyDaysAgo;
  }

  isActiveUser(userId) {
    // Implementar lógica de usuario activo
    const lastActivity = localStorage.getItem(`user_activity_${userId}`);
    if (!lastActivity) return false;
    
    const activityDate = new Date(lastActivity);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return activityDate > sevenDaysAgo;
  }

  isPremiumUser(userId) {
    // Implementar lógica de usuario premium
    const userPlan = localStorage.getItem(`user_plan_${userId}`);
    return userPlan === 'premium' || userPlan === 'pro';
  }

  trackFeatureUsage(flagKey, userId, action) {
    // Buscar tests activos para este flag
    const activeTests = Array.from(this.runningTests.values()).filter(test => 
      test.flag_key === flagKey && test.status === 'active'
    );

    for (const test of activeTests) {
      const assignment = this.assignUserToVariant(test.id, userId);
      if (assignment) {
        this.metricsCollector.recordFeatureUsage(test.id, assignment.variant, userId, action);
      }
    }
  }

  trackConversionEvents(userId, eventType, metadata) {
    // Registrar conversiones para todos los tests activos donde el usuario participa
    for (const [testId] of this.runningTests) {
      const assignmentKey = `${testId}_${userId}`;
      if (this.userAssignments.has(assignmentKey)) {
        this.recordConversion(testId, userId, eventType, metadata);
      }
    }
  }

  // API pública
  getActiveTests() {
    return Array.from(this.runningTests.values());
  }

  getTestResults(testId) {
    const test = this.runningTests.get(testId) || featureFlagsDB.getABTests()[testId];
    const metrics = this.metricsCollector.getTestMetrics(testId);
    
    return {
      test_config: test,
      current_metrics: metrics,
      is_active: this.runningTests.has(testId)
    };
  }

  getUserTestAssignments(userId) {
    const assignments = [];
    for (const [key, assignment] of this.userAssignments) {
      if (assignment.user_id === userId) {
        assignments.push(assignment);
      }
    }
    return assignments;
  }
}

// Clase para recolección de métricas
class MetricsCollector {
  constructor() {
    this.testMetrics = new Map();
  }

  initializeTestMetrics(testId, test) {
    const metrics = {
      test_id: testId,
      total_participants: 0,
      total_exposures: 0,
      total_conversions: 0,
      variants: {}
    };

    // Inicializar métricas por variante
    for (const variant of test.variants) {
      metrics.variants[variant.name] = {
        participants: 0,
        exposures: 0,
        conversions: 0,
        conversion_rate: 0,
        events: []
      };
    }

    this.testMetrics.set(testId, metrics);
  }

  recordUserAssignment(testId, variant, userId) {
    const metrics = this.testMetrics.get(testId);
    if (!metrics) return;

    metrics.total_participants++;
    metrics.variants[variant].participants++;
    
    this.updateMetrics(testId, metrics);
  }

  recordExposure(testId, variant, userId) {
    const metrics = this.testMetrics.get(testId);
    if (!metrics) return;

    metrics.total_exposures++;
    metrics.variants[variant].exposures++;
    
    this.updateMetrics(testId, metrics);
  }

  recordConversion(testId, variant, userId, eventType, metadata) {
    const metrics = this.testMetrics.get(testId);
    if (!metrics) return;

    metrics.total_conversions++;
    metrics.variants[variant].conversions++;
    metrics.variants[variant].conversion_rate = 
      metrics.variants[variant].conversions / metrics.variants[variant].participants;

    metrics.variants[variant].events.push({
      user_id: userId,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      metadata
    });
    
    this.updateMetrics(testId, metrics);
  }

  recordFeatureUsage(testId, variant, userId, action) {
    const metrics = this.testMetrics.get(testId);
    if (!metrics) return;

    // Registrar uso como exposición si no se ha registrado antes
    this.recordExposure(testId, variant, userId);
  }

  getTestMetrics(testId) {
    return this.testMetrics.get(testId) || null;
  }

  updateMetrics(testId, metrics) {
    this.testMetrics.set(testId, metrics);
    
    // Persistir métricas importantes en localStorage
    const persistentMetrics = {
      total_participants: metrics.total_participants,
      total_conversions: metrics.total_conversions,
      variants: Object.fromEntries(
        Object.entries(metrics.variants).map(([name, data]) => [
          name, 
          {
            participants: data.participants,
            conversions: data.conversions,
            conversion_rate: data.conversion_rate
          }
        ])
      )
    };

    localStorage.setItem(`ab_test_metrics_${testId}`, JSON.stringify(persistentMetrics));
  }
}

// Clase para análisis estadístico
class StatisticalAnalyzer {
  // Calcular intervalo de confianza para proporción
  calculateConfidenceInterval(successes, total, alpha = 0.05) {
    if (total === 0) return { lower: 0, upper: 0 };
    
    const p = successes / total;
    const z = 1.96; // Para 95% de confianza
    const margin = z * Math.sqrt((p * (1 - p)) / total);
    
    return {
      lower: Math.max(0, p - margin),
      upper: Math.min(1, p + margin),
      point_estimate: p
    };
  }

  // Realizar test t para comparar dos variantes
  performTTest(control, treatment) {
    const p1 = control.conversion_rate || 0;
    const n1 = control.participants || 0;
    const p2 = treatment.conversion_rate || 0;
    const n2 = treatment.participants || 0;

    if (n1 === 0 || n2 === 0) {
      return {
        is_significant: false,
        p_value: 1,
        effect_size: 0,
        winner: null
      };
    }

    // Cálculo del test Z para proporciones
    const pooledP = (control.conversions + treatment.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    const zScore = Math.abs(p2 - p1) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    const isSignificant = pValue < 0.05;
    const effectSize = p2 - p1;
    const winner = p2 > p1 ? 'treatment' : 'control';

    return {
      is_significant: isSignificant,
      p_value: pValue,
      z_score: zScore,
      effect_size: effectSize,
      winner: isSignificant ? winner : null
    };
  }

  // Aproximación de CDF normal estándar
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  // Función de error (aproximación)
  erf(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

// Instancia singleton
export const abTestingEngine = new ABTestingEngine();