import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './NotificationBadge.scss';

/**
 * Componente para mostrar badges de notificaciones con animaciones
 * Soporta diferentes prioridades y estilos
 */
const NotificationBadge = ({
  count = 0,
  priority = 'info', // 'critical', 'important', 'warning', 'info'
  size = 'medium', // 'small', 'medium', 'large'
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  showZero = false,
  maxCount = 99,
  animated = true,
  className = ''
}) => {
  // No mostrar si count es 0 y showZero es false
  if (count === 0 && !showZero) return null;

  // Formatear el número mostrado
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Determinar clases CSS
  const badgeClasses = [
    'notification-badge',
    `priority-${priority}`,
    `size-${size}`,
    `position-${position}`,
    className
  ].filter(Boolean).join(' ');

  // Animaciones
  const badgeVariants = {
    hidden: { 
      scale: 0,
      opacity: 0
    },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 25
      }
    },
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 2
      }
    }
  };

  const countVariants = {
    hidden: { 
      y: -10,
      opacity: 0 
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={badgeClasses}
        variants={badgeVariants}
        initial={animated ? 'hidden' : 'visible'}
        animate={[
          'visible',
          ...(priority === 'critical' && animated ? ['pulse'] : [])
        ]}
        exit={animated ? 'hidden' : undefined}
        layout
      >
        {/* Contenido del badge */}
        <motion.span
          className="badge-content"
          variants={countVariants}
          key={displayCount} // Key para animar cambios de número
        >
          {displayCount}
        </motion.span>

        {/* Indicador de prioridad crítica */}
        {priority === 'critical' && (
          <motion.div
            className="critical-indicator"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* Ondas para prioridad importante */}
        {priority === 'important' && animated && (
          <motion.div
            className="ripple-effect"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationBadge;

/**
 * Componente para badge de notificación inline (dentro de texto)
 */
export const InlineNotificationBadge = ({
  count = 0,
  priority = 'info',
  showZero = false,
  maxCount = 99
}) => {
  if (count === 0 && !showZero) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span className={`inline-notification-badge priority-${priority}`}>
      {displayCount}
    </span>
  );
};

/**
 * Componente para mostrar múltiples badges agrupados
 */
export const NotificationBadgeGroup = ({
  notifications = [], // Array de { count, priority, label }
  maxVisible = 3,
  showTotal = true
}) => {
  const visibleNotifications = notifications.slice(0, maxVisible);
  const hiddenCount = Math.max(0, notifications.length - maxVisible);
  const totalCount = notifications.reduce((sum, notif) => sum + notif.count, 0);

  if (totalCount === 0) return null;

  return (
    <div className="notification-badge-group">
      {visibleNotifications.map((notification, index) => (
        <NotificationBadge
          key={notification.label || index}
          count={notification.count}
          priority={notification.priority}
          size="small"
          className="grouped-badge"
          title={notification.label}
        />
      ))}
      
      {hiddenCount > 0 && (
        <NotificationBadge
          count={hiddenCount}
          priority="info"
          size="small"
          className="overflow-badge"
          title={`${hiddenCount} notificaciones más`}
        />
      )}
      
      {showTotal && notifications.length > 1 && (
        <div className="total-count">
          Total: {totalCount}
        </div>
      )}
    </div>
  );
};