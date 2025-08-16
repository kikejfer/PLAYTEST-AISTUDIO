import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Hook personalizado para gestión de estado de navegación jerárquica
 * Maneja pestañas activas, paneles expandidos, breadcrumbs y persistencia
 */
export const useNavigationState = () => {
  // Estado persistente en localStorage
  const [persistentState, setPersistentState] = useLocalStorage('navigation-state', {
    activeTab: null,
    expandedPanels: {},
    favorites: [],
    recentSections: []
  });

  // Estados reactivos
  const [activeTab, setActiveTabState] = useState(persistentState.activeTab);
  const [expandedPanels, setExpandedPanels] = useState(persistentState.expandedPanels);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [favorites, setFavorites] = useState(persistentState.favorites);
  const [recentSections, setRecentSections] = useState(persistentState.recentSections);

  // Función para actualizar pestaña activa
  const setActiveTab = useCallback((tabId) => {
    setActiveTabState(tabId);
    
    // Actualizar historial de navegación
    setNavigationHistory(prev => {
      const newHistory = [tabId, ...prev.filter(id => id !== tabId)];
      return newHistory.slice(0, 10); // Mantener últimos 10
    });

    // Persistir estado
    setPersistentState(prev => ({
      ...prev,
      activeTab: tabId
    }));
  }, [setPersistentState]);

  // Función para expandir/colapsar paneles
  const togglePanel = useCallback((panelId, sectionId = null) => {
    const key = sectionId ? `${panelId}.${sectionId}` : panelId;
    
    setExpandedPanels(prev => {
      const newState = {
        ...prev,
        [key]: !prev[key]
      };
      
      // Persistir estado
      setPersistentState(prevPersistent => ({
        ...prevPersistent,
        expandedPanels: newState
      }));
      
      return newState;
    });
  }, [setPersistentState]);

  // Función para expandir múltiples niveles
  const expandPath = useCallback((path) => {
    const pathParts = path.split('.');
    const newExpanded = { ...expandedPanels };
    
    // Expandir cada nivel de la ruta
    for (let i = 0; i < pathParts.length; i++) {
      const partialPath = pathParts.slice(0, i + 1).join('.');
      newExpanded[partialPath] = true;
    }
    
    setExpandedPanels(newExpanded);
    setPersistentState(prev => ({
      ...prev,
      expandedPanels: newExpanded
    }));
  }, [expandedPanels, setPersistentState]);

  // Función para colapsar todos los paneles
  const collapseAll = useCallback(() => {
    setExpandedPanels({});
    setPersistentState(prev => ({
      ...prev,
      expandedPanels: {}
    }));
  }, [setPersistentState]);

  // Función para gestionar breadcrumbs
  const addBreadcrumb = useCallback((crumb) => {
    setBreadcrumbs(prev => {
      const existingIndex = prev.findIndex(c => c.id === crumb.id);
      if (existingIndex !== -1) {
        // Si ya existe, mantener hasta ese punto
        return prev.slice(0, existingIndex + 1);
      } else {
        // Agregar nuevo breadcrumb
        return [...prev, crumb];
      }
    });
  }, []);

  // Función para limpiar breadcrumbs
  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  // Función para navegar hacia atrás en breadcrumbs
  const navigateBack = useCallback((steps = 1) => {
    setBreadcrumbs(prev => prev.slice(0, -steps));
  }, []);

  // Función para gestionar favoritos
  const toggleFavorite = useCallback((item) => {
    setFavorites(prev => {
      const exists = prev.find(fav => fav.id === item.id);
      const newFavorites = exists 
        ? prev.filter(fav => fav.id !== item.id)
        : [...prev, { ...item, addedAt: Date.now() }];
      
      setPersistentState(prevPersistent => ({
        ...prevPersistent,
        favorites: newFavorites
      }));
      
      return newFavorites;
    });
  }, [setPersistentState]);

  // Función para agregar a secciones recientes
  const addRecentSection = useCallback((section) => {
    setRecentSections(prev => {
      const filtered = prev.filter(s => s.id !== section.id);
      const newRecent = [{ ...section, accessedAt: Date.now() }, ...filtered].slice(0, 20);
      
      setPersistentState(prevPersistent => ({
        ...prevPersistent,
        recentSections: newRecent
      }));
      
      return newRecent;
    });
  }, [setPersistentState]);

  // Función para obtener estado de expansión
  const isPanelExpanded = useCallback((panelId, sectionId = null) => {
    const key = sectionId ? `${panelId}.${sectionId}` : panelId;
    return expandedPanels[key] || false;
  }, [expandedPanels]);

  // Función para obtener conteo de paneles expandidos
  const getExpandedCount = useCallback(() => {
    return Object.values(expandedPanels).filter(Boolean).length;
  }, [expandedPanels]);

  // Función para verificar si es favorito
  const isFavorite = useCallback((itemId) => {
    return favorites.some(fav => fav.id === itemId);
  }, [favorites]);

  // Función para obtener navegación rápida
  const getQuickNavigation = useCallback(() => {
    return {
      recent: recentSections.slice(0, 5),
      favorites: favorites.slice(0, 10),
      history: navigationHistory.slice(0, 5)
    };
  }, [recentSections, favorites, navigationHistory]);

  // Función para limpiar datos antiguos (optimización)
  const cleanupOldData = useCallback(() => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    setRecentSections(prev => prev.filter(s => s.accessedAt > thirtyDaysAgo));
    setFavorites(prev => prev.filter(f => f.addedAt > thirtyDaysAgo));
  }, []);

  // Limpiar datos antiguos periódicamente
  useEffect(() => {
    const cleanup = setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Una vez al día
    return () => clearInterval(cleanup);
  }, [cleanupOldData]);

  return {
    // Estado principal
    activeTab,
    expandedPanels,
    breadcrumbs,
    favorites,
    recentSections,
    navigationHistory,

    // Funciones de navegación
    setActiveTab,
    togglePanel,
    expandPath,
    collapseAll,
    isPanelExpanded,
    getExpandedCount,

    // Funciones de breadcrumbs
    addBreadcrumb,
    clearBreadcrumbs,
    navigateBack,

    // Funciones de favoritos y recientes
    toggleFavorite,
    addRecentSection,
    isFavorite,
    getQuickNavigation,

    // Utilidades
    cleanupOldData
  };
};