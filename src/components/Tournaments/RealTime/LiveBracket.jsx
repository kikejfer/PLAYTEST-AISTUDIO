import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTournaments } from '../../../hooks/useTournaments';
import './LiveBracket.scss';

const LiveBracket = ({ 
  tournament, 
  onMatchUpdate,
  enableNotifications = true,
  autoRefresh = true 
}) => {
  const { getTournamentBracket, loading } = useTournaments();
  
  const [bracketData, setBracketData] = useState({
    rounds: [],
    participants: [],
    liveMatches: [],
    recentUpdates: []
  });
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [animatingMatches, setAnimatingMatches] = useState(new Set());
  
  const wsRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const audioRef = useRef(null);

  // Conectar WebSocket para actualizaciones en tiempo real
  const connectWebSocket = useCallback(() => {
    if (!tournament?.id) return;

    try {
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/tournaments/${tournament.id}/bracket`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 Conectado al bracket en tiempo real');
        setConnectionStatus('connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Error procesando mensaje WebSocket:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 Desconectado del bracket en tiempo real');
        setConnectionStatus('disconnected');
        
        // Intentar reconectar en 5 segundos
        setTimeout(() => {
          if (tournament?.status === 'active') {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Error creando conexión WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [tournament?.id]);

  // Manejar actualizaciones en tiempo real
  const handleRealtimeUpdate = useCallback((data) => {
    const { type, payload } = data;

    switch (type) {
      case 'MATCH_UPDATED':
        handleMatchUpdate(payload);
        break;
      case 'MATCH_STARTED':
        handleMatchStart(payload);
        break;
      case 'MATCH_COMPLETED':
        handleMatchComplete(payload);
        break;
      case 'BRACKET_UPDATED':
        loadBracketData();
        break;
      case 'PARTICIPANT_ELIMINATED':
        handleParticipantElimination(payload);
        break;
      default:
        console.log('Tipo de actualización no reconocido:', type);
    }

    setLastUpdate(new Date());
  }, []);

  // Manejar actualización de partido
  const handleMatchUpdate = useCallback((matchData) => {
    setBracketData(prev => ({
      ...prev,
      rounds: prev.rounds.map(round => ({
        ...round,
        matches: round.matches.map(match => 
          match.id === matchData.id ? { ...match, ...matchData } : match
        )
      })),
      recentUpdates: [
        {
          id: Date.now(),
          type: 'match_update',
          message: `Actualización en ${matchData.participant1?.nickname} vs ${matchData.participant2?.nickname}`,
          timestamp: new Date(),
          matchId: matchData.id
        },
        ...prev.recentUpdates.slice(0, 9)
      ]
    }));

    // Animar actualización
    setAnimatingMatches(prev => new Set([...prev, matchData.id]));
    setTimeout(() => {
      setAnimatingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchData.id);
        return newSet;
      });
    }, 2000);

    // Notificación sonora
    if (enableNotifications) {
      playNotificationSound('update');
    }

    onMatchUpdate?.(matchData);
  }, [enableNotifications, onMatchUpdate]);

  // Manejar inicio de partido
  const handleMatchStart = useCallback((matchData) => {
    setBracketData(prev => ({
      ...prev,
      liveMatches: [...prev.liveMatches.filter(m => m.id !== matchData.id), matchData],
      recentUpdates: [
        {
          id: Date.now(),
          type: 'match_start',
          message: `¡Comenzó! ${matchData.participant1?.nickname} vs ${matchData.participant2?.nickname}`,
          timestamp: new Date(),
          matchId: matchData.id
        },
        ...prev.recentUpdates.slice(0, 9)
      ]
    }));

    if (enableNotifications) {
      playNotificationSound('start');
      showBrowserNotification('🏟️ Partido Iniciado', `${matchData.participant1?.nickname} vs ${matchData.participant2?.nickname}`);
    }
  }, [enableNotifications]);

  // Manejar finalización de partido
  const handleMatchComplete = useCallback((matchData) => {
    setBracketData(prev => ({
      ...prev,
      liveMatches: prev.liveMatches.filter(m => m.id !== matchData.id),
      recentUpdates: [
        {
          id: Date.now(),
          type: 'match_complete',
          message: `🏆 Ganador: ${matchData.winner?.nickname} vs ${matchData.participant1?.id === matchData.winner?.id ? matchData.participant2?.nickname : matchData.participant1?.nickname}`,
          timestamp: new Date(),
          matchId: matchData.id
        },
        ...prev.recentUpdates.slice(0, 9)
      ]
    }));

    // Animar finalización con efecto especial
    setAnimatingMatches(prev => new Set([...prev, matchData.id]));
    setTimeout(() => {
      setAnimatingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchData.id);
        return newSet;
      });
    }, 3000);

    if (enableNotifications) {
      playNotificationSound('complete');
      showBrowserNotification('🏆 Partido Finalizado', `Ganador: ${matchData.winner?.nickname}`);
    }

    onMatchUpdate?.(matchData);
  }, [enableNotifications, onMatchUpdate]);

  // Manejar eliminación de participante
  const handleParticipantElimination = useCallback((participantData) => {
    setBracketData(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === participantData.id ? { ...p, eliminated: true, eliminatedAt: new Date() } : p
      ),
      recentUpdates: [
        {
          id: Date.now(),
          type: 'elimination',
          message: `💔 ${participantData.nickname} ha sido eliminado`,
          timestamp: new Date(),
          participantId: participantData.id
        },
        ...prev.recentUpdates.slice(0, 9)
      ]
    }));

    if (enableNotifications) {
      playNotificationSound('elimination');
    }
  }, [enableNotifications]);

  // Cargar datos del bracket
  const loadBracketData = useCallback(async () => {
    if (!tournament?.id) return;

    try {
      const result = await getTournamentBracket(tournament.id);
      
      if (result.success && result.bracket) {
        const { rounds = [], participants = [], liveMatches = [] } = result.bracket;
        
        setBracketData(prev => ({
          rounds,
          participants,
          liveMatches,
          recentUpdates: prev.recentUpdates // Mantener actualizaciones previas
        }));
      }
    } catch (error) {
      console.error('Error cargando bracket:', error);
    }
  }, [tournament?.id, getTournamentBracket]);

  // Reproducir sonido de notificación
  const playNotificationSound = useCallback((type) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const sounds = {
      update: '/sounds/update.mp3',
      start: '/sounds/match-start.mp3',
      complete: '/sounds/victory.mp3',
      elimination: '/sounds/elimination.mp3'
    };

    if (sounds[type]) {
      audioRef.current.src = sounds[type];
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {
        // Ignorar errores de autoplay
      });
    }
  }, []);

  // Mostrar notificación del navegador
  const showBrowserNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'tournament-update'
      });
    }
  }, []);

  // Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Configurar polling como respaldo
  const setupPolling = useCallback(() => {
    if (!autoRefresh || connectionStatus === 'connected') return;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (tournament?.status === 'active') {
        loadBracketData();
      }
    }, 30000); // Cada 30 segundos como respaldo
  }, [autoRefresh, connectionStatus, tournament?.status, loadBracketData]);

  // Efectos
  useEffect(() => {
    if (tournament?.status === 'active') {
      connectWebSocket();
      requestNotificationPermission();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [tournament?.status, connectWebSocket, requestNotificationPermission]);

  useEffect(() => {
    setupPolling();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [setupPolling]);

  useEffect(() => {
    loadBracketData();
  }, [loadBracketData]);

  // Obtener estado de conexión
  const getConnectionStatusInfo = useCallback(() => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: '🟢',
          text: 'En vivo',
          className: 'connected'
        };
      case 'disconnected':
        return {
          icon: '🟡',
          text: 'Reconectando...',
          className: 'reconnecting'
        };
      case 'error':
        return {
          icon: '🔴',
          text: 'Sin conexión',
          className: 'error'
        };
      default:
        return {
          icon: '⚪',
          text: 'Conectando...',
          className: 'connecting'
        };
    }
  }, [connectionStatus]);

  const connectionInfo = getConnectionStatusInfo();

  if (loading) {
    return (
      <div className="live-bracket loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando bracket en tiempo real...</p>
      </div>
    );
  }

  return (
    <div className="live-bracket">
      {/* Header con estado de conexión */}
      <div className="bracket-header">
        <div className="header-left">
          <h3>🏆 Bracket en Tiempo Real</h3>
          <div className={`connection-status ${connectionInfo.className}`}>
            <span className="status-icon">{connectionInfo.icon}</span>
            <span className="status-text">{connectionInfo.text}</span>
            <span className="last-update">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={loadBracketData}
            disabled={loading}
            title="Actualizar manualmente"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Partidos en vivo */}
      {bracketData.liveMatches.length > 0 && (
        <div className="live-matches-section">
          <h4>🔴 En Vivo Ahora</h4>
          <div className="live-matches-grid">
            {bracketData.liveMatches.map(match => (
              <div
                key={match.id}
                className="live-match-card"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  <span className="live-text">EN VIVO</span>
                </div>
                
                <div className="match-participants">
                  <div className="participant">
                    <span className="participant-name">
                      {match.participant1?.nickname || 'TBD'}
                    </span>
                    <span className="participant-score">
                      {match.scores?.[match.participant1?.id] || 0}
                    </span>
                  </div>
                  
                  <div className="vs-divider">VS</div>
                  
                  <div className="participant">
                    <span className="participant-name">
                      {match.participant2?.nickname || 'TBD'}
                    </span>
                    <span className="participant-score">
                      {match.scores?.[match.participant2?.id] || 0}
                    </span>
                  </div>
                </div>
                
                <div className="match-round">
                  Ronda {match.round}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bracket principal */}
      <div className="bracket-container">
        {bracketData.rounds.map(round => (
          <div key={round.number} className="bracket-round">
            <div className="round-header">
              <h4>{round.name}</h4>
              <span className="round-progress">
                {round.matches.filter(m => m.status === 'completed').length} / {round.matches.length}
              </span>
            </div>
            
            <div className="round-matches">
              {round.matches.map(match => (
                <div
                  key={match.id}
                  className={`bracket-match ${match.status} ${animatingMatches.has(match.id) ? 'animating' : ''} ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMatch(match)}
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
                    
                    <div className={`participant ${match.winner?.id === match.participant2?.id ? 'winner' : ''}`}>
                      <span className="participant-name">
                        {match.participant2?.nickname || 'TBD'}
                      </span>
                      <span className="participant-score">
                        {match.scores?.[match.participant2?.id] || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="match-status">
                    {match.status === 'completed' && '✅'}
                    {match.status === 'in_progress' && '⏱️'}
                    {match.status === 'pending' && '⏳'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Panel de actualizaciones recientes */}
      {bracketData.recentUpdates.length > 0 && (
        <div className="recent-updates">
          <h4>📢 Actualizaciones Recientes</h4>
          <div className="updates-list">
            {bracketData.recentUpdates.map(update => (
              <div key={update.id} className={`update-item ${update.type}`}>
                <div className="update-content">
                  <span className="update-message">{update.message}</span>
                  <span className="update-time">
                    {update.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de detalles del partido */}
      {selectedMatch && (
        <div className="match-modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="match-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏟️ Detalles del Partido</h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedMatch(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="match-details">
                <div className="participants-display">
                  <div className={`participant-card ${selectedMatch.winner?.id === selectedMatch.participant1?.id ? 'winner' : ''}`}>
                    <div className="participant-avatar">
                      {selectedMatch.participant1?.nickname?.charAt(0) || '?'}
                    </div>
                    <div className="participant-info">
                      <span className="name">{selectedMatch.participant1?.nickname || 'TBD'}</span>
                      <span className="score">{selectedMatch.scores?.[selectedMatch.participant1?.id] || 0}</span>
                    </div>
                  </div>
                  
                  <div className="vs-large">VS</div>
                  
                  <div className={`participant-card ${selectedMatch.winner?.id === selectedMatch.participant2?.id ? 'winner' : ''}`}>
                    <div className="participant-avatar">
                      {selectedMatch.participant2?.nickname?.charAt(0) || '?'}
                    </div>
                    <div className="participant-info">
                      <span className="name">{selectedMatch.participant2?.nickname || 'TBD'}</span>
                      <span className="score">{selectedMatch.scores?.[selectedMatch.participant2?.id] || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="match-metadata">
                  <div className="meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Estado:</span>
                      <span className={`meta-value status-${selectedMatch.status}`}>
                        {selectedMatch.status === 'completed' && '✅ Finalizado'}
                        {selectedMatch.status === 'in_progress' && '⏱️ En curso'}
                        {selectedMatch.status === 'pending' && '⏳ Pendiente'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Ronda:</span>
                      <span className="meta-value">Ronda {selectedMatch.round}</span>
                    </div>
                    {selectedMatch.startedAt && (
                      <div className="meta-item">
                        <span className="meta-label">Iniciado:</span>
                        <span className="meta-value">
                          {new Date(selectedMatch.startedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedMatch.completedAt && (
                      <div className="meta-item">
                        <span className="meta-label">Finalizado:</span>
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
        </div>
      )}
    </div>
  );
};

export default LiveBracket;