import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationState } from '../../hooks/useNavigationState';
import { useAuthContext } from '../../contexts/AuthContext';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import ExpandableSection from '../../components/UI/ExpandableSection';
import Icon from '../../components/UI/Icon';
import LuminariasUsuario from './LuminariasUsuario';
import MonetizacionCreador from './MonetizacionCreador';
import HistorialTransacciones from './HistorialTransacciones';
import PlanesSubscripcion from './PlanesSubscripcion';
import Marketplace from './Marketplace';
import './FinancieroPanel.scss';

/**
 * Panel Financiero Universal con vistas diferenciadas
 * - Vista Usuario: Luminarias, compras, historial
 * - Vista Creador: Monetización, ingresos, analytics
 */
const FinancieroPanel = () => {
  const { expandedPanels, togglePanel } = useNavigationState();
  const { user } = useAuthContext();
  const { isFeatureEnabled } = useFeatureFlags();
  const [activeSection, setActiveSection] = useState(null);
  const [userType, setUserType] = useState('usuario'); // 'usuario' | 'creador'

  // Determinar tipo de usuario
  useEffect(() => {
    if (user?.roles?.includes('profesor') || user?.roles?.includes('creador')) {
      setUserType('creador');
    } else {
      setUserType('usuario');
    }
  }, [user]);

  // Configuración de secciones según tipo de usuario
  const getSections = () => {
    const baseSections = [
      {
        id: 'historial-transacciones',
        title: 'Historial de Transacciones',
        description: 'Registro completo de movimientos financieros',
        icon: 'list',
        component: HistorialTransacciones,
        color: 'gray',
        universal: true
      }
    ];

    if (userType === 'usuario') {
      return [
        {
          id: 'luminarias-usuario',
          title: 'Mis Luminarias',
          description: 'Gestión de tu moneda virtual',
          icon: 'coins',
          component: LuminariasUsuario,
          color: 'gold',
          primary: true
        },
        {
          id: 'marketplace',
          title: 'Marketplace',
          description: 'Compra contenido premium y mejoras',
          icon: 'shopping-cart',
          component: Marketplace,
          color: 'blue',
          requiresFeature: 'monetization_marketplace'
        },
        {
          id: 'planes-subscripcion',
          title: 'Planes y Suscripciones',
          description: 'Gestiona tu suscripción premium',
          icon: 'credit-card',
          component: PlanesSubscripcion,
          color: 'purple',
          requiresFeature: 'monetization_plans'
        },
        ...baseSections
      ];
    } else {
      return [
        {
          id: 'monetizacion-creador',
          title: 'Panel de Monetización',
          description: 'Ingresos, analytics y herramientas de creador',
          icon: 'trending-up',
          component: MonetizacionCreador,
          color: 'green',
          primary: true
        },
        {
          id: 'luminarias-usuario',
          title: 'Mis Luminarias',
          description: 'Tu billetera de Luminarias',
          icon: 'coins',
          component: LuminariasUsuario,
          color: 'gold'
        },
        {
          id: 'marketplace',
          title: 'Marketplace',
          description: 'Herramientas y recursos para creadores',
          icon: 'shopping-cart',
          component: Marketplace,
          color: 'blue',
          requiresFeature: 'monetization_marketplace'
        },
        ...baseSections
      ];
    }
  };

  // Filtrar secciones por features activos
  const availableSections = getSections().filter(section => {
    if (section.requiresFeature) {
      return isFeatureEnabled(section.requiresFeature);
    }
    return true;
  });

  const isPanelExpanded = (sectionId) => {
    return expandedPanels[`financiero.${sectionId}`] || false;
  };

  const handleSectionToggle = (sectionId) => {
    togglePanel('financiero', sectionId);
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const renderSectionContent = (section) => {
    const Component = section.component;
    return <Component userType={userType} />;
  };

  // Estadísticas financieras del usuario
  const getFinancialStats = () => {
    if (userType === 'usuario') {
      return {
        luminarias: 2450,
        gastadas: 1200,
        ganadas: 3650,
        ranking: 156
      };
    } else {
      return {
        ingresos: 125.50,
        luminarias: 8920,
        ventas: 45,
        comision: 15.75
      };
    }
  };

  const financialStats = getFinancialStats();

  return (
    <div className="financiero-panel">
      {/* Header del panel */}
      <div className="panel-header">
        <div className="header-content">
          <div className="title-section">
            <Icon name="dollar-sign" size="32" className="panel-icon" />
            <div>
              <h1>Panel Financiero</h1>
              <p>
                {userType === 'usuario' 
                  ? 'Gestiona tus Luminarias y compras'
                  : 'Monetización y analytics para creadores'
                }
              </p>
            </div>
          </div>
          
          <div className="user-type-indicator">
            <div className={`type-badge ${userType}`}>
              <Icon name={userType === 'usuario' ? 'user' : 'graduation-cap'} size="16" />
              <span>{userType === 'usuario' ? 'Usuario' : 'Creador'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="financial-stats">
        {userType === 'usuario' ? (
          <>
            <motion.div 
              className="stat-card primary"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="coins" size="24" />
              <div className="stat-content">
                <span className="stat-number">{financialStats.luminarias.toLocaleString()}</span>
                <span className="stat-label">Luminarias Disponibles</span>
              </div>
              <span className="stat-trend positive">+250 esta semana</span>
            </motion.div>

            <motion.div 
              className="stat-card secondary"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="arrow-up" size="24" />
              <div className="stat-content">
                <span className="stat-number">{financialStats.ganadas.toLocaleString()}</span>
                <span className="stat-label">Luminarias Ganadas</span>
              </div>
            </motion.div>

            <motion.div 
              className="stat-card tertiary"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="arrow-down" size="24" />
              <div className="stat-content">
                <span className="stat-number">{financialStats.gastadas.toLocaleString()}</span>
                <span className="stat-label">Luminarias Gastadas</span>
              </div>
            </motion.div>

            <motion.div 
              className="stat-card quaternary"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="award" size="24" />
              <div className="stat-content">
                <span className="stat-number">#{financialStats.ranking}</span>
                <span className="stat-label">Ranking Económico</span>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div 
              className="stat-card earnings"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="dollar-sign" size="24" />
              <div className="stat-content">
                <span className="stat-number">${financialStats.ingresos}</span>
                <span className="stat-label">Ingresos del Mes</span>
              </div>
              <span className="stat-trend positive">+12% vs mes anterior</span>
            </motion.div>

            <motion.div 
              className="stat-card sales"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="shopping-bag" size="24" />
              <div className="stat-content">
                <span className="stat-number">{financialStats.ventas}</span>
                <span className="stat-label">Ventas Totales</span>
              </div>
            </motion.div>

            <motion.div 
              className="stat-card luminarias"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="coins" size="24" />
              <div className="stat-content">
                <span className="stat-number">{financialStats.luminarias.toLocaleString()}</span>
                <span className="stat-label">Mis Luminarias</span>
              </div>
            </motion.div>

            <motion.div 
              className="stat-card commission"
              whileHover={{ scale: 1.02 }}
            >
              <Icon name="percent" size="24" />
              <div className="stat-content">
                <span className="stat-number">${financialStats.comision}</span>
                <span className="stat-label">Comisión Pendiente</span>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Acciones rápidas diferenciadas */}
      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          {userType === 'usuario' ? (
            <>
              <motion.button 
                className="action-card primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="plus" size="20" />
                <span>Comprar Luminarias</span>
              </motion.button>

              <motion.button 
                className="action-card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="gift" size="20" />
                <span>Enviar Regalo</span>
              </motion.button>

              <motion.button 
                className="action-card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="crown" size="20" />
                <span>Upgrade Premium</span>
              </motion.button>
            </>
          ) : (
            <>
              <motion.button 
                className="action-card primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="download" size="20" />
                <span>Retirar Fondos</span>
              </motion.button>

              <motion.button 
                className="action-card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="bar-chart" size="20" />
                <span>Ver Analytics</span>
              </motion.button>

              <motion.button 
                className="action-card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="settings" size="20" />
                <span>Config. Precios</span>
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Secciones expandibles */}
      <div className="sections-container">
        {availableSections.map((section) => {
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
                className={`financial-section ${section.primary ? 'primary' : ''}`}
                badge={section.universal ? 'Universal' : userType === 'creador' ? 'Creador' : 'Usuario'}
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

      {/* Características del panel */}
      <div className="panel-features">
        <div className="features-header">
          <h3>Características del Panel</h3>
          <div className={`view-indicator ${userType}`}>
            Vista {userType === 'usuario' ? 'Usuario' : 'Creador'}
          </div>
        </div>
        
        <div className="features-list">
          {userType === 'usuario' ? (
            <>
              <div className="feature-item">
                <Icon name="check" size="14" className="enabled-icon" />
                <span>Gestión completa de Luminarias</span>
              </div>
              <div className="feature-item">
                <Icon name="check" size="14" className="enabled-icon" />
                <span>Compras en Marketplace</span>
              </div>
              <div className="feature-item">
                <Icon name="check" size="14" className="enabled-icon" />
                <span>Historial de transacciones</span>
              </div>
              {isFeatureEnabled('monetization_plans') && (
                <div className="feature-item">
                  <Icon name="check" size="14" className="enabled-icon" />
                  <span>Gestión de suscripciones premium</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="feature-item">
                <Icon name="check" size="14" className="enabled-icon" />
                <span>Panel de monetización avanzado</span>
              </div>
              <div className="feature-item">
                <Icon name="check" size="14" className="enabled-icon" />
                <span>Analytics de ingresos en tiempo real</span>
              </div>
              <div className="feature-item">
                <Icon name="check" size="14" className="enabled-icon" />
                <span>Herramientas de configuración de precios</span>
              </div>
              <div className="feature-item">
                <Icon name="check" size="14" className="enabled-icon" />
                <span>Sistema de comisiones transparente</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancieroPanel;