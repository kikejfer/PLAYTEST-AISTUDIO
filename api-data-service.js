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
    return this.simulateDelay(games);
  }

  async fetchGame(gameId) {
    const game = await this.apiCall(`/games/${gameId}`);
    return this.simulateDelay(game);
  }

  async createGame(gameData) {
    const response = await this.apiCall('/games', {
      method: 'POST',
      body: JSON.stringify(gameData)
    });
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
    // Temporary workaround - return empty array since /games/history route doesn't exist
    return this.simulateDelay([]);
  }

  async createGameForUser(userId, nickname, gameConfig) {
    return this.createGame(gameConfig);
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
    // Always use production API for now
    return 'https://playtest-backend.onrender.com/api';
  };

// Instancia global del servicio
const apiDataService = new APIDataService(getAPIBaseURL());

// Export para uso en diferentes contextos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIDataService, apiDataService };
}