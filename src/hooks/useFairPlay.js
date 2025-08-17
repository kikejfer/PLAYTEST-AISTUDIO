import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { SystemIntegrations } from '../integrations/SystemIntegrations';

/**
 * Tipos de infracciones de fair play
 */
export const VIOLATION_TYPES = {
  CHEATING: 'cheating',           // Hacer trampas
  TOXICITY: 'toxicity',           // Comportamiento tóxico
  HARASSMENT: 'harassment',       // Acoso
  GRIEFING: 'griefing',          // Sabotaje intencional
  COLLUSION: 'collusion',         // Colusión/abuso
  AFK: 'afk',                    // Abandono frecuente
  UNSPORTSMANLIKE: 'unsportsmanlike' // Conducta antideportiva
};

/**
 * Severidades de infracciones
 */
export const VIOLATION_SEVERITIES = {
  LOW: 'low',       // Advertencia
  MEDIUM: 'medium', // Suspensión temporal
  HIGH: 'high',     // Suspensión larga
  CRITICAL: 'critical' // Ban permanente
};

/**
 * Estados de reportes
 */
export const REPORT_STATUS = {
  PENDING: 'pending',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

/**
 * Tipos de moderación automática
 */
export const AUTO_MODERATION_TYPES = {
  SCORE_PATTERN: 'score_pattern',     // Patrones de puntuación sospechosos
  TIME_PATTERN: 'time_pattern',       // Patrones de tiempo anómalos
  BEHAVIOR_PATTERN: 'behavior_pattern', // Patrones de comportamiento
  STATISTICAL: 'statistical'         // Análisis estadístico
};

/**
 * Contexto para el sistema de fair play
 */
const FairPlayContext = createContext();

/**
 * Proveedor del contexto de fair play
 */
export const FairPlayProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [reports, setReports] = useState([]);
  const [violations, setViolations] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [fairPlayScore, setFairPlayScore] = useState(100);
  const [autoModerationActive, setAutoModerationActive] = useState(true);
  const [loading, setLoading] = useState(false);

  /**
   * Reportar una infracción de fair play
   */
  const reportViolation = useCallback(async (reportData) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch('/api/fair-play/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...reportData,
          reporterId: user.id,
          timestamp: new Date().toISOString(),
          status: REPORT_STATUS.PENDING
        })
      });

      if (response.ok) {
        const report = await response.json();
        setReports(prev => [report, ...prev]);
        
        // Trigger automática de revisión
        if (autoModerationActive) {
          triggerAutoModerationCheck(reportData.accusedUserId);
        }
        
        return { success: true, report };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error reportando infracción');
      }
    } catch (error) {
      console.error('Error reportando infracción:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, autoModerationActive]);

  /**
   * Analizar patrones sospechosos en tiempo real
   */
  const analyzeGameBehavior = useCallback(async (gameData, tournamentId = null) => {
    if (!autoModerationActive) return { suspicious: false };

    try {
      const analysisResult = {
        scorePatterns: analyzeScorePatterns(gameData),
        timePatterns: analyzeTimePatterns(gameData),
        behaviorPatterns: analyzeBehaviorPatterns(gameData),
        statisticalAnomalies: analyzeStatisticalAnomalies(gameData)
      };

      const suspiciousActivities = [];
      
      // Verificar patrones de puntuación
      if (analysisResult.scorePatterns.suspicious) {
        suspiciousActivities.push({
          type: AUTO_MODERATION_TYPES.SCORE_PATTERN,
          severity: analysisResult.scorePatterns.severity,
          evidence: analysisResult.scorePatterns.evidence,
          confidence: analysisResult.scorePatterns.confidence
        });
      }

      // Verificar patrones de tiempo
      if (analysisResult.timePatterns.suspicious) {
        suspiciousActivities.push({
          type: AUTO_MODERATION_TYPES.TIME_PATTERN,
          severity: analysisResult.timePatterns.severity,
          evidence: analysisResult.timePatterns.evidence,
          confidence: analysisResult.timePatterns.confidence
        });
      }

      // Verificar patrones de comportamiento
      if (analysisResult.behaviorPatterns.suspicious) {
        suspiciousActivities.push({
          type: AUTO_MODERATION_TYPES.BEHAVIOR_PATTERN,
          severity: analysisResult.behaviorPatterns.severity,
          evidence: analysisResult.behaviorPatterns.evidence,
          confidence: analysisResult.behaviorPatterns.confidence
        });
      }

      // Verificar anomalías estadísticas
      if (analysisResult.statisticalAnomalies.suspicious) {
        suspiciousActivities.push({
          type: AUTO_MODERATION_TYPES.STATISTICAL,
          severity: analysisResult.statisticalAnomalies.severity,
          evidence: analysisResult.statisticalAnomalies.evidence,
          confidence: analysisResult.statisticalAnomalies.confidence
        });
      }

      // Si hay actividades sospechosas, crear reporte automático
      if (suspiciousActivities.length > 0) {
        const autoReport = {
          type: 'automatic',
          accusedUserId: gameData.userId,
          tournamentId,
          gameId: gameData.gameId,
          suspiciousActivities,
          autoGenerated: true,
          needsReview: suspiciousActivities.some(a => a.confidence > 0.8)
        };

        await submitAutoReport(autoReport);
      }

      return {
        suspicious: suspiciousActivities.length > 0,
        activities: suspiciousActivities,
        totalConfidence: suspiciousActivities.reduce((sum, a) => sum + a.confidence, 0) / suspiciousActivities.length
      };

    } catch (error) {
      console.error('Error analizando comportamiento:', error);
      return { suspicious: false, error: error.message };
    }
  }, [autoModerationActive]);

  /**
   * Analizar patrones de puntuación sospechosos
   */
  const analyzeScorePatterns = useCallback((gameData) => {
    const { scores = [], averageScore = 0, previousGames = [] } = gameData;
    
    // Calcular métricas
    const currentSessionAvg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const historicalAvg = previousGames.length > 0 
      ? previousGames.reduce((sum, game) => sum + game.score, 0) / previousGames.length
      : currentSessionAvg;
    
    const improvementFactor = historicalAvg > 0 ? currentSessionAvg / historicalAvg : 1;
    const perfectScoreRate = scores.filter(score => score === 100).length / scores.length;
    const scoreVariance = calculateVariance(scores);

    let suspicious = false;
    let severity = VIOLATION_SEVERITIES.LOW;
    let confidence = 0;
    const evidence = [];

    // Mejora súbita anormal (más del 300% sobre promedio histórico)
    if (improvementFactor > 3 && previousGames.length >= 10) {
      suspicious = true;
      confidence += 0.4;
      severity = VIOLATION_SEVERITIES.MEDIUM;
      evidence.push(`Mejora súbita del ${Math.round((improvementFactor - 1) * 100)}% sobre promedio histórico`);
    }

    // Tasa anormalmente alta de puntuaciones perfectas
    if (perfectScoreRate > 0.8 && scores.length >= 5) {
      suspicious = true;
      confidence += 0.3;
      evidence.push(`${Math.round(perfectScoreRate * 100)}% de puntuaciones perfectas`);
    }

    // Varianza extremadamente baja (indicativo de patrones artificiales)
    if (scoreVariance < 10 && scores.length >= 10 && currentSessionAvg > 80) {
      suspicious = true;
      confidence += 0.3;
      evidence.push(`Varianza anormalmente baja: ${scoreVariance.toFixed(2)}`);
    }

    // Patrones repetitivos exactos
    const consecutiveIdentical = findConsecutiveIdenticalScores(scores);
    if (consecutiveIdentical >= 5) {
      suspicious = true;
      confidence += 0.4;
      severity = VIOLATION_SEVERITIES.HIGH;
      evidence.push(`${consecutiveIdentical} puntuaciones idénticas consecutivas`);
    }

    return {
      suspicious,
      severity: confidence > 0.7 ? VIOLATION_SEVERITIES.HIGH : severity,
      confidence: Math.min(confidence, 1),
      evidence
    };
  }, []);

  /**
   * Analizar patrones de tiempo sospechosos
   */
  const analyzeTimePatterns = useCallback((gameData) => {
    const { responseTimes = [], gameDuration = 0, interactions = [] } = gameData;
    
    let suspicious = false;
    let severity = VIOLATION_SEVERITIES.LOW;
    let confidence = 0;
    const evidence = [];

    if (responseTimes.length === 0) return { suspicious, severity, confidence, evidence };

    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const timeVariance = calculateVariance(responseTimes);
    const superFastResponses = responseTimes.filter(time => time < 100).length; // < 100ms
    
    // Tiempos de respuesta inhumanamente rápidos
    if (avgResponseTime < 200 && responseTimes.length >= 10) {
      suspicious = true;
      confidence += 0.5;
      severity = VIOLATION_SEVERITIES.HIGH;
      evidence.push(`Tiempo promedio de respuesta inhumano: ${avgResponseTime.toFixed(0)}ms`);
    }

    // Demasiadas respuestas súper rápidas
    if (superFastResponses / responseTimes.length > 0.5 && responseTimes.length >= 10) {
      suspicious = true;
      confidence += 0.4;
      evidence.push(`${Math.round((superFastResponses / responseTimes.length) * 100)}% de respuestas < 100ms`);
    }

    // Varianza extremadamente baja en tiempos (bot-like)
    if (timeVariance < 1000 && avgResponseTime < 500 && responseTimes.length >= 15) {
      suspicious = true;
      confidence += 0.3;
      evidence.push(`Varianza de tiempo anormalmente baja: ${timeVariance.toFixed(0)}ms²`);
    }

    // Patrones regulares perfectos (cada X milisegundos exactos)
    const periodicPattern = detectPeriodicPattern(responseTimes);
    if (periodicPattern.isRegular && periodicPattern.confidence > 0.8) {
      suspicious = true;
      confidence += 0.6;
      severity = VIOLATION_SEVERITIES.HIGH;
      evidence.push(`Patrón temporal regular detectado: ${periodicPattern.period}ms`);
    }

    return {
      suspicious,
      severity: confidence > 0.7 ? VIOLATION_SEVERITIES.HIGH : severity,
      confidence: Math.min(confidence, 1),
      evidence
    };
  }, []);

  /**
   * Analizar patrones de comportamiento sospechosos
   */
  const analyzeBehaviorPatterns = useCallback((gameData) => {
    const { 
      mouseMovements = [], 
      keystrokes = [], 
      windowFocusEvents = [],
      gameInteractions = []
    } = gameData;
    
    let suspicious = false;
    let severity = VIOLATION_SEVERITIES.LOW;
    let confidence = 0;
    const evidence = [];

    // Analizar movimientos de mouse
    if (mouseMovements.length > 0) {
      const mouseAnalysis = analyzeMouseMovements(mouseMovements);
      if (mouseAnalysis.suspicious) {
        suspicious = true;
        confidence += mouseAnalysis.confidence;
        evidence.push(...mouseAnalysis.evidence);
      }
    }

    // Analizar pérdida de foco de ventana durante el juego
    const focusLossEvents = windowFocusEvents.filter(event => event.type === 'blur');
    const suspiciousFocusLoss = focusLossEvents.filter(event => 
      event.duration > 5000 && // Más de 5 segundos fuera
      event.duringCriticalMoment // Durante momento crítico del juego
    );

    if (suspiciousFocusLoss.length > 2) {
      suspicious = true;
      confidence += 0.3;
      evidence.push(`${suspiciousFocusLoss.length} pérdidas sospechosas de foco durante momentos críticos`);
    }

    // Analizar patrones de interacción anómalos
    const interactionAnalysis = analyzeInteractionPatterns(gameInteractions);
    if (interactionAnalysis.suspicious) {
      suspicious = true;
      confidence += interactionAnalysis.confidence;
      evidence.push(...interactionAnalysis.evidence);
    }

    return {
      suspicious,
      severity: confidence > 0.6 ? VIOLATION_SEVERITIES.MEDIUM : severity,
      confidence: Math.min(confidence, 1),
      evidence
    };
  }, []);

  /**
   * Analizar anomalías estadísticas
   */
  const analyzeStatisticalAnomalies = useCallback((gameData) => {
    const { 
      sessionStats = {},
      historicalStats = {},
      gameType = '',
      difficulty = 'normal'
    } = gameData;
    
    let suspicious = false;
    let severity = VIOLATION_SEVERITIES.LOW;
    let confidence = 0;
    const evidence = [];

    // Comparar con estadísticas poblacionales
    const populationStats = getPopulationStats(gameType, difficulty);
    
    if (populationStats) {
      // Verificar si el rendimiento está muy por encima del percentil 99
      const performancePercentile = calculatePercentile(sessionStats.averageScore, populationStats.scoreDistribution);
      
      if (performancePercentile > 99.5 && sessionStats.gamesPlayed >= 10) {
        suspicious = true;
        confidence += 0.4;
        evidence.push(`Rendimiento en percentil ${performancePercentile.toFixed(1)} (extremadamente alto)`);
      }

      // Verificar consistencia anormal
      const consistencyScore = calculateConsistencyScore(sessionStats);
      if (consistencyScore > 0.95 && sessionStats.gamesPlayed >= 20) {
        suspicious = true;
        confidence += 0.3;
        evidence.push(`Consistencia anormalmente alta: ${(consistencyScore * 100).toFixed(1)}%`);
      }
    }

    // Analizar progresión de aprendizaje
    if (historicalStats.progressionData) {
      const learningCurve = analyzeLearningCurve(historicalStats.progressionData);
      if (learningCurve.isAnomalous) {
        suspicious = true;
        confidence += 0.2;
        evidence.push('Curva de aprendizaje anómala detectada');
      }
    }

    return {
      suspicious,
      severity: confidence > 0.5 ? VIOLATION_SEVERITIES.MEDIUM : severity,
      confidence: Math.min(confidence, 1),
      evidence
    };
  }, []);

  /**
   * Obtener puntuación de fair play de un usuario
   */
  const getUserFairPlayScore = useCallback(async (userId = null) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return { score: 100, factors: [] };

    try {
      const response = await fetch(`/api/fair-play/score/${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const scoreData = await response.json();
        
        if (!userId) { // Solo actualizar el estado para el usuario actual
          setFairPlayScore(scoreData.score);
        }
        
        return scoreData;
      }
      
      return { score: 100, factors: [] };
    } catch (error) {
      console.error('Error obteniendo puntuación fair play:', error);
      return { score: 100, factors: [] };
    }
  }, [user]);

  /**
   * Obtener historial de infracciones
   */
  const getViolationHistory = useCallback(async (userId = null, filters = {}) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];

    try {
      const queryParams = new URLSearchParams({
        userId: targetUserId,
        ...filters
      });

      const response = await fetch(`/api/fair-play/violations?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const violations = await response.json();
        
        if (!userId) { // Solo actualizar el estado para el usuario actual
          setViolations(violations);
        }
        
        return violations;
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo historial de infracciones:', error);
      return [];
    }
  }, [user]);

  /**
   * Moderar un reporte manualmente
   */
  const moderateReport = useCallback(async (reportId, moderationData) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch(`/api/fair-play/reports/${reportId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...moderationData,
          moderatorId: user.id,
          moderatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Actualizar estado local
        setReports(prev => prev.map(report => 
          report.id === reportId ? { ...report, ...result.report } : report
        ));
        
        if (result.violation) {
          setViolations(prev => [result.violation, ...prev]);
        }
        
        return { success: true, result };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error moderando reporte');
      }
    } catch (error) {
      console.error('Error moderando reporte:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Funciones auxiliares
   */
  const calculateVariance = useCallback((values) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }, []);

  const findConsecutiveIdenticalScores = useCallback((scores) => {
    let maxConsecutive = 0;
    let currentConsecutive = 1;
    
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] === scores[i - 1]) {
        currentConsecutive++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        currentConsecutive = 1;
      }
    }
    
    return Math.max(maxConsecutive, currentConsecutive);
  }, []);

  const detectPeriodicPattern = useCallback((times) => {
    // Analizar si hay un patrón regular en los tiempos
    const intervals = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }
    
    // Buscar el intervalo más común
    const intervalCounts = {};
    intervals.forEach(interval => {
      const rounded = Math.round(interval / 10) * 10; // Redondear a décimas
      intervalCounts[rounded] = (intervalCounts[rounded] || 0) + 1;
    });
    
    const mostCommonInterval = Object.keys(intervalCounts).reduce((a, b) => 
      intervalCounts[a] > intervalCounts[b] ? a : b
    );
    
    const regularityRatio = intervalCounts[mostCommonInterval] / intervals.length;
    
    return {
      isRegular: regularityRatio > 0.7,
      period: parseInt(mostCommonInterval),
      confidence: regularityRatio
    };
  }, []);

  const submitAutoReport = useCallback(async (autoReport) => {
    try {
      const response = await fetch('/api/fair-play/auto-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(autoReport)
      });

      if (response.ok) {
        const report = await response.json();
        
        if (autoReport.needsReview) {
          setModerationQueue(prev => [report, ...prev]);
        }
        
        return report;
      }
    } catch (error) {
      console.error('Error enviando reporte automático:', error);
    }
  }, [user]);

  const triggerAutoModerationCheck = useCallback(async (userId) => {
    // Implementar revisión automática adicional cuando se reporta a un usuario
    // Esto puede incluir análisis retrospectivo de partidas recientes
  }, []);

  // Efectos para cargar datos iniciales
  useEffect(() => {
    if (user) {
      getUserFairPlayScore();
      getViolationHistory();
    }
  }, [user, getUserFairPlayScore, getViolationHistory]);

  const value = {
    // Estado
    reports,
    violations,
    moderationQueue,
    fairPlayScore,
    autoModerationActive,
    loading,
    
    // Constantes
    VIOLATION_TYPES,
    VIOLATION_SEVERITIES,
    REPORT_STATUS,
    AUTO_MODERATION_TYPES,
    
    // Funciones principales
    reportViolation,
    analyzeGameBehavior,
    getUserFairPlayScore,
    getViolationHistory,
    moderateReport,
    
    // Configuración
    setAutoModerationActive,
    
    // Análisis específicos
    analyzeScorePatterns,
    analyzeTimePatterns,
    analyzeBehaviorPatterns,
    analyzeStatisticalAnomalies
  };

  return (
    <FairPlayContext.Provider value={value}>
      {children}
    </FairPlayContext.Provider>
  );
};

/**
 * Hook para usar el contexto de fair play
 */
export const useFairPlay = () => {
  const context = useContext(FairPlayContext);
  if (!context) {
    throw new Error('useFairPlay debe usarse dentro de FairPlayProvider');
  }
  return context;
};

// Funciones auxiliares adicionales que podrían implementarse externamente
const analyzeMouseMovements = (movements) => {
  // Implementar análisis de movimientos de mouse
  return { suspicious: false, confidence: 0, evidence: [] };
};

const analyzeInteractionPatterns = (interactions) => {
  // Implementar análisis de patrones de interacción
  return { suspicious: false, confidence: 0, evidence: [] };
};

const getPopulationStats = (gameType, difficulty) => {
  // Implementar obtención de estadísticas poblacionales
  return null;
};

const calculatePercentile = (value, distribution) => {
  // Implementar cálculo de percentil
  return 50;
};

const calculateConsistencyScore = (stats) => {
  // Implementar cálculo de consistencia
  return 0.5;
};

const analyzeLearningCurve = (progressionData) => {
  // Implementar análisis de curva de aprendizaje
  return { isAnomalous: false };
};