import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/UI/Icon';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import './ConfiguradorJuego.scss';

/**
 * Configurador de Juego Universal
 * Permite crear partidas personalizadas con diferentes modalidades
 */
const ConfiguradorJuego = () => {
  const [gameConfig, setGameConfig] = useState({
    modalidad: 'trivia',
    dificultad: 'media',
    tematica: '',
    tiempoLimite: 30,
    numeroPreguntas: 10,
    tipoSala: 'publica',
    maxJugadores: 8,
    nombreSala: '',
    descripcion: '',
    configuracionAvanzada: {
      permitirAyudas: true,
      mostrarRespuestasCorrectas: true,
      puntuacionPersonalizada: false,
      modoEliminacion: false
    }
  });
  
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [step, setStep] = useState(1);

  // Cargar bloques disponibles
  useEffect(() => {
    loadBloques();
  }, []);

  const loadBloques = async () => {
    try {
      const response = await fetch('/api/juego/bloques-disponibles');
      if (response.ok) {
        const data = await response.json();
        setBloques(data.bloques || []);
      }
    } catch (error) {
      console.error('Error cargando bloques:', error);
    }
  };

  const modalidades = [
    {
      id: 'trivia',
      nombre: 'Trivia Clásica',
      descripcion: 'Preguntas y respuestas tradicionales',
      icon: 'help-circle',
      color: 'blue'
    },
    {
      id: 'duelo',
      nombre: 'Duelo 1v1',
      descripcion: 'Enfrentamiento directo entre dos jugadores',
      icon: 'zap',
      color: 'red'
    },
    {
      id: 'supervivencia',
      nombre: 'Supervivencia',
      descripcion: 'Elimina jugadores en cada ronda',
      icon: 'shield',
      color: 'orange'
    },
    {
      id: 'tiempo',
      nombre: 'Contra Reloj',
      descripcion: 'Responde el máximo número de preguntas',
      icon: 'clock',
      color: 'green'
    }
  ];

  const dificultades = [
    { id: 'facil', nombre: 'Fácil', descripcion: 'Preguntas básicas', color: 'green' },
    { id: 'media', nombre: 'Media', descripcion: 'Dificultad estándar', color: 'orange' },
    { id: 'dificil', nombre: 'Difícil', descripcion: 'Preguntas avanzadas', color: 'red' },
    { id: 'mixta', nombre: 'Mixta', descripcion: 'Variedad de dificultades', color: 'purple' }
  ];

  const handleConfigChange = (key, value) => {
    setGameConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAdvancedConfigChange = (key, value) => {
    setGameConfig(prev => ({
      ...prev,
      configuracionAvanzada: {
        ...prev.configuracionAvanzada,
        [key]: value
      }
    }));
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/juego/crear-partida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameConfig)
      });

      if (response.ok) {
        const data = await response.json();
        // Redirigir a la sala creada
        console.log('Partida creada:', data);
      }
    } catch (error) {
      console.error('Error creando partida:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="config-step">
      <h3>Paso 1: Modalidad de Juego</h3>
      <div className="modalidades-grid">
        {modalidades.map(modalidad => (
          <motion.div
            key={modalidad.id}
            className={`modalidad-card ${gameConfig.modalidad === modalidad.id ? 'selected' : ''}`}
            onClick={() => handleConfigChange('modalidad', modalidad.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon name={modalidad.icon} size="32" className={`icon-${modalidad.color}`} />
            <h4>{modalidad.nombre}</h4>
            <p>{modalidad.descripcion}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="config-step">
      <h3>Paso 2: Configuración Básica</h3>
      
      <div className="config-grid">
        <div className="config-group">
          <label>Dificultad:</label>
          <div className="dificultad-options">
            {dificultades.map(dif => (
              <button
                key={dif.id}
                className={`dificultad-btn ${gameConfig.dificultad === dif.id ? 'selected' : ''} ${dif.color}`}
                onClick={() => handleConfigChange('dificultad', dif.id)}
              >
                {dif.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="config-group">
          <label>Temática:</label>
          <select
            value={gameConfig.tematica}
            onChange={(e) => handleConfigChange('tematica', e.target.value)}
          >
            <option value="">Seleccionar bloque...</option>
            {bloques.map(bloque => (
              <option key={bloque.id} value={bloque.id}>
                {bloque.nombre} ({bloque.total_preguntas} preguntas)
              </option>
            ))}
          </select>
        </div>

        <div className="config-group">
          <label>Número de Preguntas:</label>
          <div className="slider-container">
            <input
              type="range"
              min="5"
              max="50"
              value={gameConfig.numeroPreguntas}
              onChange={(e) => handleConfigChange('numeroPreguntas', parseInt(e.target.value))}
            />
            <span className="slider-value">{gameConfig.numeroPreguntas}</span>
          </div>
        </div>

        <div className="config-group">
          <label>Tiempo por Pregunta (segundos):</label>
          <div className="slider-container">
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={gameConfig.tiempoLimite}
              onChange={(e) => handleConfigChange('tiempoLimite', parseInt(e.target.value))}
            />
            <span className="slider-value">{gameConfig.tiempoLimite}s</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="config-step">
      <h3>Paso 3: Configuración de Sala</h3>
      
      <div className="config-grid">
        <div className="config-group">
          <label>Tipo de Sala:</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                value="publica"
                checked={gameConfig.tipoSala === 'publica'}
                onChange={(e) => handleConfigChange('tipoSala', e.target.value)}
              />
              <span>Pública</span>
              <small>Cualquiera puede unirse</small>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="privada"
                checked={gameConfig.tipoSala === 'privada'}
                onChange={(e) => handleConfigChange('tipoSala', e.target.value)}
              />
              <span>Privada</span>
              <small>Solo con código de invitación</small>
            </label>
          </div>
        </div>

        <div className="config-group">
          <label>Máximo de Jugadores:</label>
          <select
            value={gameConfig.maxJugadores}
            onChange={(e) => handleConfigChange('maxJugadores', parseInt(e.target.value))}
          >
            <option value={2}>2 jugadores</option>
            <option value={4}>4 jugadores</option>
            <option value={6}>6 jugadores</option>
            <option value={8}>8 jugadores</option>
            <option value={10}>10 jugadores</option>
          </select>
        </div>

        <div className="config-group">
          <label>Nombre de la Sala:</label>
          <input
            type="text"
            placeholder="Ej: Trivia de Historia"
            value={gameConfig.nombreSala}
            onChange={(e) => handleConfigChange('nombreSala', e.target.value)}
          />
        </div>

        <div className="config-group">
          <label>Descripción (opcional):</label>
          <textarea
            placeholder="Describe tu sala..."
            value={gameConfig.descripcion}
            onChange={(e) => handleConfigChange('descripcion', e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="config-step">
      <h3>Paso 4: Configuración Avanzada</h3>
      
      <div className="advanced-config">
        <div className="toggle-group">
          <label className="toggle-option">
            <input
              type="checkbox"
              checked={gameConfig.configuracionAvanzada.permitirAyudas}
              onChange={(e) => handleAdvancedConfigChange('permitirAyudas', e.target.checked)}
            />
            <span className="toggle-label">Permitir Ayudas</span>
            <small>Los jugadores pueden usar comodines como 50/50</small>
          </label>

          <label className="toggle-option">
            <input
              type="checkbox"
              checked={gameConfig.configuracionAvanzada.mostrarRespuestasCorrectas}
              onChange={(e) => handleAdvancedConfigChange('mostrarRespuestasCorrectas', e.target.checked)}
            />
            <span className="toggle-label">Mostrar Respuestas Correctas</span>
            <small>Revelar la respuesta correcta después de cada pregunta</small>
          </label>

          <label className="toggle-option">
            <input
              type="checkbox"
              checked={gameConfig.configuracionAvanzada.modoEliminacion}
              onChange={(e) => handleAdvancedConfigChange('modoEliminacion', e.target.checked)}
            />
            <span className="toggle-label">Modo Eliminación</span>
            <small>Los jugadores son eliminados al fallar</small>
          </label>

          <label className="toggle-option">
            <input
              type="checkbox"
              checked={gameConfig.configuracionAvanzada.puntuacionPersonalizada}
              onChange={(e) => handleAdvancedConfigChange('puntuacionPersonalizada', e.target.checked)}
            />
            <span className="toggle-label">Puntuación Personalizada</span>
            <small>Configurar sistema de puntos custom</small>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="game-preview">
      <h3>Vista Previa de la Configuración</h3>
      
      <div className="preview-card">
        <div className="preview-header">
          <Icon name="gamepad2" size="24" />
          <div>
            <h4>{gameConfig.nombreSala || 'Mi Sala de Juego'}</h4>
            <span className="modalidad-tag">
              {modalidades.find(m => m.id === gameConfig.modalidad)?.nombre}
            </span>
          </div>
        </div>

        <div className="preview-details">
          <div className="detail-row">
            <Icon name="users" size="16" />
            <span>Hasta {gameConfig.maxJugadores} jugadores</span>
          </div>
          <div className="detail-row">
            <Icon name="help-circle" size="16" />
            <span>{gameConfig.numeroPreguntas} preguntas</span>
          </div>
          <div className="detail-row">
            <Icon name="clock" size="16" />
            <span>{gameConfig.tiempoLimite}s por pregunta</span>
          </div>
          <div className="detail-row">
            <Icon name="shield" size="16" />
            <span>Dificultad {gameConfig.dificultad}</span>
          </div>
          <div className="detail-row">
            <Icon name={gameConfig.tipoSala === 'publica' ? 'globe' : 'lock'} size="16" />
            <span>Sala {gameConfig.tipoSala}</span>
          </div>
        </div>

        <div className="preview-features">
          <h5>Características:</h5>
          <div className="features-list">
            {gameConfig.configuracionAvanzada.permitirAyudas && (
              <span className="feature-tag">Ayudas habilitadas</span>
            )}
            {gameConfig.configuracionAvanzada.mostrarRespuestasCorrectas && (
              <span className="feature-tag">Respuestas visibles</span>
            )}
            {gameConfig.configuracionAvanzada.modoEliminacion && (
              <span className="feature-tag">Modo eliminación</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="configurador-juego">
      {/* Header */}
      <div className="configurador-header">
        <h3>Configurador de Juego</h3>
        <p>Crea tu partida personalizada paso a paso</p>
      </div>

      {/* Progress indicator */}
      <div className="progress-indicator">
        {[1, 2, 3, 4].map(stepNum => (
          <div
            key={stepNum}
            className={`progress-step ${step >= stepNum ? 'completed' : ''} ${step === stepNum ? 'active' : ''}`}
          >
            <span>{stepNum}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="step-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="step-navigation">
        <button
          className="btn btn-secondary"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <Icon name="arrow-left" size="16" />
          Anterior
        </button>

        <button
          className="btn btn-outline"
          onClick={() => setShowPreview(true)}
        >
          <Icon name="eye" size="16" />
          Vista Previa
        </button>

        {step < 4 ? (
          <button
            className="btn btn-primary"
            onClick={() => setStep(Math.min(4, step + 1))}
          >
            Siguiente
            <Icon name="arrow-right" size="16" />
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleCreateGame}
            disabled={loading || !gameConfig.nombreSala}
          >
            {loading ? <LoadingSpinner size="small" /> : <Icon name="play" size="16" />}
            Crear Partida
          </button>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Vista Previa de la Partida"
        size="medium"
      >
        {renderPreview()}
      </Modal>
    </div>
  );
};

export default ConfiguradorJuego;