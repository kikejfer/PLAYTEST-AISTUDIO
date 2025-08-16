import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import Modal from '../UI/Modal';
import Icon from '../UI/Icon';
import './ShortcutsModal.scss';

/**
 * Modal para mostrar todos los atajos de teclado disponibles
 * Organizado por categorías con búsqueda y filtrado
 */
const ShortcutsModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Configurar shortcuts para el modal
  useKeyboardShortcuts({
    'escape': onClose,
    'ctrl+f': () => document.getElementById('shortcuts-search')?.focus()
  });

  // Configuración de shortcuts organizados por categorías
  const shortcutCategories = {
    navigation: {
      title: 'Navegación',
      icon: 'compass',
      shortcuts: [
        {
          keys: ['Ctrl', '1-6'],
          description: 'Cambiar entre pestañas principales',
          example: 'Ctrl+1 para Admin Principal'
        },
        {
          keys: ['Alt', '←', '→'],
          description: 'Navegar en historial de breadcrumbs',
          example: 'Alt+← para retroceder'
        },
        {
          keys: ['Escape'],
          description: 'Volver a pestaña por defecto',
          example: 'Limpia búsquedas y filtros'
        }
      ]
    },
    search: {
      title: 'Búsqueda',
      icon: 'search',
      shortcuts: [
        {
          keys: ['Ctrl', 'Shift', 'F'],
          description: 'Abrir búsqueda global',
          example: 'Buscar en todos los contextos'
        },
        {
          keys: ['Ctrl', 'F'],
          description: 'Buscar en página actual',
          example: 'Filtrar contenido visible'
        },
        {
          keys: ['/'],
          description: 'Búsqueda rápida',
          example: 'Activar búsqueda sin Ctrl'
        }
      ]
    },
    panels: {
      title: 'Gestión de Paneles',
      icon: 'layout',
      shortcuts: [
        {
          keys: ['Ctrl', 'Shift', 'C'],
          description: 'Colapsar todos los paneles',
          example: 'Vista compacta'
        },
        {
          keys: ['Ctrl', 'Shift', 'E'],
          description: 'Expandir todos los paneles',
          example: 'Vista completa'
        },
        {
          keys: ['Space'],
          description: 'Expandir/colapsar panel actual',
          example: 'Toggle del panel enfocado'
        }
      ]
    },
    tables: {
      title: 'Tablas y Listas',
      icon: 'table',
      shortcuts: [
        {
          keys: ['J', 'K'],
          description: 'Navegar entre filas',
          example: 'J=abajo, K=arriba'
        },
        {
          keys: ['Enter'],
          description: 'Seleccionar/abrir elemento',
          example: 'Acción principal'
        },
        {
          keys: ['Ctrl', 'A'],
          description: 'Seleccionar todo',
          example: 'En tablas con selección múltiple'
        }
      ]
    },
    actions: {
      title: 'Acciones Rápidas',
      icon: 'zap',
      shortcuts: [
        {
          keys: ['Ctrl', 'D'],
          description: 'Agregar/quitar de favoritos',
          example: 'Toggle favorito actual'
        },
        {
          keys: ['Ctrl', 'R'],
          description: 'Actualizar contenido',
          example: 'Refresh de datos'
        },
        {
          keys: ['Ctrl', 'S'],
          description: 'Guardar cambios',
          example: 'En formularios editables'
        },
        {
          keys: ['Ctrl', 'Z'],
          description: 'Deshacer última acción',
          example: 'Undo cuando disponible'
        }
      ]
    },
    help: {
      title: 'Ayuda',
      icon: 'help-circle',
      shortcuts: [
        {
          keys: ['Ctrl', 'H'],
          description: 'Mostrar/ocultar este modal',
          example: 'Toggle ayuda de shortcuts'
        },
        {
          keys: ['F1'],
          description: 'Ayuda contextual',
          example: 'Ayuda específica de la sección'
        },
        {
          keys: ['Shift', '?'],
          description: 'Ayuda rápida',
          example: 'Tips de la página actual'
        }
      ]
    }
  };

  // Filtrar shortcuts basado en búsqueda y categoría
  const filteredShortcuts = React.useMemo(() => {
    const categories = selectedCategory === 'all' 
      ? Object.entries(shortcutCategories)
      : [[selectedCategory, shortcutCategories[selectedCategory]]];

    return categories
      .map(([key, category]) => ({
        key,
        ...category,
        shortcuts: category.shortcuts.filter(shortcut =>
          searchTerm === '' ||
          shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shortcut.keys.some(key => key.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }))
      .filter(category => category.shortcuts.length > 0);
  }, [searchTerm, selectedCategory]);

  // Limpiar búsqueda al abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  const renderShortcutKeys = (keys) => (
    <div className="shortcut-keys">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="key-separator">+</span>}
          <kbd className="key">{key}</kbd>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atajos de Teclado"
      size="large"
      className="shortcuts-modal"
    >
      <div className="shortcuts-content">
        {/* Header con búsqueda y filtros */}
        <div className="shortcuts-header">
          <div className="search-container">
            <Icon name="search" size="16" />
            <input
              id="shortcuts-search"
              type="text"
              placeholder="Buscar atajos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">Todas las categorías</option>
              {Object.entries(shortcutCategories).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de shortcuts */}
        <div className="shortcuts-list">
          <AnimatePresence mode="wait">
            {filteredShortcuts.map((category) => (
              <motion.div
                key={category.key}
                className="shortcut-category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="category-header">
                  <Icon name={category.icon} size="20" />
                  <h3 className="category-title">{category.title}</h3>
                  <span className="shortcut-count">
                    {category.shortcuts.length} atajos
                  </span>
                </div>

                <div className="shortcuts-grid">
                  {category.shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      className="shortcut-item"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.15,
                        delay: index * 0.05
                      }}
                    >
                      <div className="shortcut-info">
                        <div className="shortcut-description">
                          {shortcut.description}
                        </div>
                        {shortcut.example && (
                          <div className="shortcut-example">
                            {shortcut.example}
                          </div>
                        )}
                      </div>
                      {renderShortcutKeys(shortcut.keys)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Estado vacío */}
          {filteredShortcuts.length === 0 && (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Icon name="search-x" size="48" />
              <h3>No se encontraron atajos</h3>
              <p>Intenta con otros términos de búsqueda</p>
            </motion.div>
          )}
        </div>

        {/* Footer con información adicional */}
        <div className="shortcuts-footer">
          <div className="footer-tips">
            <div className="tip">
              <Icon name="info" size="16" />
              <span>Los atajos funcionan desde cualquier parte de la aplicación</span>
            </div>
            <div className="tip">
              <Icon name="zap" size="16" />
              <span>Algunos atajos pueden variar según el contexto activo</span>
            </div>
          </div>

          <div className="footer-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Limpiar filtros
            </button>
            <button
              className="btn btn-primary"
              onClick={onClose}
            >
              Cerrar (Esc)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShortcutsModal;