// API-based Data Service for PlayTest
// Reemplaza las funciones de localStorage con llamadas a la API

class APIDataService {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('playtest_auth_token');
  }

  // Helper method para hacer llamadas HTTP
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Simulación de delay para compatibilidad
  async simulateDelay(data, delay = 50) {
    return new Promise(resolve => 
      setTimeout(() => resolve(data), delay)
    );
  }

  // === AUTHENTICATION ===
  async login(nickname, password) {
    const response = await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nickname, password })
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('playtest_auth_token', this.token);
      
      // Para compatibilidad con sistema existente
      localStorage.setItem('playtest_session', JSON.stringify({
        userId: response.user.id,
        nickname: response.user.nickname
      }));
    }

    return this.simulateDelay(response);
  }

  async register(nickname, password, email) {
    const response = await this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nickname, password, email })
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('playtest_auth_token', this.token);
      
      localStorage.setItem('playtest_session', JSON.stringify({
        userId: response.user.id,
        nickname: response.user.nickname
      }));
    }

    return this.simulateDelay(response);
  }

  async logout() {
    await this.apiCall('/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('playtest_auth_token');
    localStorage.removeItem('playtest_session');
  }

  // === BLOCKS ===
  async fetchAllBlocks() {
    const blocks = await this.apiCall('/blocks');
    return this.simulateDelay(blocks);
  }

  async fetchAvailableBlocks() {
    try {
      const blocks = await this.apiCall('/blocks/available');
      return this.simulateDelay(blocks);
    } catch (error) {
      console.warn('⚠️ /blocks/available failed, using fallback to /blocks:', error.message);
      // Fallback to main blocks endpoint and filter public ones
      const allBlocks = await this.apiCall('/blocks');
      const publicBlocks = allBlocks.filter(block => block.isPublic !== false);
      return this.simulateDelay(publicBlocks);
    }
  }

  async fetchCreatedBlocks() {
    try {
      const blocks = await this.apiCall('/blocks/created');
      return this.simulateDelay(blocks);
    } catch (error) {
      console.warn('⚠️ /blocks/created failed, using fallback to /blocks:', error.message);
      // Fallback to main blocks endpoint and filter by current user
      const profile = await this.apiCall('/users/profile');
      const allBlocks = await this.apiCall('/blocks');
      const createdBlocks = allBlocks.filter(block => block.creatorId === profile.id);
      return this.simulateDelay(createdBlocks);
    }
  }

  async fetchLoadedBlocks() {
    try {
      // Get user profile to see which blocks are loaded
      const profile = await this.apiCall('/users/profile');
      const loadedBlockIds = profile.loadedBlocks || [];
      
      if (loadedBlockIds.length === 0) {
        return this.simulateDelay([]);
      }
      
      // Try to get available blocks first, fallback to all blocks
      let availableBlocks;
      try {
        availableBlocks = await this.apiCall('/blocks/available');
      } catch (error) {
        console.warn('⚠️ /blocks/available failed in fetchLoadedBlocks, using /blocks');
        availableBlocks = await this.apiCall('/blocks');
      }
      
      const loadedBlocks = availableBlocks.filter(block => 
        loadedBlockIds.includes(block.id)
      );
      
      return this.simulateDelay(loadedBlocks);
    } catch (error) {
      console.error('❌ Failed to fetch loaded blocks:', error);
      // Ultimate fallback - return empty array
      return this.simulateDelay([]);
    }
  }

  async createBlock(blockData) {
    const response = await this.apiCall('/blocks', {
      method: 'POST',
      body: JSON.stringify(blockData)
    });
    return this.simulateDelay(response);
  }

  async updateBlock(blockId, blockData) {
    const response = await this.apiCall(`/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(blockData)
    });
    return this.simulateDelay(response);
  }

  async deleteBlock(blockId) {
    const response = await this.apiCall(`/blocks/${blockId}`, {
      method: 'DELETE'
    });
    return this.simulateDelay(response);
  }

  async loadBlock(blockId) {
    try {
      const response = await this.apiCall(`/blocks/${blockId}/load`, {
        method: 'POST'
      });
      return this.simulateDelay(response);
    } catch (error) {
      console.warn('⚠️ Load block endpoint failed:', error.message);
      // For now, just return a success message - the functionality will work once backend is fixed
      return this.simulateDelay({ message: 'Block load will be available once backend is updated' });
    }
  }

  async unloadBlock(blockId) {
    try {
      const response = await this.apiCall(`/blocks/${blockId}/load`, {
        method: 'DELETE'
      });
      return this.simulateDelay(response);
    } catch (error) {
      console.warn('⚠️ Unload block endpoint failed:', error.message);
      // For now, just return a success message - the functionality will work once backend is fixed
      return this.simulateDelay({ message: 'Block unload will be available once backend is updated' });
    }
  }

  // === QUESTIONS ===
  async createQuestion(questionData) {
    const response = await this.apiCall('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData)
    });
    return this.simulateDelay(response);
  }

  async updateQuestion(questionId, questionData) {
    const response = await this.apiCall(`/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(questionData)
    });
    return this.simulateDelay(response);
  }

  async deleteQuestion(questionId) {
    const response = await this.apiCall(`/questions/${questionId}`, {
      method: 'DELETE'
    });
    return this.simulateDelay(response);
  }

  // === GAMES ===
  async fetchGamesForUser(userId) {
    const games = await this.apiCall('/games');
    
    // Transform backend response to frontend format for all games
    if (games && Array.isArray(games)) {
      const typeToMode = {
        'classic': 'Modo Clásico',
        'time-trial': 'Modo Contrarreloj',
        'lives': 'Modo Vidas',
        'by-levels': 'Por Niveles',
        'streak': 'Racha de Aciertos',
        'exam': 'Examen Simulado',
        'duel': 'Duelo',
        'marathon': 'Maratón',
        'trivial': 'Trivial'
      };
      
      // Transform each game properly without corrupting original
      const transformedGames = games.map(game => ({
        ...game,
        mode: game.gameType ? typeToMode[game.gameType] || game.gameType : game.mode
      }));
      
      return this.simulateDelay(transformedGames);
    }
    
    return this.simulateDelay(games);
  }

  async fetchGame(gameId) {
    const game = await this.apiCall(`/games/${gameId}`);
    
    // Transform backend response to frontend format
    if (game) {
      // Map gameType to mode for frontend compatibility
      const typeToMode = {
        'classic': 'Modo Clásico',
        'time-trial': 'Modo Contrarreloj',
        'lives': 'Modo Vidas',
        'by-levels': 'Por Niveles',
        'streak': 'Racha de Aciertos',
        'exam': 'Examen Simulado',
        'duel': 'Duelo',
        'marathon': 'Maratón',
        'trivial': 'Trivial'
      };
      
      // Create a new object to avoid corrupting the original
      const transformedGame = {
        ...game,
        mode: typeToMode[game.gameType] || game.gameType
      };
      
      return this.simulateDelay(transformedGame);
    }
    
    return this.simulateDelay(game);
  }

  async createGame(gameData) {
    const response = await this.apiCall('/games', {
      method: 'POST',
      body: JSON.stringify(gameData)
    });
    
    // If we get a gameId, fetch the full game object for consistency
    if (response && response.gameId) {
      const fullGame = await this.fetchGame(response.gameId);
      return this.simulateDelay(fullGame);
    }
    
    return this.simulateDelay(response);
  }

  async updateGame(gameId, updatedData) {
    const response = await this.apiCall(`/games/${gameId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData)
    });
    return this.simulateDelay(response.game);
  }

  async deleteGame(gameId) {
    const response = await this.apiCall(`/games/${gameId}`, {
      method: 'DELETE'
    });
    return this.simulateDelay(response);
  }

  async deleteGameForUser(userId, gameId) {
    return this.deleteGame(gameId);
  }

  // === SCORES ===
  async saveTrivialScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'trivial' 
      })
    });
    return this.simulateDelay(response);
  }

  async saveClassicScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'classic' 
      })
    });
    return this.simulateDelay(response);
  }

  async saveDuelScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'duel' 
      })
    });
    return this.simulateDelay(response);
  }

  async saveStreakScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'streak' 
      })
    });
    return this.simulateDelay(response);
  }

  async saveMarathonScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'marathon' 
      })
    });
    return this.simulateDelay(response);
  }

  async saveLivesScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'lives' 
      })
    });
    return this.simulateDelay(response);
  }

  async saveExamScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'exam' 
      })
    });
    return this.simulateDelay(response);
  }

  async saveTimeTrialScore(gameId, scoreData) {
    const response = await this.apiCall(`/games/${gameId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ 
        scoreData, 
        gameType: 'time-trial' 
      })
    });
    return this.simulateDelay(response);
  }

  // === USER STATS ===
  async updateUserStats(userId, gameId, gameResults, gameModeName) {
    const response = await this.apiCall('/users/stats', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        gameResults,
        gameType: gameModeName
      })
    });
    return this.simulateDelay(response);
  }

  // === USER PROFILE ===
  async getUserProfile() {
    const profile = await this.apiCall('/users/profile');
    return this.simulateDelay(profile);
  }

  async updateUserProfile(profileData) {
    const response = await this.apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return this.simulateDelay(response);
  }

  // === LEGACY COMPATIBILITY FUNCTIONS ===
  // These functions provide compatibility with the existing frontend
  
  async registerUser(userData) {
    return this.register(userData.nickname, userData.password, userData.email);
  }

  async fetchBlocksForUser(userId) {
    return this.fetchAllBlocks();
  }

  async fetchAllUsers() {
    // Temporary workaround - return empty array since /users route doesn't exist
    return this.simulateDelay([]);
  }

  async fetchAllUserProfiles() {
    // Temporary workaround - return empty array since /users/profiles route doesn't exist
    return this.simulateDelay([]);
  }

  async fetchAllUsersWithStats() {
    const users = await this.apiCall('/users/stats');
    return this.simulateDelay(users);
  }

  async fetchChallengesForUser(userId) {
    // Temporary workaround - return empty array since /games/challenges route doesn't exist
    return this.simulateDelay([]);
  }

  async fetchGameHistory(userId) {
    try {
      const history = await this.apiCall('/games/history');
      return this.simulateDelay(history || []);
    } catch (error) {
      console.warn('⚠️ Game history fetch failed, returning empty array:', error.message);
      return this.simulateDelay([]);
    }
  }

  async createGameForUser(userId, nickname, gameConfig) {
    // Map Spanish game modes to English gameType values
    const modeToType = {
      'Modo Clásico': 'classic',
      'Modo Contrarreloj': 'time-trial',
      'Modo Vidas': 'lives',
      'Por Niveles': 'by-levels',
      'Racha de Aciertos': 'streak',
      'Examen Simulado': 'exam',
      'Duelo': 'duel',
      'Maratón': 'marathon',
      'Trivial': 'trivial'
    };
    
    // Create properly formatted game data for backend
    const gameData = {
      gameType: modeToType[gameConfig.mode] || gameConfig.gameType || 'classic',
      config: gameConfig.config || gameConfig,  // Extract just the config part
      players: [
        {
          userId: userId,
          nickname: nickname,
          playerIndex: 0
        }
      ]
    };
    
    console.log('🚀 Creating game with data:', gameData);
    const result = await this.createGame(gameData);
    console.log('📝 Game creation result:', result);
    return result;
  }

  async addBlockToUser(userId, blockId) {
    const response = await this.apiCall(`/users/blocks/${blockId}`, {
      method: 'POST'
    });
    return this.simulateDelay(response);
  }

  async deleteBlockForUser(userId, blockId) {
    return this.deleteBlock(blockId);
  }

  async createChallenge(currentUser, challengedUser, gameConfig) {
    const response = await this.apiCall('/games/challenges', {
      method: 'POST',
      body: JSON.stringify({
        challengedUserId: challengedUser.id,
        gameConfig
      })
    });
    return this.simulateDelay(response);
  }

  async acceptChallenge(userId, gameId) {
    const response = await this.apiCall(`/games/challenges/${gameId}/accept`, {
      method: 'POST'
    });
    return this.simulateDelay(response);
  }

  async declineChallenge(userId, gameId) {
    const response = await this.apiCall(`/games/challenges/${gameId}/decline`, {
      method: 'POST'
    });
    return this.simulateDelay(response);
  }

  async fetchDetailedHistoryForBlock(userId, blockId) {
    const history = await this.apiCall(`/blocks/${blockId}/history`);
    return this.simulateDelay(history);
  }
}

// Configuración de la URL base según el entorno
const getAPIBaseURL = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  // URL de producción en Render
  return 'https://playtest-backend.onrender.com/api';
};

// Instancia global del servicio
const apiDataService = new APIDataService(getAPIBaseURL());

// Export para uso en diferentes contextos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIDataService, apiDataService };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to window
  window.APIDataService = APIDataService;
  window.apiDataService = apiDataService;
}
