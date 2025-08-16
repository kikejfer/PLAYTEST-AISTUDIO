import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationState } from '../../hooks/useNavigationState';
import ExpandableSection from '../../components/UI/ExpandableSection';
import Icon from '../../components/UI/Icon';
import ProfesoresAsignados from './ProfesoresAsignados';
import UsuariosAsignados from './UsuariosAsignados';
import ReportesSecundario from './ReportesSecundario';
import './AdminSecundarioPanel.scss';

/**
 * Panel de Administrador Secundario
 * Funcionalidades limitadas comparado con Admin Principal
 * - No acceso a datos de Luminarias
 * - No capacidades de reasignación de administradores
 * - Solo gestión de profesores y usuarios asignados
 */
const AdminSecundarioPanel = () => {
  const { expandedPanels, togglePanel } = useNavigationState();
  const [activeSection, setActiveSection] = useState(null);

  // Configuración de secciones para Admin Secundario
  const sections = [
    {
      id: 'profesores-asignados',
      title: 'Profesores Asignados',
      description: 'Gestión de profesores bajo tu supervisión',
      icon: 'graduation-cap',
      component: ProfesoresAsignados,
      color: 'blue'
    },
    {
      id: 'usuarios-asignados',
      title: 'Usuarios Asignados',
      description: 'Seguimiento de usuarios finales asignados',
      icon: 'users',
      component: UsuariosAsignados,
      color: 'green'
    },
    {
      id: 'reportes-secundario',
      title: 'Reportes y Métricas',
      description: 'Estadísticas de tu área de gestión',
      icon: 'chart-bar',
      component: ReportesSecundario,
      color: 'purple'
    }
  ];

  const isPanelExpanded = (sectionId) => {
    return expandedPanels[`admin-secundario.${sectionId}`] || false;
  };

  const handleSectionToggle = (sectionId) => {
    togglePanel('admin-secundario', sectionId);
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const renderSectionContent = (section) => {
    const Component = section.component;
    return <Component />;
  };

  return (
    <div className="admin-secundario-panel">
      {/* Header del panel */}
      <div className="panel-header">
        <div className="header-content">
          <div className="title-section">
            <Icon name="shield" size="32" className="panel-icon" />
            <div>
              <h1>Panel de Administrador Secundario</h1>
              <p>Gestión delegada de profesores y usuarios asignados</p>
            </div>
          </div>
          
          <div className="admin-info">
            <div className="admin-badge">
              <Icon name="user-check" size="16" />
              <span>Admin Secundario</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de resumen */}
      <div className="summary-stats">
        <div className="stat-card primary">
          <Icon name="graduation-cap" size="24" />
          <div className="stat-content">
            <span className="stat-number">12</span>
            <span className="stat-label">Profesores Asignados</span>
          </div>
        </div>
        
        <div className="stat-card secondary">
          <Icon name="users" size="24" />
          <div className="stat-content">
            <span className="stat-number">248</span>
            <span className="stat-label">Usuarios Asignados</span>
          </div>
        </div>
        
        <div className="stat-card tertiary">
          <Icon name="layers" size="24" />
          <div className="stat-content">
            <span className="stat-number">45</span>
            <span className="stat-label">Bloques Activos</span>
          </div>
        </div>
        
        <div className="stat-card quaternary">
          <Icon name="help-circle" size="24" />
          <div className="stat-content">
            <span className="stat-number">1,234</span>
            <span className="stat-label">Preguntas Totales</span>
          </div>
        </div>
      </div>

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
                className="admin-section"
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

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          <button className="action-card">
            <Icon name="mail" size="20" />
            <span>Notificar Profesores</span>
          </button>
          
          <button className="action-card">
            <Icon name="download" size="20" />
            <span>Exportar Reportes</span>
          </button>
          
          <button className="action-card">
            <Icon name="settings" size="20" />
            <span>Configurar Alertas</span>
          </button>
          
          <button className="action-card">
            <Icon name="help-circle" size="20" />
            <span>Soporte Técnico</span>
          </button>
        </div>
      </div>

      {/* Limitaciones del rol */}
      <div className="role-limitations">
        <div className="limitation-notice">
          <Icon name="info" size="16" />
          <span>Como Administrador Secundario, tienes acceso limitado a ciertas funcionalidades del sistema</span>
        </div>
        
        <div className="limitations-list">
          <div className="limitation-item">
            <Icon name="x" size="14" className="disabled-icon" />
            <span>Sin acceso a datos financieros (Luminarias)</span>
          </div>
          <div className="limitation-item">
            <Icon name="x" size="14" className="disabled-icon" />
            <span>Sin capacidades de reasignación entre administradores</span>
          </div>
          <div className="limitation-item">
            <Icon name="x" size="14" className="disabled-icon" />
            <span>Sin acceso a configuración global del sistema</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecundarioPanel;