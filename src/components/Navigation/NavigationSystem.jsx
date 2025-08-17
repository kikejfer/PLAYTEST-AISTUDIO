import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useNavigationState } from '../../hooks/useNavigationState';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
// import { useNotificationBadges } from '../../hooks/useNotificationBadges'; // Disabled for testing
import TabButton from './TabButton';
import SearchGlobal from './SearchGlobal';
import './NavigationSystem.scss';

/**
 * Sistema de Navegación Jerárquico Principal
 * Gestiona todas las pestañas dinámicas basadas en roles
 */
const NavigationSystem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRoles } = useAuthContext();
  const { activeTab, setActiveTab, breadcrumbs, addBreadcrumb } = useNavigationState();
  // const { notificationCounts } = useNotificationBadges(); // Disabled for testing
  const notificationCounts = {}; // Mock for testing

  // Configuración de pestañas por rol
  const TAB_CONFIGS = useMemo(() => ({
    administrador_principal: {
      id: 'admin-principal',
      label: 'Admin Principal',
      icon: 'crown',
      priority: 1,
      route: '/admin-principal',
      sections: [
        'administradores-secundarios',
        'profesores-creadores', 
        'usuarios-jugadores',
        'configuracion-modular'
      ]
    },
    administrador_secundario: {
      id: 'admin-secundario',
      label: 'Admin Secundario',
      icon: 'shield',
      priority: 2,
      route: '/admin-secundario',
      sections: [
        'profesores-asignados',
        'usuarios-asignados'
      ]
    },
    servicio_tecnico: {
      id: 'servicio-tecnico',
      label: 'Soporte Técnico',
      icon: 'tools',
      priority: 3,
      route: '/soporte',
      sections: [
        'dashboard-tickets',
        'base-conocimiento'
      ]
    },
    profesor: {
      id: 'profesor',
      label: 'Panel Profesor',
      icon: 'graduation-cap',
      priority: 4,
      route: '/profesor',
      sections: [
        'analytics-bloques',
        'gestion-retos',
        'gestion-torneos',
        'gestion-estudiantes',
        'herramientas-creacion'
      ]
    },
    creador: {
      id: 'creador',
      label: 'Panel Creador',
      icon: 'paint-brush',
      priority: 4,
      route: '/creador',
      sections: [
        'analytics-bloques',
        'gestion-retos',
        'gestion-torneos',
        'gestion-estudiantes',
        'herramientas-creacion'
      ]
    }
  }), []);

  // Pestañas universales (siempre visibles)
  const UNIVERSAL_TABS = useMemo(() => ({
    juego: {
      id: 'juego',
      label: 'Juego',
      icon: 'gamepad',
      priority: 5,
      route: '/juego',
      universal: true
    },
    financiero: {
      id: 'financiero',
      label: 'Financiero',
      icon: 'coins',
      priority: 6,
      route: '/financiero',
      universal: true
    }
  }), []);

  // Calcular pestañas disponibles basado en roles del usuario
  const availableTabs = useMemo(() => {
    const roleTabs = userRoles
      .filter(role => TAB_CONFIGS[role.name])
      .map(role => ({
        ...TAB_CONFIGS[role.name],
        roleName: role.name
      }))
      .sort((a, b) => a.priority - b.priority);

    const universalTabs = Object.values(UNIVERSAL_TABS);
    
    return [...roleTabs, ...universalTabs];
  }, [userRoles, TAB_CONFIGS, UNIVERSAL_TABS]);

  // Configurar shortcuts de teclado
  useKeyboardShortcuts({
    'ctrl+1': () => switchToTab(0),
    'ctrl+2': () => switchToTab(1),
    'ctrl+3': () => switchToTab(2),
    'ctrl+4': () => switchToTab(3),
    'ctrl+5': () => switchToTab(4),
    'ctrl+6': () => switchToTab(5),
    'ctrl+shift+f': () => document.getElementById('global-search').focus(),
    'escape': () => setActiveTab(getDefaultTab())
  });

  const switchToTab = (index) => {
    if (availableTabs[index]) {
      handleTabChange(availableTabs[index].id);
    }
  };

  const getDefaultTab = () => {
    return availableTabs.length > 0 ? availableTabs[0].id : 'juego';
  };

  // Inicializar pestaña por defecto
  useEffect(() => {
    if (!activeTab && availableTabs.length > 0) {
      const defaultTab = getDefaultTab();
      setActiveTab(defaultTab);
      navigate(availableTabs.find(tab => tab.id === defaultTab)?.route || '/');
    }
  }, [availableTabs, activeTab, setActiveTab, navigate]);

  // Sincronizar con la URL actual
  useEffect(() => {
    const currentPath = location.pathname;
    const matchingTab = availableTabs.find(tab => 
      currentPath.startsWith(tab.route)
    );
    
    if (matchingTab && matchingTab.id !== activeTab) {
      setActiveTab(matchingTab.id);
    }
  }, [location.pathname, availableTabs, activeTab, setActiveTab]);

  const handleTabChange = (tabId) => {
    const tab = availableTabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTab(tabId);
      navigate(tab.route);
      
      // Agregar a breadcrumbs
      addBreadcrumb({
        id: tabId,
        label: tab.label,
        route: tab.route
      });
    }
  };

  const getNotificationCount = (tabId) => {
    return notificationCounts[tabId] || 0;
  };

  const getNotificationPriority = (tabId) => {
    const notifications = notificationCounts[tabId + '_details'] || [];
    if (notifications.some(n => n.priority === 'critical')) return 'critical';
    if (notifications.some(n => n.priority === 'important')) return 'important';
    if (notifications.length > 0) return 'info';
    return null;
  };

  return (
    <nav className="navigation-system">
      {/* Header de navegación */}
      <div className="navigation-header">
        <div className="navigation-brand">
          <img src="/logo-playtest.svg" alt="PLAYTEST" className="brand-logo" />
          <span className="brand-text">PLAYTEST</span>
        </div>

        {/* Búsqueda global */}
        <SearchGlobal />

        {/* Info del usuario */}
        <div className="user-info">
          <span className="user-name">{user?.nickname}</span>
          <span className="user-roles">
            {userRoles.map(role => role.display_name).join(', ')}
          </span>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="navigation-tabs">
        <div className="tabs-container">
          {availableTabs.map((tab, index) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              notificationCount={getNotificationCount(tab.id)}
              notificationPriority={getNotificationPriority(tab.id)}
              shortcutKey={index < 6 ? `Ctrl+${index + 1}` : null}
            />
          ))}
        </div>

        {/* Breadcrumbs dinámicos */}
        {breadcrumbs.length > 1 && (
          <div className="breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                {index > 0 && <span className="breadcrumb-separator">›</span>}
                <button
                  className={`breadcrumb-item ${
                    index === breadcrumbs.length - 1 ? 'active' : ''
                  }`}
                  onClick={() => navigate(crumb.route)}
                  disabled={index === breadcrumbs.length - 1}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Indicador de shortcuts */}
      <div className="shortcuts-help">
        <button 
          className="shortcuts-toggle"
          title="Ver atajos de teclado (Ctrl+H)"
        >
          <i className="icon-keyboard" />
        </button>
      </div>
    </nav>
  );
};

export default NavigationSystem;