import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTournaments } from '../../../hooks/useTournaments';
import EliminationBracket from './EliminationBracket';
import './EliminationTournament.scss';

const EliminationTournament = ({ 
  tournament, 
  isOrganizer = false, 
  isParticipant = false 
}) => {
  const { 
    getTournamentBracket,
    loading 
  } = useTournaments();

  const [bracketData, setBracketData] = useState({
    rounds: [],
    participants: [],
    currentRound: 1,
    totalRounds: 0,
    winner: null
  });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [bracketView, setBracketView] = useState('tree'); // 'tree' o 'list'

  // Cargar datos del bracket
  const loadBracketData = useCallback(async () => {
    if (!tournament?.id) return;

    try {
      const result = await getTournamentBracket(tournament.id);
      
      if (result.success && result.bracket) {
        const { matches = [], participants = [] } = result.bracket;
        
        // Organizar matches por rondas
        const roundsMap = new Map();
        let maxRound = 0;
        
        matches.forEach(match => {
          const round = match.round || 1;
          maxRound = Math.max(maxRound, round);
          
          if (!roundsMap.has(round)) {
            roundsMap.set(round, []);
          }
          roundsMap.get(round).push(match);
        });

        // Convertir a array ordenado
        const rounds = Array.from(roundsMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([roundNum, roundMatches]) => ({
            number: roundNum,
            name: getRoundName(roundNum, maxRound),
            matches: roundMatches.sort((a, b) => (a.position || 0) - (b.position || 0))
          }));

        // Determinar ronda actual
        const currentRound = getCurrentRound(rounds);
        
        // Encontrar ganador
        const finalMatch = rounds[rounds.length - 1]?.matches?.[0];
        const winner = finalMatch?.status === 'completed' ? finalMatch.winner : null;

        setBracketData({
          rounds,
          participants,
          currentRound,
          totalRounds: maxRound,
          winner
        });
      }
    } catch (error) {
      console.error('Error cargando bracket:', error);
    }
  }, [tournament?.id, getTournamentBracket]);

  // Obtener nombre de la ronda
  const getRoundName = useCallback((roundNum, totalRounds) => {
    const remainingRounds = totalRounds - roundNum + 1;
    
    if (roundNum === totalRounds) return 'Final';
    if (roundNum === totalRounds - 1) return 'Semifinal';
    if (roundNum === totalRounds - 2) return 'Cuartos de Final';
    if (roundNum === 1) return 'Primera Ronda';
    
    return `Ronda ${roundNum}`;
  }, []);

  // Determinar ronda actual
  const getCurrentRound = useCallback((rounds) => {
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      const hasIncompleteMatches = round.matches.some(match => 
        match.status === 'pending' || match.status === 'in_progress'
      );
      
      if (hasIncompleteMatches) {
        return round.number;
      }
    }
    
    // Si todas las rondas están completas, retornar la última
    return rounds.length > 0 ? rounds[rounds.length - 1].number : 1;
  }, []);

  // Calcular estadísticas del torneo
  const tournamentStats = useMemo(() => {
    const totalMatches = bracketData.rounds.reduce((sum, round) => sum + round.matches.length, 0);
    const completedMatches = bracketData.rounds.reduce((sum, round) => 
      sum + round.matches.filter(match => match.status === 'completed').length, 0
    );
    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    // Calcular participantes activos (no eliminados)
    const activeParticipants = bracketData.participants.filter(p => !p.eliminated).length;

    return {
      totalMatches,
      completedMatches,
      progress,
      activeParticipants,
      eliminatedParticipants: bracketData.participants.length - activeParticipants
    };
  }, [bracketData]);

  // Obtener estado de la fase actual
  const getPhaseStatus = useCallback(() => {
    if (tournament?.status === 'finished') {
      return {
        phase: 'Torneo Finalizado',
        description: bracketData.winner ? 
          `🏆 Ganador: ${bracketData.winner.nickname}` : 
          'Torneo completado',
        className: 'finished',
        progress: 100
      };
    }

    if (tournament?.status === 'active') {
      const currentRoundData = bracketData.rounds.find(r => r.number === bracketData.currentRound);
      return {
        phase: currentRoundData?.name || 'En Progreso',
        description: `${tournamentStats.completedMatches} de ${tournamentStats.totalMatches} partidos completados`,
        className: 'active',
        progress: tournamentStats.progress
      };
    }

    return {
      phase: 'Preparación',
      description: 'El torneo aún no ha comenzado',
      className: 'preparation',
      progress: 0
    };
  }, [tournament?.status, bracketData, tournamentStats]);

  // Manejar selección de partido
  const handleMatchSelect = useCallback((match) => {
    setSelectedMatch(selectedMatch?.id === match.id ? null : match);
  }, [selectedMatch]);

  // Obtener próximos partidos
  const getUpcomingMatches = useCallback(() => {
    const currentRoundData = bracketData.rounds.find(r => r.number === bracketData.currentRound);
    if (!currentRoundData) return [];

    return currentRoundData.matches
      .filter(match => match.status === 'pending' || match.status === 'in_progress')
      .slice(0, 5); // Mostrar máximo 5 próximos partidos
  }, [bracketData.currentRound, bracketData.rounds]);

  // Cargar datos al montar
  useEffect(() => {
    loadBracketData();
  }, [loadBracketData]);

  // Recargar datos cada 30 segundos si el torneo está activo
  useEffect(() => {
    if (tournament?.status === 'active') {
      const interval = setInterval(loadBracketData, 30000);
      return () => clearInterval(interval);
    }
  }, [tournament?.status, loadBracketData]);

  const phaseStatus = getPhaseStatus();
  const upcomingMatches = getUpcomingMatches();

  if (loading) {
    return (
      <div className="elimination-tournament loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando bracket de eliminación...</p>
      </div>
    );
  }

  return (
    <div className="elimination-tournament">
      {/* Header del torneo */}
      <div className="tournament-header">
        <div className="tournament-info">
          <h2 className="tournament-title">
            🏆 {tournament.name}
            <span className="tournament-type">Eliminación</span>
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
            <span className="stat-value">{bracketData.participants.length}</span>
            <span className="stat-label">Participantes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{tournamentStats.activeParticipants}</span>
            <span className="stat-label">Activos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{bracketData.totalRounds}</span>
            <span className="stat-label">Rondas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{Math.round(tournamentStats.progress)}%</span>
            <span className="stat-label">Progreso</span>
          </div>
        </div>
      </div>

      {/* Controles de vista */}
      <div className="view-controls">
        <div className="view-options">
          <button
            className={`view-btn ${bracketView === 'tree' ? 'active' : ''}`}
            onClick={() => setBracketView('tree')}
          >
            🌳 Vista Árbol
          </button>
          <button
            className={`view-btn ${bracketView === 'list' ? 'active' : ''}`}
            onClick={() => setBracketView('list')}
          >
            📋 Vista Lista
          </button>
        </div>

        {/* Información del ganador */}
        {bracketData.winner && (
          <div className="winner-info">
            <span className="winner-label">🏆 Campeón:</span>
            <span className="winner-name">{bracketData.winner.nickname}</span>
          </div>
        )}
      </div>

      {/* Bracket principal */}
      <div className="bracket-container">
        {bracketView === 'tree' ? (
          <EliminationBracket
            rounds={bracketData.rounds}
            participants={bracketData.participants}
            currentRound={bracketData.currentRound}
            onMatchSelect={handleMatchSelect}
            selectedMatch={selectedMatch}
            isOrganizer={isOrganizer}
            isParticipant={isParticipant}
          />
        ) : (
          <div className="bracket-list-view">
            {bracketData.rounds.map(round => (
              <div key={round.number} className="round-section">
                <div className="round-header">
                  <h3 className="round-title">{round.name}</h3>
                  <span className="round-progress">
                    {round.matches.filter(m => m.status === 'completed').length} / {round.matches.length} completados
                  </span>
                </div>
                
                <div className="round-matches">
                  {round.matches.map(match => (
                    <div
                      key={match.id}
                      className={`match-card ${match.status} ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                      onClick={() => handleMatchSelect(match)}
                    >
                      <div className="match-participants">
                        <div className={`participant ${match.winner?.id === match.participant1?.id ? 'winner' : ''}`}>
                          <span className="participant-name">
                            {match.participant1?.nickname || 'TBD'}
                          </span>
                          <span className="participant-score">
                            {match.scores?.[match.participant1?.id] || 0}
                          </span>
                        </div>
                        
                        <div className="match-vs">VS</div>
                        
                        <div className={`participant ${match.winner?.id === match.participant2?.id ? 'winner' : ''}`}>
                          <span className="participant-name">
                            {match.participant2?.nickname || 'TBD'}
                          </span>
                          <span className="participant-score">
                            {match.scores?.[match.participant2?.id] || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className="match-meta">
                        <span className={`match-status ${match.status}`}>
                          {match.status === 'completed' && '✅ Completado'}
                          {match.status === 'in_progress' && '⏱️ En curso'}
                          {match.status === 'pending' && '⏳ Pendiente'}
                        </span>
                        {match.scheduledAt && (
                          <span className="match-time">
                            {new Date(match.scheduledAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel lateral con próximos partidos */}
      {upcomingMatches.length > 0 && (
        <div className="upcoming-matches">
          <h3>⏰ Próximos Partidos</h3>
          <div className="matches-list">
            {upcomingMatches.map(match => (
              <div key={match.id} className="upcoming-match">
                <div className="match-info">
                  <span className="participants">
                    {match.participant1?.nickname || 'TBD'} vs {match.participant2?.nickname || 'TBD'}
                  </span>
                  <span className="match-round">
                    {getRoundName(match.round, bracketData.totalRounds)}
                  </span>
                </div>
                {match.scheduledAt && (
                  <div className="match-schedule">
                    {new Date(match.scheduledAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de detalles del partido seleccionado */}
      {selectedMatch && (
        <div className="match-details-modal" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏟️ Detalles del Partido</h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedMatch(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="match-overview">
                <div className="participants-display">
                  <div className={`participant-detail ${selectedMatch.winner?.id === selectedMatch.participant1?.id ? 'winner' : ''}`}>
                    <div className="participant-avatar">
                      {selectedMatch.participant1?.nickname?.charAt(0) || '?'}
                    </div>
                    <div className="participant-info">
                      <span className="name">{selectedMatch.participant1?.nickname || 'TBD'}</span>
                      <span className="score">{selectedMatch.scores?.[selectedMatch.participant1?.id] || 0} puntos</span>
                    </div>
                  </div>
                  
                  <div className="vs-divider">VS</div>
                  
                  <div className={`participant-detail ${selectedMatch.winner?.id === selectedMatch.participant2?.id ? 'winner' : ''}`}>
                    <div className="participant-avatar">
                      {selectedMatch.participant2?.nickname?.charAt(0) || '?'}
                    </div>
                    <div className="participant-info">
                      <span className="name">{selectedMatch.participant2?.nickname || 'TBD'}</span>
                      <span className="score">{selectedMatch.scores?.[selectedMatch.participant2?.id] || 0} puntos</span>
                    </div>
                  </div>
                </div>
                
                <div className="match-metadata">
                  <div className="meta-item">
                    <span className="meta-label">Ronda:</span>
                    <span className="meta-value">
                      {getRoundName(selectedMatch.round, bracketData.totalRounds)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Estado:</span>
                    <span className={`meta-value status-${selectedMatch.status}`}>
                      {selectedMatch.status === 'completed' && '✅ Completado'}
                      {selectedMatch.status === 'in_progress' && '⏱️ En curso'}
                      {selectedMatch.status === 'pending' && '⏳ Pendiente'}
                    </span>
                  </div>
                  {selectedMatch.scheduledAt && (
                    <div className="meta-item">
                      <span className="meta-label">Programado:</span>
                      <span className="meta-value">
                        {new Date(selectedMatch.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedMatch.completedAt && (
                    <div className="meta-item">
                      <span className="meta-label">Completado:</span>
                      <span className="meta-value">
                        {new Date(selectedMatch.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EliminationTournament;