import React, { useState, useCallback } from 'react';
import './LeagueTable.scss';

const LeagueTable = ({ 
  standings = [], 
  tournament, 
  onPlayerSelect, 
  selectedPlayer,
  isOrganizer = false,
  isParticipant = false 
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'position',
    direction: 'asc'
  });
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);

  // Manejar ordenamiento de columnas
  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Ordenar standings según configuración actual
  const sortedStandings = React.useMemo(() => {
    if (!sortConfig.key) return standings;

    return [...standings].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Manejar valores numéricos
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Manejar strings
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [standings, sortConfig]);

  // Obtener icono de tendencia
  const getTrendIcon = useCallback((trend) => {
    switch (trend) {
      case 'up':
        return <span className="trend-icon up">↗️</span>;
      case 'down':
        return <span className="trend-icon down">↘️</span>;
      default:
        return <span className="trend-icon neutral">➡️</span>;
    }
  }, []);

  // Obtener clase CSS para posición
  const getPositionClass = useCallback((position) => {
    if (position === 1) return 'gold';
    if (position === 2) return 'silver';
    if (position === 3) return 'bronze';
    if (position <= 5) return 'top-five';
    return '';
  }, []);

  // Manejar clic en fila
  const handleRowClick = useCallback((player) => {
    onPlayerSelect?.(player);
  }, [onPlayerSelect]);

  // Calcular estadísticas adicionales
  const getPlayerStats = useCallback((player) => {
    const gamesPlayed = (player.wins || 0) + (player.losses || 0) + (player.draws || 0);
    const winRate = gamesPlayed > 0 ? ((player.wins || 0) / gamesPlayed * 100) : 0;
    const avgScore = gamesPlayed > 0 ? ((player.totalScore || 0) / gamesPlayed) : 0;

    return {
      gamesPlayed,
      winRate: Math.round(winRate * 100) / 100,
      avgScore: Math.round(avgScore * 100) / 100
    };
  }, []);

  if (standings.length === 0) {
    return (
      <div className="league-table empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Sin clasificación disponible</h3>
          <p>Los datos aparecerán cuando se completen los primeros partidos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="league-table">
      <div className="table-header">
        <h3>📊 Clasificación</h3>
        <div className="table-actions">
          <button
            className={`view-toggle ${showPlayerDetails ? 'active' : ''}`}
            onClick={() => setShowPlayerDetails(!showPlayerDetails)}
            title={showPlayerDetails ? 'Vista simple' : 'Vista detallada'}
          >
            {showPlayerDetails ? '👁️‍🗨️' : '👁️'} 
            {showPlayerDetails ? 'Simple' : 'Detallado'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th 
                className={`sortable ${sortConfig.key === 'position' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('position')}
              >
                Pos.
              </th>
              <th>📈</th>
              <th 
                className={`sortable ${sortConfig.key === 'nickname' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('nickname')}
              >
                Jugador
              </th>
              <th 
                className={`sortable ${sortConfig.key === 'points' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('points')}
              >
                Pts
              </th>
              <th 
                className={`sortable ${sortConfig.key === 'wins' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('wins')}
              >
                G
              </th>
              <th 
                className={`sortable ${sortConfig.key === 'draws' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('draws')}
              >
                E
              </th>
              <th 
                className={`sortable ${sortConfig.key === 'losses' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('losses')}
              >
                P
              </th>
              {showPlayerDetails && (
                <>
                  <th 
                    className={`sortable ${sortConfig.key === 'totalScore' ? sortConfig.direction : ''}`}
                    onClick={() => handleSort('totalScore')}
                  >
                    Puntos Total
                  </th>
                  <th>% Victoria</th>
                  <th>Promedio</th>
                </>
              )}
              <th>Últimos 5</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((player, index) => {
              const stats = getPlayerStats(player);
              const isSelected = selectedPlayer?.id === player.id;
              const positionClass = getPositionClass(player.position);

              return (
                <tr
                  key={player.id}
                  className={`standings-row ${positionClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleRowClick(player)}
                >
                  <td className="position">
                    <span className={`position-number ${positionClass}`}>
                      {player.position}
                    </span>
                    {positionClass && (
                      <span className="position-medal">
                        {positionClass === 'gold' && '🥇'}
                        {positionClass === 'silver' && '🥈'}
                        {positionClass === 'bronze' && '🥉'}
                      </span>
                    )}
                  </td>
                  <td className="trend">
                    {getTrendIcon(player.trend)}
                  </td>
                  <td className="player-info">
                    <div className="player-name">
                      <span className="nickname">{player.nickname}</span>
                      {player.isCurrentUser && <span className="self-indicator">👤</span>}
                      {player.isOrganizer && <span className="organizer-indicator">👑</span>}
                    </div>
                    {showPlayerDetails && player.team && (
                      <div className="player-team">{player.team}</div>
                    )}
                  </td>
                  <td className="points">
                    <span className="points-value">{player.points || 0}</span>
                  </td>
                  <td className="wins">{player.wins || 0}</td>
                  <td className="draws">{player.draws || 0}</td>
                  <td className="losses">{player.losses || 0}</td>
                  {showPlayerDetails && (
                    <>
                      <td className="total-score">{player.totalScore || 0}</td>
                      <td className="win-rate">
                        <span className={`percentage ${stats.winRate >= 70 ? 'high' : stats.winRate >= 40 ? 'medium' : 'low'}`}>
                          {stats.winRate}%
                        </span>
                      </td>
                      <td className="avg-score">{stats.avgScore}</td>
                    </>
                  )}
                  <td className="recent-form">
                    <div className="form-indicators">
                      {(player.recentResults || []).slice(-5).map((result, idx) => (
                        <span
                          key={idx}
                          className={`form-indicator ${result.toLowerCase()}`}
                          title={`${result} vs ${result.opponent || 'Oponente'}`}
                        >
                          {result.charAt(0).toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Panel de detalles del jugador seleccionado */}
      {selectedPlayer && (
        <div className="player-details-panel">
          <div className="panel-header">
            <h4>📋 Detalles de {selectedPlayer.nickname}</h4>
            <button 
              className="close-panel"
              onClick={() => onPlayerSelect?.(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="panel-content">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Posición actual:</span>
                <span className="detail-value">#{selectedPlayer.position}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Puntos:</span>
                <span className="detail-value">{selectedPlayer.points || 0}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Partidos jugados:</span>
                <span className="detail-value">{getPlayerStats(selectedPlayer).gamesPlayed}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Porcentaje de victoria:</span>
                <span className="detail-value">{getPlayerStats(selectedPlayer).winRate}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Puntuación promedio:</span>
                <span className="detail-value">{getPlayerStats(selectedPlayer).avgScore}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mejor racha:</span>
                <span className="detail-value">{selectedPlayer.bestStreak || 0} victorias</span>
              </div>
            </div>

            {/* Histórico de enfrentamientos */}
            {selectedPlayer.matchHistory && selectedPlayer.matchHistory.length > 0 && (
              <div className="match-history">
                <h5>🏆 Últimos partidos</h5>
                <div className="matches-list">
                  {selectedPlayer.matchHistory.slice(0, 5).map((match, index) => (
                    <div key={index} className={`match-item ${match.result.toLowerCase()}`}>
                      <span className="match-opponent">vs {match.opponent}</span>
                      <span className="match-score">{match.score}</span>
                      <span className="match-result">{match.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="table-legend">
        <div className="legend-section">
          <span className="legend-title">Leyenda:</span>
          <div className="legend-items">
            <span className="legend-item">Pts = Puntos</span>
            <span className="legend-item">G = Ganados</span>
            <span className="legend-item">E = Empates</span>
            <span className="legend-item">P = Perdidos</span>
            <span className="legend-item">👑 = Organizador</span>
            <span className="legend-item">👤 = Tú</span>
          </div>
        </div>
        
        <div className="legend-section">
          <span className="legend-title">Forma reciente:</span>
          <div className="legend-items">
            <span className="form-indicator win">G</span>
            <span className="form-indicator draw">E</span>
            <span className="form-indicator loss">P</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueTable;