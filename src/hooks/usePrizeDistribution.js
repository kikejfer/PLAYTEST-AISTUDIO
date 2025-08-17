import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Tipos de premios disponibles
 */
export const PRIZE_TYPES = {
  LUMINARIAS: 'luminarias',
  EXPERIENCE: 'experience',
  LEVEL_BOOST: 'level_boost',
  BADGE: 'badge',
  TITLE: 'title',
  CUSTOM: 'custom'
};

/**
 * Criterios de distribución
 */
export const DISTRIBUTION_CRITERIA = {
  POSITION: 'position',           // Por posición final
  PERFORMANCE: 'performance',     // Por rendimiento/puntuación
  PARTICIPATION: 'participation', // Por participación
  STREAK: 'streak',              // Por rachas
  IMPROVEMENT: 'improvement',     // Por mejora
  FAIR_PLAY: 'fair_play'         // Por fair play
};

/**
 * Estados de distribución
 */
export const DISTRIBUTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Contexto para distribución de premios
 */
const PrizeDistributionContext = createContext();

/**
 * Proveedor del contexto de distribución de premios
 */
export const PrizeDistributionProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingQueue, setProcessingQueue] = useState([]);

  /**
   * Configurar distribución automática de premios para un torneo
   */
  const setupPrizeDistribution = useCallback(async (tournamentId, prizeConfig) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/prizes/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...prizeConfig,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const distribution = await response.json();
        setDistributions(prev => [distribution, ...prev]);
        return { success: true, distribution };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error configurando distribución de premios');
      }
    } catch (error) {
      console.error('Error configurando premios:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Calcular premios basado en resultados del torneo
   */
  const calculatePrizes = useCallback(async (tournamentId, participants, finalRankings) => {
    try {
      // Obtener configuración de premios del torneo
      const distributionConfig = distributions.find(d => d.tournamentId === tournamentId);
      if (!distributionConfig) {
        throw new Error('No se encontró configuración de premios para este torneo');
      }

      const prizeCalculations = [];

      // Calcular premios por posición
      if (distributionConfig.criteria.includes(DISTRIBUTION_CRITERIA.POSITION)) {
        const positionPrizes = calculatePositionPrizes(
          finalRankings, 
          distributionConfig.positionRewards
        );
        prizeCalculations.push(...positionPrizes);
      }

      // Calcular premios por rendimiento
      if (distributionConfig.criteria.includes(DISTRIBUTION_CRITERIA.PERFORMANCE)) {
        const performancePrizes = calculatePerformancePrizes(
          participants, 
          distributionConfig.performanceRewards
        );
        prizeCalculations.push(...performancePrizes);
      }

      // Calcular premios por participación
      if (distributionConfig.criteria.includes(DISTRIBUTION_CRITERIA.PARTICIPATION)) {
        const participationPrizes = calculateParticipationPrizes(
          participants, 
          distributionConfig.participationRewards
        );
        prizeCalculations.push(...participationPrizes);
      }

      // Calcular premios por rachas
      if (distributionConfig.criteria.includes(DISTRIBUTION_CRITERIA.STREAK)) {
        const streakPrizes = calculateStreakPrizes(
          participants, 
          distributionConfig.streakRewards
        );
        prizeCalculations.push(...streakPrizes);
      }

      // Calcular premios por mejora
      if (distributionConfig.criteria.includes(DISTRIBUTION_CRITERIA.IMPROVEMENT)) {
        const improvementPrizes = calculateImprovementPrizes(
          participants, 
          distributionConfig.improvementRewards
        );
        prizeCalculations.push(...improvementPrizes);
      }

      // Calcular premios por fair play
      if (distributionConfig.criteria.includes(DISTRIBUTION_CRITERIA.FAIR_PLAY)) {
        const fairPlayPrizes = calculateFairPlayPrizes(
          participants, 
          distributionConfig.fairPlayRewards
        );
        prizeCalculations.push(...fairPlayPrizes);
      }

      // Consolidar premios por participante
      const consolidatedPrizes = consolidatePrizes(prizeCalculations);

      return {
        success: true,
        prizes: consolidatedPrizes,
        totalValue: calculateTotalValue(consolidatedPrizes),
        distribution: distributionConfig
      };

    } catch (error) {
      console.error('Error calculando premios:', error);
      return { success: false, error: error.message };
    }
  }, [distributions]);

  /**
   * Calcular premios por posición final
   */
  const calculatePositionPrizes = useCallback((rankings, positionRewards) => {
    const prizes = [];

    rankings.forEach((participant, index) => {
      const position = index + 1;
      const reward = positionRewards.find(r => 
        position >= r.positionRange.min && position <= r.positionRange.max
      );

      if (reward) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.LUMINARIAS,
          amount: reward.luminarias,
          reason: `Posición ${position}`,
          criteria: DISTRIBUTION_CRITERIA.POSITION,
          metadata: { position, finalScore: participant.totalScore }
        });

        // Premios adicionales por posiciones especiales
        if (position === 1) {
          prizes.push({
            participantId: participant.id,
            type: PRIZE_TYPES.BADGE,
            value: 'tournament_champion',
            reason: 'Campeón del torneo',
            criteria: DISTRIBUTION_CRITERIA.POSITION
          });
        }

        if (position <= 3) {
          prizes.push({
            participantId: participant.id,
            type: PRIZE_TYPES.TITLE,
            value: position === 1 ? 'Campeón' : position === 2 ? 'Subcampeón' : 'Tercer lugar',
            reason: `Podio - Posición ${position}`,
            criteria: DISTRIBUTION_CRITERIA.POSITION
          });
        }
      }
    });

    return prizes;
  }, []);

  /**
   * Calcular premios por rendimiento
   */
  const calculatePerformancePrizes = useCallback((participants, performanceRewards) => {
    const prizes = [];
    
    // Encontrar mejores performances
    const bestAverage = Math.max(...participants.map(p => p.averageScore || 0));
    const bestStreak = Math.max(...participants.map(p => p.bestStreak || 0));
    const mostImproved = Math.max(...participants.map(p => p.improvement || 0));

    participants.forEach(participant => {
      // Premio por mejor promedio
      if (participant.averageScore === bestAverage && performanceRewards.bestAverage) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.LUMINARIAS,
          amount: performanceRewards.bestAverage.luminarias,
          reason: `Mejor promedio: ${participant.averageScore}`,
          criteria: DISTRIBUTION_CRITERIA.PERFORMANCE
        });
      }

      // Premio por mejor racha
      if (participant.bestStreak === bestStreak && performanceRewards.bestStreak) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.EXPERIENCE,
          amount: performanceRewards.bestStreak.experience,
          reason: `Mejor racha: ${participant.bestStreak} victorias`,
          criteria: DISTRIBUTION_CRITERIA.PERFORMANCE
        });
      }

      // Premio por puntuación excepcional
      if (participant.totalScore >= performanceRewards.exceptionalScore?.threshold) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.BADGE,
          value: 'exceptional_performance',
          reason: 'Rendimiento excepcional',
          criteria: DISTRIBUTION_CRITERIA.PERFORMANCE
        });
      }
    });

    return prizes;
  }, []);

  /**
   * Calcular premios por participación
   */
  const calculateParticipationPrizes = useCallback((participants, participationRewards) => {
    const prizes = [];

    participants.forEach(participant => {
      // Premio básico por participación
      if (participationRewards.basic) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.LUMINARIAS,
          amount: participationRewards.basic.luminarias,
          reason: 'Participación en el torneo',
          criteria: DISTRIBUTION_CRITERIA.PARTICIPATION
        });
      }

      // Premio por participación completa
      if (participant.completionRate >= 0.9 && participationRewards.complete) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.EXPERIENCE,
          amount: participationRewards.complete.experience,
          reason: 'Participación completa',
          criteria: DISTRIBUTION_CRITERIA.PARTICIPATION
        });
      }

      // Premio por asistencia perfecta
      if (participant.attendanceRate === 1 && participationRewards.perfectAttendance) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.BADGE,
          value: 'perfect_attendance',
          reason: 'Asistencia perfecta',
          criteria: DISTRIBUTION_CRITERIA.PARTICIPATION
        });
      }
    });

    return prizes;
  }, []);

  /**
   * Calcular premios por rachas
   */
  const calculateStreakPrizes = useCallback((participants, streakRewards) => {
    const prizes = [];

    participants.forEach(participant => {
      const { winStreak = 0, lossStreak = 0, drawStreak = 0 } = participant;

      // Premio por racha de victorias
      streakRewards.win?.forEach(reward => {
        if (winStreak >= reward.threshold) {
          prizes.push({
            participantId: participant.id,
            type: PRIZE_TYPES.LUMINARIAS,
            amount: reward.luminarias,
            reason: `Racha de ${winStreak} victorias`,
            criteria: DISTRIBUTION_CRITERIA.STREAK
          });
        }
      });

      // Premio especial por superar rachas de pérdidas
      if (lossStreak >= 3 && participant.overcameAdversity) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.BADGE,
          value: 'comeback_champion',
          reason: 'Superación de adversidades',
          criteria: DISTRIBUTION_CRITERIA.STREAK
        });
      }
    });

    return prizes;
  }, []);

  /**
   * Calcular premios por mejora
   */
  const calculateImprovementPrizes = useCallback((participants, improvementRewards) => {
    const prizes = [];

    // Encontrar mayor mejora
    const maxImprovement = Math.max(...participants.map(p => p.improvementPercentage || 0));

    participants.forEach(participant => {
      const improvement = participant.improvementPercentage || 0;

      // Premio por mejora significativa
      improvementRewards.thresholds?.forEach(threshold => {
        if (improvement >= threshold.percentage) {
          prizes.push({
            participantId: participant.id,
            type: PRIZE_TYPES.LUMINARIAS,
            amount: threshold.luminarias,
            reason: `Mejora del ${improvement}%`,
            criteria: DISTRIBUTION_CRITERIA.IMPROVEMENT
          });
        }
      });

      // Premio por mayor mejora
      if (improvement === maxImprovement && improvementRewards.mostImproved) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.BADGE,
          value: 'most_improved',
          reason: 'Mayor mejora en el torneo',
          criteria: DISTRIBUTION_CRITERIA.IMPROVEMENT
        });
      }
    });

    return prizes;
  }, []);

  /**
   * Calcular premios por fair play
   */
  const calculateFairPlayPrizes = useCallback((participants, fairPlayRewards) => {
    const prizes = [];

    participants.forEach(participant => {
      const fairPlayScore = participant.fairPlayScore || 0;

      // Premio por fair play excepcional
      if (fairPlayScore >= fairPlayRewards.exceptional?.threshold) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.BADGE,
          value: 'fair_play_champion',
          reason: 'Fair Play excepcional',
          criteria: DISTRIBUTION_CRITERIA.FAIR_PLAY
        });

        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.LUMINARIAS,
          amount: fairPlayRewards.exceptional.luminarias,
          reason: 'Comportamiento ejemplar',
          criteria: DISTRIBUTION_CRITERIA.FAIR_PLAY
        });
      }

      // Premio por espíritu deportivo
      if (participant.sportsmanshipRating >= 4.5 && fairPlayRewards.sportsmanship) {
        prizes.push({
          participantId: participant.id,
          type: PRIZE_TYPES.TITLE,
          value: 'Espíritu Deportivo',
          reason: 'Excelente espíritu deportivo',
          criteria: DISTRIBUTION_CRITERIA.FAIR_PLAY
        });
      }
    });

    return prizes;
  }, []);

  /**
   * Consolidar premios por participante
   */
  const consolidatePrizes = useCallback((prizeCalculations) => {
    const consolidated = {};

    prizeCalculations.forEach(prize => {
      const participantId = prize.participantId;
      
      if (!consolidated[participantId]) {
        consolidated[participantId] = {
          participantId,
          prizes: [],
          totalLuminarias: 0,
          totalExperience: 0,
          badges: [],
          titles: []
        };
      }

      const participant = consolidated[participantId];
      participant.prizes.push(prize);

      // Sumar valores por tipo
      switch (prize.type) {
        case PRIZE_TYPES.LUMINARIAS:
          participant.totalLuminarias += prize.amount || 0;
          break;
        case PRIZE_TYPES.EXPERIENCE:
          participant.totalExperience += prize.amount || 0;
          break;
        case PRIZE_TYPES.BADGE:
          participant.badges.push(prize.value);
          break;
        case PRIZE_TYPES.TITLE:
          participant.titles.push(prize.value);
          break;
      }
    });

    return Object.values(consolidated);
  }, []);

  /**
   * Calcular valor total de premios
   */
  const calculateTotalValue = useCallback((consolidatedPrizes) => {
    return consolidatedPrizes.reduce((total, participant) => {
      return total + participant.totalLuminarias + (participant.totalExperience * 0.1);
    }, 0);
  }, []);

  /**
   * Distribuir premios automáticamente
   */
  const distributePrizes = useCallback(async (tournamentId, prizeCalculations) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/prizes/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          prizes: prizeCalculations,
          distributedBy: user.id,
          distributedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Actualizar estado de distribuciones
        setDistributions(prev => 
          prev.map(d => 
            d.tournamentId === tournamentId 
              ? { ...d, status: DISTRIBUTION_STATUS.COMPLETED, completedAt: new Date() }
              : d
          )
        );

        return { success: true, result };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error distribuyendo premios');
      }
    } catch (error) {
      console.error('Error distribuyendo premios:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Obtener historial de distribuciones
   */
  const getDistributionHistory = useCallback(async (tournamentId = null) => {
    if (!user) return [];

    try {
      const url = tournamentId 
        ? `/api/tournaments/${tournamentId}/prizes/history`
        : '/api/prizes/history';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        return history;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }, [user]);

  /**
   * Validar configuración de premios
   */
  const validatePrizeConfig = useCallback((config) => {
    const errors = [];

    // Validar que hay al menos un criterio
    if (!config.criteria || config.criteria.length === 0) {
      errors.push('Debe especificar al menos un criterio de distribución');
    }

    // Validar premios por posición
    if (config.criteria.includes(DISTRIBUTION_CRITERIA.POSITION)) {
      if (!config.positionRewards || config.positionRewards.length === 0) {
        errors.push('Debe configurar premios por posición');
      }
    }

    // Validar presupuesto total
    if (config.maxBudget && config.estimatedCost > config.maxBudget) {
      errors.push('El costo estimado excede el presupuesto máximo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  const value = {
    // Estado
    distributions,
    loading,
    processingQueue,
    
    // Constantes
    PRIZE_TYPES,
    DISTRIBUTION_CRITERIA,
    DISTRIBUTION_STATUS,
    
    // Funciones principales
    setupPrizeDistribution,
    calculatePrizes,
    distributePrizes,
    getDistributionHistory,
    validatePrizeConfig,
    
    // Funciones de cálculo específicas
    calculatePositionPrizes,
    calculatePerformancePrizes,
    calculateParticipationPrizes,
    calculateStreakPrizes,
    calculateImprovementPrizes,
    calculateFairPlayPrizes,
    
    // Utilidades
    consolidatePrizes,
    calculateTotalValue
  };

  return (
    <PrizeDistributionContext.Provider value={value}>
      {children}
    </PrizeDistributionContext.Provider>
  );
};

/**
 * Hook para usar el contexto de distribución de premios
 */
export const usePrizeDistribution = () => {
  const context = useContext(PrizeDistributionContext);
  if (!context) {
    throw new Error('usePrizeDistribution debe usarse dentro de PrizeDistributionProvider');
  }
  return context;
};