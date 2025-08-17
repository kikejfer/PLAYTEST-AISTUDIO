import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Estados de visibilidad de bloques
 */
export const BLOCK_VISIBILITY_STATES = {
  PRIVATE: 'private',        // Solo el creador puede ver
  PUBLIC: 'public',          // Visible para todos
  RESTRICTED: 'restricted',  // Solo por invitación
  ARCHIVED: 'archived'       // Archivado, acceso solo por link directo
};

/**
 * Contexto para gestión de visibilidad de bloques
 */
const BlockVisibilityContext = createContext();

/**
 * Proveedor del contexto de visibilidad de bloques
 */
export const BlockVisibilityProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchIndex, setSearchIndex] = useState(new Map());

  /**
   * Validaciones para transición de estados
   */
  const validateStateTransition = useCallback((block, newState) => {
    const validations = {
      errors: [],
      warnings: [],
      canTransition: true
    };

    // Validaciones generales del bloque
    if (!block.id || !block.title) {
      validations.errors.push('El bloque debe tener ID y título válidos');
      validations.canTransition = false;
    }

    // Validaciones específicas por transición
    switch (newState) {
      case BLOCK_VISIBILITY_STATES.PUBLIC:
        // Validaciones para hacer público
        if (!block.description || block.description.length < 50) {
          validations.errors.push('La descripción debe tener al menos 50 caracteres');
          validations.canTransition = false;
        }

        if (!block.questions || block.questions.length < 10) {
          validations.errors.push('El bloque debe tener al menos 10 preguntas');
          validations.canTransition = false;
        }

        const topics = [...new Set(block.questions?.map(q => q.tema).filter(Boolean))];
        if (topics.length < 2) {
          validations.errors.push('Las preguntas deben estar distribuidas en al menos 2 temas');
          validations.canTransition = false;
        }

        if (!block.category || !block.educationalLevel || !block.knowledgeArea) {
          validations.errors.push('Metadatos incompletos: categoría, nivel educativo y área de conocimiento son obligatorios');
          validations.canTransition = false;
        }

        if (!block.authorObservations || block.authorObservations.length < 50) {
          validations.errors.push('Las observaciones del autor deben tener al menos 50 caracteres');
          validations.canTransition = false;
        }

        // Validaciones de calidad del contenido
        const duplicateAnswers = block.questions?.some(q => 
          q.respuestas && new Set(q.respuestas.map(r => r.textoRespuesta)).size !== q.respuestas.length
        );
        if (duplicateAnswers) {
          validations.errors.push('Hay preguntas con respuestas duplicadas');
          validations.canTransition = false;
        }

        const questionsWithoutCorrectAnswer = block.questions?.some(q => 
          !q.respuestas || !q.respuestas.some(r => r.esCorrecta)
        );
        if (questionsWithoutCorrectAnswer) {
          validations.errors.push('Todas las preguntas deben tener al menos una respuesta correcta');
          validations.canTransition = false;
        }
        break;

      case BLOCK_VISIBILITY_STATES.PRIVATE:
        // Solo se puede volver privado si no hay actividad reciente
        if (block.visibility === BLOCK_VISIBILITY_STATES.PUBLIC) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          if (block.lastActiveUsers && block.lastActiveUsers > sevenDaysAgo) {
            validations.errors.push('No se puede cambiar a privado: hay usuarios activos en los últimos 7 días');
            validations.canTransition = false;
          }
        }
        break;

      case BLOCK_VISIBILITY_STATES.RESTRICTED:
        // Advertencia sobre acceso restringido
        if (block.visibility === BLOCK_VISIBILITY_STATES.PUBLIC) {
          validations.warnings.push('Los usuarios que ya tenían el bloque cargado mantendrán el acceso');
        }
        break;

      case BLOCK_VISIBILITY_STATES.ARCHIVED:
        // Archivado siempre es posible, pero con advertencia
        validations.warnings.push('El bloque será eliminado de búsquedas públicas pero mantendrá acceso por link directo');
        break;
    }

    return validations;
  }, []);

  /**
   * Cambiar estado de visibilidad de un bloque
   */
  const changeBlockVisibility = useCallback(async (blockId, newState, force = false) => {
    setLoading(true);
    try {
      const block = blocks.find(b => b.id === blockId);
      if (!block) {
        throw new Error('Bloque no encontrado');
      }

      // Validar la transición
      const validation = validateStateTransition(block, newState);
      if (!force && !validation.canTransition) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Realizar la transición
      const response = await fetch(`/api/blocks/${blockId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          visibility: newState, 
          force,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Error en el servidor');
      }

      const result = await response.json();

      // Actualizar estado local
      setBlocks(prev => prev.map(b => 
        b.id === blockId 
          ? { ...b, visibility: newState, lastModified: new Date().toISOString() }
          : b
      ));

      // Actualizar índice de búsqueda si es necesario
      if (newState === BLOCK_VISIBILITY_STATES.PUBLIC) {
        updateSearchIndex(blockId, block);
      } else if (block.visibility === BLOCK_VISIBILITY_STATES.PUBLIC) {
        removeFromSearchIndex(blockId);
      }

      return {
        success: true,
        warnings: validation.warnings,
        newState
      };

    } catch (error) {
      console.error('Error changing block visibility:', error);
      return {
        success: false,
        errors: [error.message]
      };
    } finally {
      setLoading(false);
    }
  }, [blocks, user, validateStateTransition]);

  /**
   * Obtener bloques según visibilidad y permisos del usuario
   */
  const getVisibleBlocks = useCallback((visibility = null, userId = null) => {
    const currentUserId = userId || user?.id;
    
    return blocks.filter(block => {
      // Filtrar por estado de visibilidad si se especifica
      if (visibility && block.visibility !== visibility) {
        return false;
      }

      // Lógica de permisos por estado
      switch (block.visibility) {
        case BLOCK_VISIBILITY_STATES.PRIVATE:
          return block.createdBy === currentUserId;
          
        case BLOCK_VISIBILITY_STATES.PUBLIC:
          return true;
          
        case BLOCK_VISIBILITY_STATES.RESTRICTED:
          return block.createdBy === currentUserId || 
                 block.allowedUsers?.includes(currentUserId);
                 
        case BLOCK_VISIBILITY_STATES.ARCHIVED:
          return block.createdBy === currentUserId;
          
        default:
          return false;
      }
    });
  }, [blocks, user]);

  /**
   * Actualizar índice de búsqueda para un bloque
   */
  const updateSearchIndex = useCallback((blockId, block) => {
    const searchData = {
      id: blockId,
      title: block.title,
      description: block.description,
      authorObservations: block.authorObservations,
      topics: block.questions?.map(q => q.tema).filter(Boolean) || [],
      category: block.category,
      knowledgeArea: block.knowledgeArea,
      tags: block.tags || [],
      searchText: [
        block.title,
        block.description,
        block.authorObservations,
        ...(block.questions?.map(q => q.tema) || []),
        block.category,
        block.knowledgeArea,
        ...(block.tags || [])
      ].filter(Boolean).join(' ').toLowerCase()
    };

    setSearchIndex(prev => new Map(prev.set(blockId, searchData)));
  }, []);

  /**
   * Remover del índice de búsqueda
   */
  const removeFromSearchIndex = useCallback((blockId) => {
    setSearchIndex(prev => {
      const newIndex = new Map(prev);
      newIndex.delete(blockId);
      return newIndex;
    });
  }, []);

  /**
   * Búsqueda full-text en bloques públicos
   */
  const searchBlocks = useCallback((query, filters = {}) => {
    if (!query.trim()) {
      return getVisibleBlocks(BLOCK_VISIBILITY_STATES.PUBLIC);
    }

    const queryLower = query.toLowerCase();
    const results = [];

    for (const [blockId, searchData] of searchIndex) {
      const block = blocks.find(b => b.id === blockId);
      if (!block || block.visibility !== BLOCK_VISIBILITY_STATES.PUBLIC) {
        continue;
      }

      // Aplicar filtros adicionales
      if (filters.category && block.category !== filters.category) continue;
      if (filters.knowledgeArea && block.knowledgeArea !== filters.knowledgeArea) continue;
      if (filters.educationalLevel && block.educationalLevel !== filters.educationalLevel) continue;

      // Calcular relevancia de búsqueda
      let relevance = 0;
      
      // Título (peso alto)
      if (searchData.title.toLowerCase().includes(queryLower)) {
        relevance += 10;
      }

      // Descripción (peso medio)
      if (searchData.description.toLowerCase().includes(queryLower)) {
        relevance += 5;
      }

      // Observaciones del autor (peso medio)
      if (searchData.authorObservations.toLowerCase().includes(queryLower)) {
        relevance += 5;
      }

      // Temas (peso bajo)
      if (searchData.topics.some(topic => topic.toLowerCase().includes(queryLower))) {
        relevance += 2;
      }

      // Búsqueda general en todo el texto
      if (searchData.searchText.includes(queryLower)) {
        relevance += 1;
      }

      if (relevance > 0) {
        results.push({
          ...block,
          searchRelevance: relevance,
          matchedIn: {
            title: searchData.title.toLowerCase().includes(queryLower),
            description: searchData.description.toLowerCase().includes(queryLower),
            observations: searchData.authorObservations.toLowerCase().includes(queryLower),
            topics: searchData.topics.some(topic => topic.toLowerCase().includes(queryLower))
          }
        });
      }
    }

    // Ordenar por relevancia
    return results.sort((a, b) => b.searchRelevance - a.searchRelevance);
  }, [searchIndex, blocks, getVisibleBlocks]);

  /**
   * Cargar bloques del usuario actual
   */
  const loadUserBlocks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/blocks/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const userBlocks = await response.json();
        setBlocks(userBlocks);

        // Actualizar índice de búsqueda para bloques públicos
        userBlocks
          .filter(block => block.visibility === BLOCK_VISIBILITY_STATES.PUBLIC)
          .forEach(block => updateSearchIndex(block.id, block));
      }
    } catch (error) {
      console.error('Error loading user blocks:', error);
    } finally {
      setLoading(false);
    }
  }, [user, updateSearchIndex]);

  // Cargar bloques al montar o cambiar usuario
  useEffect(() => {
    loadUserBlocks();
  }, [loadUserBlocks]);

  const value = {
    blocks,
    loading,
    searchIndex,
    
    // Estados de visibilidad
    VISIBILITY_STATES: BLOCK_VISIBILITY_STATES,
    
    // Funciones principales
    changeBlockVisibility,
    getVisibleBlocks,
    searchBlocks,
    validateStateTransition,
    
    // Gestión de datos
    loadUserBlocks,
    updateSearchIndex,
    removeFromSearchIndex
  };

  return (
    <BlockVisibilityContext.Provider value={value}>
      {children}
    </BlockVisibilityContext.Provider>
  );
};

/**
 * Hook para usar el contexto de visibilidad de bloques
 */
export const useBlockVisibility = () => {
  const context = useContext(BlockVisibilityContext);
  if (!context) {
    throw new Error('useBlockVisibility debe usarse dentro de BlockVisibilityProvider');
  }
  return context;
};

/**
 * Hook para validaciones específicas de publicación
 */
export const usePublicationValidation = () => {
  const { validateStateTransition, VISIBILITY_STATES } = useBlockVisibility();

  const validateForPublication = useCallback((block) => {
    return validateStateTransition(block, VISIBILITY_STATES.PUBLIC);
  }, [validateStateTransition, VISIBILITY_STATES]);

  return { validateForPublication };
};