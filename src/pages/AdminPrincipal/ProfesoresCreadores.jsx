import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationState } from '../../hooks/useNavigationState';
import VirtualizedTable from '../../components/UI/VirtualizedTable';
import ExpandableSection from '../../components/UI/ExpandableSection';
import Modal from '../../components/UI/Modal';
import SearchInput from '../../components/UI/SearchInput';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Icon from '../../components/UI/Icon';
import './ProfesoresCreadores.scss';

/**
 * Sección 2 - Profesores/Creadores (Expandible multinivel)
 * Nivel 1: Lista de profesores
 * Nivel 2: Bloques públicos del profesor  
 * Nivel 3: Temas del bloque
 * Nivel 4: Preguntas individuales
 */
const ProfesoresCreadores = () => {
  const { expandedPanels, togglePanel } = useNavigationState();
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [bloqueDetails, setBloqueDetails] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // Cargar profesores
  const loadProfesores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/profesores-creadores');
      if (response.ok) {
        const data = await response.json();
        setProfesores(data.profesores || []);
      }
    } catch (error) {
      console.error('Error cargando profesores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar bloques de un profesor
  const loadBloquesProfesor = useCallback(async (profesorId) => {
    try {
      const response = await fetch(`/api/admin/profesores/${profesorId}/bloques`);
      if (response.ok) {
        const data = await response.json();
        setBloqueDetails(prev => ({
          ...prev,
          [`profesor_${profesorId}`]: data.bloques || []
        }));
      }
    } catch (error) {
      console.error('Error cargando bloques:', error);
    }
  }, []);

  // Cargar temas de un bloque
  const loadTemasBloque = useCallback(async (bloqueId) => {
    try {
      const response = await fetch(`/api/admin/bloques/${bloqueId}/temas`);
      if (response.ok) {
        const data = await response.json();
        setBloqueDetails(prev => ({
          ...prev,
          [`bloque_${bloqueId}`]: data.temas || []
        }));
      }
    } catch (error) {
      console.error('Error cargando temas:', error);
    }
  }, []);

  // Cargar preguntas de un tema
  const loadPreguntasTema = useCallback(async (temaId) => {
    try {
      const response = await fetch(`/api/admin/temas/${temaId}/preguntas`);
      if (response.ok) {
        const data = await response.json();
        setBloqueDetails(prev => ({
          ...prev,
          [`tema_${temaId}`]: data.preguntas || []
        }));
      }
    } catch (error) {
      console.error('Error cargando preguntas:', error);
    }
  }, []);

  useEffect(() => {
    loadProfesores();
  }, [loadProfesores]);

  // Configuración de columnas para profesores (Nivel 1)
  const profesoresColumns = [
    {
      key: 'expand',
      title: '',
      width: 50,
      render: (value, row) => (
        <button
          className="expand-btn"
          onClick={() => handleProfesorExpand(row)}
          title="Expandir bloques"
        >
          <Icon 
            name={isPanelExpanded(`profesor_${row.id}`) ? 'chevron-down' : 'chevron-right'} 
            size="16" 
          />
        </button>
      )
    },
    {
      key: 'nickname',
      title: 'Nickname',
      width: 150,
      render: (value, row) => (
        <div className="profesor-info">
          <Icon name="user" size="16" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'nombre_completo',
      title: 'Nombre Completo',
      width: 200
    },
    {
      key: 'email',
      title: 'Email',
      width: 220
    },
    {
      key: 'admin_asignado',
      title: 'Admin Asignado',
      width: 180,
      render: (value, row) => (
        <select
          value={value || ''}
          onChange={(e) => handleAdminReasign(row.id, e.target.value)}
          className="admin-select"
        >
          <option value="">Sin asignar</option>
          <option value="admin1">Admin Secundario 1</option>
          <option value="admin2">Admin Secundario 2</option>
        </select>
      )
    },
    {
      key: 'total_bloques',
      title: 'Bloques',
      width: 80,
      align: 'center',
      render: (value) => <span className="count-badge">{value || 0}</span>
    },
    {
      key: 'total_preguntas',
      title: 'Preguntas',
      width: 80,
      align: 'center',
      render: (value) => <span className="count-badge secondary">{value || 0}</span>
    },
    {
      key: 'usuarios_activos',
      title: 'Usuarios Activos',
      width: 120,
      align: 'center',
      render: (value) => <span className="count-badge tertiary">{value || 0}</span>
    }
  ];

  // Configuración de columnas para bloques (Nivel 2)
  const bloquesColumns = [
    {
      key: 'expand',
      title: '',
      width: 50,
      render: (value, row) => (
        <button
          className="expand-btn level-2"
          onClick={() => handleBloqueExpand(row)}
        >
          <Icon 
            name={isPanelExpanded(`bloque_${row.id}`) ? 'chevron-down' : 'chevron-right'} 
            size="14" 
          />
        </button>
      )
    },
    {
      key: 'nombre_bloque',
      title: 'Nombre del Bloque',
      width: 250,
      render: (value, row) => (
        <button
          className="bloque-name-btn"
          onClick={() => showBloqueModal(row)}
          title="Ver descripción completa"
        >
          <Icon name="layers" size="14" />
          {value}
        </button>
      )
    },
    {
      key: 'num_temas',
      title: 'Temas',
      width: 80,
      align: 'center',
      render: (value) => <span className="count-badge small">{value || 0}</span>
    },
    {
      key: 'total_preguntas',
      title: 'Preguntas',
      width: 80,
      align: 'center',
      render: (value) => <span className="count-badge small secondary">{value || 0}</span>
    },
    {
      key: 'usuarios_activos',
      title: 'Usuarios Activos',
      width: 120,
      align: 'center',
      render: (value) => <span className="count-badge small tertiary">{value || 0}</span>
    },
    {
      key: 'fecha_creacion',
      title: 'Creado',
      width: 120,
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  // Configuración de columnas para temas (Nivel 3)
  const temasColumns = [
    {
      key: 'expand',
      title: '',
      width: 50,
      render: (value, row) => (
        <button
          className="expand-btn level-3"
          onClick={() => handleTemaExpand(row)}
        >
          <Icon 
            name={isPanelExpanded(`tema_${row.id}`) ? 'chevron-down' : 'chevron-right'} 
            size="12" 
          />
        </button>
      )
    },
    {
      key: 'nombre_tema',
      title: 'Nombre del Tema',
      width: 200,
      render: (value) => (
        <div className="tema-name">
          <Icon name="bookmark" size="12" />
          {value}
        </div>
      )
    },
    {
      key: 'num_preguntas',
      title: 'Preguntas',
      width: 80,
      align: 'center',
      render: (value) => <span className="count-badge tiny">{value || 0}</span>
    },
    {
      key: 'dificultad_promedio',
      title: 'Dificultad',
      width: 100,
      render: (value) => (
        <div className="difficulty-bar">
          <div 
            className="difficulty-fill"
            style={{ width: `${(value || 0) * 20}%` }}
          />
          <span>{value || 0}/5</span>
        </div>
      )
    },
    {
      key: 'porcentaje_acierto',
      title: 'Acierto',
      width: 80,
      align: 'center',
      render: (value) => `${value || 0}%`
    }
  ];

  // Configuración de columnas para preguntas (Nivel 4)
  const preguntasColumns = [
    {
      key: 'numero',
      title: '#',
      width: 50,
      align: 'center'
    },
    {
      key: 'pregunta',
      title: 'Pregunta',
      width: 300,
      render: (value) => (
        <div className="pregunta-preview">
          {value.length > 100 ? `${value.substring(0, 100)}...` : value}
        </div>
      )
    },
    {
      key: 'tipo',
      title: 'Tipo',
      width: 100,
      render: (value) => (
        <span className={`tipo-badge ${value?.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      key: 'dificultad',
      title: 'Dificultad',
      width: 80,
      align: 'center',
      render: (value) => (
        <span className={`dificultad-${value}`}>
          {value}/5
        </span>
      )
    },
    {
      key: 'aciertos',
      title: 'Aciertos',
      width: 80,
      align: 'center'
    },
    {
      key: 'intentos',
      title: 'Intentos',
      width: 80,
      align: 'center'
    },
    {
      key: 'porcentaje_acierto',
      title: 'Éxito',
      width: 80,
      align: 'center',
      render: (value) => `${value || 0}%`
    }
  ];

  const isPanelExpanded = (panelId) => {
    return expandedPanels[`profesores-creadores.${panelId}`] || false;
  };

  const handleProfesorExpand = async (profesor) => {
    const panelId = `profesor_${profesor.id}`;
    togglePanel('profesores-creadores', panelId);
    
    if (!isPanelExpanded(panelId)) {
      await loadBloquesProfesor(profesor.id);
    }
  };

  const handleBloqueExpand = async (bloque) => {
    const panelId = `bloque_${bloque.id}`;
    togglePanel('profesores-creadores', panelId);
    
    if (!isPanelExpanded(panelId)) {
      await loadTemasBloque(bloque.id);
    }
  };

  const handleTemaExpand = async (tema) => {
    const panelId = `tema_${tema.id}`;
    togglePanel('profesores-creadores', panelId);
    
    if (!isPanelExpanded(panelId)) {
      await loadPreguntasTema(tema.id);
    }
  };

  const handleAdminReasign = async (profesorId, adminId) => {
    try {
      await fetch(`/api/admin/profesores/${profesorId}/assign-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId })
      });
      loadProfesores(); // Recargar lista
    } catch (error) {
      console.error('Error reasignando admin:', error);
    }
  };

  const showBloqueModal = (bloque) => {
    setModalContent({
      type: 'bloque',
      title: bloque.nombre_bloque,
      data: bloque
    });
    setShowModal(true);
  };

  const filteredProfesores = profesores.filter(profesor => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      profesor.nickname?.toLowerCase().includes(term) ||
      profesor.nombre_completo?.toLowerCase().includes(term) ||
      profesor.email?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingSpinner size="medium" />;
  }

  return (
    <div className="profesores-creadores">
      {/* Header */}
      <div className="section-header">
        <div className="header-content">
          <h3>Profesores/Creadores</h3>
          <p>Gestión expandible multinivel de educadores y contenido</p>
        </div>

        <div className="header-actions">
          <SearchInput
            placeholder="Buscar profesores..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-row">
        <div className="stat-card">
          <Icon name="users" size="24" />
          <div>
            <span className="stat-number">{profesores.length}</span>
            <span className="stat-label">Profesores</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="layers" size="24" />
          <div>
            <span className="stat-number">
              {profesores.reduce((sum, p) => sum + (p.total_bloques || 0), 0)}
            </span>
            <span className="stat-label">Bloques Totales</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="help-circle" size="24" />
          <div>
            <span className="stat-number">
              {profesores.reduce((sum, p) => sum + (p.total_preguntas || 0), 0)}
            </span>
            <span className="stat-label">Preguntas Totales</span>
          </div>
        </div>
      </div>

      {/* Tabla multinivel */}
      <div className="multinivel-container">
        {/* Nivel 1: Profesores */}
        <div className="nivel-1">
          <h4>Nivel 1 - Profesores</h4>
          <VirtualizedTable
            data={filteredProfesores}
            columns={profesoresColumns}
            height={300}
            rowHeight={50}
            sortable={true}
            className="profesores-table"
          />
        </div>

        {/* Niveles expandidos */}
        <AnimatePresence>
          {filteredProfesores.map(profesor => {
            const profesorPanelId = `profesor_${profesor.id}`;
            const isProfesorExpanded = isPanelExpanded(profesorPanelId);
            const bloques = bloqueDetails[profesorPanelId] || [];

            return isProfesorExpanded && (
              <motion.div
                key={profesorPanelId}
                className="nivel-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="nivel-header">
                  <h4>Nivel 2 - Bloques de {profesor.nickname}</h4>
                  <span className="nivel-count">{bloques.length} bloques</span>
                </div>
                
                <VirtualizedTable
                  data={bloques}
                  columns={bloquesColumns}
                  height={200}
                  rowHeight={40}
                  className="bloques-table"
                />

                {/* Nivel 3: Temas */}
                <AnimatePresence>
                  {bloques.map(bloque => {
                    const bloquePanelId = `bloque_${bloque.id}`;
                    const isBloqueExpanded = isPanelExpanded(bloquePanelId);
                    const temas = bloqueDetails[bloquePanelId] || [];

                    return isBloqueExpanded && (
                      <motion.div
                        key={bloquePanelId}
                        className="nivel-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="nivel-header">
                          <h5>Nivel 3 - Temas de "{bloque.nombre_bloque}"</h5>
                          <span className="nivel-count">{temas.length} temas</span>
                        </div>

                        <VirtualizedTable
                          data={temas}
                          columns={temasColumns}
                          height={150}
                          rowHeight={35}
                          className="temas-table"
                        />

                        {/* Nivel 4: Preguntas */}
                        <AnimatePresence>
                          {temas.map(tema => {
                            const temaPanelId = `tema_${tema.id}`;
                            const isTemaExpanded = isPanelExpanded(temaPanelId);
                            const preguntas = bloqueDetails[temaPanelId] || [];

                            return isTemaExpanded && (
                              <motion.div
                                key={temaPanelId}
                                className="nivel-4"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="nivel-header">
                                  <h6>Nivel 4 - Preguntas de "{tema.nombre_tema}"</h6>
                                  <span className="nivel-count">{preguntas.length} preguntas</span>
                                </div>

                                <VirtualizedTable
                                  data={preguntas}
                                  columns={preguntasColumns}
                                  height={200}
                                  rowHeight={30}
                                  className="preguntas-table"
                                />
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal para detalles */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent?.title || ''}
        size="large"
      >
        {modalContent?.type === 'bloque' && (
          <div className="bloque-details">
            <div className="detail-section">
              <h4>Descripción</h4>
              <p>{modalContent.data.descripcion || 'Sin descripción disponible'}</p>
            </div>

            <div className="detail-section">
              <h4>Estadísticas</h4>
              <div className="stats-grid">
                <div className="stat">
                  <span className="label">Temas:</span>
                  <span className="value">{modalContent.data.num_temas}</span>
                </div>
                <div className="stat">
                  <span className="label">Preguntas:</span>
                  <span className="value">{modalContent.data.total_preguntas}</span>
                </div>
                <div className="stat">
                  <span className="label">Usuarios activos:</span>
                  <span className="value">{modalContent.data.usuarios_activos}</span>
                </div>
                <div className="stat">
                  <span className="label">Fecha de creación:</span>
                  <span className="value">
                    {new Date(modalContent.data.fecha_creacion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Observaciones</h4>
              <p>{modalContent.data.observaciones || 'Sin observaciones'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfesoresCreadores;