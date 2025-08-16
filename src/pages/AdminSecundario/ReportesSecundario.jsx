import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/UI/Icon';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import './ReportesSecundario.scss';

/**
 * Sección de Reportes y Métricas para Admin Secundario
 * Reportes limitados al área de gestión del administrador
 */
const ReportesSecundario = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('actividad');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin-secundario/reportes?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];

  const metrics = [
    { value: 'actividad', label: 'Actividad de Usuarios', icon: 'activity' },
    { value: 'contenido', label: 'Creación de Contenido', icon: 'layers' },
    { value: 'engagement', label: 'Participación', icon: 'users' },
    { value: 'rendimiento', label: 'Rendimiento', icon: 'chart-bar' }
  ];

  const mockData = {
    overview: {
      profesores_activos: 8,
      usuarios_activos: 156,
      bloques_creados: 12,
      preguntas_nuevas: 245
    },
    actividad: {
      daily: [
        { day: 'Lun', users: 45, professors: 3 },
        { day: 'Mar', users: 52, professors: 4 },
        { day: 'Mié', users: 38, professors: 2 },
        { day: 'Jue', users: 61, professors: 5 },
        { day: 'Vie', users: 44, professors: 3 },
        { day: 'Sáb', users: 28, professors: 1 },
        { day: 'Dom', users: 15, professors: 0 }
      ]
    },
    top_profesores: [
      { nombre: 'Prof. García', bloques: 5, preguntas: 120, actividad: 95 },
      { nombre: 'Prof. Martínez', bloques: 4, preguntas: 98, actividad: 87 },
      { nombre: 'Prof. López', bloques: 3, preguntas: 76, actividad: 82 }
    ],
    alertas: [
      { tipo: 'warning', mensaje: 'Prof. Rodríguez sin actividad por 5 días', timestamp: '2024-01-15' },
      { tipo: 'info', mensaje: 'Nuevo bloque creado por Prof. García', timestamp: '2024-01-14' },
      { tipo: 'success', mensaje: 'Meta semanal de preguntas alcanzada', timestamp: '2024-01-13' }
    ]
  };

  if (loading) {
    return <LoadingSpinner size="medium" />;
  }

  return (
    <div className="reportes-secundario">
      {/* Header */}
      <div className="section-header">
        <div className="header-content">
          <h3>Reportes y Métricas</h3>
          <p>Estadísticas de tu área de gestión</p>
        </div>

        <div className="header-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="overview-metrics">
        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="graduation-cap" size="24" />
          <div className="metric-content">
            <span className="metric-number">{mockData.overview.profesores_activos}</span>
            <span className="metric-label">Profesores Activos</span>
            <span className="metric-change positive">+2 esta semana</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="users" size="24" />
          <div className="metric-content">
            <span className="metric-number">{mockData.overview.usuarios_activos}</span>
            <span className="metric-label">Usuarios Activos</span>
            <span className="metric-change positive">+12 esta semana</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="layers" size="24" />
          <div className="metric-content">
            <span className="metric-number">{mockData.overview.bloques_creados}</span>
            <span className="metric-label">Bloques Creados</span>
            <span className="metric-change positive">+3 esta semana</span>
          </div>
        </motion.div>

        <motion.div 
          className="metric-card"
          whileHover={{ scale: 1.02 }}
        >
          <Icon name="help-circle" size="24" />
          <div className="metric-content">
            <span className="metric-number">{mockData.overview.preguntas_nuevas}</span>
            <span className="metric-label">Preguntas Nuevas</span>
            <span className="metric-change positive">+45 esta semana</span>
          </div>
        </motion.div>
      </div>

      {/* Selector de métricas */}
      <div className="metrics-selector">
        {metrics.map(metric => (
          <button
            key={metric.value}
            className={`metric-btn ${selectedMetric === metric.value ? 'active' : ''}`}
            onClick={() => setSelectedMetric(metric.value)}
          >
            <Icon name={metric.icon} size="16" />
            {metric.label}
          </button>
        ))}
      </div>

      {/* Gráfico de actividad */}
      <div className="chart-section">
        <h4>Actividad Diaria</h4>
        <div className="activity-chart">
          {mockData.actividad.daily.map((day, index) => (
            <div key={index} className="chart-bar">
              <div className="bar-container">
                <div 
                  className="bar users" 
                  style={{ height: `${(day.users / 70) * 100}%` }}
                  title={`${day.users} usuarios`}
                />
                <div 
                  className="bar professors" 
                  style={{ height: `${(day.professors / 5) * 100}%` }}
                  title={`${day.professors} profesores`}
                />
              </div>
              <span className="day-label">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color users"></div>
            <span>Usuarios</span>
          </div>
          <div className="legend-item">
            <div className="legend-color professors"></div>
            <span>Profesores</span>
          </div>
        </div>
      </div>

      {/* Top profesores */}
      <div className="top-profesores">
        <h4>Top Profesores de la Semana</h4>
        <div className="profesores-list">
          {mockData.top_profesores.map((profesor, index) => (
            <motion.div
              key={index}
              className="profesor-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="profesor-rank">#{index + 1}</div>
              <div className="profesor-info">
                <h5>{profesor.nombre}</h5>
                <div className="profesor-stats">
                  <span><Icon name="layers" size="12" /> {profesor.bloques} bloques</span>
                  <span><Icon name="help-circle" size="12" /> {profesor.preguntas} preguntas</span>
                </div>
              </div>
              <div className="actividad-score">
                <div className="score-circle">
                  <span>{profesor.actividad}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Alertas y notificaciones */}
      <div className="alertas-section">
        <h4>Alertas Recientes</h4>
        <div className="alertas-list">
          {mockData.alertas.map((alerta, index) => (
            <motion.div
              key={index}
              className={`alerta-item ${alerta.tipo}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon 
                name={
                  alerta.tipo === 'warning' ? 'alert-triangle' : 
                  alerta.tipo === 'success' ? 'check-circle' : 'info'
                } 
                size="16" 
              />
              <div className="alerta-content">
                <span className="alerta-mensaje">{alerta.mensaje}</span>
                <span className="alerta-time">{alerta.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h4>Acciones Rápidas</h4>
        <div className="actions-grid">
          <button className="action-btn">
            <Icon name="download" size="16" />
            Exportar Reporte
          </button>
          <button className="action-btn">
            <Icon name="mail" size="16" />
            Enviar Resumen
          </button>
          <button className="action-btn">
            <Icon name="bell" size="16" />
            Configurar Alertas
          </button>
          <button className="action-btn">
            <Icon name="calendar" size="16" />
            Programar Reporte
          </button>
        </div>
      </div>

      {/* Limitaciones del rol */}
      <div className="role-limitations">
        <div className="limitation-notice">
          <Icon name="info" size="16" />
          <span>Los reportes están limitados a tu área de gestión asignada</span>
        </div>
      </div>
    </div>
  );
};

export default ReportesSecundario;