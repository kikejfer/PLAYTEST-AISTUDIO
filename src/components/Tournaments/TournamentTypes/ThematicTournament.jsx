import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTournaments } from '../../../hooks/useTournaments';
import { useBlockVisibility } from '../../../hooks/useBlockVisibility';
import ThematicRounds from './ThematicRounds';
import ThematicLeaderboard from './ThematicLeaderboard';
import './ThematicTournament.scss';

const ThematicTournament = ({ 
  tournament, 
  isOrganizer = false, 
  isParticipant = false 
}) => {
  const { 
    getTournamentBracket,
    getTournamentRankings,
    loading 
  } = useTournaments();
  
  const { searchBlocks } = useBlockVisibility();

  const [activeTab, setActiveTab] = useState('overview');
  const [tournamentData, setTournamentData] = useState({
    themes: [],
    participants: [],
    currentTheme: null,
    currentRound: 1,
    totalRounds: 0,
    leaderboard: [],
    themeProgress: {},
    completedThemes: []
  });
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [themeBlocks, setThemeBlocks] = useState({});

  // Cargar datos del torneo temático
  const loadTournamentData = useCallback(async () => {
    if (!tournament?.id) return;

    try {
      const [bracketResult, rankingsResult] = await Promise.all([
        getTournamentBracket(tournament.id),
        getTournamentRankings(tournament.id)
      ]);

      if (bracketResult.success && rankingsResult.success) {
        const { themes = [], participants = [], currentTheme = null } = bracketResult.bracket;
        const { leaderboard = [], themeProgress = {} } = rankingsResult.rankings;

        // Procesar temas con progreso y bloques
        const processedThemes = await Promise.all(
          themes.map(async (theme) => {
            const progress = themeProgress[theme.id] || {};
            const blocks = await loadThemeBlocks(theme);
            
            return {
              ...theme,
              progress,
              blocks,
              isCompleted: progress.completed || false,
              isActive: currentTheme?.id === theme.id,
              participantCount: progress.participantCount || 0,
              averageScore: progress.averageScore || 0
            };
          })
        );

        // Determinar ronda actual y total
        const currentRound = getCurrentRound(processedThemes, currentTheme);
        const totalRounds = processedThemes.length;

        // Obtener temas completados
        const completedThemes = processedThemes.filter(theme => theme.isCompleted);

        setTournamentData({
          themes: processedThemes,
          participants,
          currentTheme,
          currentRound,
          totalRounds,
          leaderboard,
          themeProgress,
          completedThemes
        });

        // Auto-seleccionar tema actual o primero disponible
        if (!selectedTheme) {
          setSelectedTheme(currentTheme || processedThemes[0] || null);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del torneo temático:', error);
    }
  }, [tournament?.id, getTournamentBracket, getTournamentRankings, selectedTheme]);

  // Cargar bloques de un tema específico
  const loadThemeBlocks = useCallback(async (theme) => {
    if (!theme.keywords || theme.keywords.length === 0) return [];

    try {
      // Usar el sistema de búsqueda para encontrar bloques relevantes
      const searchPromises = theme.keywords.map(keyword => 
        searchBlocks(keyword, {
          category: theme.category,
          knowledgeArea: theme.knowledgeArea,
          educationalLevel: theme.educationalLevel
        })
      );

      const searchResults = await Promise.all(searchPromises);
      
      // Combinar y deduplicar resultados
      const allBlocks = searchResults.flat();
      const uniqueBlocks = allBlocks.reduce((acc, block) => {
        if (!acc.find(b => b.id === block.id)) {
          acc.push(block);
        }
        return acc;
      }, []);

      // Ordenar por relevancia y limitar cantidad
      return uniqueBlocks
        .sort((a, b) => (b.searchRelevance || 0) - (a.searchRelevance || 0))
        .slice(0, theme.maxBlocks || 10);

    } catch (error) {
      console.error('Error cargando bloques del tema:', error);
      return [];
    }
  }, [searchBlocks]);

  // Determinar ronda actual
  const getCurrentRound = useCallback((themes, currentTheme) => {
    if (!currentTheme) return 1;
    
    const themeIndex = themes.findIndex(theme => theme.id === currentTheme.id);
    return themeIndex >= 0 ? themeIndex + 1 : 1;
  }, []);

  // Calcular estadísticas del torneo
  const tournamentStats = useMemo(() => {
    const totalParticipants = tournamentData.participants.length;
    const activeParticipants = tournamentData.participants.filter(p => p.isActive).length;
    const totalThemes = tournamentData.themes.length;
    const completedThemes = tournamentData.completedThemes.length;
    const overallProgress = totalThemes > 0 ? (completedThemes / totalThemes) * 100 : 0;

    // Calcular puntuación promedio global
    const globalAverage = tournamentData.leaderboard.length > 0 
      ? tournamentData.leaderboard.reduce((sum, player) => sum + (player.totalScore || 0), 0) / tournamentData.leaderboard.length
      : 0;

    // Encontrar tema más popular
    const mostPopularTheme = tournamentData.themes.reduce((max, theme) => 
      theme.participantCount > (max.participantCount || 0) ? theme : max, {}
    );

    return {
      totalParticipants,
      activeParticipants,
      totalThemes,
      completedThemes,
      overallProgress,
      globalAverage: Math.round(globalAverage * 100) / 100,
      mostPopularTheme: mostPopularTheme.name || 'N/A'
    };
  }, [tournamentData]);

  // Obtener estado de la fase actual
  const getPhaseStatus = useCallback(() => {
    if (tournament?.status === 'finished') {
      return {
        phase: 'Torneo Finalizado',
        description: '🏆 Todos los temas completados',
        className: 'finished',
        progress: 100
      };
    }

    if (tournament?.status === 'active') {
      const currentTheme = tournamentData.currentTheme;
      if (currentTheme) {
        return {
          phase: `Tema: ${currentTheme.name}`,
          description: `Ronda ${tournamentData.currentRound} de ${tournamentData.totalRounds}`,
          className: 'active',
          progress: tournamentStats.overallProgress
        };
      } else {
        return {
          phase: 'Preparando Siguiente Tema',
          description: `${tournamentStats.completedThemes} de ${tournamentStats.totalThemes} temas completados`,
          className: 'transition',
          progress: tournamentStats.overallProgress
        };
      }
    }

    return {
      phase: 'Preparación',
      description: 'El torneo aún no ha comenzado',
      className: 'preparation',
      progress: 0
    };
  }, [tournament?.status, tournamentData, tournamentStats]);

  // Manejar selección de tema
  const handleThemeSelect = useCallback((theme) => {
    setSelectedTheme(selectedTheme?.id === theme.id ? null : theme);
  }, [selectedTheme]);

  // Obtener el siguiente tema
  const getNextTheme = useCallback(() => {
    const currentIndex = tournamentData.themes.findIndex(
      theme => theme.id === tournamentData.currentTheme?.id
    );
    
    if (currentIndex >= 0 && currentIndex < tournamentData.themes.length - 1) {
      return tournamentData.themes[currentIndex + 1];
    }
    
    return null;
  }, [tournamentData.themes, tournamentData.currentTheme]);

  // Cargar datos al montar
  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

  // Recargar datos cada 30 segundos si está activo
  useEffect(() => {
    if (tournament?.status === 'active') {
      const interval = setInterval(loadTournamentData, 30000);
      return () => clearInterval(interval);
    }
  }, [tournament?.status, loadTournamentData]);

  const phaseStatus = getPhaseStatus();
  const nextTheme = getNextTheme();

  if (loading) {
    return (
      <div className="thematic-tournament loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando torneo temático...</p>
      </div>
    );
  }

  return (
    <div className="thematic-tournament">
      {/* Header del torneo */}
      <div className="tournament-header">
        <div className="tournament-info">
          <h2 className="tournament-title">
            🏆 {tournament.name}
            <span className="tournament-type">Temático</span>
          </h2>
          <p className="tournament-description">{tournament.description}</p>
          
          <div className="phase-status">
            <div className="phase-info">
              <span className={`phase-label ${phaseStatus.className}`}>
                {phaseStatus.phase}
              </span>
              <span className="phase-description">{phaseStatus.description}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${phaseStatus.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Estadísticas del torneo */}
        <div className="tournament-stats">
          <div className="stat-card">
            <span className="stat-value">{tournamentStats.totalParticipants}</span>
            <span className="stat-label">Participantes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{tournamentStats.totalThemes}</span>
            <span className="stat-label">Temas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{tournamentStats.completedThemes}</span>
            <span className="stat-label">Completados</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{tournamentStats.globalAverage}</span>
            <span className="stat-label">Promedio</span>
          </div>
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="tournament-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Resumen
        </button>
        <button
          className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          🎯 Temas
        </button>
        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Clasificación
        </button>
        <button
          className={`tab-btn ${activeTab === 'rounds' ? 'active' : ''}`}
          onClick={() => setActiveTab('rounds')}
        >
          🔄 Rondas
        </button>
      </div>

      {/* Contenido principal */}
      <div className="tournament-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Tema actual */}
            {tournamentData.currentTheme && (
              <div className="current-theme-section">
                <h3>🎯 Tema Actual</h3>
                <div className="current-theme-card">
                  <div className="theme-header">
                    <h4>{tournamentData.currentTheme.name}</h4>
                    <span className="theme-status active">⏱️ En Curso</span>
                  </div>
                  <p className="theme-description">
                    {tournamentData.currentTheme.description}
                  </p>
                  <div className="theme-meta">
                    <div className="meta-item">
                      <span className="meta-label">Categoría:</span>
                      <span className="meta-value">{tournamentData.currentTheme.category}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Área:</span>
                      <span className="meta-value">{tournamentData.currentTheme.knowledgeArea}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Participantes:</span>
                      <span className="meta-value">{tournamentData.currentTheme.participantCount}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Promedio:</span>
                      <span className="meta-value">{tournamentData.currentTheme.averageScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Próximo tema */}
            {nextTheme && (
              <div className="next-theme-section">
                <h3>⏭️ Próximo Tema</h3>
                <div className="next-theme-card">
                  <div className="theme-header">
                    <h4>{nextTheme.name}</h4>
                    <span className="theme-status upcoming">📅 Próximo</span>
                  </div>
                  <p className="theme-description">{nextTheme.description}</p>
                  <div className="theme-keywords">
                    <span className="keywords-label">Palabras clave:</span>
                    <div className="keywords-list">
                      {nextTheme.keywords?.slice(0, 5).map((keyword, index) => (
                        <span key={index} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen de temas */}
            <div className="themes-summary">
              <h3>📊 Resumen de Temas</h3>
              <div className="themes-progress-grid">
                {tournamentData.themes.map((theme, index) => (
                  <div
                    key={theme.id}
                    className={`theme-progress-card ${theme.isCompleted ? 'completed' : ''} ${theme.isActive ? 'active' : ''}`}
                  >
                    <div className="theme-number">{index + 1}</div>
                    <div className="theme-info">
                      <h5>{theme.name}</h5>
                      <span className="theme-category">{theme.category}</span>
                    </div>
                    <div className="theme-status-icon">
                      {theme.isCompleted && '✅'}
                      {theme.isActive && '⏱️'}
                      {!theme.isCompleted && !theme.isActive && '⏳'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estadísticas destacadas */}
            <div className="highlighted-stats">
              <h3>🌟 Estadísticas Destacadas</h3>
              <div className="stats-grid">
                <div className="stat-highlight">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <span className="stat-title">Participación</span>
                    <span className="stat-description">
                      {tournamentStats.activeParticipants} jugadores activos de {tournamentStats.totalParticipants} totales
                    </span>
                  </div>
                </div>
                
                <div className="stat-highlight">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <span className="stat-title">Tema Popular</span>
                    <span className="stat-description">
                      {tournamentStats.mostPopularTheme} con más participantes
                    </span>
                  </div>
                </div>
                
                <div className="stat-highlight">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <span className="stat-title">Progreso</span>
                    <span className="stat-description">
                      {Math.round(tournamentStats.overallProgress)}% del torneo completado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="themes-tab">
            <div className="themes-grid">
              {tournamentData.themes.map((theme, index) => (
                <div
                  key={theme.id}
                  className={`theme-card ${theme.isCompleted ? 'completed' : ''} ${theme.isActive ? 'active' : ''} ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div className="theme-header">
                    <div className="theme-number">{index + 1}</div>
                    <h4 className="theme-title">{theme.name}</h4>
                    <div className="theme-status">
                      {theme.isCompleted && <span className="status-completed">✅ Completado</span>}
                      {theme.isActive && <span className="status-active">⏱️ Activo</span>}
                      {!theme.isCompleted && !theme.isActive && <span className="status-upcoming">⏳ Próximo</span>}
                    </div>
                  </div>
                  
                  <p className="theme-description">{theme.description}</p>
                  
                  <div className="theme-details">
                    <div className="detail-item">
                      <span className="detail-label">Categoría:</span>
                      <span className="detail-value">{theme.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Área:</span>
                      <span className="detail-value">{theme.knowledgeArea}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Nivel:</span>
                      <span className="detail-value">{theme.educationalLevel}</span>
                    </div>
                  </div>

                  {theme.keywords && theme.keywords.length > 0 && (
                    <div className="theme-keywords">
                      <span className="keywords-label">Palabras clave:</span>
                      <div className="keywords-list">
                        {theme.keywords.slice(0, 3).map((keyword, idx) => (
                          <span key={idx} className="keyword-tag">
                            {keyword}
                          </span>
                        ))}
                        {theme.keywords.length > 3 && (
                          <span className="more-keywords">
                            +{theme.keywords.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="theme-stats">
                    <div className="stat">
                      <span className="stat-label">Participantes:</span>
                      <span className="stat-value">{theme.participantCount}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Promedio:</span>
                      <span className="stat-value">{theme.averageScore}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Bloques:</span>
                      <span className="stat-value">{theme.blocks?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detalles del tema seleccionado */}
            {selectedTheme && (
              <div className="theme-details-panel">
                <div className="panel-header">
                  <h3>📋 Detalles: {selectedTheme.name}</h3>
                  <button 
                    className="close-panel"
                    onClick={() => setSelectedTheme(null)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="panel-content">
                  <div className="theme-full-description">
                    <h4>Descripción</h4>
                    <p>{selectedTheme.description}</p>
                  </div>

                  {selectedTheme.blocks && selectedTheme.blocks.length > 0 && (
                    <div className="theme-blocks">
                      <h4>Bloques Relacionados ({selectedTheme.blocks.length})</h4>
                      <div className="blocks-list">
                        {selectedTheme.blocks.map(block => (
                          <div key={block.id} className="block-item">
                            <div className="block-info">
                              <span className="block-title">{block.title}</span>
                              <span className="block-description">{block.description}</span>
                            </div>
                            <div className="block-relevance">
                              <span className="relevance-score">
                                {Math.round((block.searchRelevance || 0) * 10)}% relevancia
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTheme.keywords && (
                    <div className="theme-all-keywords">
                      <h4>Todas las Palabras Clave</h4>
                      <div className="all-keywords-list">
                        {selectedTheme.keywords.map((keyword, index) => (
                          <span key={index} className="keyword-tag">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <ThematicLeaderboard
            leaderboard={tournamentData.leaderboard}
            themes={tournamentData.themes}
            tournament={tournament}
            isOrganizer={isOrganizer}
            isParticipant={isParticipant}
          />
        )}

        {activeTab === 'rounds' && (
          <ThematicRounds
            themes={tournamentData.themes}
            currentTheme={tournamentData.currentTheme}
            tournament={tournament}
            isOrganizer={isOrganizer}
            isParticipant={isParticipant}
            onUpdate={loadTournamentData}
          />
        )}
      </div>
    </div>
  );
};

export default ThematicTournament;