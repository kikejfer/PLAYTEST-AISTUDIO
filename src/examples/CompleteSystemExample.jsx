/**
 * Ejemplo completo de integración de todos los sistemas de PLAYTEST
 * Este archivo demuestra cómo interactúan todos los componentes desarrollados
 */

import React, { useState, useEffect } from 'react';
import { useTournaments } from '../hooks/useTournaments';
import { usePrizeDistribution } from '../hooks/usePrizeDistribution';
import { useFairPlay } from '../hooks/useFairPlay';
import { useBlockVisibility } from '../hooks/useBlockVisibility';
import { SystemIntegrations } from '../integrations/SystemIntegrations';

// Componentes desarrollados
import TournamentDashboard from '../components/Tournaments/TournamentDashboard';
import BlockVisibilityControls from '../components/Blocks/BlockVisibilityControls';
import AuthorObservationsEditor from '../components/Blocks/AuthorObservationsEditor';
import FairPlayDashboard from '../components/FairPlay/FairPlayDashboard';
import LiveBracket from '../components/Tournaments/RealTime/LiveBracket';
import TournamentRegistration from '../components/Tournaments/Registration/TournamentRegistration';

/**
 * Ejemplo de flujo completo de un torneo
 */
const CompleteTournamentFlow = () => {
  const [currentStep, setCurrentStep] = useState('creation');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentResults, setTournamentResults] = useState([]);

  const {
    createTournament,
    startTournament,
    finalizeTournament,
    registerForTournament,
    TOURNAMENT_TYPES,
    TOURNAMENT_STATUS
  } = useTournaments();

  const {
    setupPrizeDistribution,
    calculatePrizes,
    distributePrizes
  } = usePrizeDistribution();

  const {
    analyzeGameBehavior,
    reportViolation
  } = useFairPlay();

  /**
   * Paso 1: Crear un torneo temático con bloques específicos
   */
  const createSampleTournament = async () => {
    const tournamentData = {
      name: 'Torneo de Matemáticas Avanzadas',
      description: 'Competencia de resolución de problemas matemáticos',
      type: TOURNAMENT_TYPES.THEMATIC,
      category: 'educational',
      subject: 'mathematics',
      difficulty: 'advanced',
      maxParticipants: 32,
      registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días
      duration: 120, // 2 horas
      format: {
        rounds: 4,
        questionsPerRound: 10,
        timePerQuestion: 60
      },
      prizes: {
        enabled: true,
        budget: 10000, // luminarias
        distribution: ['50%', '30%', '20%'] // Top 3
      },
      requirements: {
        minLevel: 5,
        minLuminarias: 100,
        minTournaments: 0
      },
      blocks: ['block_1', 'block_2', 'block_3'], // IDs de bloques específicos
      settings: {
        fairPlayMonitoring: true,
        autoModerationLevel: 'strict',
        allowSpectators: true,
        recordGames: true
      }
    };

    try {
      const result = await createTournament(tournamentData);
      if (result.success) {
        setSelectedTournament(result.tournament);
        
        // Configurar distribución de premios automática
        await setupTournamentPrizes(result.tournament.id);
        
        setCurrentStep('registration');
        console.log('✅ Torneo creado exitosamente:', result.tournament);
      }
    } catch (error) {
      console.error('❌ Error creando torneo:', error);
    }
  };

  /**
   * Paso 2: Configurar sistema de premios
   */
  const setupTournamentPrizes = async (tournamentId) => {
    const prizeConfig = {
      criteria: ['position', 'performance', 'fair_play'],
      positionRewards: [
        { positionRange: { min: 1, max: 1 }, luminarias: 5000 },
        { positionRange: { min: 2, max: 2 }, luminarias: 3000 },
        { positionRange: { min: 3, max: 3 }, luminarias: 2000 },
        { positionRange: { min: 4, max: 8 }, luminarias: 500 }
      ],
      performanceRewards: {
        bestAverage: { luminarias: 1000 },
        bestStreak: { experience: 500 },
        exceptionalScore: { threshold: 95 }
      },
      participationRewards: {
        basic: { luminarias: 100 },
        complete: { experience: 200 }
      },
      fairPlayRewards: {
        exceptional: { threshold: 95, luminarias: 500 }
      },
      maxBudget: 15000
    };

    try {
      const result = await setupPrizeDistribution(tournamentId, prizeConfig);
      console.log('✅ Sistema de premios configurado:', result);
    } catch (error) {
      console.error('❌ Error configurando premios:', error);
    }
  };

  /**
   * Paso 3: Simular proceso de inscripción
   */
  const handleRegistration = async (registrationData) => {
    try {
      const result = await registerForTournament(selectedTournament.id, registrationData);
      if (result.success) {
        console.log('✅ Inscripción exitosa:', result.registration);
        
        // Si llegamos al mínimo de participantes, permitir iniciar
        if (selectedTournament.currentParticipants >= 8) {
          setCurrentStep('ready_to_start');
        }
      }
    } catch (error) {
      console.error('❌ Error en inscripción:', error);
    }
  };

  /**
   * Paso 4: Iniciar torneo con todas las integraciones
   */
  const handleTournamentStart = async () => {
    try {
      const result = await startTournament(selectedTournament.id);
      if (result.success) {
        console.log('✅ Torneo iniciado con integraciones:', result);
        setCurrentStep('tournament_active');
        
        // Simular progreso del torneo
        simulateTournamentProgress();
      }
    } catch (error) {
      console.error('❌ Error iniciando torneo:', error);
    }
  };

  /**
   * Paso 5: Simular progreso y monitoreo del torneo
   */
  const simulateTournamentProgress = async () => {
    // Simular análisis de comportamiento en tiempo real
    const gameData = {
      userId: 'user_123',
      gameId: 'game_456',
      scores: [85, 92, 88, 95, 90],
      averageScore: 90,
      responseTimes: [1200, 1100, 1350, 950, 1250],
      gameInteractions: [
        { type: 'answer_submit', timestamp: Date.now(), correct: true },
        { type: 'hint_request', timestamp: Date.now() + 1000 },
        { type: 'answer_submit', timestamp: Date.now() + 2000, correct: true }
      ],
      windowFocusEvents: [
        { type: 'focus', timestamp: Date.now() },
        { type: 'blur', timestamp: Date.now() + 5000, duration: 2000 }
      ]
    };

    // Analizar comportamiento
    const behaviorAnalysis = await analyzeGameBehavior(gameData, selectedTournament.id);
    if (behaviorAnalysis.suspicious) {
      console.log('⚠️ Comportamiento sospechoso detectado:', behaviorAnalysis);
    }

    // Simular finalización después de un tiempo
    setTimeout(() => {
      setCurrentStep('tournament_finished');
      handleTournamentFinalization();
    }, 5000);
  };

  /**
   * Paso 6: Finalizar torneo y distribuir premios
   */
  const handleTournamentFinalization = async () => {
    // Resultados simulados del torneo
    const results = [
      {
        userId: 'user_123',
        username: 'ProMath',
        placement: 1,
        totalScore: 950,
        averageScore: 95,
        gamesPlayed: 10,
        performance: {
          averageScore: 95,
          fairPlayScore: 98,
          improvementRate: 0.15,
          winStreak: 8,
          consistencyScore: 0.92,
          firstTournament: false
        }
      },
      {
        userId: 'user_456',
        username: 'MathGuru',
        placement: 2,
        totalScore: 920,
        averageScore: 92,
        gamesPlayed: 10,
        performance: {
          averageScore: 92,
          fairPlayScore: 100,
          improvementRate: 0.25,
          winStreak: 6,
          consistencyScore: 0.88,
          firstTournament: true
        }
      },
      {
        userId: 'user_789',
        username: 'NumberNinja',
        placement: 3,
        totalScore: 880,
        averageScore: 88,
        gamesPlayed: 10,
        performance: {
          averageScore: 88,
          fairPlayScore: 95,
          improvementRate: 0.10,
          winStreak: 4,
          consistencyScore: 0.85,
          firstTournament: false
        }
      }
    ];

    // Calcular premios
    const prizeCalculation = await calculatePrizes(
      selectedTournament.id,
      results.map(r => ({ id: r.userId, ...r.performance })),
      results
    );

    if (prizeCalculation.success) {
      console.log('✅ Premios calculados:', prizeCalculation.prizes);
      
      // Finalizar torneo con integraciones
      const finalizationResult = await finalizeTournament(
        selectedTournament.id,
        results,
        prizeCalculation.prizes
      );
      
      if (finalizationResult.success) {
        console.log('✅ Torneo finalizado con integraciones:', finalizationResult);
        setTournamentResults(results);
        setCurrentStep('results_displayed');
      }
    }
  };

  /**
   * Ejemplo de gestión de bloques durante el torneo
   */
  const BlockManagementExample = () => {
    const { updateBlockVisibility } = useBlockVisibility();
    const [selectedBlock, setSelectedBlock] = useState(null);

    const handleVisibilityChange = async (blockId, newVisibility) => {
      const result = await updateBlockVisibility(blockId, newVisibility, {
        reason: 'Actualización por torneo',
        tournamentId: selectedTournament?.id
      });
      
      if (result.success) {
        console.log('✅ Visibilidad del bloque actualizada:', result);
      }
    };

    return (
      <div className="block-management-example">
        <h3>🧩 Gestión de Bloques del Torneo</h3>
        <BlockVisibilityControls
          blockId="block_1"
          currentVisibility="public"
          onVisibilityChange={(visibility) => handleVisibilityChange('block_1', visibility)}
        />
        
        <AuthorObservationsEditor
          blockId="block_1"
          initialContent=""
          onSave={(content) => console.log('Observaciones guardadas:', content)}
        />
      </div>
    );
  };

  /**
   * Renderizado del ejemplo paso a paso
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'creation':
        return (
          <div className="step-content">
            <h2>🏗️ Paso 1: Crear Torneo</h2>
            <p>Vamos a crear un torneo temático con todas las integraciones:</p>
            <button onClick={createSampleTournament} className="btn btn-primary">
              Crear Torneo de Ejemplo
            </button>
          </div>
        );

      case 'registration':
        return (
          <div className="step-content">
            <h2>📝 Paso 2: Registro e Inscripciones</h2>
            <p>Torneo creado: <strong>{selectedTournament?.name}</strong></p>
            <TournamentRegistration
              tournament={selectedTournament}
              onRegistrationChange={(registered) => {
                if (registered) handleRegistration({ motivation: 'Ejemplo de inscripción' });
              }}
            />
            <BlockManagementExample />
          </div>
        );

      case 'ready_to_start':
        return (
          <div className="step-content">
            <h2>🚀 Paso 3: Iniciar Torneo</h2>
            <p>El torneo tiene suficientes participantes y está listo para comenzar.</p>
            <button onClick={handleTournamentStart} className="btn btn-success">
              Iniciar Torneo
            </button>
          </div>
        );

      case 'tournament_active':
        return (
          <div className="step-content">
            <h2>⚡ Paso 4: Torneo en Progreso</h2>
            <p>El torneo está activo con monitoreo de fair play en tiempo real.</p>
            <LiveBracket 
              tournament={selectedTournament}
              onMatchUpdate={(match) => console.log('Match actualizado:', match)}
            />
            <FairPlayDashboard userRole="moderator" />
          </div>
        );

      case 'tournament_finished':
        return (
          <div className="step-content">
            <h2>🏁 Paso 5: Finalizando Torneo</h2>
            <p>Calculando premios y ejecutando integraciones...</p>
            <div className="loading-indicator">⏳ Procesando resultados...</div>
          </div>
        );

      case 'results_displayed':
        return (
          <div className="step-content">
            <h2>🎉 Paso 6: Resultados y Premios</h2>
            <h3>🏆 Resultados Finales:</h3>
            <div className="results-table">
              {tournamentResults.map((result, index) => (
                <div key={result.userId} className="result-row">
                  <span className="position">{result.placement}°</span>
                  <span className="username">{result.username}</span>
                  <span className="score">{result.totalScore} pts</span>
                  <span className="fair-play">Fair Play: {result.performance.fairPlayScore}%</span>
                </div>
              ))}
            </div>
            
            <h3>💰 Integraciones Ejecutadas:</h3>
            <ul>
              <li>✅ Luminarias distribuidas automáticamente</li>
              <li>✅ Experiencia otorgada por participación</li>
              <li>✅ Notificaciones enviadas a participantes</li>
              <li>✅ Canal de chat actualizado</li>
              <li>✅ Estadísticas de fair play actualizadas</li>
            </ul>
          </div>
        );

      default:
        return <div>Estado no reconocido</div>;
    }
  };

  return (
    <div className="complete-system-example">
      <div className="example-header">
        <h1>🎯 PLAYTEST - Ejemplo de Sistema Completo</h1>
        <p>Demostración de la integración completa de todos los sistemas desarrollados</p>
        
        <div className="progress-indicator">
          {['creation', 'registration', 'ready_to_start', 'tournament_active', 'tournament_finished', 'results_displayed'].map((step, index) => (
            <div 
              key={step} 
              className={`step ${currentStep === step ? 'active' : ''} ${
                ['creation', 'registration', 'ready_to_start', 'tournament_active', 'tournament_finished', 'results_displayed'].indexOf(currentStep) > index ? 'completed' : ''
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="example-content">
        {renderCurrentStep()}
      </div>

      <div className="example-footer">
        <h3>🔧 Sistemas Integrados:</h3>
        <div className="systems-grid">
          <div className="system-card">
            <h4>🧩 Gestión de Bloques</h4>
            <p>Visibilidad, validaciones y observaciones</p>
          </div>
          <div className="system-card">
            <h4>🏆 Sistema de Torneos</h4>
            <p>4 tipos, inscripciones y brackets en tiempo real</p>
          </div>
          <div className="system-card">
            <h4>💰 Distribución de Premios</h4>
            <p>Cálculo automático por múltiples criterios</p>
          </div>
          <div className="system-card">
            <h4>🛡️ Fair Play</h4>
            <p>Detección automática y moderación</p>
          </div>
          <div className="system-card">
            <h4>✨ Luminarias</h4>
            <p>Otorgamiento automático de recompensas</p>
          </div>
          <div className="system-card">
            <h4>💬 Chat</h4>
            <p>Canales automáticos y moderación</p>
          </div>
          <div className="system-card">
            <h4>📊 Niveles</h4>
            <p>Experiencia automática y progresión</p>
          </div>
          <div className="system-card">
            <h4>🔔 Notificaciones</h4>
            <p>Alertas en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteTournamentFlow;