import React from 'react';
import { useBlockVisibility } from '../../hooks/useBlockVisibility';
import './BlockVisibilityBadge.scss';

const BlockVisibilityBadge = ({ 
  visibility, 
  size = 'medium', 
  showLabel = true, 
  className = '' 
}) => {
  const { VISIBILITY_STATES } = useBlockVisibility();

  const getVisibilityConfig = (state) => {
    switch (state) {
      case VISIBILITY_STATES.PRIVATE:
        return {
          icon: '🔒',
          label: 'Privado',
          className: 'visibility-private',
          description: 'Solo tú puedes ver este bloque'
        };
      case VISIBILITY_STATES.PUBLIC:
        return {
          icon: '🌐',
          label: 'Público',
          className: 'visibility-public',
          description: 'Visible para todos los usuarios'
        };
      case VISIBILITY_STATES.RESTRICTED:
        return {
          icon: '👥',
          label: 'Restringido',
          className: 'visibility-restricted',
          description: 'Solo por invitación'
        };
      case VISIBILITY_STATES.ARCHIVED:
        return {
          icon: '📦',
          label: 'Archivado',
          className: 'visibility-archived',
          description: 'Acceso solo por link directo'
        };
      default:
        return {
          icon: '❓',
          label: 'Desconocido',
          className: 'visibility-unknown',
          description: 'Estado de visibilidad desconocido'
        };
    }
  };

  const config = getVisibilityConfig(visibility);

  return (
    <div 
      className={`visibility-badge ${config.className} ${size} ${className}`}
      title={config.description}
    >
      <span className="visibility-icon">{config.icon}</span>
      {showLabel && <span className="visibility-label">{config.label}</span>}
    </div>
  );
};

export default BlockVisibilityBadge;