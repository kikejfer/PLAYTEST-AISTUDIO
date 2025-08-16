import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para gestión de atajos de teclado
 * Soporta combinaciones complejas y contextos específicos
 */
export const useKeyboardShortcuts = (shortcuts, options = {}) => {
  const {
    enableGlobal = true,
    preventDefault = true,
    context = null,
    disabled = false
  } = options;

  const shortcutsRef = useRef(shortcuts);
  const contextRef = useRef(context);

  // Actualizar referencias cuando cambien las props
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    contextRef.current = context;
  }, [shortcuts, context]);

  // Función para normalizar las teclas de shortcut
  const normalizeShortcut = useCallback((shortcut) => {
    return shortcut
      .toLowerCase()
      .split('+')
      .map(key => key.trim())
      .sort((a, b) => {
        // Orden específico: ctrl, alt, shift, meta, luego teclas
        const order = ['ctrl', 'alt', 'shift', 'meta'];
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });
  }, []);

  // Función para crear la clave del evento
  const getEventKey = useCallback((event) => {
    const keys = [];
    
    if (event.ctrlKey) keys.push('ctrl');
    if (event.altKey) keys.push('alt');
    if (event.shiftKey) keys.push('shift');
    if (event.metaKey) keys.push('meta');
    
    // Mapear teclas especiales
    const keyMap = {
      ' ': 'space',
      'Escape': 'escape',
      'Enter': 'enter',
      'Tab': 'tab',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown',
      'F1': 'f1', 'F2': 'f2', 'F3': 'f3', 'F4': 'f4',
      'F5': 'f5', 'F6': 'f6', 'F7': 'f7', 'F8': 'f8',
      'F9': 'f9', 'F10': 'f10', 'F11': 'f11', 'F12': 'f12'
    };
    
    const key = keyMap[event.key] || event.key.toLowerCase();
    keys.push(key);
    
    return keys;
  }, []);

  // Función principal para manejar eventos de teclado
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;

    // Verificar si estamos en un elemento de entrada
    const isInputElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
                           event.target.contentEditable === 'true';

    // Si está en un elemento de entrada y no es global, ignorar
    if (isInputElement && !enableGlobal) return;

    const eventKeys = getEventKey(event);
    const eventKeyString = eventKeys.join('+');

    // Buscar coincidencia en shortcuts
    for (const [shortcut, handler] of Object.entries(shortcutsRef.current)) {
      const normalizedShortcut = normalizeShortcut(shortcut).join('+');
      
      if (eventKeyString === normalizedShortcut) {
        // Verificar contexto si está especificado
        if (contextRef.current && !contextRef.current.contains(event.target)) {
          continue;
        }

        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }

        // Ejecutar handler
        try {
          handler(event);
        } catch (error) {
          console.error('Error ejecutando shortcut:', error);
        }
        
        break;
      }
    }
  }, [disabled, enableGlobal, preventDefault, getEventKey, normalizeShortcut]);

  // Configurar event listeners
  useEffect(() => {
    const target = contextRef.current || document;
    
    target.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  // Función para mostrar shortcuts disponibles (útil para debugging)
  const getAvailableShortcuts = useCallback(() => {
    return Object.keys(shortcutsRef.current).map(shortcut => ({
      shortcut,
      normalized: normalizeShortcut(shortcut).join(' + ')
    }));
  }, [normalizeShortcut]);

  return {
    getAvailableShortcuts
  };
};

/**
 * Hook específico para shortcuts de navegación
 */
export const useNavigationShortcuts = (navigationActions) => {
  const shortcuts = {
    // Navegación entre pestañas
    'ctrl+1': () => navigationActions.switchToTab(0),
    'ctrl+2': () => navigationActions.switchToTab(1),
    'ctrl+3': () => navigationActions.switchToTab(2),
    'ctrl+4': () => navigationActions.switchToTab(3),
    'ctrl+5': () => navigationActions.switchToTab(4),
    'ctrl+6': () => navigationActions.switchToTab(5),
    
    // Navegación general
    'ctrl+shift+f': () => navigationActions.focusSearch(),
    'ctrl+h': () => navigationActions.showShortcutsHelp(),
    'escape': () => navigationActions.clearSearch(),
    
    // Navegación en breadcrumbs
    'alt+left': () => navigationActions.navigateBack(),
    'alt+right': () => navigationActions.navigateForward(),
    
    // Gestión de paneles
    'ctrl+shift+c': () => navigationActions.collapseAll(),
    'ctrl+shift+e': () => navigationActions.expandAll(),
    
    // Favoritos
    'ctrl+d': () => navigationActions.toggleCurrentFavorite(),
    'ctrl+shift+d': () => navigationActions.showFavorites(),
    
    // Acciones rápidas
    'ctrl+r': () => navigationActions.refresh(),
    'f5': () => navigationActions.refresh(),
    'ctrl+shift+r': () => navigationActions.hardRefresh(),
    
    // Navegación por secciones
    'j': () => navigationActions.nextSection(),
    'k': () => navigationActions.previousSection(),
    'g g': () => navigationActions.goToTop(),
    'g e': () => navigationActions.goToEnd()
  };

  useKeyboardShortcuts(shortcuts, { enableGlobal: true });
};

/**
 * Hook para shortcuts contextuales (por ejemplo, en tablas)
 */
export const useContextualShortcuts = (context, shortcuts, enabled = true) => {
  useKeyboardShortcuts(shortcuts, {
    context,
    enableGlobal: false,
    disabled: !enabled
  });
};

/**
 * Hook para secuencias de teclas (como vim)
 */
export const useKeySequence = (sequences, timeout = 1000) => {
  const sequenceRef = useRef('');
  const timeoutRef = useRef(null);

  const handleKeyPress = useCallback((event) => {
    const key = event.key.toLowerCase();
    
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Agregar tecla a la secuencia
    sequenceRef.current += key;
    
    // Buscar coincidencias
    for (const [sequence, handler] of Object.entries(sequences)) {
      if (sequence === sequenceRef.current) {
        handler(event);
        sequenceRef.current = '';
        return;
      }
    }
    
    // Configurar timeout para limpiar secuencia
    timeoutRef.current = setTimeout(() => {
      sequenceRef.current = '';
    }, timeout);
  }, [sequences, timeout]);

  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleKeyPress]);
};