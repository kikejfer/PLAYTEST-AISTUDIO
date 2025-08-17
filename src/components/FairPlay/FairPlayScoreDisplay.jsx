import React, { useState, useMemo } from 'react';
import './FairPlayScoreDisplay.scss';

const FairPlayScoreDisplay = ({ 
  score = 100, 
  violations = [], 
  showDetails = false,
  size = 'medium' // small, medium, large
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calcular el nivel de fair play basado en la puntuación
  const fairPlayLevel = useMemo(() => {
    if (score >= 95) return { level: 'Excelente', color: '#059669', icon: '🏆' };
    if (score >= 85) return { level: 'Muy Bueno', color: '#0891b2', icon: '⭐' };
    if (score >= 70) return { level: 'Bueno', color: '#65a30d', icon: '✅' };
    if (score >= 50) return { level: 'Regular', color: '#eab308', icon: '⚠️' };
    if (score >= 30) return { level: 'Malo', color: '#f97316', icon: '📉' };
    return { level: 'Crítico', color: '#dc2626', icon: '🚨' };
  }, [score]);

  // Calcular estadísticas de violaciones
  const violationStats = useMemo(() => {
    const totalViolations = violations.length;
    const recentViolations = violations.filter(v => {
      const violationDate = new Date(v.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return violationDate >= thirtyDaysAgo;
    }).length;

    const severityCounts = violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      total: totalViolations,
      recent: recentViolations,
      severityCounts
    };
  }, [violations]);

  // Calcular el porcentaje para el gráfico circular
  const scorePercentage = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45; // radio de 45
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  // Obtener factores que afectan la puntuación
  const getScoreFactors = () => {
    const factors = [];
    
    if (violationStats.recent > 0) {
      factors.push({
        type: 'negative',
        text: `${violationStats.recent} infracciones recientes`,
        impact: -5 * violationStats.recent
      });
    }
    
    if (violationStats.severityCounts.critical > 0) {
      factors.push({
        type: 'negative',
        text: `${violationStats.severityCounts.critical} infracciones críticas`,
        impact: -20 * violationStats.severityCounts.critical
      });
    }
    
    if (violationStats.severityCounts.high > 0) {
      factors.push({
        type: 'negative',
        text: `${violationStats.severityCounts.high} infracciones graves`,
        impact: -10 * violationStats.severityCounts.high
      });
    }

    if (violationStats.total === 0) {
      factors.push({
        type: 'positive',
        text: 'Sin infracciones registradas',
        impact: 0
      });
    }

    // Factores positivos basados en comportamiento
    if (score >= 95) {
      factors.push({
        type: 'positive',
        text: 'Comportamiento ejemplar sostenido',
        impact: 5
      });
    }

    return factors;
  };

  const scoreFactors = getScoreFactors();

  return (
    <div className={`fair-play-score-display ${size}`}>
      <div className="score-header">
        <h3>🛡️ Puntuación Fair Play</h3>
        {showDetails && (
          <button
            className="toggle-breakdown"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            {showBreakdown ? '📊 Ocultar detalles' : '📈 Ver detalles'}
          </button>
        )}
      </div>

      <div className="score-main">
        <div className="score-visual">
          <div className="score-circle">
            <svg viewBox="0 0 100 100" className="score-svg">
              {/* Círculo de fondo */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
              />
              
              {/* Círculo de progreso */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={fairPlayLevel.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)"
                className="score-progress"
              />
            </svg>
            
            <div className="score-content">
              <div className="score-number">{score}</div>
              <div className="score-max">/100</div>
            </div>
          </div>
        </div>

        <div className="score-info">
          <div className="score-level">
            <span className="level-icon">{fairPlayLevel.icon}</span>
            <span 
              className="level-text"
              style={{ color: fairPlayLevel.color }}
            >
              {fairPlayLevel.level}
            </span>
          </div>

          <div className="score-stats">
            <div className="stat-item">
              <span className="stat-label">Infracciones totales:</span>
              <span className="stat-value">{violationStats.total}</span>
            </div>
            
            {violationStats.recent > 0 && (
              <div className="stat-item recent">
                <span className="stat-label">Recientes (30 días):</span>
                <span className="stat-value">{violationStats.recent}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desglose detallado */}
      {showBreakdown && showDetails && (
        <div className="score-breakdown">
          <h4>📋 Desglose de Puntuación</h4>
          
          <div className="factors-list">
            {scoreFactors.map((factor, index) => (
              <div key={index} className={`factor-item ${factor.type}`}>
                <div className="factor-description">
                  {factor.text}
                </div>
                <div className="factor-impact">
                  {factor.impact > 0 && '+'}
                  {factor.impact !== 0 && factor.impact}
                  {factor.impact !== 0 && ' pts'}
                </div>
              </div>
            ))}
          </div>

          {violations.length > 0 && (
            <div className="violations-summary">
              <h5>⚠️ Resumen de Infracciones</h5>
              <div className="violations-grid">
                {Object.entries(violationStats.severityCounts).map(([severity, count]) => (
                  <div key={severity} className={`violation-count ${severity}`}>
                    <span className="count">{count}</span>
                    <span className="severity">{severity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="improvement-tips">
            <h5>💡 Consejos para Mejorar</h5>
            <ul>
              {score < 70 && (
                <li>Evita comportamientos tóxicos o antideportivos</li>
              )}
              {violationStats.recent > 0 && (
                <li>Mantén un comportamiento ejemplar durante los próximos 30 días</li>
              )}
              {score >= 70 && score < 90 && (
                <li>Continúa con el buen comportamiento para alcanzar nivel "Excelente"</li>
              )}
              {score >= 90 && (
                <li>¡Excelente! Eres un ejemplo para la comunidad</li>
              )}
              <li>Reporta comportamientos inadecuados que observes</li>
              <li>Ayuda a otros jugadores cuando sea necesario</li>
            </ul>
          </div>
        </div>
      )}

      {/* Indicadores de tendencia */}
      {showDetails && (
        <div className="score-trend">
          {violationStats.recent === 0 && violations.length > 0 && (
            <div className="trend-indicator positive">
              <span className="trend-icon">📈</span>
              <span>Tendencia positiva - Sin infracciones recientes</span>
            </div>
          )}
          
          {violationStats.recent > 0 && (
            <div className="trend-indicator negative">
              <span className="trend-icon">📉</span>
              <span>Atención - Infracciones recientes detectadas</span>
            </div>
          )}
          
          {score >= 95 && violations.length === 0 && (
            <div className="trend-indicator excellent">
              <span className="trend-icon">🌟</span>
              <span>¡Jugador ejemplar! Sin infracciones registradas</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FairPlayScoreDisplay;