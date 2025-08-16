import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationState } from '../../hooks/useNavigationState';
import ExpandableSection from '../../components/UI/ExpandableSection';
import Icon from '../../components/UI/Icon';
import DashboardTickets from './DashboardTickets';
import MonitoreoSistema from './MonitoreoSistema';
import LogsActividad from './LogsActividad';
import HerramientasDiagnostico from './HerramientasDiagnostico';
import './ServicioTecnicoPanel.scss';

/**
 * Panel de Servicio Técnico
 * Dashboard especializado para soporte técnico con gestión de tickets,
 * monitoreo del sistema y herramientas de diagnóstico
 */
const ServicioTecnicoPanel = () => {
  const { expandedPanels, togglePanel } = useNavigationState();
  const [activeSection, setActiveSection] = useState(null);

  // Configuración de secciones para Servicio Técnico
  const sections = [
    {
      id: 'dashboard-tickets',
      title: 'Dashboard de Tickets',
      description: 'Gestión centralizada de tickets de soporte',
      icon: 'life-buoy',
      component: DashboardTickets,
      color: 'red',
      priority: 'high'
    },
    {
      id: 'monitoreo-sistema',
      title: 'Monitoreo del Sistema',
      description: 'Estado en tiempo real de los servicios',
      icon: 'monitor',
      component: MonitoreoSistema,
      color: 'blue',
      priority: 'high'
    },
    {
      id: 'logs-actividad',
      title: 'Logs de Actividad',
      description: 'Registro detallado de eventos del sistema',
      icon: 'file-text',
      component: LogsActividad,
      color: 'green',
      priority: 'medium'
    },
    {
      id: 'herramientas-diagnostico',
      title: 'Herramientas de Diagnóstico',
      description: 'Utilidades para resolución de problemas',
      icon: 'tool',
      component: HerramientasDiagnostico,
      color: 'orange',
      priority: 'medium'
    }
  ];

  const isPanelExpanded = (sectionId) => {
    return expandedPanels[`servicio-tecnico.${sectionId}`] || false;
  };

  const handleSectionToggle = (sectionId) => {
    togglePanel('servicio-tecnico', sectionId);
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const renderSectionContent = (section) => {
    const Component = section.component;
    return <Component />;
  };

  const getSystemStatus = () => {
    // Simulación de estado del sistema
    return {
      status: 'operational', // 'operational', 'degraded', 'maintenance', 'outage'
      uptime: '99.98%',
      responseTime: '120ms',
      activeTickets: 8,
      criticalIssues: 1
    };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="servicio-tecnico-panel">
      {/* Header del panel */}
      <div className="panel-header">
        <div className="header-content">
          <div className="title-section">
            <Icon name="wrench" size="32" className="panel-icon" />
            <div>
              <h1>Panel de Servicio Técnico</h1>
              <p>Soporte especializado y monitoreo del sistema</p>
            </div>
          </div>
          
          <div className="system-status">
            <div className={`status-indicator ${systemStatus.status}`}>
              <div className="status-dot"></div>
              <span>
                {systemStatus.status === 'operational' ? 'Operativo' :
                 systemStatus.status === 'degraded' ? 'Degradado' :
                 systemStatus.status === 'maintenance' ? 'Mantenimiento' : 'Fuera de Servicio'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de estado crítico */}
      <div className="critical-metrics">
        <div className="metric-card uptime">
          <Icon name="trending-up" size="20" />
          <div className="metric-content">
            <span className="metric-value">{systemStatus.uptime}</span>
            <span className="metric-label">Uptime</span>
          </div>
        </div>
        
        <div className="metric-card response-time">
          <Icon name="zap" size="20" />
          <div className="metric-content">
            <span className="metric-value">{systemStatus.responseTime}</span>
            <span className="metric-label">Tiempo de Respuesta</span>
          </div>
        </div>
        
        <div className="metric-card active-tickets">
          <Icon name="life-buoy" size="20" />
          <div className="metric-content">
            <span className="metric-value">{systemStatus.activeTickets}</span>
            <span className="metric-label">Tickets Activos</span>
          </div>
        </div>
        
        <div className="metric-card critical-issues">
          <Icon name="alert-triangle" size="20" />
          <div className="metric-content">
            <span className="metric-value critical">{systemStatus.criticalIssues}</span>
            <span className="metric-label">Problemas Críticos</span>
          </div>
        </div>
      </div>

      {/* Alertas críticas */}
      {systemStatus.criticalIssues > 0 && (
        <motion.div 
          className="critical-alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Icon name="alert-circle" size="20" />
          <span>Hay {systemStatus.criticalIssues} problema(s) crítico(s) que requieren atención inmediata</span>
          <button className="btn btn-danger btn-sm">
            Ver Detalles
          </button>
        </motion.div>
      )}

      {/* Secciones expandibles */}
      <div className="sections-container">
        {sections.map((section) => {
          const isExpanded = isPanelExpanded(section.id);
          
          return (
            <div key={section.id} className="section-wrapper">
              <ExpandableSection
                id={section.id}
                title={section.title}
                description={section.description}
                icon={section.icon}
                isExpanded={isExpanded}
                onToggle={() => handleSectionToggle(section.id)}
                color={section.color}
                priority={section.priority}
                className="tech-section"
              >
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="section-content"
                    >
                      {renderSectionContent(section)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </ExpandableSection>
            </div>
          );
        })}
      </div>

      {/* Herramientas rápidas */}
      <div className="quick-tools">
        <h3>Herramientas Rápidas</h3>
        <div className="tools-grid">
          <button className="tool-card emergency">
            <Icon name="phone" size="24" />
            <span>Contacto de Emergencia</span>
          </button>
          
          <button className="tool-card">
            <Icon name="refresh-cw" size="24" />
            <span>Reiniciar Servicios</span>
          </button>
          
          <button className="tool-card">
            <Icon name="database" size="24" />
            <span>Backup Manual</span>
          </button>
          
          <button className="tool-card">
            <Icon name="terminal" size="24" />
            <span>Consola del Sistema</span>
          </button>
          
          <button className="tool-card">
            <Icon name="shield" size="24" />
            <span>Verificar Seguridad</span>
          </button>
          
          <button className="tool-card">
            <Icon name="activity" size="24" />
            <span>Análisis de Rendimiento</span>
          </button>
        </div>
      </div>

      {/* Información de turno */}
      <div className="shift-info">
        <div className="shift-header">
          <h4>Información del Turno</h4>
          <div className="shift-status active">
            <Icon name="clock" size="16" />
            <span>Turno Activo</span>
          </div>
        </div>
        
        <div className="shift-details">
          <div className="shift-detail">
            <span className="label">Técnico en turno:</span>
            <span className="value">Usuario Actual</span>
          </div>
          <div className="shift-detail">
            <span className="label">Inicio del turno:</span>
            <span className="value">08:00</span>
          </div>
          <div className="shift-detail">
            <span className="label">Fin del turno:</span>
            <span className="value">16:00</span>
          </div>
          <div className="shift-detail">
            <span className="label">Técnico siguiente:</span>
            <span className="value">Técnico B</span>
          </div>
        </div>
        
        <div className="escalation-contacts">
          <h5>Contactos de Escalación</h5>
          <div className="contact-list">
            <div className="contact-item">
              <Icon name="user" size="14" />
              <span>Supervisor Técnico: +1234567890</span>
            </div>
            <div className="contact-item">
              <Icon name="users" size="14" />
              <span>Equipo de Desarrollo: dev@playtest.com</span>
            </div>
            <div className="contact-item">
              <Icon name="shield" size="14" />
              <span>Seguridad: security@playtest.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicioTecnicoPanel;