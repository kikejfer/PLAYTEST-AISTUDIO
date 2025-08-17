import React, { useState, useEffect, useCallback } from 'react';
import { useTournaments } from '../../../hooks/useTournaments';
import LeagueTable from './LeagueTable';
import LeagueSchedule from './LeagueSchedule';
import './LeagueTournament.scss';

const LeagueTournament = ({ 
  tournament, 
  isOrganizer = false, 
  isParticipant = false 
}) => {
  const { 
    getTournamentRankings, 
    getTournamentBracket,
    loading 
  } = useTournaments();

  const [activeTab, setActiveTab] = useState('table');
  const [leagueData, setLeagueData] = useState({
    standings: [],
    matches: [],
    statistics: {},
    currentRound: 1,
    totalRounds: 0
  });
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Cargar datos de la liga
  const loadLeagueData = useCallback(async () => {
    if (!tournament?.id) return;

    try {
      const [rankingsResult, bracketResult] = await Promise.all([
        getTournamentRankings(tournament.id),
        getTournamentBracket(tournament.id)
      ]);

      if (rankingsResult.success && bracketResult.success) {
        const standings = rankingsResult.rankings.standings || [];
        const matches = bracketResult.bracket.matches || [];
        
        // Calcular estadísticas
        const totalMatches = matches.length;
        const completedMatches = matches.filter(m => m.status === 'completed').length;
        const totalRounds = Math.max(...matches.map(m => m.round || 1), 1);
        const currentRound = getCurrentRound(matches);

        setLeagueData({
          standings: standings.map((player, index) => ({
            ...player,
            position: index + 1,
            trend: calculateTrend(player, standings)
          })),
          matches: matches.sort((a, b) => (a.round || 1) - (b.round || 1) || new Date(a.scheduledAt) - new Date(b.scheduledAt)),
          statistics: {
            totalMatches,
            completedMatches,
            completionPercentage: totalMatches > 0 ? (completedMatches / totalMatches * 100) : 0,
            averageScore: calculateAverageScore(matches),
            topScorer: getTopScorer(standings),
            mostActive: getMostActivePlayer(matches)
          },
          currentRound,
          totalRounds
        });
      }
    } catch (error) {
      console.error('Error cargando datos de liga:', error);
    }
  }, [tournament?.id, getTournamentRankings, getTournamentBracket]);

  // Calcular ronda actual
  const getCurrentRound = useCallback((matches) => {
    const completedRounds = [...new Set(
      matches
        .filter(m => m.status === 'completed')
        .map(m => m.round || 1)
    )];
    
    return Math.max(...completedRounds, 0) + 1;
  }, []);

  // Calcular tendencia de posición
  const calculateTrend = useCallback((player, standings) => {
    // Esta función necesitaría datos históricos de posiciones
    // Por ahora retornamos neutral
    return 'neutral'; // 'up', 'down', 'neutral'
  }, []);

  // Calcular puntuación promedio
  const calculateAverageScore = useCallback((matches) => {
    const completedMatches = matches.filter(m => m.status === 'completed' && m.scores);
    if (completedMatches.length === 0) return 0;

    const totalScore = completedMatches.reduce((sum, match) => {
      const scores = Object.values(match.scores || {});
      return sum + scores.reduce((matchSum, score) => matchSum + (score || 0), 0);
    }, 0);

    return Math.round(totalScore / (completedMatches.length * 2) * 100) / 100;
  }, []);

  // Obtener máximo goleador
  const getTopScorer = useCallback((standings) => {
    if (standings.length === 0) return null;
    return standings.reduce((top, player) => 
      (player.totalScore || 0) > (top.totalScore || 0) ? player : top
    );
  }, []);

  // Obtener jugador más activo
  const getMostActivePlayer = useCallback((matches) => {
    const playerActivity = {};
    
    matches.forEach(match => {
      if (match.participants) {
        match.participants.forEach(participant => {
          playerActivity[participant.id] = (playerActivity[participant.id] || 0) + 1;
        });
      }
    });

    const mostActive = Object.entries(playerActivity)
      .sort(([,a], [,b]) => b - a)[0];
    
    return mostActive ? { id: mostActive[0], matches: mostActive[1] } : null;
  }, []);

  // Manejar selección de jugador
  const handlePlayerSelect = useCallback((player) => {
    setSelectedPlayer(selectedPlayer?.id === player.id ? null : player);
  }, [selectedPlayer]);

  // Cargar datos al montar
  useEffect(() => {
    loadLeagueData();
  }, [loadLeagueData]);

  // Recargar datos cada 30 segundos si el torneo está activo
  useEffect(() => {
    if (tournament?.status === 'active') {
      const interval = setInterval(loadLeagueData, 30000);
      return () => clearInterval(interval);
    }
  }, [tournament?.status, loadLeagueData]);

  const getPhaseStatus = useCallback(() => {
    const { currentRound, totalRounds, statistics } = leagueData;
    
    if (tournament?.status === 'finished') {
      return {
        phase: 'Finalizado',
        progress: 100,
        description: 'El torneo ha terminado',
        className: 'finished'
      };
    }
    
    if (tournament?.status === 'active') {
      const progress = totalRounds > 0 ? (currentRound - 1) / totalRounds * 100 : 0;
      return {
        phase: `Jornada ${currentRound} de ${totalRounds}`,
        progress: Math.min(progress, 100),
        description: `${statistics.completedMatches || 0} de ${statistics.totalMatches || 0} partidos completados`,
        className: 'active'
      };
    }
    
    return {
      phase: 'Preparación',
      progress: 0,
      description: 'El torneo aún no ha comenzado',
      className: 'preparation'
    };
  }, [leagueData, tournament?.status]);

  const phaseStatus = getPhaseStatus();

  if (loading) {
    return (
      <div className="league-tournament loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando datos de la liga...</p>
      </div>
    );
  }

  return (
    <div className="league-tournament">
      {/* Header con información de la liga */}
      <div className="league-header">
        <div className="tournament-info">
          <h2 className="tournament-title">
            🏆 {tournament.name}
            <span className="tournament-type">Liga</span>
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

        {/* Estadísticas destacadas */}
        <div className="league-stats">
          <div className="stat-card">
            <span className="stat-value">{leagueData.standings.length}</span>
            <span className="stat-label">Participantes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{leagueData.statistics.completedMatches || 0}</span>
            <span className="stat-label">Partidos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{Math.round(leagueData.statistics.completionPercentage || 0)}%</span>
            <span className="stat-label">Progreso</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{leagueData.statistics.averageScore || 0}</span>
            <span className="stat-label">Promedio</span>
          </div>
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="league-tabs">
        <button
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          📊 Clasificación
        </button>
        <button
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Calendario
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📈 Estadísticas
        </button>
      </div>

      {/* Contenido principal */}
      <div className="league-content">
        {activeTab === 'table' && (
          <LeagueTable
            standings={leagueData.standings}
            tournament={tournament}
            onPlayerSelect={handlePlayerSelect}
            selectedPlayer={selectedPlayer}
            isOrganizer={isOrganizer}
            isParticipant={isParticipant}
          />
        )}

        {activeTab === 'schedule' && (
          <LeagueSchedule
            matches={leagueData.matches}
            tournament={tournament}
            currentRound={leagueData.currentRound}
            totalRounds={leagueData.totalRounds}
            isOrganizer={isOrganizer}
            isParticipant={isParticipant}
            onMatchUpdate={loadLeagueData}
          />
        )}

        {activeTab === 'stats' && (
          <div className="league-statistics">
            {/* Estadísticas destacadas */}
            <div className="stats-highlights">
              <div className="highlight-card">
                <h3>🎯 Máximo Goleador</h3>
                {leagueData.statistics.topScorer ? (
                  <div className="player-highlight">
                    <span className="player-name">{leagueData.statistics.topScorer.nickname}</span>
                    <span className="player-stat">{leagueData.statistics.topScorer.totalScore} puntos</span>
                  </div>
                ) : (
                  <p className="no-data">Sin datos disponibles</p>
                )}
              </div>

              <div className="highlight-card">
                <h3>⚡ Más Activo</h3>
                {leagueData.statistics.mostActive ? (
                  <div className="player-highlight">
                    <span className="player-name">Jugador #{leagueData.statistics.mostActive.id}</span>
                    <span className="player-stat">{leagueData.statistics.mostActive.matches} partidos</span>
                  </div>
                ) : (
                  <p className="no-data">Sin datos disponibles</p>
                )}
              </div>

              <div className="highlight-card">
                <h3>📊 Estadísticas Generales</h3>
                <div className="general-stats">
                  <div className="general-stat">
                    <span className="stat-label">Promedio de puntos:</span>
                    <span className="stat-value">{leagueData.statistics.averageScore || 0}</span>
                  </div>
                  <div className="general-stat">
                    <span className="stat-label">Jornadas completadas:</span>
                    <span className="stat-value">{leagueData.currentRound - 1} de {leagueData.totalRounds}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de progreso por jornadas */}
            <div className="progress-chart">
              <h3>📈 Progreso por Jornadas</h3>
              <div className="rounds-progress">
                {Array.from({ length: leagueData.totalRounds }, (_, i) => i + 1).map(round => {
                  const roundMatches = leagueData.matches.filter(m => (m.round || 1) === round);
                  const completedInRound = roundMatches.filter(m => m.status === 'completed').length;
                  const totalInRound = roundMatches.length;
                  const isCurrentRound = round === leagueData.currentRound;
                  
                  return (
                    <div 
                      key={round} 
                      className={`round-indicator ${isCurrentRound ? 'current' : ''} ${completedInRound === totalInRound && totalInRound > 0 ? 'completed' : ''}`}
                    >
                      <div className="round-number">{round}</div>
                      <div className="round-progress">
                        <div 
                          className="round-progress-bar" 
                          style={{ 
                            width: totalInRound > 0 ? `${(completedInRound / totalInRound) * 100}%` : '0%' 
                          }} 
                        />
                      </div>
                      <div className="round-info">
                        {completedInRound}/{totalInRound}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueTournament;