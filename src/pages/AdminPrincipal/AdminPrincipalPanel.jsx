import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationState } from '../../hooks/useNavigationState';
import { useAutoMarkAsRead } from '../../hooks/useNotificationBadges';
import ExpandableSection from '../../components/UI/ExpandableSection';
import AdministradoresSecundarios from './AdministradoresSecundarios';
import ProfesoresCreadores from './ProfesoresCreadores';
import UsuariosJugadores from './UsuariosJugadores';
import ConfiguracionModular from './ConfiguracionModular';
import './AdminPrincipalPanel.scss';

/**
 * Panel Principal de Administrador
 * 4 secciones expandibles con navegación jerárquica
 */
const AdminPrincipalPanel = () => {
  const { expandedPanels, togglePanel, addRecentSection } = useNavigationState();
  
  // Auto-marcar notificaciones como leídas
  useAutoMarkAsRead('admin-principal');

  // Configuración de secciones
  const sections = [
    {
      id: 'administradores-secundarios',
      title: 'Administradores Secundarios',
      icon: 'shield',
      description: 'Gestión de administradores delegados y sus asignaciones',
      component: AdministradoresSecundarios,
      priority: 1
    },
    {
      id: 'profesores-creadores',
      title: 'Profesores/Creadores',
      icon: 'users',
      description: 'Gestión expandible multinivel de educadores y contenido',
      component: ProfesoresCreadores,
      priority: 2
    },
    {
      id: 'usuarios-jugadores',
      title: 'Usuarios/Jugadores',
      icon: 'gamepad',
      description: 'Administración de usuarios finales y sus datos',
      component: UsuariosJugadores,
      priority: 3
    },
    {
      id: 'configuracion-modular',
      title: 'Configuración Modular de la Aplicación',
      icon: 'settings',
      description: 'Sistema de Feature Flags con 9 grupos de funcionalidades',
      component: ConfiguracionModular,
      priority: 4
    }
  ];

  const handleSectionToggle = (sectionId) => {
    togglePanel('admin-principal', sectionId);
    
    // Agregar a secciones recientes
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      addRecentSection({
        id: `admin-principal.${sectionId}`,
        label: section.title,
        route: `/admin-principal#${sectionId}`,
        context: 'admin-principal'
      });
    }
  };

  const isSectionExpanded = (sectionId) => {
    return expandedPanels[`admin-principal.${sectionId}`] || false;
  };

  return (
    <div className="admin-principal-panel">
      {/* Header del panel */}
      <div className="panel-header">
        <div className="header-content">
          <h1>Panel de Administrador Principal</h1>
          <p>Gestión completa del sistema PLAYTEST</p>
        </div>
        
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">4</span>
            <span className="stat-label">Secciones</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {sections.filter(s => isSectionExpanded(s.id)).length}
            </span>
            <span className="stat-label">Expandidas</span>
          </div>
        </div>
      </div>

      {/* Secciones expandibles */}
      <div className="sections-container">
        {sections.map((section) => {
          const SectionComponent = section.component;
          const isExpanded = isSectionExpanded(section.id);
          
          return (
            <motion.div
              key={section.id}
              className="section-wrapper"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3,
                delay: section.priority * 0.1
              }}
            >
              <ExpandableSection
                id={section.id}
                title={section.title}
                icon={section.icon}
                description={section.description}
                isExpanded={isExpanded}
                onToggle={() => handleSectionToggle(section.id)}
                priority={section.priority}
                className="admin-section"
              >
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.div
                      key={`${section.id}-content`}
                      className="section-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ 
                        duration: 0.4,
                        ease: 'easeInOut'
                      }}
                    >
                      <SectionComponent />
                    </motion.div>
                  )}
                </AnimatePresence>
              </ExpandableSection>
            </motion.div>
          );
        })}
      </div>

      {/* Acciones rápidas flotantes */}
      <div className="quick-actions">
        <button
          className="quick-action-btn expand-all"
          onClick={() => {
            sections.forEach(section => {
              if (!isSectionExpanded(section.id)) {
                handleSectionToggle(section.id);
              }
            });
          }}
          title="Expandir todas las secciones (Ctrl+Shift+E)"
        >
          <span className="btn-icon">⬇</span>
          <span className="btn-text">Expandir Todo</span>
        </button>
        
        <button
          className="quick-action-btn collapse-all"
          onClick={() => {
            sections.forEach(section => {
              if (isSectionExpanded(section.id)) {
                handleSectionToggle(section.id);
              }
            });
          }}
          title="Colapsar todas las secciones (Ctrl+Shift+C)"
        >
          <span className="btn-icon">⬆</span>
          <span className="btn-text">Colapsar Todo</span>
        </button>
      </div>
    </div>
  );
};

export default AdminPrincipalPanel;