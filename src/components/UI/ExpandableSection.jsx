import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import Icon from './Icon';
import './ExpandableSection.scss';

/**
 * Componente ExpandableSection
 * Sección expandible/colapsable con animaciones y estilos personalizables
 */
const ExpandableSection = ({
  id,
  title,
  description,
  icon,
  isExpanded = false,
  onToggle,
  children,
  color = 'blue',
  className = '',
  disabled = false,
  badge = null,
  priority = 'normal',
  expandedByDefault = false,
  showCount = false,
  count = 0,
  headerActions = null
}) => {
  const handleToggle = () => {
    if (!disabled && onToggle) {
      onToggle(id);
    }
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'critical':
        return 'alert-triangle';
      case 'low':
        return 'info';
      default:
        return null;
    }
  };

  const sectionClasses = [
    'expandable-section',
    `color-${color}`,
    `priority-${priority}`,
    isExpanded ? 'expanded' : 'collapsed',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClasses}>
      {/* Header clickeable */}
      <motion.div
        className="section-header"
        onClick={handleToggle}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
        layout
      >
        {/* Icono principal */}
        <div className="header-icon">
          {icon && <Icon name={icon} size="20" />}
        </div>

        {/* Contenido del header */}
        <div className="header-content">
          <div className="header-title">
            <h3>{title}</h3>
            
            {/* Badges y indicadores */}
            <div className="header-badges">
              {badge && (
                <span className={`section-badge ${badge.toLowerCase()}`}>
                  {badge}
                </span>
              )}
              
              {showCount && count > 0 && (
                <span className="count-badge">
                  {count}
                </span>
              )}
              
              {priority !== 'normal' && getPriorityIcon() && (
                <Icon 
                  name={getPriorityIcon()} 
                  size="14" 
                  className={`priority-indicator priority-${priority}`}
                />
              )}
            </div>
          </div>
          
          {description && (
            <p className="header-description">{description}</p>
          )}
        </div>

        {/* Acciones del header */}
        <div className="header-actions">
          {headerActions && (
            <div className="custom-actions" onClick={(e) => e.stopPropagation()}>
              {headerActions}
            </div>
          )}
          
          {!disabled && (
            <motion.div
              className="expand-toggle"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon name="chevron-down" size="16" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Contenido expandible */}
      <motion.div
        className="section-content"
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{
          height: { duration: 0.3, ease: 'easeInOut' },
          opacity: { duration: 0.2, delay: isExpanded ? 0.1 : 0 }
        }}
        style={{ overflow: 'hidden' }}
      >
        <div className="content-wrapper">
          {children}
        </div>
      </motion.div>

      {/* Indicador de carga o estado */}
      {isExpanded && (
        <motion.div
          className="section-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="expand-indicator">
            <div className={`indicator-line color-${color}`} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

ExpandableSection.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.string,
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func,
  children: PropTypes.node,
  color: PropTypes.oneOf([
    'blue', 'green', 'red', 'orange', 'purple', 'gray', 'gold', 'pink'
  ]),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  badge: PropTypes.string,
  priority: PropTypes.oneOf(['low', 'normal', 'high', 'critical']),
  expandedByDefault: PropTypes.bool,
  showCount: PropTypes.bool,
  count: PropTypes.number,
  headerActions: PropTypes.node
};

export default ExpandableSection;