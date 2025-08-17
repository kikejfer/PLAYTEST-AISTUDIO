import React, { useState, useEffect, useCallback } from 'react';
import { useFairPlay } from '../../hooks/useFairPlay';
import { useAuthContext } from '../../contexts/AuthContext';
import ReportModal from './ReportModal';
import ModerationPanel from './ModerationPanel';
import FairPlayScoreDisplay from './FairPlayScoreDisplay';
import './FairPlayDashboard.scss';

const FairPlayDashboard = ({ userRole = 'player' }) => {
  const {
    reports,
    violations,
    moderationQueue,
    fairPlayScore,
    loading,
    reportViolation,
    moderateReport,
    getViolationHistory,
    VIOLATION_TYPES,
    REPORT_STATUS
  } = useFairPlay();
  
  const { user } = useAuthContext();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: '30days'
  });

  // Filtrar reportes basado en filtros activos
  const filteredReports = reports.filter(report => {
    if (filters.status !== 'all' && report.status !== filters.status) return false;
    if (filters.type !== 'all' && report.violationType !== filters.type) return false;
    
    if (filters.dateRange !== 'all') {
      const reportDate = new Date(report.createdAt);
      const now = new Date();
      const daysAgo = {
        '7days': 7,
        '30days': 30,
        '90days': 90
      }[filters.dateRange];
      
      if (daysAgo) {
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        if (reportDate < cutoffDate) return false;
      }
    }
    
    return true;
  });

  // Obtener estadísticas del overview
  const getOverviewStats = useCallback(() => {
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === REPORT_STATUS.PENDING).length;
    const resolvedReports = reports.filter(r => r.status === REPORT_STATUS.RESOLVED).length;
    const myViolations = violations.filter(v => v.userId === user?.id).length;
    
    return {
      totalReports,
      pendingReports,
      resolvedReports,
      myViolations,
      fairPlayScore
    };
  }, [reports, violations, user?.id, fairPlayScore, REPORT_STATUS]);

  const stats = getOverviewStats();

  const renderOverviewTab = () => (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalReports}</div>
            <div className="stat-label">Reportes Totales</div>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingReports}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>
        
        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.resolvedReports}</div>
            <div className="stat-label">Resueltos</div>
          </div>
        </div>
        
        <div className="stat-card violations">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.myViolations}</div>
            <div className="stat-label">Mis Infracciones</div>
          </div>
        </div>
      </div>

      <div className="overview-content">
        <div className="fair-play-score-section">
          <FairPlayScoreDisplay 
            score={fairPlayScore}
            violations={violations.filter(v => v.userId === user?.id)}
            showDetails={true}
          />
        </div>

        <div className="recent-activity">
          <h3>📈 Actividad Reciente</h3>
          <div className="activity-list">
            {reports.slice(0, 5).map(report => (
              <div key={report.id} className={`activity-item ${report.status}`}>
                <div className="activity-icon">
                  {report.status === REPORT_STATUS.PENDING && '⏳'}
                  {report.status === REPORT_STATUS.INVESTIGATING && '🔍'}
                  {report.status === REPORT_STATUS.RESOLVED && '✅'}
                  {report.status === REPORT_STATUS.DISMISSED && '❌'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    Reporte por {VIOLATION_TYPES[report.violationType] || report.violationType}
                  </div>
                  <div className="activity-meta">
                    {new Date(report.createdAt).toLocaleDateString()} • {report.status}
                  </div>
                </div>
              </div>
            ))}
            
            {reports.length === 0 && (
              <div className="no-activity">
                <p>No hay actividad reciente de fair play</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="reports-tab">
      <div className="reports-header">
        <h3>📋 Gestión de Reportes</h3>
        <div className="reports-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowReportModal(true)}
          >
            ➕ Nuevo Reporte
          </button>
        </div>
      </div>

      <div className="reports-filters">
        <div className="filter-group">
          <label>Estado:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="investigating">Investigando</option>
            <option value="resolved">Resueltos</option>
            <option value="dismissed">Descartados</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tipo:</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="all">Todos</option>
            {Object.entries(VIOLATION_TYPES).map(([key, value]) => (
              <option key={key} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Período:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
          >
            <option value="all">Todo el tiempo</option>
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="90days">Últimos 90 días</option>
          </select>
        </div>
      </div>

      <div className="reports-list">
        {filteredReports.map(report => (
          <div key={report.id} className={`report-card ${report.status}`}>
            <div className="report-header">
              <div className="report-meta">
                <span className={`status-badge ${report.status}`}>
                  {report.status}
                </span>
                <span className="report-id">#{report.id.slice(-6)}</span>
                <span className="report-date">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {userRole === 'moderator' && report.status === REPORT_STATUS.PENDING && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setSelectedReport(report)}
                >
                  🔍 Revisar
                </button>
              )}
            </div>

            <div className="report-content">
              <div className="report-type">
                <strong>Tipo:</strong> {VIOLATION_TYPES[report.violationType] || report.violationType}
              </div>
              
              <div className="report-description">
                {report.description}
              </div>
              
              {report.evidence && report.evidence.length > 0 && (
                <div className="report-evidence">
                  <strong>Evidencia:</strong>
                  <ul>
                    {report.evidence.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {report.resolution && (
              <div className="report-resolution">
                <strong>Resolución:</strong> {report.resolution}
                {report.moderatedBy && (
                  <span className="moderator">
                    por {report.moderatedBy}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="no-reports">
            <p>No se encontraron reportes con los filtros aplicados</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderModerationTab = () => {
    if (userRole !== 'moderator' && userRole !== 'admin') {
      return (
        <div className="access-denied">
          <p>❌ No tienes permisos para acceder al panel de moderación</p>
        </div>
      );
    }

    return (
      <div className="moderation-tab">
        <ModerationPanel
          queue={moderationQueue}
          onModerate={moderateReport}
          loading={loading}
        />
      </div>
    );
  };

  const renderViolationsTab = () => (
    <div className="violations-tab">
      <h3>⚠️ Historial de Infracciones</h3>
      
      <div className="violations-list">
        {violations.filter(v => v.userId === user?.id).map(violation => (
          <div key={violation.id} className={`violation-card ${violation.severity}`}>
            <div className="violation-header">
              <div className="violation-type">
                <strong>{VIOLATION_TYPES[violation.type] || violation.type}</strong>
              </div>
              <div className="violation-date">
                {new Date(violation.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="violation-content">
              <div className="violation-description">
                {violation.description}
              </div>
              
              <div className="violation-penalty">
                <strong>Sanción:</strong> {violation.penalty}
              </div>
              
              {violation.evidence && (
                <div className="violation-evidence">
                  <strong>Evidencia:</strong> {violation.evidence}
                </div>
              )}
            </div>

            <div className="violation-footer">
              <span className={`severity-badge ${violation.severity}`}>
                {violation.severity}
              </span>
              {violation.appealable && (
                <button className="btn btn-sm btn-secondary">
                  📋 Apelar
                </button>
              )}
            </div>
          </div>
        ))}

        {violations.filter(v => v.userId === user?.id).length === 0 && (
          <div className="no-violations">
            <div className="success-icon">✅</div>
            <h4>¡Excelente!</h4>
            <p>No tienes infracciones registradas. Mantén el buen comportamiento.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fair-play-dashboard loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando datos de fair play...</p>
      </div>
    );
  }

  return (
    <div className="fair-play-dashboard">
      <div className="dashboard-header">
        <h2>🛡️ Centro de Fair Play</h2>
        <p>Mantén la integridad y el espíritu deportivo en PLAYTEST</p>
      </div>

      <div className="dashboard-navigation">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Resumen
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reportes
        </button>
        
        {(userRole === 'moderator' || userRole === 'admin') && (
          <button
            className={`nav-tab ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            🔨 Moderación
          </button>
        )}
        
        <button
          className={`nav-tab ${activeTab === 'violations' ? 'active' : ''}`}
          onClick={() => setActiveTab('violations')}
        >
          ⚠️ Mis Infracciones
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'moderation' && renderModerationTab()}
        {activeTab === 'violations' && renderViolationsTab()}
      </div>

      {/* Modal de nuevo reporte */}
      {showReportModal && (
        <ReportModal
          onSubmit={async (reportData) => {
            const result = await reportViolation(reportData);
            if (result.success) {
              setShowReportModal(false);
            }
            return result;
          }}
          onClose={() => setShowReportModal(false)}
          loading={loading}
        />
      )}

      {/* Panel de moderación para reporte seleccionado */}
      {selectedReport && (
        <ModerationPanel
          report={selectedReport}
          onModerate={async (moderationData) => {
            const result = await moderateReport(selectedReport.id, moderationData);
            if (result.success) {
              setSelectedReport(null);
            }
            return result;
          }}
          onClose={() => setSelectedReport(null)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default FairPlayDashboard;