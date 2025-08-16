import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationState } from '../../hooks/useNavigationState';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import ExpandableSection from '../../components/UI/ExpandableSection';
import Icon from '../../components/UI/Icon';
import ConfiguradorJuego from './ConfiguradorJuego';
import SalasActivas from './SalasActivas';
import Torneos from './Torneos';
import Clasificaciones from './Clasificaciones';
import HistorialPartidas from './HistorialPartidas';
import './JuegoPanel.scss';

/**
 * Panel de Juego Universal
 * Accesible para todos los usuarios, funcionalidades diferenciadas por rol
 * Configurador de juegos, salas activas, torneos y clasificaciones
 */
const JuegoPanel = () => {
  const { expandedPanels, togglePanel } = useNavigationState();
  const { isFeatureEnabled } = useFeatureFlags();
  const [activeSection, setActiveSection] = useState(null);

  // Configuración de secciones del panel de juego
  const sections = [
    {
      id: 'configurador-juego',
      title: 'Configurador de Juego',
      description: 'Crea y configura nuevas partidas personalizadas',
      icon: 'settings',
      component: ConfiguradorJuego,
      color: 'blue',
      universal: true
    },
    {
      id: 'salas-activas',
      title: 'Salas Activas',
      description: 'Únete a partidas en curso o espera',
      icon: 'users',
      component: SalasActivas,
      color: 'green',
      universal: true
    },
    {
      id: 'torneos',
      title: 'Torneos y Competiciones',
      description: 'Participa en torneos organizados',
      icon: 'trophy',
      component: Torneos,
      color: 'gold',
      universal: true,
      requiresFeature: 'competition_tournaments'
    },
    {
      id: 'clasificaciones',
      title: 'Clasificaciones',
      description: 'Rankings y estadísticas globales',
      icon: 'award',
      component: Clasificaciones,
      color: 'purple',
      universal: true,
      requiresFeature: 'competition_rankings'
    },
    {
      id: 'historial-partidas',
      title: 'Historial de Partidas',
      description: 'Revisa tus partidas anteriores y estadísticas',
      icon: 'history',
      component: HistorialPartidas,
      color: 'gray',
      universal: true
    }
  ];

  // Filtrar secciones por features activos
  const availableSections = sections.filter(section => {
    if (section.requiresFeature) {
      return isFeatureEnabled(section.requiresFeature);
    }
    return true;
  });

  const isPanelExpanded = (sectionId) => {
    return expandedPanels[`juego.${sectionId}`] || false;
  };

  const handleSectionToggle = (sectionId) => {
    togglePanel('juego', sectionId);
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const renderSectionContent = (section) => {
    const Component = section.component;
    return <Component />;
  };

  // Estadísticas de juego del usuario
  const getGameStats = () => {
    return {
      partidasJugadas: 156,
      partidasGanadas: 89,
      puntajeBest: 2450,
      rankingActual: 342,
      rachaActual: 5
    };
  };

  const gameStats = getGameStats();
  const winRate = Math.round((gameStats.partidasGanadas / gameStats.partidasJugadas) * 100);

  return (
    <div className="juego-panel">
      {/* Header del panel */}
      <div className="panel-header">
        <div className="header-content">
          <div className="title-section">
            <Icon name="gamepad2" size="32" className="panel-icon" />
            <div>
              <h1>Panel de Juego</h1>
              <p>Crea, juega y compite en PLAYTEST</p>
            </div>
          </div>
          
          <div className="user-game-stats">
            <div className="quick-stat">
              <Icon name="zap" size="16" />
              <span>Racha: {gameStats.rachaActual}</span>
            </div>
            <div className="quick-stat">
              <Icon name="target" size="16" />
              <span>Best: {gameStats.puntajeBest}</span>
            </div>
            <div className="quick-stat">
              <Icon name="trending-up" size="16" />
              <span>#{gameStats.rankingActual}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas del usuario */}
      <div className="player-stats">
        <motion.div 
          className="stat-card games-played"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="play" size="24" />
          <div className="stat-content">
            <span className="stat-number">{gameStats.partidasJugadas}</span>
            <span className="stat-label">Partidas Jugadas</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card games-won"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="award" size="24" />
          <div className="stat-content">
            <span className="stat-number">{gameStats.partidasGanadas}</span>
            <span className="stat-label">Partidas Ganadas</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card win-rate"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="percent" size="24" />
          <div className="stat-content">
            <span className="stat-number">{winRate}%</span>
            <span className="stat-label">Tasa de Victoria</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card ranking"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="trending-up" size="24" />
          <div className="stat-content">
            <span className="stat-number">#{gameStats.rankingActual}</span>
            <span className="stat-label">Ranking Global</span>
          </div>
        </motion.div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <motion.button 
          className="quick-action-btn primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon name="play" size="20" />
          <span>Juego Rápido</span>
        </motion.button>

        <motion.button 
          className="quick-action-btn secondary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon name="users" size="20" />
          <span>Crear Sala</span>
        </motion.button>

        <motion.button 
          className="quick-action-btn tertiary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon name="search" size="20" />
          <span>Buscar Partida</span>
        </motion.button>

        {isFeatureEnabled('competition_tournaments') && (
          <motion.button 
            className="quick-action-btn tournament"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="trophy" size="20" />
            <span>Torneo Activo</span>
          </motion.button>
        )}
      </div>

      {/* Secciones expandibles */}
      <div className="sections-container">
        {availableSections.map((section) => {
          const isExpanded = isPanelExpanded(section.id);
          
          return (
            <div key={section.id} className="section-wrapper">
              <ExpandableSection
                id={section.id}
                title={section.title}
                description={section.description}
                icon={section.icon}
                isExpanded={isExpanded}
                onToggle={() => handleSectionToggle(section.id)}
                color={section.color}
                className="game-section"
                badge={section.universal ? 'Universal' : null}
              >
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="section-content"
                    >
                      {renderSectionContent(section)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </ExpandableSection>
            </div>
          );
        })}
      </div>

      {/* Actividad reciente */}
      <div className="recent-activity">
        <h3>Actividad Reciente</h3>
        <div className="activity-list">
          <motion.div 
            className="activity-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Icon name="trophy" size="16" className="activity-icon victory" />
            <div className="activity-content">
              <span className="activity-text">Ganaste una partida de Trivia Rápida</span>
              <span className="activity-time">Hace 2 horas</span>
            </div>
            <span className="activity-points">+250 pts</span>
          </motion.div>

          <motion.div 
            className="activity-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Icon name="users" size="16" className="activity-icon social" />
            <div className="activity-content">
              <span className="activity-text">Te uniste a la sala "Historia Mundial"</span>
              <span className="activity-time">Hace 4 horas</span>
            </div>
          </motion.div>

          <motion.div 
            className="activity-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Icon name="award" size="16" className="activity-icon achievement" />
            <div className="activity-content">
              <span className="activity-text">Alcanzaste el ranking #342</span>
              <span className="activity-time">Ayer</span>
            </div>
            <span className="activity-points">Subiste 58 posiciones</span>
          </motion.div>

          <motion.div 
            className="activity-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Icon name="zap" size="16" className="activity-icon streak" />
            <div className="activity-content">
              <span className="activity-text">Racha de 5 victorias consecutivas</span>
              <span className="activity-time">Ayer</span>
            </div>
            <span className="activity-points">¡En racha!</span>
          </motion.div>
        </div>
      </div>

      {/* Características universales */}
      <div className="universal-features">
        <div className="feature-notice">
          <Icon name="globe" size="16" />
          <span>Este panel está disponible para todos los usuarios de PLAYTEST</span>
        </div>
        
        <div className="features-list">
          <div className="feature-item">
            <Icon name="check" size="14" className="enabled-icon" />
            <span>Acceso a configurador de juegos básico</span>
          </div>
          <div className="feature-item">
            <Icon name="check" size="14" className="enabled-icon" />
            <span>Participación en salas públicas</span>
          </div>
          <div className="feature-item">
            <Icon name="check" size="14" className="enabled-icon" />
            <span>Visualización de rankings globales</span>
          </div>
          {!isFeatureEnabled('competition_tournaments') && (
            <div className="feature-item">
              <Icon name="lock" size="14" className="disabled-icon" />
              <span>Torneos (requiere activación)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JuegoPanel;