/**
 * LUMINARIAS MANAGER
 * Sistema centralizado para gestionar la moneda virtual "Luminarias"
 * en PLAYTEST
 */

class LuminariasManager {
    constructor() {
        this.currentBalance = 0;
        this.API_BASE = '/api/luminarias';
        this.listeners = [];
        this.isInitialized = false;
    }

    /**
     * Inicializa el gestor de Luminarias
     * Carga el balance actual del usuario
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('🪙 Luminarias Manager already initialized');
            return;
        }

        try {
            const token = localStorage.getItem('playtest_auth_token');
            if (!token) {
                console.warn('⚠️ No auth token found for Luminarias');
                return;
            }

            await this.loadBalance();
            this.isInitialized = true;
            console.log('✅ Luminarias Manager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Luminarias Manager:', error);
        }
    }

    /**
     * Carga el balance actual desde el backend
     * @returns {Promise<number>} Balance actual
     */
    async loadBalance() {
        try {
            const token = localStorage.getItem('playtest_auth_token');
            const response = await fetch(`${this.API_BASE}/balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentBalance = data.current_balance || 0;
                this.updateDisplay();
                this.notifyListeners();
                console.log('🪙 Balance loaded:', this.currentBalance);
                return this.currentBalance;
            } else {
                console.error('Error loading balance:', response.status);
                return 0;
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            return 0;
        }
    }

    /**
     * Procesa una transacción de Luminarias
     * @param {Object} transactionData
     * @param {string} transactionData.transaction_type - 'earn' o 'spend'
     * @param {number} transactionData.amount - Cantidad
     * @param {string} transactionData.user_role - 'user' o 'creator'
     * @param {string} transactionData.category - Categoría de la transacción
     * @param {string} transactionData.subcategory - Subcategoría
     * @param {string} transactionData.action_type - Tipo de acción específica
     * @param {string} transactionData.description - Descripción legible
     * @param {number} [transactionData.reference_id] - ID de referencia opcional
     * @param {string} [transactionData.reference_type] - Tipo de referencia
     * @param {Object} [transactionData.metadata] - Metadatos adicionales
     * @returns {Promise<Object>} Resultado de la transacción
     */
    async processTransaction(transactionData) {
        try {
            const token = localStorage.getItem('playtest_auth_token');
            const response = await fetch(`${this.API_BASE}/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(transactionData)
            });

            const result = await response.json();

            if (response.ok) {
                // Actualizar balance local
                await this.loadBalance();
                console.log('✅ Transaction processed:', result);
                return { success: true, ...result };
            } else {
                console.error('Error processing transaction:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error in transaction:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Recompensa al usuario con Luminarias por completar una partida
     * @param {Object} gameData
     * @param {string} gameData.gameMode - Modo de juego ('classic', 'time_trial', etc.)
     * @param {number} gameData.correctAnswers - Respuestas correctas
     * @param {number} gameData.totalQuestions - Total de preguntas
     * @param {number} gameData.score - Puntuación obtenida
     * @param {boolean} [gameData.victory] - Si ganó la partida
     * @returns {Promise<Object>} Resultado con cantidad de Luminarias ganadas
     */
    async rewardGameCompletion(gameData) {
        try {
            // Calcular Luminarias según rendimiento
            const luminariasEarned = this.calculateGameReward(gameData);

            if (luminariasEarned <= 0) {
                return { success: true, amount: 0, message: 'No se ganaron Luminarias esta vez' };
            }

            const transaction = {
                transaction_type: 'earn',
                amount: luminariasEarned,
                user_role: 'user',
                category: 'user_earning',
                subcategory: 'study_activity',
                action_type: 'complete_session',
                description: `Completar partida en modo ${this.getGameModeName(gameData.gameMode)}: ${gameData.correctAnswers}/${gameData.totalQuestions} correctas`,
                metadata: {
                    game_mode: gameData.gameMode,
                    correct_answers: gameData.correctAnswers,
                    total_questions: gameData.totalQuestions,
                    score: gameData.score,
                    victory: gameData.victory || false
                }
            };

            const result = await this.processTransaction(transaction);

            if (result.success) {
                // Mostrar notificación visual
                this.showRewardNotification(luminariasEarned, gameData);
                return { success: true, amount: luminariasEarned, ...result };
            }

            return result;
        } catch (error) {
            console.error('Error rewarding game completion:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calcula la recompensa de Luminarias según el rendimiento
     * @param {Object} gameData
     * @returns {number} Cantidad de Luminarias a otorgar
     */
    calculateGameReward(gameData) {
        const { correctAnswers, totalQuestions, gameMode, victory } = gameData;

        if (totalQuestions === 0) return 0;

        const percentage = (correctAnswers / totalQuestions) * 100;

        // Recompensa base según porcentaje de aciertos
        let baseLuminarias = 0;
        if (percentage >= 90) {
            baseLuminarias = 25; // Excelente
        } else if (percentage >= 75) {
            baseLuminarias = 20; // Muy bien
        } else if (percentage >= 60) {
            baseLuminarias = 15; // Bien
        } else if (percentage >= 40) {
            baseLuminarias = 10; // Regular
        } else {
            baseLuminarias = 5; // Participación
        }

        // Multiplicador según modo de juego
        const modeMultiplier = this.getGameModeMultiplier(gameMode);
        let finalAmount = Math.floor(baseLuminarias * modeMultiplier);

        // Bonus por victoria (en modos competitivos)
        if (victory) {
            finalAmount += 10;
        }

        // Bonus por partida perfecta
        if (percentage === 100) {
            finalAmount += 15;
        }

        return Math.max(5, Math.min(finalAmount, 50)); // Entre 5 y 50 Luminarias
    }

    /**
     * Obtiene el multiplicador según el modo de juego
     * @param {string} gameMode
     * @returns {number} Multiplicador
     */
    getGameModeMultiplier(gameMode) {
        const multipliers = {
            'classic': 1.0,
            'time_trial': 1.2,
            'lives': 1.3,
            'exam': 1.4,
            'duel': 1.5,
            'marathon': 1.6,
            'streak': 1.4,
            'trivial': 1.1,
            'by_levels': 1.3
        };
        return multipliers[gameMode] || 1.0;
    }

    /**
     * Obtiene el nombre legible del modo de juego
     * @param {string} gameMode
     * @returns {string} Nombre del modo
     */
    getGameModeName(gameMode) {
        const names = {
            'classic': 'Clásico',
            'time_trial': 'Contrarreloj',
            'lives': 'Vidas',
            'exam': 'Examen',
            'duel': 'Duelo',
            'marathon': 'Maratón',
            'streak': 'Racha',
            'trivial': 'Trivial',
            'by_levels': 'Por Niveles'
        };
        return names[gameMode] || 'Desconocido';
    }

    /**
     * Muestra una notificación visual de la recompensa
     * @param {number} amount - Cantidad ganada
     * @param {Object} gameData - Datos del juego
     */
    showRewardNotification(amount, gameData) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'luminarias-notification';
        notification.innerHTML = `
            <div class="luminarias-notification-content">
                <img src="Imagenes/1lum.png" alt="Luminarias" class="luminarias-icon">
                <div class="luminarias-text">
                    <span class="luminarias-amount">+${amount}</span>
                    <span class="luminarias-label">Luminarias</span>
                </div>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.getElementById('luminarias-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'luminarias-notification-styles';
            styles.textContent = `
                .luminarias-notification {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    z-index: 10000;
                    animation: luminarias-pop 2s ease-out forwards;
                }

                @keyframes luminarias-pop {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    10% {
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 1;
                    }
                    20% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    80% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -100vh) scale(0.5);
                        opacity: 0;
                    }
                }

                .luminarias-notification-content {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border-radius: 1rem;
                    padding: 1.5rem 2rem;
                    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 3px solid #FFE55C;
                }

                .luminarias-icon {
                    width: 3rem;
                    height: 3rem;
                    animation: luminarias-spin 1s ease-in-out;
                }

                @keyframes luminarias-spin {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(360deg); }
                }

                .luminarias-text {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .luminarias-amount {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #1B263B;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                }

                .luminarias-label {
                    font-size: 0.875rem;
                    color: #415A77;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
            `;
            document.head.appendChild(styles);
        }

        // Agregar al DOM
        document.body.appendChild(notification);

        // Remover después de la animación
        setTimeout(() => {
            notification.remove();
        }, 2000);

        // Reproducir sonido (opcional)
        this.playRewardSound();
    }

    /**
     * Reproduce un sonido de recompensa (opcional)
     */
    playRewardSound() {
        try {
            // Crear un sonido simple usando Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Silenciar errores de audio
        }
    }

    /**
     * Actualiza el display del balance en el header
     */
    updateDisplay() {
        const luminariasElement = document.getElementById('user-luminarias');
        if (luminariasElement) {
            luminariasElement.textContent = this.currentBalance.toLocaleString();
        }
    }

    /**
     * Añade un listener para cambios en el balance
     * @param {Function} callback - Función a ejecutar cuando cambie el balance
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notifica a todos los listeners
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.currentBalance);
            } catch (error) {
                console.error('Error in balance listener:', error);
            }
        });
    }

    /**
     * Obtiene el balance actual (sin hacer petición al servidor)
     * @returns {number} Balance actual
     */
    getBalance() {
        return this.currentBalance;
    }

    /**
     * Abre la tienda de Luminarias
     */
    openStore() {
        window.open('luminarias-store.html', '_blank');
    }

    /**
     * Abre el historial de transacciones
     */
    openHistory() {
        window.open('luminarias-history.html', '_blank');
    }

    /**
     * Abre el panel de administración (solo admin)
     */
    openAdmin() {
        window.open('luminarias-admin.html', '_blank');
    }
}

// Crear instancia global
window.luminariasManager = new LuminariasManager();

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.luminariasManager.initialize();
    });
} else {
    window.luminariasManager.initialize();
}

console.log('🪙 Luminarias Manager script loaded');
