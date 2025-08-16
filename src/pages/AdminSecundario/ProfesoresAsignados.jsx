import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import VirtualizedTable from '../../components/UI/VirtualizedTable';
import SearchInput from '../../components/UI/SearchInput';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import Icon from '../../components/UI/Icon';
import './ProfesoresAsignados.scss';

/**
 * Sección de Profesores Asignados para Admin Secundario
 * Vista limitada: solo profesores bajo supervisión del admin actual
 */
const ProfesoresAsignados = () => {
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre_completo', direction: 'asc' });
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Cargar profesores asignados al admin secundario actual
  const loadProfesoresAsignados = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-secundario/profesores-asignados');
      if (response.ok) {
        const data = await response.json();
        setProfesores(data.profesores || []);
      }
    } catch (error) {
      console.error('Error cargando profesores asignados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfesoresAsignados();
  }, [loadProfesoresAsignados]);

  // Configuración de columnas (sin Luminarias ni reasignación)
  const columns = [
    {
      key: 'nickname',
      title: 'Nickname',
      width: 150,
      sortable: true,
      render: (value, row) => (
        <div className="profesor-info">
          <Icon name="user" size="16" />
          <span>{value}</span>
          {row.is_active && (
            <span className="status-badge active">Activo</span>
          )}
        </div>
      )
    },
    {
      key: 'nombre_completo',
      title: 'Nombre Completo',
      width: 200,
      sortable: true
    },
    {
      key: 'email',
      title: 'Email',
      width: 220,
      sortable: true
    },
    {
      key: 'total_bloques',
      title: 'Bloques',
      width: 80,
      align: 'center',
      sortable: true,
      render: (value) => (
        <span className="count-badge">{value || 0}</span>
      )
    },
    {
      key: 'total_preguntas',
      title: 'Preguntas',
      width: 90,
      align: 'center',
      sortable: true,
      render: (value) => (
        <span className="count-badge secondary">{value || 0}</span>
      )
    },
    {
      key: 'usuarios_activos',
      title: 'Usuarios Activos',
      width: 120,
      align: 'center',
      sortable: true,
      render: (value) => (
        <span className="count-badge tertiary">{value || 0}</span>
      )
    },
    {
      key: 'ultima_actividad',
      title: 'Última Actividad',
      width: 140,
      sortable: true,
      render: (value) => {
        if (!value) return <span className="inactive">Nunca</span>;
        const date = new Date(value);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        return (
          <div className="activity-cell">
            <span className={`activity-date ${diffDays > 7 ? 'old' : diffDays > 1 ? 'recent' : 'active'}`}>
              {diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Ayer' : `${diffDays}d`}
            </span>
            <small>{date.toLocaleDateString()}</small>
          </div>
        );
      }
    },
    {
      key: 'acciones',
      title: 'Acciones',
      width: 100,
      render: (value, row) => (
        <div className="action-buttons">
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
            title="Ver detalles"
          >
            <Icon name="eye" size="14" />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleContactProfesor(row);
            }}
            title="Contactar profesor"
          >
            <Icon name="mail" size="14" />
          </button>
        </div>
      )
    }
  ];

  const handleViewDetails = (profesor) => {
    setSelectedProfesor(profesor);
    setShowDetailModal(true);
  };

  const handleContactProfesor = (profesor) => {
    // Implementar funcionalidad de contacto
    console.log('Contactar profesor:', profesor);
  };

  // Filtrar profesores por búsqueda
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
    <div className="profesores-asignados">
      {/* Header */}
      <div className="section-header">
        <div className="header-content">
          <h3>Profesores Asignados</h3>
          <p>Gestión de profesores bajo tu supervisión</p>
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
            <span className="stat-label">Profesores Asignados</span>
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
        <div className="stat-card">
          <Icon name="activity" size="24" />
          <div>
            <span className="stat-number">
              {profesores.filter(p => p.is_active).length}
            </span>
            <span className="stat-label">Activos</span>
          </div>
        </div>
      </div>

      {/* Tabla de profesores */}
      <div className="table-container">
        <VirtualizedTable
          data={filteredProfesores}
          columns={columns}
          height={400}
          sortable={true}
          onSort={setSortConfig}
          className="profesores-table"
        />
      </div>

      {/* Modal de detalles */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Detalles de ${selectedProfesor?.nickname || ''}`}
        size="large"
      >
        {selectedProfesor && (
          <div className="profesor-details">
            <div className="detail-header">
              <div className="profesor-avatar">
                <Icon name="user" size="48" />
              </div>
              <div className="profesor-info">
                <h3>{selectedProfesor.nombre_completo}</h3>
                <p>{selectedProfesor.email}</p>
                <div className="badges">
                  {selectedProfesor.is_active && (
                    <span className="badge success">Activo</span>
                  )}
                  <span className="badge info">Profesor</span>
                </div>
              </div>
            </div>

            <div className="detail-sections">
              <div className="detail-section">
                <h4>Estadísticas</h4>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="label">Bloques creados:</span>
                    <span className="value">{selectedProfesor.total_bloques}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Preguntas totales:</span>
                    <span className="value">{selectedProfesor.total_preguntas}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Usuarios activos:</span>
                    <span className="value">{selectedProfesor.usuarios_activos}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Última actividad:</span>
                    <span className="value">
                      {selectedProfesor.ultima_actividad ? 
                        new Date(selectedProfesor.ultima_actividad).toLocaleDateString() : 
                        'Nunca'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Acciones Disponibles</h4>
                <div className="action-buttons">
                  <button className="btn btn-primary">
                    <Icon name="mail" size="16" />
                    Enviar Mensaje
                  </button>
                  <button className="btn btn-secondary">
                    <Icon name="chart-bar" size="16" />
                    Ver Reportes
                  </button>
                  <button className="btn btn-secondary">
                    <Icon name="layers" size="16" />
                    Ver Bloques
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <h4>Limitaciones del Rol</h4>
                <div className="limitations">
                  <div className="limitation">
                    <Icon name="info" size="16" />
                    <span>No puedes reasignar este profesor a otro administrador</span>
                  </div>
                  <div className="limitation">
                    <Icon name="info" size="16" />
                    <span>Los datos financieros (Luminarias) no están disponibles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfesoresAsignados;