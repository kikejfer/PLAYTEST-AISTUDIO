import React from 'react';
import { useBlockVisibility } from '../../hooks/useBlockVisibility';
import './ValidationModal.scss';

const ValidationModal = ({
  targetState,
  errors = [],
  warnings = [],
  isValidationOnly = false,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const { VISIBILITY_STATES } = useBlockVisibility();

  const getStateConfig = (state) => {
    const configs = {
      [VISIBILITY_STATES.PRIVATE]: {
        label: 'Privado',
        icon: '🔒',
        color: '#6b7280'
      },
      [VISIBILITY_STATES.PUBLIC]: {
        label: 'Público',
        icon: '🌐',
        color: '#10b981'
      },
      [VISIBILITY_STATES.RESTRICTED]: {
        label: 'Restringido',
        icon: '👥',
        color: '#f59e0b'
      },
      [VISIBILITY_STATES.ARCHIVED]: {
        label: 'Archivado',
        icon: '📦',
        color: '#8b5cf6'
      }
    };
    return configs[state] || { label: 'Desconocido', icon: '❓', color: '#ef4444' };
  };

  const stateConfig = getStateConfig(targetState);
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className="validation-modal-overlay" onClick={onCancel}>
      <div className="validation-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="state-info">
            <span className="state-icon" style={{ color: stateConfig.color }}>
              {stateConfig.icon}
            </span>
            <h3 className="modal-title">
              {isValidationOnly 
                ? `Validación para hacer ${stateConfig.label}`
                : `Cambiar estado a ${stateConfig.label}`
              }
            </h3>
          </div>
          <button 
            className="close-btn" 
            onClick={onCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* Errores */}
          {hasErrors && (
            <div className="validation-section errors">
              <div className="section-header">
                <span className="section-icon">🚫</span>
                <h4 className="section-title">
                  Errores que impiden el cambio ({errors.length})
                </h4>
              </div>
              <ul className="validation-list">
                {errors.map((error, index) => (
                  <li key={index} className="validation-item error">
                    <span className="item-icon">⚠️</span>
                    <span className="item-text">{error}</span>
                  </li>
                ))}
              </ul>
              {!isValidationOnly && (
                <div className="error-note">
                  <p>
                    <strong>Nota:</strong> Puedes forzar el cambio de estado, pero se recomienda 
                    corregir estos problemas primero para garantizar la calidad del contenido.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Advertencias */}
          {hasWarnings && (
            <div className="validation-section warnings">
              <div className="section-header">
                <span className="section-icon">⚠️</span>
                <h4 className="section-title">
                  Advertencias ({warnings.length})
                </h4>
              </div>
              <ul className="validation-list">
                {warnings.map((warning, index) => (
                  <li key={index} className="validation-item warning">
                    <span className="item-icon">💡</span>
                    <span className="item-text">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Estado sin problemas */}
          {!hasErrors && !hasWarnings && (
            <div className="validation-section success">
              <div className="section-header">
                <span className="section-icon">✅</span>
                <h4 className="section-title">
                  {isValidationOnly 
                    ? 'El bloque cumple todos los requisitos'
                    : 'Listo para cambiar estado'
                  }
                </h4>
              </div>
              <div className="success-message">
                <p>
                  {isValidationOnly
                    ? `El bloque está listo para ser publicado como ${stateConfig.label}.`
                    : `No hay problemas detectados para cambiar el estado a ${stateConfig.label}.`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          {targetState === VISIBILITY_STATES.PUBLIC && (
            <div className="info-section">
              <h5>ℹ️ Requisitos para publicación:</h5>
              <ul className="requirements-list">
                <li>Descripción detallada (mínimo 50 caracteres)</li>
                <li>Al menos 10 preguntas con respuestas correctas</li>
                <li>Preguntas distribuidas en al menos 2 temas</li>
                <li>Metadatos completos (categoría, nivel, área)</li>
                <li>Observaciones del autor (mínimo 50 caracteres)</li>
                <li>Sin respuestas duplicadas</li>
              </ul>
            </div>
          )}

          {targetState === VISIBILITY_STATES.RESTRICTED && (
            <div className="info-section">
              <h5>ℹ️ Modo Restringido:</h5>
              <p>
                Solo los usuarios que invites específicamente podrán acceder a este bloque. 
                Los usuarios que ya tenían acceso lo mantendrán.
              </p>
            </div>
          )}

          {targetState === VISIBILITY_STATES.ARCHIVED && (
            <div className="info-section">
              <h5>ℹ️ Archivado:</h5>
              <p>
                El bloque se eliminará de las búsquedas públicas pero seguirá siendo 
                accesible mediante link directo para quienes lo tengan.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-cancel" 
            onClick={onCancel}
            disabled={loading}
          >
            {isValidationOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          
          {!isValidationOnly && (
            <button 
              className={`btn ${hasErrors ? 'btn-force' : 'btn-confirm'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && <span className="loading-spinner">⏳</span>}
              {hasErrors 
                ? 'Forzar Cambio' 
                : `Cambiar a ${stateConfig.label}`
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;