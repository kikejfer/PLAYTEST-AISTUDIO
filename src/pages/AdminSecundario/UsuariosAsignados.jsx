import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import VirtualizedTable from '../../components/UI/VirtualizedTable';
import SearchInput from '../../components/UI/SearchInput';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Icon from '../../components/UI/Icon';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import './UsuariosAsignados.scss';

/**
 * Sección de Usuarios Asignados para Admin Secundario
 * Vista limitada: sin datos de Luminarias, sin reasignación de administradores
 */
const UsuariosAsignados = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre_completo', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({
    bloquesMin: '',
    bloquesMax: '',
    actividad: 'all'
  });
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Infinite scroll para grandes volúmenes
  const { isLoading: loadingMore, loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    onLoadMore: loadMoreUsers,
    threshold: 10
  });

  // Cargar usuarios asignados
  const loadUsers = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...Object.fromEntries(
          Object.entries(filterConfig).filter(([_, value]) => value && value !== 'all')
        )
      });

      const response = await fetch(`/api/admin-secundario/usuarios-asignados?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setUsuarios(prev => [...prev, ...data.usuarios]);
        } else {
          setUsuarios(data.usuarios || []);
        }
        
        setHasNextPage(data.hasNextPage);
        setCurrentPage(data.currentPage);
      }
    } catch (error) {
      console.error('Error cargando usuarios asignados:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortConfig, filterConfig]);

  // Cargar más usuarios (infinite scroll)
  async function loadMoreUsers() {
    if (hasNextPage && !loadingMore) {
      await loadUsers(currentPage + 1, true);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Recargar cuando cambien filtros o búsqueda
  useEffect(() => {
    loadUsers(1, false);
  }, [searchTerm, sortConfig, filterConfig]);

  // Configuración de columnas (sin Luminarias)
  const columns = [
    {
      key: 'nickname',
      title: 'Nickname',
      width: 150,
      sortable: true,
      render: (value, row) => (
        <div className="user-info">
          <div className="user-avatar">
            <Icon name="user" size="16" />
          </div>
          <div className="user-details">
            <span className="nickname">{value}</span>
            {row.is_premium && (
              <Icon name="star" size="12" className="premium-icon" />
            )}
          </div>
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
      key: 'bloques_cargados',
      title: 'Bloques Cargados',
      width: 120,
      align: 'center',
      sortable: true,
      render: (value) => (
        <span className="count-badge">{value || 0}</span>
      )
    },
    {
      key: 'profesor_asignado',
      title: 'Profesor Asignado',
      width: 180,
      render: (value) => (
        <div className="profesor-assignment">
          {value ? (
            <div className="assigned-profesor">
              <Icon name="graduation-cap" size="14" />
              <span>{value}</span>
            </div>
          ) : (
            <span className="no-assignment">Sin asignar</span>
          )}
        </div>
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
              handleViewUserDetails(row);
            }}
            title="Ver detalles"
          >
            <Icon name="eye" size="14" />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleContactUser(row);
            }}
            title="Contactar usuario"
          >
            <Icon name="mail" size="14" />
          </button>
        </div>
      )
    }
  ];

  const handleViewUserDetails = (user) => {
    // Implementar vista de detalles
    console.log('Ver detalles de:', user);
  };

  const handleContactUser = (user) => {
    // Implementar contacto con usuario
    console.log('Contactar usuario:', user);
  };

  // Filtros aplicados
  const getActiveFiltersCount = () => {
    return Object.values(filterConfig).filter(value => value && value !== 'all').length;
  };

  const clearFilters = () => {
    setFilterConfig({
      bloquesMin: '',
      bloquesMax: '',
      actividad: 'all'
    });
  };

  if (loading) {
    return <LoadingSpinner size="medium" />;
  }

  return (
    <div className="usuarios-asignados">
      {/* Header */}
      <div className="section-header">
        <div className="header-content">
          <h3>Usuarios Asignados</h3>
          <p>Seguimiento de usuarios finales bajo tu supervisión</p>
        </div>

        <div className="header-actions">
          <SearchInput
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>

      {/* Filtros simplificados */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Actividad:</label>
            <select
              value={filterConfig.actividad}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                actividad: e.target.value
              }))}
            >
              <option value="all">Todos</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Bloques:</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filterConfig.bloquesMin}
                onChange={(e) => setFilterConfig(prev => ({
                  ...prev,
                  bloquesMin: e.target.value
                }))}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filterConfig.bloquesMax}
                onChange={(e) => setFilterConfig(prev => ({
                  ...prev,
                  bloquesMax: e.target.value
                }))}
              />
            </div>
          </div>

          {getActiveFiltersCount() > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={clearFilters}
            >
              <Icon name="x" size="14" />
              Limpiar ({getActiveFiltersCount()})
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas simplificadas */}
      <div className="stats-row">
        <div className="stat-card">
          <Icon name="users" size="24" />
          <div>
            <span className="stat-number">{usuarios.length}</span>
            <span className="stat-label">Usuarios Asignados</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="layers" size="24" />
          <div>
            <span className="stat-number">
              {usuarios.reduce((sum, u) => sum + (u.bloques_cargados || 0), 0)}
            </span>
            <span className="stat-label">Bloques Totales</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="activity" size="24" />
          <div>
            <span className="stat-number">
              {usuarios.filter(u => {
                if (!u.ultima_actividad) return false;
                const diffDays = Math.floor((new Date() - new Date(u.ultima_actividad)) / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length}
            </span>
            <span className="stat-label">Activos (7 días)</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="star" size="24" />
          <div>
            <span className="stat-number">
              {usuarios.filter(u => u.is_premium).length}
            </span>
            <span className="stat-label">Premium</span>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="table-container">
        <VirtualizedTable
          data={usuarios}
          columns={columns}
          height={500}
          sortable={true}
          onSort={(sortConfig) => setSortConfig(sortConfig)}
          hasNextPage={hasNextPage}
          onLoadMore={loadMoreUsers}
          className="usuarios-table"
          virtualizationMode="window"
        />
        
        {loadingMore && (
          <div className="loading-more">
            <LoadingSpinner size="small" />
            <span>Cargando más usuarios...</span>
          </div>
        )}
      </div>

      {/* Información de limitaciones */}
      <div className="role-limitations">
        <div className="limitation-notice">
          <Icon name="info" size="16" />
          <span>Como Administrador Secundario, solo puedes ver usuarios asignados a tu supervisión</span>
        </div>
        
        <div className="limitations-list">
          <div className="limitation-item">
            <Icon name="x" size="14" className="disabled-icon" />
            <span>Sin acceso a datos de Luminarias</span>
          </div>
          <div className="limitation-item">
            <Icon name="x" size="14" className="disabled-icon" />
            <span>Sin capacidades de reasignación masiva</span>
          </div>
          <div className="limitation-item">
            <Icon name="check" size="14" className="enabled-icon" />
            <span>Puedes contactar y hacer seguimiento de usuarios</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsuariosAsignados;