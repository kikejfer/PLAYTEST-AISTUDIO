import React, { useState, useEffect, useCallback } from 'react';
import { useTournaments } from '../../hooks/useTournaments';
import TournamentCard from './TournamentCard';
import TournamentCreator from './TournamentCreator';
import TournamentFilters from './TournamentFilters';
import './TournamentDashboard.scss';

const TournamentDashboard = () => {
  const {
    tournaments,
    myTournaments,
    loading,
    loadPublicTournaments,
    loadMyTournaments,
    getUserTournamentStats,
    TOURNAMENT_STATUS,
    TOURNAMENT_TYPES
  } = useTournaments();

  const [activeTab, setActiveTab] = useState('public');
  const [showCreator, setShowCreator] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    sortBy: 'created_desc'
  });
  const [userStats, setUserStats] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadPublicTournaments(filters);
  }, [loadPublicTournaments, filters]);

  // Cargar estadísticas del usuario
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getUserTournamentStats();
      setUserStats(stats);
    };
    loadStats();
  }, [getUserTournamentStats]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleCreateTournament = useCallback(() => {
    setShowCreator(true);
  }, []);

  const handleTournamentCreated = useCallback(() => {
    setShowCreator(false);
    loadMyTournaments();
    loadPublicTournaments(filters);
  }, [loadMyTournaments, loadPublicTournaments, filters]);

  const getFilteredTournaments = useCallback((tournamentList) => {
    return tournamentList.filter(tournament => {
      // Filtro por tipo
      if (filters.type && tournament.type !== filters.type) {
        return false;
      }
      
      // Filtro por estado
      if (filters.status && tournament.status !== filters.status) {
        return false;
      }
      
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          tournament.name.toLowerCase().includes(searchLower) ||
          tournament.description?.toLowerCase().includes(searchLower) ||
          tournament.organizer?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'created_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'created_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'start_date':
          return new Date(a.startDate) - new Date(b.startDate);
        case 'participants':
          return (b.participantCount || 0) - (a.participantCount || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [filters]);

  const publicTournaments = getFilteredTournaments(tournaments);
  const myFilteredTournaments = getFilteredTournaments(myTournaments);

  const getStatusCounts = useCallback((tournamentList) => {
    return Object.values(TOURNAMENT_STATUS).reduce((counts, status) => {
      counts[status] = tournamentList.filter(t => t.status === status).length;
      return counts;
    }, {});
  }, [TOURNAMENT_STATUS]);

  const myTournamentCounts = getStatusCounts(myTournaments);

  return (
    <div className="tournament-dashboard">
      {/* Header con estadísticas */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">🏆 Torneos PlayTest</h1>
          <p className="dashboard-subtitle">
            Compite con otros usuarios en desafíos emocionantes
          </p>
          
          {userStats && (
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-value">{userStats.tournamentsParticipated || 0}</span>
                <span className="stat-label">Participaciones</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{userStats.tournamentsWon || 0}</span>
                <span className="stat-label">Victorias</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{userStats.tournamentsCreated || 0}</span>
                <span className="stat-label">Organizados</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{userStats.totalPoints || 0}</span>
                <span className="stat-label">Puntos</span>
              </div>
            </div>
          )}
        </div>

        <div className="header-actions">
          <button 
            className="btn btn-primary create-tournament-btn"
            onClick={handleCreateTournament}
          >
            ➕ Crear Torneo
          </button>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveTab('public')}
        >
          🌐 Torneos Públicos
          <span className="tab-count">{tournaments.length}</span>
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'my-tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-tournaments')}
        >
          👤 Mis Torneos
          <span className="tab-count">{myTournaments.length}</span>
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'participating' ? 'active' : ''}`}
          onClick={() => setActiveTab('participating')}
        >
          🎮 Participando
          <span className="tab-count">
            {myTournaments.filter(t => t.isParticipating && !t.isOrganizer).length}
          </span>
        </button>
      </div>

      {/* Filtros */}
      <TournamentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        className="dashboard-filters"
      />

      {/* Contenido principal */}
      <div className="dashboard-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Cargando torneos...</p>
          </div>
        )}

        {/* Pestaña de torneos públicos */}
        {activeTab === 'public' && !loading && (
          <div className="tournaments-grid">
            {publicTournaments.length > 0 ? (
              publicTournaments.map(tournament => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  showActions={true}
                  variant="public"
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No se encontraron torneos</h3>
                <p>
                  {filters.search || filters.type || filters.status
                    ? 'Intenta ajustar los filtros para ver más resultados.'
                    : 'No hay torneos públicos disponibles en este momento.'
                  }
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateTournament}
                >
                  Crear el primer torneo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pestaña de mis torneos */}
        {activeTab === 'my-tournaments' && !loading && (
          <div className="my-tournaments-section">
            {/* Resumen de estados */}
            <div className="status-summary">
              <div className="summary-item">
                <span className="summary-count">{myTournamentCounts[TOURNAMENT_STATUS.DRAFT] || 0}</span>
                <span className="summary-label">Borradores</span>
              </div>
              <div className="summary-item">
                <span className="summary-count">{myTournamentCounts[TOURNAMENT_STATUS.REGISTRATION] || 0}</span>
                <span className="summary-label">Inscripciones</span>
              </div>
              <div className="summary-item">
                <span className="summary-count">{myTournamentCounts[TOURNAMENT_STATUS.ACTIVE] || 0}</span>
                <span className="summary-label">Activos</span>
              </div>
              <div className="summary-item">
                <span className="summary-count">{myTournamentCounts[TOURNAMENT_STATUS.FINISHED] || 0}</span>
                <span className="summary-label">Finalizados</span>
              </div>
            </div>

            <div className="tournaments-grid">
              {myFilteredTournaments.length > 0 ? (
                myFilteredTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    showActions={true}
                    variant="owner"
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <h3>No has creado torneos aún</h3>
                  <p>Organiza tu primer torneo y desafía a otros usuarios.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreateTournament}
                  >
                    Crear mi primer torneo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestaña de participaciones */}
        {activeTab === 'participating' && !loading && (
          <div className="tournaments-grid">
            {myTournaments
              .filter(t => t.isParticipating && !t.isOrganizer)
              .map(tournament => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  showActions={true}
                  variant="participant"
                />
              ))
            }
            
            {myTournaments.filter(t => t.isParticipating && !t.isOrganizer).length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎮</div>
                <h3>No estás participando en torneos</h3>
                <p>Únete a torneos públicos para competir con otros usuarios.</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('public')}
                >
                  Ver torneos públicos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de creación de torneo */}
      {showCreator && (
        <TournamentCreator
          onClose={() => setShowCreator(false)}
          onTournamentCreated={handleTournamentCreated}
        />
      )}
    </div>
  );
};

export default TournamentDashboard;