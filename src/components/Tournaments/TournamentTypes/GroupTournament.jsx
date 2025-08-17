import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTournaments } from '../../../hooks/useTournaments';
import GroupStage from './GroupStage';
import EliminationBracket from './EliminationBracket';
import './GroupTournament.scss';

const GroupTournament = ({ 
  tournament, 
  isOrganizer = false, 
  isParticipant = false 
}) => {
  const { 
    getTournamentBracket,
    getTournamentRankings,
    loading 
  } = useTournaments();

  const [activePhase, setActivePhase] = useState('groups');
  const [tournamentData, setTournamentData] = useState({
    groups: [],
    knockoutBracket: [],
    currentPhase: 'groups',
    groupsCompleted: false,
    participants: [],
    qualifiedTeams: []
  });
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Cargar datos del torneo de grupos
  const loadTournamentData = useCallback(async () => {
    if (!tournament?.id) return;

    try {
      const [bracketResult, rankingsResult] = await Promise.all([
        getTournamentBracket(tournament.id),
        getTournamentRankings(tournament.id)
      ]);

      if (bracketResult.success && rankingsResult.success) {
        const { groups = [], knockoutMatches = [], participants = [] } = bracketResult.bracket;
        const { groupStandings = [] } = rankingsResult.rankings;

        // Procesar grupos con sus clasificaciones
        const processedGroups = groups.map(group => {
          const groupStanding = groupStandings.find(gs => gs.groupId === group.id);
          return {
            ...group,
            standings: groupStanding?.standings || [],
            isCompleted: checkGroupCompletion(group.matches || []),
            qualified: getQualifiedFromGroup(groupStanding?.standings || [], tournament.settings?.qualifiedPerGroup || 2)
          };
        });

        // Determinar si la fase de grupos está completa
        const groupsCompleted = processedGroups.every(group => group.isCompleted);
        
        // Obtener equipos clasificados
        const qualifiedTeams = processedGroups.reduce((acc, group) => {
          return [...acc, ...group.qualified];
        }, []);

        // Organizar bracket de eliminatorias
        const knockoutBracket = organizeKnockoutBracket(knockoutMatches);

        // Determinar fase actual
        const currentPhase = determineCurrentPhase(groupsCompleted, knockoutMatches);

        setTournamentData({
          groups: processedGroups,
          knockoutBracket,
          currentPhase,
          groupsCompleted,
          participants,
          qualifiedTeams
        });

        // Auto-seleccionar el primer grupo si no hay uno seleccionado
        if (!selectedGroup && processedGroups.length > 0) {
          setSelectedGroup(processedGroups[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del torneo de grupos:', error);
    }
  }, [tournament?.id, getTournamentBracket, getTournamentRankings, selectedGroup]);

  // Verificar si un grupo está completo
  const checkGroupCompletion = useCallback((matches) => {
    return matches.every(match => match.status === 'completed');
  }, []);

  // Obtener equipos clasificados de un grupo
  const getQualifiedFromGroup = useCallback((standings, qualifiedCount) => {
    return standings
      .slice(0, qualifiedCount)
      .map(standing => ({ ...standing, qualified: true }));
  }, []);

  // Organizar bracket de eliminatorias
  const organizeKnockoutBracket = useCallback((knockoutMatches) => {
    if (!knockoutMatches || knockoutMatches.length === 0) return [];

    // Agrupar por rondas
    const roundsMap = new Map();
    let maxRound = 0;

    knockoutMatches.forEach(match => {
      const round = match.round || 1;
      maxRound = Math.max(maxRound, round);
      
      if (!roundsMap.has(round)) {
        roundsMap.set(round, []);
      }
      roundsMap.get(round).push(match);
    });

    return Array.from(roundsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([roundNum, matches]) => ({
        number: roundNum,
        name: getKnockoutRoundName(roundNum, maxRound),
        matches: matches.sort((a, b) => (a.position || 0) - (b.position || 0))
      }));
  }, []);

  // Obtener nombre de ronda de eliminatorias
  const getKnockoutRoundName = useCallback((roundNum, totalRounds) => {
    const remainingRounds = totalRounds - roundNum + 1;
    
    if (roundNum === totalRounds) return 'Final';
    if (roundNum === totalRounds - 1) return 'Semifinal';
    if (roundNum === totalRounds - 2) return 'Cuartos de Final';
    if (roundNum === 1) return 'Octavos de Final';
    
    return `Ronda ${roundNum}`;
  }, []);

  // Determinar fase actual del torneo
  const determineCurrentPhase = useCallback((groupsCompleted, knockoutMatches) => {
    if (!groupsCompleted) return 'groups';
    if (knockoutMatches && knockoutMatches.length > 0) return 'knockout';
    return 'groups';
  }, []);

  // Calcular estadísticas del torneo
  const tournamentStats = useMemo(() => {
    const totalGroups = tournamentData.groups.length;
    const completedGroups = tournamentData.groups.filter(g => g.isCompleted).length;
    const totalGroupMatches = tournamentData.groups.reduce((sum, group) => 
      sum + (group.matches?.length || 0), 0
    );
    const completedGroupMatches = tournamentData.groups.reduce((sum, group) => 
      sum + (group.matches?.filter(m => m.status === 'completed').length || 0), 0
    );

    const knockoutMatches = tournamentData.knockoutBracket.reduce((sum, round) => 
      sum + round.matches.length, 0
    );
    const completedKnockoutMatches = tournamentData.knockoutBracket.reduce((sum, round) => 
      sum + round.matches.filter(m => m.status === 'completed').length, 0
    );

    const totalMatches = totalGroupMatches + knockoutMatches;
    const completedMatches = completedGroupMatches + completedKnockoutMatches;
    const overallProgress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    return {
      totalGroups,
      completedGroups,
      totalGroupMatches,
      completedGroupMatches,
      knockoutMatches,
      completedKnockoutMatches,
      totalMatches,
      completedMatches,
      overallProgress,
      groupProgress: totalGroupMatches > 0 ? (completedGroupMatches / totalGroupMatches) * 100 : 0,
      knockoutProgress: knockoutMatches > 0 ? (completedKnockoutMatches / knockoutMatches) * 100 : 0
    };
  }, [tournamentData]);

  // Obtener estado de la fase
  const getPhaseStatus = useCallback(() => {
    if (tournament?.status === 'finished') {
      return {
        phase: 'Torneo Finalizado',
        description: '🏆 Campeón determinado',
        className: 'finished',
        progress: 100
      };
    }

    if (tournament?.status === 'active') {
      if (tournamentData.currentPhase === 'groups') {
        return {
          phase: 'Fase de Grupos',
          description: `${tournamentStats.completedGroups} de ${tournamentStats.totalGroups} grupos completados`,
          className: 'groups-active',
          progress: tournamentStats.groupProgress
        };
      } else if (tournamentData.currentPhase === 'knockout') {
        return {
          phase: 'Fase Eliminatoria',
          description: `${tournamentStats.completedKnockoutMatches} de ${tournamentStats.knockoutMatches} partidos completados`,
          className: 'knockout-active',
          progress: tournamentStats.knockoutProgress
        };
      }
    }

    return {
      phase: 'Preparación',
      description: 'El torneo aún no ha comenzado',
      className: 'preparation',
      progress: 0
    };
  }, [tournament?.status, tournamentData.currentPhase, tournamentStats]);

  // Manejar selección de grupo
  const handleGroupSelect = useCallback((group) => {
    setSelectedGroup(selectedGroup?.id === group.id ? null : group);
  }, [selectedGroup]);

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

  // Auto-cambiar a fase eliminatoria cuando los grupos estén completos
  useEffect(() => {
    if (tournamentData.groupsCompleted && tournamentData.currentPhase === 'knockout' && activePhase === 'groups') {
      setActivePhase('knockout');
    }
  }, [tournamentData.groupsCompleted, tournamentData.currentPhase, activePhase]);

  const phaseStatus = getPhaseStatus();

  if (loading) {
    return (
      <div className="group-tournament loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando torneo de grupos...</p>
      </div>
    );
  }

  return (
    <div className="group-tournament">
      {/* Header del torneo */}
      <div className="tournament-header">
        <div className="tournament-info">
          <h2 className="tournament-title">
            🏆 {tournament.name}
            <span className="tournament-type">Grupos + Eliminatorias</span>
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
            <span className="stat-value">{tournamentData.participants.length}</span>
            <span className="stat-label">Participantes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{tournamentData.groups.length}</span>
            <span className="stat-label">Grupos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{tournamentData.qualifiedTeams.length}</span>
            <span className="stat-label">Clasificados</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{Math.round(tournamentStats.overallProgress)}%</span>
            <span className="stat-label">Progreso</span>
          </div>
        </div>
      </div>

      {/* Navegación de fases */}
      <div className="phase-navigation">
        <button
          className={`phase-btn ${activePhase === 'groups' ? 'active' : ''} ${tournamentData.currentPhase === 'groups' ? 'current' : ''}`}
          onClick={() => setActivePhase('groups')}
        >
          <span className="phase-icon">👥</span>
          <span className="phase-text">Fase de Grupos</span>
          <span className="phase-progress">
            {tournamentStats.completedGroups}/{tournamentStats.totalGroups}
          </span>
        </button>
        
        <div className="phase-separator">
          <div className={`arrow ${tournamentData.groupsCompleted ? 'active' : ''}`}>
            ➡️
          </div>
        </div>
        
        <button
          className={`phase-btn ${activePhase === 'knockout' ? 'active' : ''} ${tournamentData.currentPhase === 'knockout' ? 'current' : ''}`}
          onClick={() => setActivePhase('knockout')}
          disabled={!tournamentData.groupsCompleted}
        >
          <span className="phase-icon">🏆</span>
          <span className="phase-text">Eliminatorias</span>
          <span className="phase-progress">
            {tournamentStats.completedKnockoutMatches}/{tournamentStats.knockoutMatches}
          </span>
        </button>
      </div>

      {/* Contenido principal */}
      <div className="tournament-content">
        {activePhase === 'groups' && (
          <div className="groups-phase">
            <div className="groups-overview">
              <h3>📊 Grupos</h3>
              <div className="groups-grid">
                {tournamentData.groups.map((group, index) => (
                  <div
                    key={group.id}
                    className={`group-card ${group.isCompleted ? 'completed' : ''} ${selectedGroup?.id === group.id ? 'selected' : ''}`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <div className="group-header">
                      <h4 className="group-name">
                        Grupo {String.fromCharCode(65 + index)}
                      </h4>
                      <span className={`group-status ${group.isCompleted ? 'completed' : 'active'}`}>
                        {group.isCompleted ? '✅' : '⏱️'}
                      </span>
                    </div>
                    
                    <div className="group-stats">
                      <div className="stat">
                        <span className="stat-label">Equipos:</span>
                        <span className="stat-value">{group.standings?.length || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Partidos:</span>
                        <span className="stat-value">
                          {group.matches?.filter(m => m.status === 'completed').length || 0}/
                          {group.matches?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Vista previa de clasificados */}
                    {group.qualified.length > 0 && (
                      <div className="qualified-preview">
                        <span className="qualified-label">Clasifican:</span>
                        <div className="qualified-teams">
                          {group.qualified.slice(0, 2).map(team => (
                            <span key={team.id} className="qualified-team">
                              {team.nickname}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detalles del grupo seleccionado */}
            {selectedGroup && (
              <GroupStage
                group={selectedGroup}
                tournament={tournament}
                isOrganizer={isOrganizer}
                isParticipant={isParticipant}
                onUpdate={loadTournamentData}
              />
            )}
          </div>
        )}

        {activePhase === 'knockout' && (
          <div className="knockout-phase">
            {tournamentData.groupsCompleted ? (
              <div>
                <div className="knockout-header">
                  <h3>🏆 Fase Eliminatoria</h3>
                  <p>Los mejores equipos de cada grupo compiten por el título</p>
                </div>

                {/* Equipos clasificados */}
                <div className="qualified-teams-section">
                  <h4>🎯 Equipos Clasificados</h4>
                  <div className="qualified-grid">
                    {tournamentData.qualifiedTeams.map((team, index) => (
                      <div key={team.id} className="qualified-item">
                        <span className="team-position">#{index + 1}</span>
                        <span className="team-name">{team.nickname}</span>
                        <span className="team-group">
                          Grupo {String.fromCharCode(65 + (team.groupIndex || 0))}
                        </span>
                        <span className="team-points">{team.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bracket de eliminatorias */}
                <EliminationBracket
                  rounds={tournamentData.knockoutBracket}
                  participants={tournamentData.qualifiedTeams}
                  currentRound={1}
                  isOrganizer={isOrganizer}
                  isParticipant={isParticipant}
                />
              </div>
            ) : (
              <div className="knockout-waiting">
                <div className="waiting-content">
                  <div className="waiting-icon">⏳</div>
                  <h3>Esperando Clasificados</h3>
                  <p>La fase eliminatoria comenzará cuando se completen todos los grupos.</p>
                  <div className="groups-progress">
                    <span>Progreso: {tournamentStats.completedGroups} de {tournamentStats.totalGroups} grupos completados</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(tournamentStats.completedGroups / tournamentStats.totalGroups) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupTournament;