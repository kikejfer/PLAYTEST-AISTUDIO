import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { SystemIntegrations } from '../integrations/SystemIntegrations';

/**
 * Tipos de torneos disponibles
 */
export const TOURNAMENT_TYPES = {
  LEAGUE: 'league',                    // Liga: todos contra todos
  ELIMINATION: 'elimination',          // Eliminatorias: mata-mata
  GROUPS: 'groups',                   // Grupos: fase de grupos + eliminatorias
  THEMATIC: 'thematic'                // Temáticos: por área de conocimiento
};

/**
 * Estados de torneos
 */
export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',                     // Borrador
  REGISTRATION: 'registration',       // Inscripciones abiertas
  READY: 'ready',                     // Listo para empezar
  ACTIVE: 'active',                   // En curso
  PAUSED: 'paused',                   // Pausado
  FINISHED: 'finished',               // Finalizado
  CANCELLED: 'cancelled'              // Cancelado
};

/**
 * Formatos de clasificación
 */
export const RANKING_FORMATS = {
  POINTS: 'points',                   // Por puntos
  WINS: 'wins',                       // Por victorias
  PERCENTAGE: 'percentage',           // Por porcentaje
  TIME: 'time',                       // Por tiempo
  CUSTOM: 'custom'                    // Personalizado
};

/**
 * Contexto para gestión de torneos
 */
const TournamentsContext = createContext();

/**
 * Proveedor del contexto de torneos
 */
export const TournamentsProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState([]);

  /**
   * Cargar torneos públicos
   */
  const loadPublicTournaments = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/tournaments/public?${queryParams}`, {
        headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
        return data;
      } else {
        throw new Error('Error cargando torneos');
      }
    } catch (error) {
      console.error('Error cargando torneos públicos:', error);
      return { tournaments: [], error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Cargar mis torneos (creados y participando)
   */
  const loadMyTournaments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/tournaments/my-tournaments', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyTournaments(data.tournaments || []);
        return data;
      } else {
        throw new Error('Error cargando mis torneos');
      }
    } catch (error) {
      console.error('Error cargando mis torneos:', error);
      return { tournaments: [], error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Crear nuevo torneo
   */
  const createTournament = useCallback(async (tournamentData) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch('/api/tournaments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...tournamentData,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const newTournament = await response.json();
        setMyTournaments(prev => [newTournament, ...prev]);
        return { success: true, tournament: newTournament };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error creando torneo');
      }
    } catch (error) {
      console.error('Error creando torneo:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Registrarse en un torneo
   */
  const registerForTournament = useCallback(async (tournamentId, registrationData = {}) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          ...registrationData,
          registeredAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Actualizar lista de inscripciones
        setRegistrations(prev => [...prev, result.registration]);
        
        // Recargar torneos para actualizar contadores
        await loadPublicTournaments();
        await loadMyTournaments();
        
        return { success: true, registration: result.registration };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error en inscripción');
      }
    } catch (error) {
      console.error('Error registrándose en torneo:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, loadPublicTournaments, loadMyTournaments]);

  /**
   * Salirse de un torneo
   */
  const unregisterFromTournament = useCallback(async (tournamentId) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/unregister`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        // Actualizar lista de inscripciones
        setRegistrations(prev => prev.filter(reg => reg.tournamentId !== tournamentId));
        
        // Recargar torneos
        await loadPublicTournaments();
        await loadMyTournaments();
        
        return { success: true };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error cancelando inscripción');
      }
    } catch (error) {
      console.error('Error cancelando inscripción:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, loadPublicTournaments, loadMyTournaments]);

  /**
   * Obtener detalles de un torneo específico
   */
  const getTournamentDetails = useCallback(async (tournamentId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
      });

      if (response.ok) {
        const tournament = await response.json();
        return { success: true, tournament };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Torneo no encontrado');
      }
    } catch (error) {
      console.error('Error obteniendo detalles del torneo:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Iniciar torneo (solo organizador)
   */
  const startTournament = useCallback(async (tournamentId) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Actualizar estado local
        setMyTournaments(prev => 
          prev.map(t => t.id === tournamentId 
            ? { ...t, status: TOURNAMENT_STATUS.ACTIVE, startedAt: new Date().toISOString() }
            : t
          )
        );
        
        // Inicializar integraciones del torneo
        try {
          await SystemIntegrations.initializeTournament(
            result.tournament, 
            result.participants || []
          );
        } catch (integrationError) {
          console.warn('Error en integraciones del torneo:', integrationError);
        }
        
        return { success: true, tournament: result.tournament };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error iniciando torneo');
      }
    } catch (error) {
      console.error('Error iniciando torneo:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Finalizar torneo (solo organizador)
   */
  const finalizeTournament = useCallback(async (tournamentId, results, prizeDistribution) => {
    if (!user) throw new Error('Usuario no autenticado');

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          results,
          prizeDistribution,
          finalizedBy: user.id,
          finalizedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Actualizar estado local
        setMyTournaments(prev => 
          prev.map(t => t.id === tournamentId 
            ? { ...t, status: TOURNAMENT_STATUS.FINISHED, finishedAt: new Date().toISOString() }
            : t
          )
        );
        
        // Ejecutar integraciones de finalización
        try {
          const integrationResults = await SystemIntegrations.finalizeTournament(
            result.tournament, 
            results,
            prizeDistribution
          );
          
          return { 
            success: true, 
            tournament: result.tournament,
            integrations: integrationResults
          };
        } catch (integrationError) {
          console.warn('Error en integraciones de finalización:', integrationError);
          return { success: true, tournament: result.tournament };
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error finalizando torneo');
      }
    } catch (error) {
      console.error('Error finalizando torneo:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Obtener bracket/clasificación de un torneo
   */
  const getTournamentBracket = useCallback(async (tournamentId) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
        headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
      });

      if (response.ok) {
        const bracket = await response.json();
        return { success: true, bracket };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error obteniendo bracket');
      }
    } catch (error) {
      console.error('Error obteniendo bracket:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  /**
   * Obtener rankings/clasificaciones
   */
  const getTournamentRankings = useCallback(async (tournamentId) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/rankings`, {
        headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
      });

      if (response.ok) {
        const rankings = await response.json();
        return { success: true, rankings };
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error obteniendo rankings');
      }
    } catch (error) {
      console.error('Error obteniendo rankings:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  /**
   * Verificar si el usuario está registrado en un torneo
   */
  const isRegisteredInTournament = useCallback((tournamentId) => {
    return registrations.some(reg => reg.tournamentId === tournamentId);
  }, [registrations]);

  /**
   * Obtener estadísticas del usuario en torneos
   */
  const getUserTournamentStats = useCallback(async () => {
    if (!user) return null;

    try {
      const response = await fetch('/api/tournaments/my-stats', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const stats = await response.json();
        return stats;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }, [user]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadMyTournaments();
      
      // Cargar inscripciones del usuario
      fetch('/api/tournaments/my-registrations', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      .then(response => response.ok ? response.json() : { registrations: [] })
      .then(data => setRegistrations(data.registrations || []))
      .catch(error => console.error('Error cargando inscripciones:', error));
    }
  }, [user, loadMyTournaments]);

  const value = {
    // Estado
    tournaments,
    myTournaments,
    activeTournament,
    registrations,
    loading,
    
    // Constantes
    TOURNAMENT_TYPES,
    TOURNAMENT_STATUS,
    RANKING_FORMATS,
    
    // Funciones principales
    loadPublicTournaments,
    loadMyTournaments,
    createTournament,
    registerForTournament,
    unregisterFromTournament,
    getTournamentDetails,
    startTournament,
    finalizeTournament,
    getTournamentBracket,
    getTournamentRankings,
    getUserTournamentStats,
    
    // Utilidades
    isRegisteredInTournament,
    setActiveTournament
  };

  return (
    <TournamentsContext.Provider value={value}>
      {children}
    </TournamentsContext.Provider>
  );
};

/**
 * Hook para usar el contexto de torneos
 */
export const useTournaments = () => {
  const context = useContext(TournamentsContext);
  if (!context) {
    throw new Error('useTournaments debe usarse dentro de TournamentsProvider');
  }
  return context;
};

/**
 * Hook específico para crear torneos
 */
export const useTournamentCreation = () => {
  const { 
    createTournament, 
    TOURNAMENT_TYPES, 
    TOURNAMENT_STATUS, 
    RANKING_FORMATS,
    loading 
  } = useTournaments();

  const [creationStep, setCreationStep] = useState(0);
  const [tournamentDraft, setTournamentDraft] = useState({
    name: '',
    description: '',
    type: TOURNAMENT_TYPES.LEAGUE,
    maxParticipants: 16,
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    rules: '',
    prizes: [],
    blocks: [],
    settings: {}
  });

  const updateDraft = useCallback((updates) => {
    setTournamentDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetDraft = useCallback(() => {
    setTournamentDraft({
      name: '',
      description: '',
      type: TOURNAMENT_TYPES.LEAGUE,
      maxParticipants: 16,
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      rules: '',
      prizes: [],
      blocks: [],
      settings: {}
    });
    setCreationStep(0);
  }, [TOURNAMENT_TYPES.LEAGUE]);

  const submitTournament = useCallback(async () => {
    const result = await createTournament(tournamentDraft);
    if (result.success) {
      resetDraft();
    }
    return result;
  }, [createTournament, tournamentDraft, resetDraft]);

  return {
    creationStep,
    setCreationStep,
    tournamentDraft,
    updateDraft,
    resetDraft,
    submitTournament,
    loading,
    TOURNAMENT_TYPES,
    TOURNAMENT_STATUS,
    RANKING_FORMATS
  };
};