import React, { useState, useCallback } from 'react';
import { useFairPlay } from '../../hooks/useFairPlay';
import './ModerationPanel.scss';

const ModerationPanel = ({ 
  queue = [], 
  report = null, 
  onModerate, 
  onClose = null, 
  loading = false 
}) => {
  const { 
    VIOLATION_SEVERITIES, 
    REPORT_STATUS, 
    VIOLATION_TYPES 
  } = useFairPlay();
  
  const [selectedReport, setSelectedReport] = useState(report);
  const [moderationForm, setModerationForm] = useState({
    action: '', // dismiss, warning, temporary_ban, permanent_ban
    severity: VIOLATION_SEVERITIES.LOW,
    reason: '',
    banDuration: 7, // días
    notes: '',
    requiresApproval: false
  });
  const [submitting, setSubmitting] = useState(false);

  // Si hay un reporte específico, usarlo; si no, usar la cola
  const reportsToModerate = report ? [report] : queue;

  // Manejar selección de reporte
  const handleReportSelect = useCallback((reportToSelect) => {
    setSelectedReport(reportToSelect);
    // Reset form cuando se selecciona un nuevo reporte
    setModerationForm({
      action: '',
      severity: VIOLATION_SEVERITIES.LOW,
      reason: '',
      banDuration: 7,
      notes: '',
      requiresApproval: false
    });
  }, [VIOLATION_SEVERITIES]);

  // Manejar cambios en el formulario
  const handleFormChange = useCallback((field, value) => {
    setModerationForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Obtener acciones disponibles basadas en el tipo de infracción
  const getAvailableActions = useCallback((violationType) => {
    const actions = [
      { value: 'dismiss', label: '❌ Descartar', description: 'El reporte no es válido o no hay evidencia suficiente' }
    ];

    // Acciones específicas por tipo
    switch (violationType) {
      case VIOLATION_TYPES.CHEATING:
        actions.push(
          { value: 'temporary_ban', label: '⏰ Suspensión Temporal', description: 'Suspensión por días específicos' },
          { value: 'permanent_ban', label: '🚫 Ban Permanente', description: 'Prohibición permanente del usuario' }
        );
        break;
        
      case VIOLATION_TYPES.TOXICITY:
      case VIOLATION_TYPES.UNSPORTSMANLIKE:
        actions.push(
          { value: 'warning', label: '⚠️ Advertencia', description: 'Advertencia formal al usuario' },
          { value: 'temporary_ban', label: '⏰ Suspensión Temporal', description: 'Suspensión por días específicos' }
        );
        break;
        
      case VIOLATION_TYPES.HARASSMENT:
        actions.push(
          { value: 'temporary_ban', label: '⏰ Suspensión Temporal', description: 'Suspensión por días específicos' },
          { value: 'permanent_ban', label: '🚫 Ban Permanente', description: 'Prohibición permanente del usuario' }
        );
        break;
        
      case VIOLATION_TYPES.GRIEFING:
      case VIOLATION_TYPES.AFK:
        actions.push(
          { value: 'warning', label: '⚠️ Advertencia', description: 'Advertencia formal al usuario' },
          { value: 'temporary_ban', label: '⏰ Suspensión Temporal', description: 'Suspensión por días específicos' }
        );
        break;
        
      case VIOLATION_TYPES.COLLUSION:
        actions.push(
          { value: 'temporary_ban', label: '⏰ Suspensión Temporal', description: 'Suspensión por días específicos' },
          { value: 'permanent_ban', label: '🚫 Ban Permanente', description: 'Prohibición permanente del usuario' }
        );
        break;
        
      default:
        actions.push(
          { value: 'warning', label: '⚠️ Advertencia', description: 'Advertencia formal al usuario' },
          { value: 'temporary_ban', label: '⏰ Suspensión Temporal', description: 'Suspensión por días específicos' }
        );
    }

    return actions;
  }, [VIOLATION_TYPES]);

  // Enviar moderación
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!selectedReport || !moderationForm.action) {
      return;
    }

    setSubmitting(true);
    try {
      const moderationData = {
        action: moderationForm.action,
        status: moderationForm.action === 'dismiss' ? REPORT_STATUS.DISMISSED : REPORT_STATUS.RESOLVED,
        severity: moderationForm.severity,
        reason: moderationForm.reason,
        moderatorNotes: moderationForm.notes,
        ...(moderationForm.action === 'temporary_ban' && { 
          banDuration: moderationForm.banDuration 
        }),
        requiresApproval: moderationForm.requiresApproval
      };

      const result = await onModerate(moderationData);
      
      if (result.success) {
        // Si hay onClose (modal), cerrar; si no, limpiar selección
        if (onClose) {
          onClose();
        } else {
          setSelectedReport(null);
          setModerationForm({
            action: '',
            severity: VIOLATION_SEVERITIES.LOW,
            reason: '',
            banDuration: 7,
            notes: '',
            requiresApproval: false
          });
        }
      }
    } catch (error) {
      console.error('Error moderando reporte:', error);
    } finally {
      setSubmitting(false);
    }
  }, [selectedReport, moderationForm, onModerate, onClose, REPORT_STATUS, VIOLATION_SEVERITIES]);

  // Obtener color de prioridad
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  }, []);

  if (reportsToModerate.length === 0) {
    return (
      <div className="moderation-panel empty">
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>¡Todo despejado!</h3>
          <p>No hay reportes pendientes de moderación.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`moderation-panel ${report ? 'modal-mode' : ''}`}>
      {report && onClose && (
        <div className="panel-header">
          <h3>🔨 Moderar Reporte</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      )}

      <div className="panel-content">
        {/* Lista de reportes (solo si no hay reporte específico) */}
        {!report && (
          <div className="reports-queue">
            <h3>📋 Cola de Moderación ({reportsToModerate.length})</h3>
            <div className="queue-list">
              {reportsToModerate.map(queueReport => (
                <div
                  key={queueReport.id}
                  className={`queue-item ${selectedReport?.id === queueReport.id ? 'selected' : ''}`}
                  onClick={() => handleReportSelect(queueReport)}
                >
                  <div className="queue-item-header">
                    <span 
                      className="priority-indicator"
                      style={{ backgroundColor: getPriorityColor(queueReport.priority) }}
                    />
                    <span className="report-type">
                      {VIOLATION_TYPES[queueReport.violationType] || queueReport.violationType}
                    </span>
                    <span className="report-date">
                      {new Date(queueReport.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="queue-item-content">
                    <p>{queueReport.description.substring(0, 100)}...</p>
                    <span className="accused-user">
                      Usuario: {queueReport.accusedUsername}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel de moderación */}
        {selectedReport && (
          <div className="moderation-form">
            <div className="report-details">
              <h4>📄 Detalles del Reporte</h4>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <label>ID del Reporte:</label>
                  <span>#{selectedReport.id.slice(-8)}</span>
                </div>
                <div className="detail-item">
                  <label>Usuario Reportado:</label>
                  <span>{selectedReport.accusedUsername}</span>
                </div>
                <div className="detail-item">
                  <label>Tipo de Infracción:</label>
                  <span>{VIOLATION_TYPES[selectedReport.violationType] || selectedReport.violationType}</span>
                </div>
                <div className="detail-item">
                  <label>Prioridad:</label>
                  <span 
                    className={`priority-badge ${selectedReport.priority}`}
                    style={{ color: getPriorityColor(selectedReport.priority) }}
                  >
                    {selectedReport.priority?.toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Reportado por:</label>
                  <span>{selectedReport.reporterUsername || 'Sistema'}</span>
                </div>
                <div className="detail-item">
                  <label>Fecha:</label>
                  <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="report-description">
                <label>Descripción:</label>
                <p>{selectedReport.description}</p>
              </div>

              {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                <div className="report-evidence">
                  <label>Evidencia:</label>
                  <ul>
                    {selectedReport.evidence.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <form className="moderation-actions" onSubmit={handleSubmit}>
              <h4>⚖️ Acción de Moderación</h4>

              {/* Selección de acción */}
              <div className="form-group">
                <label>Acción a tomar:</label>
                <div className="action-options">
                  {getAvailableActions(selectedReport.violationType).map(action => (
                    <div
                      key={action.value}
                      className={`action-option ${moderationForm.action === action.value ? 'selected' : ''}`}
                      onClick={() => handleFormChange('action', action.value)}
                    >
                      <div className="action-label">{action.label}</div>
                      <div className="action-description">{action.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuraciones específicas por acción */}
              {moderationForm.action && moderationForm.action !== 'dismiss' && (
                <>
                  <div className="form-group">
                    <label>Severidad:</label>
                    <select
                      value={moderationForm.severity}
                      onChange={(e) => handleFormChange('severity', e.target.value)}
                    >
                      {Object.entries(VIOLATION_SEVERITIES).map(([key, value]) => (
                        <option key={key} value={value}>
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {moderationForm.action === 'temporary_ban' && (
                    <div className="form-group">
                      <label>Duración (días):</label>
                      <select
                        value={moderationForm.banDuration}
                        onChange={(e) => handleFormChange('banDuration', parseInt(e.target.value))}
                      >
                        <option value={1}>1 día</option>
                        <option value={3}>3 días</option>
                        <option value={7}>1 semana</option>
                        <option value={14}>2 semanas</option>
                        <option value={30}>1 mes</option>
                        <option value={90}>3 meses</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Razón de la decisión */}
              <div className="form-group">
                <label>Razón de la decisión:</label>
                <textarea
                  value={moderationForm.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  placeholder="Explica la razón de tu decisión..."
                  rows="3"
                  required
                />
              </div>

              {/* Notas internas */}
              <div className="form-group">
                <label>Notas internas (opcional):</label>
                <textarea
                  value={moderationForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Notas para otros moderadores..."
                  rows="2"
                />
              </div>

              {/* Requiere aprobación adicional */}
              {(moderationForm.action === 'permanent_ban' || moderationForm.severity === VIOLATION_SEVERITIES.CRITICAL) && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={moderationForm.requiresApproval}
                      onChange={(e) => handleFormChange('requiresApproval', e.target.checked)}
                    />
                    Requiere aprobación de administrador
                  </label>
                </div>
              )}

              {/* Botones de acción */}
              <div className="form-actions">
                {!report && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedReport(null)}
                  >
                    ← Volver a la cola
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!moderationForm.action || !moderationForm.reason || submitting || loading}
                >
                  {submitting ? '⏳ Procesando...' : '✅ Aplicar Moderación'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationPanel;