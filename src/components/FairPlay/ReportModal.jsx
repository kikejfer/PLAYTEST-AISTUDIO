import React, { useState, useCallback } from 'react';
import { useFairPlay } from '../../hooks/useFairPlay';
import './ReportModal.scss';

const ReportModal = ({ onSubmit, onClose, loading = false }) => {
  const { VIOLATION_TYPES } = useFairPlay();
  
  const [formData, setFormData] = useState({
    accusedUserId: '',
    accusedUsername: '',
    violationType: '',
    description: '',
    tournamentId: '',
    gameId: '',
    evidence: ['']
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.accusedUsername.trim()) {
      newErrors.accusedUsername = 'El nombre de usuario es obligatorio';
    }

    if (!formData.violationType) {
      newErrors.violationType = 'Debe seleccionar un tipo de infracción';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (formData.description.length < 20) {
      newErrors.description = 'La descripción debe tener al menos 20 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Manejar cambios en el formulario
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Manejar cambios en evidencia
  const handleEvidenceChange = useCallback((index, value) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.map((item, i) => i === index ? value : item)
    }));
  }, []);

  // Agregar campo de evidencia
  const addEvidenceField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, '']
    }));
  }, []);

  // Remover campo de evidencia
  const removeEvidenceField = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  }, []);

  // Enviar formulario
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Filtrar evidencia vacía
      const cleanedEvidence = formData.evidence.filter(item => item.trim());
      
      const reportData = {
        ...formData,
        evidence: cleanedEvidence,
        priority: getPriorityFromType(formData.violationType)
      };

      const result = await onSubmit(reportData);
      
      if (result.success) {
        onClose();
      } else {
        setErrors({ submit: result.error || 'Error al enviar el reporte' });
      }
    } catch (error) {
      setErrors({ submit: 'Error inesperado al enviar el reporte' });
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, onClose]);

  // Obtener prioridad basada en el tipo de infracción
  const getPriorityFromType = useCallback((type) => {
    const highPriorityTypes = [VIOLATION_TYPES.CHEATING, VIOLATION_TYPES.HARASSMENT];
    const mediumPriorityTypes = [VIOLATION_TYPES.TOXICITY, VIOLATION_TYPES.GRIEFING];
    
    if (highPriorityTypes.includes(type)) return 'high';
    if (mediumPriorityTypes.includes(type)) return 'medium';
    return 'low';
  }, [VIOLATION_TYPES]);

  // Obtener descripción del tipo de infracción
  const getViolationTypeDescription = useCallback((type) => {
    const descriptions = {
      [VIOLATION_TYPES.CHEATING]: 'Uso de herramientas externas, trampas o métodos no permitidos',
      [VIOLATION_TYPES.TOXICITY]: 'Comportamiento tóxico, insultos o lenguaje inapropiado',
      [VIOLATION_TYPES.HARASSMENT]: 'Acoso, intimidación o comportamiento amenazante',
      [VIOLATION_TYPES.GRIEFING]: 'Sabotaje intencional o arruinar la experiencia de otros',
      [VIOLATION_TYPES.COLLUSION]: 'Acuerdos previos o manipulación de resultados',
      [VIOLATION_TYPES.AFK]: 'Abandono frecuente o no participación',
      [VIOLATION_TYPES.UNSPORTSMANLIKE]: 'Conducta antideportiva general'
    };
    
    return descriptions[type] || '';
  }, [VIOLATION_TYPES]);

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 Reportar Infracción</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="modal-content" onSubmit={handleSubmit}>
          {/* Usuario reportado */}
          <div className="form-group">
            <label htmlFor="accusedUsername" className="form-label">
              👤 Usuario a reportar *
            </label>
            <input
              id="accusedUsername"
              type="text"
              className={`form-input ${errors.accusedUsername ? 'error' : ''}`}
              placeholder="Nombre de usuario o nickname"
              value={formData.accusedUsername}
              onChange={(e) => handleChange('accusedUsername', e.target.value)}
            />
            {errors.accusedUsername && (
              <span className="error-message">{errors.accusedUsername}</span>
            )}
          </div>

          {/* Tipo de infracción */}
          <div className="form-group">
            <label htmlFor="violationType" className="form-label">
              ⚠️ Tipo de infracción *
            </label>
            <select
              id="violationType"
              className={`form-select ${errors.violationType ? 'error' : ''}`}
              value={formData.violationType}
              onChange={(e) => handleChange('violationType', e.target.value)}
            >
              <option value="">Selecciona el tipo de infracción</option>
              {Object.entries(VIOLATION_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            {formData.violationType && (
              <div className="violation-description">
                <small>{getViolationTypeDescription(formData.violationType)}</small>
              </div>
            )}
            {errors.violationType && (
              <span className="error-message">{errors.violationType}</span>
            )}
          </div>

          {/* Descripción detallada */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              📋 Descripción detallada *
            </label>
            <textarea
              id="description"
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describe en detalle lo que ocurrió, cuándo y cómo. Sé específico y objetivo."
              rows="4"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            <div className="character-count">
              {formData.description.length}/500 caracteres
            </div>
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
          </div>

          {/* Contexto adicional */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tournamentId" className="form-label">
                🏆 ID del Torneo (opcional)
              </label>
              <input
                id="tournamentId"
                type="text"
                className="form-input"
                placeholder="Si ocurrió en un torneo"
                value={formData.tournamentId}
                onChange={(e) => handleChange('tournamentId', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gameId" className="form-label">
                🎮 ID del Juego (opcional)
              </label>
              <input
                id="gameId"
                type="text"
                className="form-input"
                placeholder="ID específico del juego"
                value={formData.gameId}
                onChange={(e) => handleChange('gameId', e.target.value)}
              />
            </div>
          </div>

          {/* Evidencia */}
          <div className="form-group">
            <label className="form-label">
              📁 Evidencia (opcional)
            </label>
            <div className="evidence-list">
              {formData.evidence.map((evidence, index) => (
                <div key={index} className="evidence-item">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="URL de imagen, enlace o descripción de evidencia"
                    value={evidence}
                    onChange={(e) => handleEvidenceChange(index, e.target.value)}
                  />
                  {formData.evidence.length > 1 && (
                    <button
                      type="button"
                      className="remove-evidence-btn"
                      onClick={() => removeEvidenceField(index)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-evidence-btn"
              onClick={addEvidenceField}
            >
              ➕ Agregar evidencia
            </button>
          </div>

          {/* Error de envío */}
          {errors.submit && (
            <div className="submit-error">
              <span className="error-icon">❌</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Advertencia importante */}
          <div className="warning-notice">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Los reportes falsos o malintencionados serán penalizados</li>
                <li>Toda la información será revisada por moderadores</li>
                <li>Mantén la objetividad y evita el lenguaje ofensivo</li>
              </ul>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loading}
            >
              {submitting ? '⏳ Enviando...' : '📤 Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;