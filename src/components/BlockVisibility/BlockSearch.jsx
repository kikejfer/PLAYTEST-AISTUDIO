import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useBlockVisibility } from '../../hooks/useBlockVisibility';
import BlockVisibilityBadge from './BlockVisibilityBadge';
import './BlockSearch.scss';

const BlockSearch = ({ 
  onBlockSelect, 
  showPrivateBlocks = false,
  maxResults = 20,
  className = ''
}) => {
  const { 
    searchBlocks, 
    getVisibleBlocks, 
    VISIBILITY_STATES, 
    loading 
  } = useBlockVisibility();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    knowledgeArea: '',
    educationalLevel: '',
    visibility: showPrivateBlocks ? '' : VISIBILITY_STATES.PUBLIC
  });
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Opciones para filtros (estas deberían venir de una API o configuración)
  const filterOptions = useMemo(() => ({
    categories: [
      'Ciencias',
      'Matemáticas',
      'Historia',
      'Literatura',
      'Idiomas',
      'Tecnología',
      'Arte',
      'Deportes',
      'Geografía',
      'Música'
    ],
    knowledgeAreas: [
      'Educación Primaria',
      'Educación Secundaria',
      'Bachillerato',
      'Universidad',
      'Formación Profesional',
      'Educación de Adultos'
    ],
    educationalLevels: [
      'Básico',
      'Intermedio',
      'Avanzado',
      'Experto'
    ]
  }), []);

  // Realizar búsqueda
  const performSearch = useCallback(async () => {
    if (!query.trim() && !filters.category && !filters.knowledgeArea && !filters.educationalLevel) {
      // Si no hay query ni filtros, mostrar bloques visibles por defecto
      const visibleBlocks = getVisibleBlocks(filters.visibility || null);
      setResults(visibleBlocks.slice(0, maxResults));
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchBlocks(query, {
        category: filters.category || undefined,
        knowledgeArea: filters.knowledgeArea || undefined,
        educationalLevel: filters.educationalLevel || undefined
      });

      // Filtrar por visibilidad si se especifica
      let filteredResults = searchResults;
      if (filters.visibility) {
        filteredResults = searchResults.filter(block => block.visibility === filters.visibility);
      }

      setResults(filteredResults.slice(0, maxResults));
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, searchBlocks, getVisibleBlocks, maxResults]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const handleQueryChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setFilters({
      category: '',
      knowledgeArea: '',
      educationalLevel: '',
      visibility: showPrivateBlocks ? '' : VISIBILITY_STATES.PUBLIC
    });
  }, [showPrivateBlocks, VISIBILITY_STATES.PUBLIC]);

  const highlightMatch = useCallback((text, searchQuery) => {
    if (!searchQuery.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  }, []);

  return (
    <div className={`block-search ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="search-header">
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar bloques por título, descripción, temas..."
              value={query}
              onChange={handleQueryChange}
              disabled={loading}
            />
            {(query || Object.values(filters).some(Boolean)) && (
              <button 
                className="clear-search-btn"
                onClick={clearFilters}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          
          <button
            className={`filters-toggle ${showAdvancedFilters ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            🔧 Filtros
          </button>
        </div>

        {/* Filtros avanzados */}
        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="category-filter">Categoría:</label>
                <select
                  id="category-filter"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {filterOptions.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="knowledge-area-filter">Área de Conocimiento:</label>
                <select
                  id="knowledge-area-filter"
                  value={filters.knowledgeArea}
                  onChange={(e) => handleFilterChange('knowledgeArea', e.target.value)}
                >
                  <option value="">Todas las áreas</option>
                  {filterOptions.knowledgeAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="level-filter">Nivel Educativo:</label>
                <select
                  id="level-filter"
                  value={filters.educationalLevel}
                  onChange={(e) => handleFilterChange('educationalLevel', e.target.value)}
                >
                  <option value="">Todos los niveles</option>
                  {filterOptions.educationalLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {showPrivateBlocks && (
                <div className="filter-group">
                  <label htmlFor="visibility-filter">Visibilidad:</label>
                  <select
                    id="visibility-filter"
                    value={filters.visibility}
                    onChange={(e) => handleFilterChange('visibility', e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value={VISIBILITY_STATES.PUBLIC}>Público</option>
                    <option value={VISIBILITY_STATES.PRIVATE}>Privado</option>
                    <option value={VISIBILITY_STATES.RESTRICTED}>Restringido</option>
                    <option value={VISIBILITY_STATES.ARCHIVED}>Archivado</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estado de carga */}
      {(loading || isSearching) && (
        <div className="search-loading">
          <span className="loading-spinner">⏳</span>
          <span>Buscando bloques...</span>
        </div>
      )}

      {/* Resultados */}
      <div className="search-results">
        {!loading && !isSearching && (
          <>
            <div className="results-header">
              <span className="results-count">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                {maxResults && results.length === maxResults && ' (máximo alcanzado)'}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">📭</div>
                <h3>No se encontraron bloques</h3>
                <p>
                  {query || Object.values(filters).some(Boolean)
                    ? 'Intenta con otros términos de búsqueda o filtros diferentes.'
                    : 'No hay bloques disponibles en este momento.'
                  }
                </p>
              </div>
            ) : (
              <div className="results-list">
                {results.map(block => (
                  <div 
                    key={block.id}
                    className="result-item"
                    onClick={() => onBlockSelect?.(block)}
                  >
                    <div className="result-header">
                      <h4 className="result-title">
                        {highlightMatch(block.title, query)}
                      </h4>
                      <BlockVisibilityBadge 
                        visibility={block.visibility} 
                        size="small"
                      />
                    </div>
                    
                    <div className="result-content">
                      <p className="result-description">
                        {highlightMatch(block.description || 'Sin descripción', query)}
                      </p>
                      
                      {block.authorObservations && (
                        <p className="result-observations">
                          <strong>Observaciones:</strong> {highlightMatch(block.authorObservations, query)}
                        </p>
                      )}
                    </div>

                    <div className="result-metadata">
                      <div className="metadata-item">
                        <span className="metadata-label">Categoría:</span>
                        <span className="metadata-value">{block.category || 'Sin categoría'}</span>
                      </div>
                      
                      <div className="metadata-item">
                        <span className="metadata-label">Preguntas:</span>
                        <span className="metadata-value">{block.questions?.length || 0}</span>
                      </div>
                      
                      {block.searchRelevance && (
                        <div className="metadata-item">
                          <span className="metadata-label">Relevancia:</span>
                          <div className="relevance-bars">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div 
                                key={i}
                                className={`relevance-bar ${i < Math.ceil(block.searchRelevance / 2) ? 'active' : ''}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {block.matchedIn && (
                      <div className="match-indicators">
                        {block.matchedIn.title && <span className="match-tag">título</span>}
                        {block.matchedIn.description && <span className="match-tag">descripción</span>}
                        {block.matchedIn.observations && <span className="match-tag">observaciones</span>}
                        {block.matchedIn.topics && <span className="match-tag">temas</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlockSearch;