import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../UI/Icon';
import NotificationBadge from './NotificationBadge';
import './TabButton.scss';

/**
 * Componente para botones de pestañas con notificaciones y shortcuts
 */
const TabButton = ({
  tab,
  isActive,
  onClick,
  notificationCount = 0,
  notificationPriority = null,
  shortcutKey = null
}) => {
  const handleClick = () => {
    onClick();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.button
      className={`tab-button ${isActive ? 'active' : ''} ${tab.universal ? 'universal' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      aria-label={`${tab.label}${notificationCount > 0 ? ` (${notificationCount} notificaciones)` : ''}`}
      title={`${tab.label}${shortcutKey ? ` (${shortcutKey})` : ''}`}
    >
      {/* Indicador de estado activo */}
      {isActive && (
        <motion.div
          className="active-indicator"
          layoutId="activeTab"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      {/* Contenido del botón */}
      <div className="tab-content">
        <Icon 
          name={tab.icon} 
          className="tab-icon"
          size="20"
        />
        
        <span className="tab-label">{tab.label}</span>
        
        {/* Badge de notificaciones */}
        {notificationCount > 0 && (
          <NotificationBadge
            count={notificationCount}
            priority={notificationPriority}
            size="small"
          />
        )}
        
        {/* Indicador de shortcut */}
        {shortcutKey && !isActive && (
          <span className="shortcut-hint">{shortcutKey}</span>
        )}
      </div>

      {/* Efecto de fondo para pestañas universales */}
      {tab.universal && (
        <div className="universal-background" />
      )}
    </motion.button>
  );
};

export default TabButton;