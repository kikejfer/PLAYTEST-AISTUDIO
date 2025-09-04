// API-based Data Service for PlayTest
// Reemplaza las funciones de localStorage con llamadas a la API

class APIDataService {
  constructor(baseURL = null) {
    // Auto-detect API URL based on environment
    if (!baseURL) {
      // Check if running in development or production
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Development - try multiple local ports
        this.baseURL = 'http://localhost:3002/api'; // Updated to use current port
        this.fallbackURLs = [
          'http://localhost:3000/api',
          'http://localhost:3001/api'
        ];
      } else {
        // Production - use Render backend
        this.baseURL = 'https://playtest-backend.onrender.com/api';
        this.fallbackURLs = [];
      }
    } else {
      this.baseURL = baseURL;
      this.fallbackURLs = [];
    }
    
    this.token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
    console.log(`🌐 API Service initialized with base URL: ${this.baseURL}`);
  }

  // Helper method para hacer llamadas HTTP con respaldo
  async apiCall(endpoint, options = {}) {
    const urls = [this.baseURL, ...this.fallbackURLs];
    let lastError;

    for (let i = 0; i < urls.length; i++) {
      const baseUrl = urls[i];
      const url = `${baseUrl}${endpoint}`;
      const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
      const activeRole = localStorage.getItem('activeRole');
      console.log('🔍 activeRole from localStorage:', activeRole);
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(activeRole && { 'X-Current-Role': activeRole })
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
        // Debug logging for authorization issues
        if (endpoint.includes('/games/') || endpoint.includes('/questions')) {
          console.log('🔍 API Debug - URL:', url);
          console.log('🔍 API Debug - Token used:', token ? token.substring(0, 50) + '...' : 'null');
          console.log('🔍 API Debug - Headers:', finalOptions.headers);
        }
        
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
          if (endpoint.includes('/games/') || endpoint.includes('/questions')) {
            console.log('❌ API Debug - Response status:', response.status);
            console.log('❌ API Debug - Response headers:', Object.fromEntries(response.headers.entries()));
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Si la llamada fue exitosa con una URL diferente, actualizar la base URL
        if (i > 0) {
          console.log(`✅ Switched to working API URL: ${baseUrl}`);
          this.baseURL = baseUrl;
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (i === 0) {
          console.warn(`⚠️ Primary API URL failed (${url}):`, error.message);
        } else if (i < urls.length - 1) {
          console.warn(`⚠️ Fallback API URL failed (${url}):`, error.message);
        }
        
        // If this is the last URL, throw the error
        if (i === urls.length - 1) {
          // Mejorar mensajes de error para problemas comunes
          if (error.message === 'Failed to fetch') {
            console.error('🚨 Todos los backends no están disponibles:');
            urls.forEach(url => console.error(`  - ${url}`));
            console.error('💡 Posibles soluciones:');
            console.error('  1. Verificar que el backend esté ejecutándose');
            console.error('  2. Comprobar la conexión a internet');
            console.error('  3. Revisar la configuración de CORS');
          }
          
          console.error(`❌ API call failed for ${endpoint} on all URLs:`, error);
          throw error;
        }
      }
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
    try {
      const response = await this.apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ nickname, password })
      });

      if (response.token) {
        this.token = response.token;
        localStorage.setItem('playtest_auth_token', this.token);
        localStorage.setItem('authToken', this.token);
        
        // Para compatibilidad con sistema existente
        localStorage.setItem('playtest_session', JSON.stringify({
          userId: response.user.id,
          nickname: response.user.nickname
        }));
      }

      return this.simulateDelay(response);
    } catch (error) {
      console.warn('⚠️ Backend no disponible, usando login temporal:', error.message);
      
      // Fallback temporal mientras el backend se despierta
      if (nickname && password) {
        // Crear usuario temporal para desarrollo/demo
        const tempUser = {
          id: 1,
          nickname: nickname,
          firstName: 'Usuario',
          lastName: 'Demo',
          email: 'demo@playtest.com',
          roles: ['creador', 'jugador', 'profesor']
        };
        
        // Crear un token JWT-like válido para el decodificador
        const header = { alg: "none", typ: "JWT" };
        const payload = {
          user: tempUser,
          roles: tempUser.roles,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        };
        
        const tempToken = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.temp_signature';
        
        this.token = tempToken;
        localStorage.setItem('playtest_auth_token', tempToken);
        localStorage.setItem('authToken', tempToken);
        
        localStorage.setItem('playtest_session', JSON.stringify({
          userId: tempUser.id,
          nickname: tempUser.nickname
        }));
        
        console.log('✅ Login temporal exitoso para:', nickname);
        
        return this.simulateDelay({
          user: tempUser,
          token: tempToken
        });
      } else {
        throw new Error('Credenciales inválidas');
      }
    }
  }

  async register(nickname, password, email, firstName, lastName) {
    try {
      const response = await this.apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          nickname, 
          password, 
          email,
          firstName,
          lastName
        })
      });

      if (response.token) {
        this.token = response.token;
        localStorage.setItem('playtest_auth_token', this.token);
        localStorage.setItem('authToken', this.token);
        
        localStorage.setItem('playtest_session', JSON.stringify({
          userId: response.user.id,
          nickname: response.user.nickname
        }));
      }

      return this.simulateDelay(response);
    } catch (error) {
      console.warn('⚠️ Backend no disponible, usando registro temporal:', error.message);
      
      // Fallback temporal mientras el backend se despierta
      if (nickname && password) {
        // Crear usuario temporal para desarrollo/demo
        const tempUser = {
          id: Math.floor(Math.random() * 1000) + 1,
          nickname: nickname,
          firstName: firstName || 'Usuario',
          lastName: lastName || 'Nuevo',
          email: email || 'demo@playtest.com',
          roles: ['creador', 'jugador', 'profesor']
        };
        
        // Crear un token JWT-like válido para el decodificador
        const header = { alg: "none", typ: "JWT" };
        const payload = {
          user: tempUser,
          roles: tempUser.roles,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        };
        
        const tempToken = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.temp_signature';
        
        this.token = tempToken;
        localStorage.setItem('playtest_auth_token', tempToken);
        localStorage.setItem('authToken', tempToken);
        
        localStorage.setItem('playtest_session', JSON.stringify({
          userId: tempUser.id,
          nickname: tempUser.nickname
        }));
        
        console.log('✅ Registro temporal exitoso para:', nickname);
        
        return this.simulateDelay({
          user: tempUser,
          token: tempToken
        });
      } else {
        throw new Error('Datos de registro inválidos');
      }
    }
  }

  async logout() {
    await this.apiCall('/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('playtest_auth_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('playtest_session');
  }

  // === BLOCKS ===
  async fetchAllBlocks() {
    try {
      const blocks = await this.apiCall('/blocks');
      return this.simulateDelay(blocks);
    } catch (error) {
      console.warn('⚠️ Backend no disponible, usando bloques demo:', error.message);
      
      // Bloques demo para cuando el backend no esté disponible
      const demoBlocks = [
        {
          id: 1,
          nombreCorto: 'Matemáticas Demo',
          descripcion: 'Bloque de demostración de matemáticas',
          isPublic: true,
          creatorId: 1,
          questions: [
            {
              id: 1,
              tema: 'Álgebra',
              textoPregunta: '¿Cuánto es 2 + 2?',
              respuestas: [
                { textoRespuesta: '3', esCorrecta: false },
                { textoRespuesta: '4', esCorrecta: true },
                { textoRespuesta: '5', esCorrecta: false },
                { textoRespuesta: '6', esCorrecta: false }
              ],
              explicacionRespuesta: '2 + 2 = 4 es una operación básica de suma.',
              dificultad: 1
            },
            {
              id: 2,
              tema: 'Geometría', 
              textoPregunta: '¿Cuántos lados tiene un triángulo?',
              respuestas: [
                { textoRespuesta: '2', esCorrecta: false },
                { textoRespuesta: '3', esCorrecta: true },
                { textoRespuesta: '4', esCorrecta: false },
                { textoRespuesta: '5', esCorrecta: false }
              ],
              explicacionRespuesta: 'Un triángulo es un polígono de tres lados.',
              dificultad: 1
            }
          ]
        },
        {
          id: 2,
          nombreCorto: 'Historia Demo',
          descripcion: 'Bloque de demostración de historia',
          isPublic: true,
          creatorId: 1,
          questions: [
            {
              id: 3,
              tema: 'Historia Medieval',
              textoPregunta: '¿En qué año comenzó la Edad Media?',
              respuestas: [
                { textoRespuesta: '476 d.C.', esCorrecta: true },
                { textoRespuesta: '500 d.C.', esCorrecta: false },
                { textoRespuesta: '600 d.C.', esCorrecta: false },
                { textoRespuesta: '700 d.C.', esCorrecta: false }
              ],
              explicacionRespuesta: 'La Edad Media comenzó tradicionalmente en 476 d.C. con la caída del Imperio Romano de Occidente.',
              dificultad: 2
            }
          ]
        }
      ];
      
      return this.simulateDelay(demoBlocks);
    }
  }

  async fetchAvailableBlocks() {
    try {
      const blocks = await this.apiCall('/blocks/available');
      return this.simulateDelay(blocks);
    } catch (error) {
      console.warn('⚠️ /blocks/available failed, trying fallback to /blocks:', error.message);
      try {
        // Fallback to main blocks endpoint and filter public ones
        const allBlocks = await this.apiCall('/blocks');
        const publicBlocks = allBlocks.filter(block => block.isPublic !== false);
        return this.simulateDelay(publicBlocks);
      } catch (fallbackError) {
        console.error('❌ All blocks endpoints failed, using empty array:', fallbackError.message);
        // Ultimate fallback - return mock data for testing
        return this.simulateDelay([]);
      }
    }
  }

  async fetchCreatedBlocks() {
    try {
      const blocks = await this.apiCall('/blocks/created');
      return this.simulateDelay(blocks);
    } catch (error) {
      console.warn('⚠️ /blocks/created failed, trying fallback to /blocks:', error.message);
      try {
        // Fallback to main blocks endpoint and filter by current user
        const profile = await this.apiCall('/users/profile');
        const allBlocks = await this.apiCall('/blocks');
        const createdBlocks = allBlocks.filter(block => block.creatorId === profile.id);
        return this.simulateDelay(createdBlocks);
      } catch (fallbackError) {
        console.error('❌ All blocks endpoints failed for created blocks, using empty array:', fallbackError.message);
        // Ultimate fallback - return empty array
        return this.simulateDelay([]);
      }
    }
  }

  async fetchLoadedBlocks() {
    try {
      console.log('🔍 fetchLoadedBlocks: Calling /blocks/loaded endpoint');
      const loadedBlocks = await this.apiCall('/blocks/loaded');
      console.log('✅ fetchLoadedBlocks: Got', loadedBlocks.length, 'loaded blocks');
      return this.simulateDelay(loadedBlocks);
    } catch (error) {
      console.error('❌ Failed to fetch loaded blocks from /blocks/loaded, using fallback method:', error.message);
      
      // Fallback: Use the old method
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
          console.warn('⚠️ /blocks/available failed in fetchLoadedBlocks, trying /blocks');
          try {
            availableBlocks = await this.apiCall('/blocks');
          } catch (fallbackError) {
            console.error('❌ All blocks endpoints failed in fetchLoadedBlocks:', fallbackError.message);
            return this.simulateDelay([]);
          }
        }
        
        const loadedBlocks = availableBlocks.filter(block => 
          loadedBlockIds.includes(block.id)
        );
        
        return this.simulateDelay(loadedBlocks);
      } catch (fallbackError) {
        console.error('❌ Fallback method also failed, using empty array:', fallbackError);
        return this.simulateDelay([]);
      }
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
    try {
      console.log('🔍 fetchGamesForUser - Requesting games for user ID:', userId);
      const games = await this.apiCall('/games');
      console.log('📦 fetchGamesForUser - Raw response:', games);
      console.log('📦 fetchGamesForUser - Games count:', games ? games.length : 0);
      
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
        
        console.log('✅ fetchGamesForUser - Transformed games:', transformedGames);
        console.log('✅ fetchGamesForUser - Returning games count:', transformedGames.length);
        return this.simulateDelay(transformedGames);
      }
      
      console.log('⚠️ fetchGamesForUser - Games not array, returning as-is:', games);
      return this.simulateDelay(games || []);
    } catch (error) {
      console.error('❌ Failed to fetch games for user:', error.message);
      // Return empty array so dashboard still loads
      return this.simulateDelay([]);
    }
  }

  async fetchGame(gameId) {
    try {
      console.log('🔍 fetchGame - Requesting game ID:', gameId);
      
      // Debug token information
      const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
      console.log('🔑 fetchGame - Token exists:', !!token);
      console.log('🔑 fetchGame - Token length:', token ? token.length : 0);
      console.log('🔑 fetchGame - Token preview:', token ? token.substring(0, 50) + '...' : 'null');
      console.log('🔑 fetchGame - this.token:', this.token ? this.token.substring(0, 50) + '...' : 'null');
      
      const game = await this.apiCall(`/games/${gameId}`);
      console.log('📦 fetchGame - Raw response:', game);
      
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
        
        console.log('✅ fetchGame - Returning transformed game:', transformedGame);
        return this.simulateDelay(transformedGame);
      }
      
      console.log('⚠️ fetchGame - No game data, returning raw response:', game);
      return this.simulateDelay(game);
    } catch (error) {
      console.error('❌ Failed to fetch game:', gameId, error.message);
      // Check if this might be an emergency game ID
      if (gameId && gameId.toString().startsWith('emergency_')) {
        console.log('🚨 Creating emergency game data for ID:', gameId);
        return this.simulateDelay({
          id: gameId,
          gameType: 'classic',
          mode: 'Modo Clásico',
          config: {},
          players: [],
          status: 'active',
          isEmergencyGame: true
        });
      }
      throw error; // Re-throw if not emergency
    }
  }

  async createGame(gameData) {
    try {
      const response = await this.apiCall('/games', {
        method: 'POST',
        body: JSON.stringify(gameData)
      });
      
      // Return basic response immediately to avoid authorization timing issues
      if (response && response.gameId) {
        return this.simulateDelay({
          id: response.gameId,
          gameType: gameData.gameType,
          mode: this.getGameModeDisplay(gameData.gameType),
          config: gameData.config,
          players: gameData.players,
          status: 'active'
        });
      }
      
      return this.simulateDelay(response);
    } catch (error) {
      console.error('❌ Game creation failed, using emergency fallback:', error.message);
      // Emergency fallback - create a mock game that allows navigation
      const mockGameId = 'emergency_' + Date.now();
      const mockGame = {
        id: mockGameId,
        gameType: gameData.gameType || 'classic',
        mode: this.getGameModeDisplay(gameData.gameType) || 'Modo Clásico',
        config: gameData.config || {},
        players: gameData.players || [],
        status: 'active',
        isEmergencyGame: true
      };
      
      console.log('🚨 Created emergency game:', mockGame);
      return this.simulateDelay(mockGame);
    }
  }

  // Helper method for mode display
  getGameModeDisplay(gameType) {
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
    return typeToMode[gameType] || 'Modo Clásico';
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
    try {
      const profile = await this.apiCall('/users/profile');
      return this.simulateDelay(profile);
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error.message);
      // Return mock profile to prevent crashes
      return this.simulateDelay({
        id: this.getCurrentUserId(),
        nickname: 'User',
        email: 'user@example.com',
        stats: {
          consolidation: {
            byQuestion: {},
            byTopic: {},
            byBlock: {}
          }
        },
        loadedBlocks: []
      });
    }
  }

  // Helper to get current user ID from localStorage
  getCurrentUserId() {
    try {
      const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');
      return session.userId || 1;
    } catch {
      return 1;
    }
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
    try {
      const users = await this.apiCall('/users');
      return this.simulateDelay(users);
    } catch (error) {
      console.warn('⚠️ Failed to fetch all users:', error.message);
      return this.simulateDelay([]);
    }
  }

  async fetchAllUserProfiles() {
    try {
      const profiles = await this.apiCall('/users/profiles');
      return this.simulateDelay(profiles);
    } catch (error) {
      console.warn('⚠️ Failed to fetch all user profiles:', error.message);
      // Fallback: try to get basic user info and construct profiles
      try {
        const users = await this.fetchAllUsers();
        const profilesMap = {};
        
        // Create basic profile structure for each user
        for (const user of users) {
          profilesMap[user.id] = {
            id: user.id,
            nickname: user.nickname,
            loadedBlocks: user.loadedBlocks || []
          };
        }
        
        return this.simulateDelay(profilesMap);
      } catch (fallbackError) {
        console.error('❌ All user profile methods failed:', fallbackError.message);
        return this.simulateDelay({});
      }
    }
  }

  async fetchAllUsersWithStats() {
    const users = await this.apiCall('/users/stats');
    return this.simulateDelay(users);
  }

  async fetchChallengesForUser(userId) {
    try {
      const challenges = await this.apiCall(`/games/challenges/${userId}`);
      return this.simulateDelay(challenges);
    } catch (error) {
      console.warn('⚠️ Failed to fetch challenges for user:', error.message);
      return this.simulateDelay([]);
    }
  }

  async fetchGameHistory(userId) {
    try {
      const history = await this.apiCall(`/games/history/${userId}`);
      return this.simulateDelay(history || []);
    } catch (error) {
      console.warn('⚠️ Game history fetch failed, returning empty array:', error.message);
      return this.simulateDelay([]);
    }
  }

  // Helper function to create detailed configuration metadata
  async createConfigurationMetadata(gameConfig, allBlocks) {
    const metadata = {
      totalQuestions: 0,
      blocks: [],
      summary: {
        blockCount: 0,
        topicCount: 0,
        questionCount: 0
      },
      createdAt: new Date().toISOString()
    };

    if (!gameConfig || !allBlocks) {
      return metadata;
    }

    for (const [blockId, blockConfig] of Object.entries(gameConfig)) {
      const block = allBlocks.find(b => 
        b.id === parseInt(blockId) || b.id === blockId
      );
      
      if (!block) continue;

      let selectedTopics = [];
      let questionCount = 0;

      if (blockConfig.topics === 'all') {
        selectedTopics = [...new Set(block.questions.map(q => q.tema))];
        questionCount = block.questions.length;
      } else if (Array.isArray(blockConfig.topics)) {
        selectedTopics = blockConfig.topics;
        questionCount = block.questions.filter(q => blockConfig.topics.includes(q.tema)).length;
      }

      const blockMetadata = {
        blockId: block.id,
        blockName: block.nombreCorto,
        blockImage: block.urlImagenBloque,
        creatorNickname: block.creatorNickname,
        selectedTopics: selectedTopics,
        isAllTopics: blockConfig.topics === 'all',
        questionCount: questionCount,
        totalBlockQuestions: block.questions.length
      };

      metadata.blocks.push(blockMetadata);
      metadata.totalQuestions += questionCount;
    }

    metadata.summary.blockCount = metadata.blocks.length;
    metadata.summary.topicCount = metadata.blocks.reduce((count, block) => count + block.selectedTopics.length, 0);
    metadata.summary.questionCount = metadata.totalQuestions;

    return metadata;
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
    
    // Get blocks information to create detailed configuration metadata
    let configurationMetadata = null;
    try {
      const allBlocks = await this.fetchAllBlocks();
      configurationMetadata = await this.createConfigurationMetadata(gameConfig.config, allBlocks);
    } catch (error) {
      console.warn('⚠️ Failed to create configuration metadata:', error.message);
    }
    
    // Create properly formatted game data for backend
    const gameData = {
      gameType: modeToType[gameConfig.mode] || gameConfig.gameType || 'classic',
      config: gameConfig.config || gameConfig,  // Extract just the config part
      configurationMetadata: configurationMetadata, // Add detailed metadata
      players: [
        {
          userId: userId,
          nickname: nickname,
          playerIndex: 0
        }
      ]
    };
    
    // CRITICAL: Save game configuration for Active Games panel
    try {
      await this.saveGameConfiguration(gameData.gameType, gameData.config, configurationMetadata);
      console.log('✅ Game configuration saved for Active Games panel');
    } catch (configError) {
      console.warn('⚠️ Failed to save game configuration:', configError.message);
    }
    
    console.log('🚀 Creating game with data:', gameData);
    const result = await this.createGame(gameData);
    console.log('📝 Game creation result:', result);
    return result;
  }

  // === GAME CONFIGURATIONS (Active Games functionality) ===
  async saveGameConfiguration(gameType, config, metadata) {
    try {
      const response = await this.apiCall('/games/configurations', {
        method: 'POST',
        body: JSON.stringify({
          gameType: gameType,
          config: config,
          configurationMetadata: metadata
        })
      });
      return this.simulateDelay(response);
    } catch (error) {
      console.warn('⚠️ Failed to save game configuration:', error.message);
      throw error;
    }
  }

  async fetchGameConfigurations() {
    try {
      const configurations = await this.apiCall('/games/configurations');
      return this.simulateDelay(configurations || []);
    } catch (error) {
      console.warn('⚠️ Failed to fetch game configurations, returning empty array:', error.message);
      return this.simulateDelay([]);
    }
  }

  async deleteGameConfiguration(configId) {
    try {
      const response = await this.apiCall(`/games/configurations/${configId}`, {
        method: 'DELETE'
      });
      return this.simulateDelay(response);
    } catch (error) {
      console.warn('⚠️ Failed to delete game configuration:', error.message);
      throw error;
    }
  }

  async addBlockToUser(userId, blockId) {
    try {
      // Check if block is already loaded (since backend now auto-loads)
      const profile = await this.getUserProfile();
      if (profile.loadedBlocks && profile.loadedBlocks.includes(parseInt(blockId))) {
        console.log('ℹ️ Block already loaded by auto-loading, skipping manual add');
        return this.simulateDelay({ message: 'Block already loaded' });
      }
      
      const response = await this.apiCall(`/users/blocks/${blockId}`, {
        method: 'POST'
      });
      return this.simulateDelay(response);
    } catch (error) {
      console.warn('⚠️ addBlockToUser failed, block may already be auto-loaded:', error.message);
      // Don't throw error since block creation was successful
      return this.simulateDelay({ message: 'Block may already be loaded' });
    }
  }

  async deleteBlockForUser(userId, blockId) {
    return this.deleteBlock(blockId);
  }

  // Unload/Remove a block from user's loaded blocks
  async unloadBlockForUser(blockId) {
    const response = await this.apiCall(`/blocks/${blockId}/unload`, {
      method: 'DELETE'
    });
    return this.simulateDelay(response);
  }

  // Get created blocks with statistics for Bloques Creados section
  async fetchCreatedBlocksStats() {
    try {
      const blocksStats = await this.apiCall('/blocks/created-stats');
      return this.simulateDelay(blocksStats);
    } catch (error) {
      console.warn('⚠️ /blocks/created-stats failed, trying fallback to /blocks/created:', error.message);
      try {
        // Fallback to main created blocks endpoint (without stats)
        const allBlocks = await this.apiCall('/blocks/created');
        // Transform to include empty stats structure
        const blocksWithStats = allBlocks.map(block => ({
          ...block,
          stats: {
            totalQuestions: block.questionCount || 0,
            totalTopics: 0,
            totalUsers: 0
          }
        }));
        return this.simulateDelay(blocksWithStats);
      } catch (fallbackError) {
        console.error('❌ All blocks created endpoints failed, using empty array:', fallbackError.message);
        return this.simulateDelay([]);
      }
    }
  }

  // Get loaded blocks with statistics for Bloques Cargados section (PJG)
  async fetchLoadedBlocksStats() {
    try {
      const blocksStats = await this.apiCall('/blocks/loaded-stats');
      return this.simulateDelay(blocksStats);
    } catch (error) {
      console.warn('⚠️ /blocks/loaded-stats failed, trying fallback to /blocks/loaded:', error.message);
      try {
        // Fallback to main loaded blocks endpoint (without stats)
        const allBlocks = await this.apiCall('/blocks/loaded');
        // Transform to include empty stats structure
        const blocksWithStats = allBlocks.map(block => ({
          ...block,
          stats: {
            totalQuestions: block.questionCount || 0,
            totalTopics: 0,
            loadedAt: block.loadedAt || null
          }
        }));
        return this.simulateDelay(blocksWithStats);
      } catch (fallbackError) {
        console.error('❌ All blocks loaded endpoints failed, using empty array:', fallbackError.message);
        return this.simulateDelay([]);
      }
    }
  }

  // Get block metadata for dropdowns
  async fetchBlockMetadata() {
    try {
      const metadata = await this.apiCall('/blocks/metadata');
      return this.simulateDelay(metadata);
    } catch (error) {
      console.warn('⚠️ /blocks/metadata failed, trying individual endpoints:', error.message);
      try {
        // Fallback to individual endpoints
        const [types, levels, states] = await Promise.all([
          this.apiCall('/blocks/types').catch(() => []),
          this.apiCall('/blocks/levels').catch(() => []),
          this.apiCall('/blocks/states').catch(() => [])
        ]);
        
        return this.simulateDelay({
          types: types || [],
          levels: levels || [],
          states: states || []
        });
      } catch (fallbackError) {
        console.error('❌ All metadata endpoints failed, using empty arrays:', fallbackError.message);
        return this.simulateDelay({
          types: [],
          levels: [],
          states: []
        });
      }
    }
  }

  // Get individual metadata arrays
  async fetchBlockTypes() {
    try {
      return await this.apiCall('/blocks/types');
    } catch (error) {
      console.error('Error fetching block types:', error);
      return [];
    }
  }

  async fetchBlockLevels() {
    try {
      return await this.apiCall('/blocks/levels');
    } catch (error) {
      console.error('Error fetching block levels:', error);
      return [];
    }
  }

  async fetchBlockStates() {
    try {
      return await this.apiCall('/blocks/states');
    } catch (error) {
      console.error('Error fetching block states:', error);
      return [];
    }
  }

  async createChallenge(currentUser, challengedUser, gameConfig) {
    // Generate configuration metadata for challenges too
    let configurationMetadata = null;
    try {
      const allBlocks = await this.fetchAllBlocks();
      configurationMetadata = await this.createConfigurationMetadata(gameConfig.config, allBlocks);
    } catch (error) {
      console.warn('⚠️ Failed to create configuration metadata for challenge:', error.message);
    }
    
    const response = await this.apiCall('/games/challenges', {
      method: 'POST',
      body: JSON.stringify({
        challengedUserId: challengedUser.id,
        gameConfig: {
          ...gameConfig,
          configurationMetadata: configurationMetadata
        }
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

  // === GAME MODE SCORE FETCHERS ===
  async fetchTimeTrialScores(gameId) {
    try {
      console.log('📊 Fetching Time Trial scores for game:', gameId);
      const ranking = await this.apiCall(`/games/${gameId}/ranking`);
      console.log('✅ Time Trial scores loaded:', ranking.length, 'entries');
      return this.simulateDelay(ranking);
    } catch (error) {
      console.error('❌ Failed to fetch Time Trial scores:', error);
      return this.simulateDelay([]);
    }
  }

  async fetchMarathonScores(gameId) {
    try {
      console.log('📊 Fetching Marathon scores for game:', gameId);
      const ranking = await this.apiCall(`/games/${gameId}/ranking`);
      console.log('✅ Marathon scores loaded:', ranking.length, 'entries');
      return this.simulateDelay(ranking);
    } catch (error) {
      console.error('❌ Failed to fetch Marathon scores:', error);
      return this.simulateDelay([]);
    }
  }

  async fetchLivesScores(gameId) {
    console.log('⚠️ fetchLivesScores: returning empty array (not implemented yet)');
    return this.simulateDelay([]);
  }

  async fetchStreakScores(gameId) {
    console.log('⚠️ fetchStreakScores: returning empty array (not implemented yet)');
    return this.simulateDelay([]);
  }

  async fetchExamScores(gameId) {
    console.log('⚠️ fetchExamScores: returning empty array (not implemented yet)');
    return this.simulateDelay([]);
  }

  async fetchDuelScores(gameId) {
    console.log('⚠️ fetchDuelScores: returning empty array (not implemented yet)');
    return this.simulateDelay([]);
  }

  async fetchTrivialScores(gameId) {
    console.log('⚠️ fetchTrivialScores: returning empty array (not implemented yet)');
    return this.simulateDelay([]);
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
