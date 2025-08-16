import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { useAuthContext } from '../../contexts/AuthContext';
import Icon from '../UI/Icon';
import LoadingSpinner from '../UI/LoadingSpinner';
import './SearchGlobal.scss';

/**
 * Componente de búsqueda global
 * Buscador universal con filtros por contexto y navegación inteligente
 */
const SearchGlobal = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  
  const searchInputRef = useRef();
  const resultsRef = useRef();

  // Configurar shortcuts
  useKeyboardShortcuts({
    'ctrl+shift+f': (e) => {
      e.preventDefault();
      openSearch();
    },
    'escape': () => {
      if (isOpen) {
        closeSearch();
      }
    },
    '/': (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openSearch();
      }
    }
  });

  // Configuración de filtros de búsqueda
  const searchFilters = {
    all: {
      label: 'Todo',
      icon: 'search',
      contexts: ['users', 'blocks', 'questions', 'classes', 'tournaments']
    },
    users: {
      label: 'Usuarios',
      icon: 'users',
      contexts: ['users']
    },
    content: {
      label: 'Contenido',
      icon: 'layers',
      contexts: ['blocks', 'questions']
    },
    education: {
      label: 'Educación',
      icon: 'graduation-cap',
      contexts: ['classes', 'assignments', 'teachers']
    },
    games: {
      label: 'Juegos',
      icon: 'gamepad',
      contexts: ['tournaments', 'challenges', 'rankings']
    }
  };

  // Búsqueda debounced
  const performSearch = useDebouncedCallback(async (term, filter) => {
    if (!term.trim() || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const contexts = searchFilters[filter].contexts.join(',');
      const response = await fetch(`/api/search/global?q=${encodeURIComponent(term)}&contexts=${contexts}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Error en búsqueda global:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Cargar búsquedas recientes
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Error cargando búsquedas recientes:', error);
      }
    }
  }, []);

  // Efecto para búsqueda
  useEffect(() => {
    if (searchTerm) {
      performSearch(searchTerm, activeFilter);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchTerm, activeFilter, performSearch]);

  // Manejar navegación con teclado
  useKeyboardShortcuts({
    'ArrowDown': (e) => {
      if (isOpen && results.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      }
    },
    'ArrowUp': (e) => {
      if (isOpen && results.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      }
    },
    'Enter': (e) => {
      if (isOpen && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        handleResultSelect(results[selectedIndex]);
      }
    },
    'Tab': (e) => {
      if (isOpen && results.length > 0) {
        e.preventDefault();
        // Cambiar filtro
        const filterKeys = Object.keys(searchFilters);
        const currentIndex = filterKeys.indexOf(activeFilter);
        const nextIndex = (currentIndex + 1) % filterKeys.length;
        setActiveFilter(filterKeys[nextIndex]);
      }
    }
  }, { context: searchInputRef.current });

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setSearchTerm('');
    setResults([]);
    setSelectedIndex(-1);
  };

  const handleResultSelect = (result) => {
    // Guardar en búsquedas recientes
    const newSearch = {
      id: Date.now(),
      term: searchTerm,
      result: result,
      timestamp: Date.now()
    };

    const updatedRecent = [newSearch, ...recentSearches.filter(s => s.term !== searchTerm)].slice(0, 10);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recent-searches', JSON.stringify(updatedRecent));

    // Navegar al resultado
    navigate(result.route);
    closeSearch();
  };

  const handleRecentSearchSelect = (recentSearch) => {
    setSearchTerm(recentSearch.term);
    setActiveFilter(recentSearch.result.context || 'all');
    searchInputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  const getResultIcon = (type) => {
    const iconMap = {
      user: 'user',
      block: 'layers',
      question: 'help-circle',
      class: 'graduation-cap',
      tournament: 'trophy',
      challenge: 'target',
      teacher: 'user-check'
    };
    return iconMap[type] || 'search';
  };

  const formatResultDescription = (result) => {
    switch (result.type) {
      case 'user':
        return `Usuario • ${result.email || 'Sin email'}`;
      case 'block':
        return `Bloque • ${result.themes_count} temas • ${result.questions_count} preguntas`;
      case 'question':
        return `Pregunta • Bloque: ${result.block_name}`;
      case 'class':
        return `Clase • Profesor: ${result.teacher_name}`;
      case 'tournament':
        return `Torneo • ${result.participants_count} participantes`;
      default:
        return result.description || '';
    }
  };

  return (
    <>
      {/* Botón de búsqueda */}
      <button
        className="search-trigger"
        onClick={openSearch}
        title="Búsqueda global (Ctrl+Shift+F)"
      >
        <Icon name="search" size="18" />
        <span className="search-hint">Buscar...</span>
        <kbd className="shortcut-hint">⌘K</kbd>
      </button>

      {/* Modal de búsqueda */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
          >
            <motion.div
              className="search-modal"
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header de búsqueda */}
              <div className="search-header">
                <div className="search-input-container">
                  <Icon name="search" size="20" className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar en todo PLAYTEST..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {loading && <LoadingSpinner size="small" />}
                </div>

                <button className="close-btn" onClick={closeSearch}>
                  <Icon name="x" size="20" />
                </button>
              </div>

              {/* Filtros de búsqueda */}
              <div className="search-filters">
                {Object.entries(searchFilters).map(([key, filter]) => (
                  <button
                    key={key}
                    className={`filter-btn ${activeFilter === key ? 'active' : ''}`}
                    onClick={() => setActiveFilter(key)}
                  >
                    <Icon name={filter.icon} size="16" />
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Contenido de búsqueda */}
              <div className="search-content" ref={resultsRef}>
                {/* Búsquedas recientes */}
                {!searchTerm && recentSearches.length > 0 && (
                  <div className="recent-searches">
                    <div className="section-header">
                      <h4>Búsquedas recientes</h4>
                      <button 
                        className="clear-btn"
                        onClick={clearRecentSearches}
                      >
                        Limpiar
                      </button>
                    </div>
                    <div className="recent-list">
                      {recentSearches.slice(0, 5).map((recent) => (
                        <button
                          key={recent.id}
                          className="recent-item"
                          onClick={() => handleRecentSearchSelect(recent)}
                        >
                          <Icon name="clock" size="16" />
                          <span className="recent-term">{recent.term}</span>
                          <span className="recent-type">{recent.result.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultados de búsqueda */}
                {searchTerm && (
                  <div className="search-results">
                    {results.length > 0 && (
                      <div className="results-header">
                        <span>{results.length} resultados encontrados</span>
                      </div>
                    )}

                    <div className="results-list">
                      {results.map((result, index) => (
                        <motion.button
                          key={result.id}
                          className={`result-item ${selectedIndex === index ? 'selected' : ''}`}
                          onClick={() => handleResultSelect(result)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="result-icon">
                            <Icon name={getResultIcon(result.type)} size="20" />
                          </div>
                          <div className="result-content">
                            <div className="result-title">{result.title}</div>
                            <div className="result-description">
                              {formatResultDescription(result)}
                            </div>
                          </div>
                          <div className="result-meta">
                            <span className="result-type">{result.type}</span>
                            {result.score && (
                              <span className="result-score">
                                {Math.round(result.score * 100)}%
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {searchTerm && results.length === 0 && !loading && (
                      <div className="no-results">
                        <Icon name="search-x" size="48" />
                        <h3>No se encontraron resultados</h3>
                        <p>Intenta con otros términos de búsqueda</p>
                        <div className="search-tips">
                          <h4>Consejos de búsqueda:</h4>
                          <ul>
                            <li>Usa términos más generales</li>
                            <li>Revisa la ortografía</li>
                            <li>Prueba con diferentes filtros</li>
                            <li>Busca por partes del nombre</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ayuda de shortcuts */}
                <div className="search-help">
                  <div className="shortcut-help">
                    <span><kbd>↵</kbd> para seleccionar</span>
                    <span><kbd>↑</kbd><kbd>↓</kbd> para navegar</span>
                    <span><kbd>Tab</kbd> para cambiar filtros</span>
                    <span><kbd>Esc</kbd> para cerrar</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchGlobal;