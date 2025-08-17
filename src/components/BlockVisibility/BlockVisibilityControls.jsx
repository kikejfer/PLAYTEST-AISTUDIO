import React, { useState, useCallback } from 'react';
import { useBlockVisibility, usePublicationValidation } from '../../hooks/useBlockVisibility';
import BlockVisibilityBadge from './BlockVisibilityBadge';
import ValidationModal from './ValidationModal';
import './BlockVisibilityControls.scss';

const BlockVisibilityControls = ({ 
  block, 
  onVisibilityChanged, 
  disabled = false,
  showCurrentState = true 
}) => {
  const { 
    VISIBILITY_STATES, 
    changeBlockVisibility, 
    validateStateTransition, 
    loading 
  } = useBlockVisibility();
  
  const { validateForPublication } = usePublicationValidation();
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [isChanging, setIsChanging] = useState(false);

  const handleVisibilityChange = useCallback(async (newVisibility, force = false) => {
    if (disabled || loading || isChanging) return;

    setIsChanging(true);
    try {
      const result = await changeBlockVisibility(block.id, newVisibility, force);
      
      if (result.success) {
        onVisibilityChanged?.(newVisibility, result.warnings);
        if (result.warnings?.length > 0) {
          console.info('Advertencias en cambio de visibilidad:', result.warnings);
        }
      } else {
        // Mostrar modal de validación si hay errores
        setPendingTransition({ newVisibility, errors: result.errors, warnings: result.warnings });
        setShowValidationModal(true);
      }
    } catch (error) {
      console.error('Error cambiando visibilidad:', error);
    } finally {
      setIsChanging(false);
    }
  }, [block.id, changeBlockVisibility, onVisibilityChanged, disabled, loading, isChanging]);

  const handleForceChange = useCallback(async () => {
    if (!pendingTransition) return;
    
    await handleVisibilityChange(pendingTransition.newVisibility, true);
    setShowValidationModal(false);
    setPendingTransition(null);
  }, [pendingTransition, handleVisibilityChange]);

  const handleValidationModalClose = useCallback(() => {
    setShowValidationModal(false);
    setPendingTransition(null);
  }, []);

  const getTransitionConfig = useCallback((targetState) => {
    const validation = validateStateTransition(block, targetState);
    const isCurrentState = block.visibility === targetState;
    
    const configs = {
      [VISIBILITY_STATES.PRIVATE]: {
        label: 'Hacer Privado',
        icon: '🔒',
        className: 'btn-private',
        description: 'Solo tú podrás ver este bloque'
      },
      [VISIBILITY_STATES.PUBLIC]: {
        label: 'Publicar',
        icon: '🌐',
        className: 'btn-public',
        description: 'Será visible para todos los usuarios'
      },
      [VISIBILITY_STATES.RESTRICTED]: {
        label: 'Restringir',
        icon: '👥',
        className: 'btn-restricted',
        description: 'Solo usuarios invitados podrán acceder'
      },
      [VISIBILITY_STATES.ARCHIVED]: {
        label: 'Archivar',
        icon: '📦',
        className: 'btn-archived',
        description: 'Se eliminará de búsquedas públicas'
      }
    };

    return {
      ...configs[targetState],
      disabled: isCurrentState || disabled || loading || isChanging,
      hasErrors: validation.errors.length > 0,
      hasWarnings: validation.warnings.length > 0,
      canTransition: validation.canTransition,
      isCurrentState
    };
  }, [block, validateStateTransition, VISIBILITY_STATES, disabled, loading, isChanging]);

  const visibilityOptions = Object.values(VISIBILITY_STATES);

  return (
    <div className="block-visibility-controls">
      {showCurrentState && (
        <div className="current-state">
          <span className="current-state-label">Estado actual:</span>
          <BlockVisibilityBadge 
            visibility={block.visibility} 
            size="medium"
          />
        </div>
      )}

      <div className="visibility-actions">
        <span className="actions-label">Cambiar a:</span>
        <div className="action-buttons">
          {visibilityOptions.map(state => {
            const config = getTransitionConfig(state);
            
            return (
              <button
                key={state}
                className={`visibility-btn ${config.className} ${config.isCurrentState ? 'current' : ''} ${config.hasErrors ? 'has-errors' : ''} ${config.hasWarnings ? 'has-warnings' : ''}`}
                onClick={() => handleVisibilityChange(state)}
                disabled={config.disabled}
                title={config.isCurrentState ? 'Estado actual' : config.description}
              >
                <span className="btn-icon">{config.icon}</span>
                <span className="btn-label">{config.label}</span>
                {config.hasErrors && <span className="error-indicator">⚠️</span>}
                {config.hasWarnings && !config.hasErrors && <span className="warning-indicator">⚠️</span>}
                {isChanging && <span className="loading-indicator">⏳</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botón de validación para publicación */}
      {block.visibility !== VISIBILITY_STATES.PUBLIC && (
        <div className="publication-validation">
          <button
            className="validate-btn"
            onClick={() => {
              const validation = validateForPublication(block);
              setPendingTransition({ 
                newVisibility: VISIBILITY_STATES.PUBLIC, 
                errors: validation.errors, 
                warnings: validation.warnings,
                isValidation: true
              });
              setShowValidationModal(true);
            }}
            disabled={disabled || loading}
          >
            🔍 Validar para Publicación
          </button>
        </div>
      )}

      {/* Modal de validación */}
      {showValidationModal && pendingTransition && (
        <ValidationModal
          targetState={pendingTransition.newVisibility}
          errors={pendingTransition.errors}
          warnings={pendingTransition.warnings}
          isValidationOnly={pendingTransition.isValidation}
          onConfirm={pendingTransition.isValidation ? handleValidationModalClose : handleForceChange}
          onCancel={handleValidationModalClose}
          loading={isChanging}
        />
      )}
    </div>
  );
};

export default BlockVisibilityControls;