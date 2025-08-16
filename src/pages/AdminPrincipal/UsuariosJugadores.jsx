import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import VirtualizedTable from '../../components/UI/VirtualizedTable';
import SearchInput from '../../components/UI/SearchInput';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import Icon from '../../components/UI/Icon';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import './UsuariosJugadores.scss';

/**
 * Sección 3 - Usuarios/Jugadores
 * Gestión con filtrado, ordenación por Luminarias, reasignación masiva
 */
const UsuariosJugadores = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'luminarias', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState({
    adminAsignado: 'all',
    bloquesMin: '',
    bloquesMax: '',
    luminariasMin: '',
    luminariasMax: ''
  });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showReasignModal, setShowReasignModal] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminSecundarios, setAdminSecundarios] = useState([]);

  // Infinite scroll para grandes volúmenes
  const { isLoading: loadingMore, loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    onLoadMore: loadMoreUsers,
    threshold: 10
  });

  // Cargar usuarios con paginación
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

      const response = await fetch(`/api/admin/usuarios-jugadores?${queryParams}`);
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
      console.error('Error cargando usuarios:', error);
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

  // Cargar admin secundarios para reasignación
  const loadAdminSecundarios = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/administradores-secundarios');
      if (response.ok) {
        const data = await response.json();
        setAdminSecundarios(data.administradores || []);
      }
    } catch (error) {
      console.error('Error cargando admin secundarios:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadAdminSecundarios();
  }, [loadUsers, loadAdminSecundarios]);

  // Recargar cuando cambien filtros o búsqueda
  useEffect(() => {
    loadUsers(1, false);
  }, [searchTerm, sortConfig, filterConfig]);

  // Configuración de columnas
  const columns = [
    {
      key: 'select',
      title: '',
      width: 50,
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedUsers.has(row.id)}
          onChange={(e) => handleUserSelect(row.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
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
      key: 'admin_asignado',
      title: 'Admin Asignado',
      width: 180,
      render: (value, row) => (
        <select
          value={value || ''}
          onChange={(e) => handleSingleReasign(row.id, e.target.value)}
          className="admin-select"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">Sin asignar</option>
          {adminSecundarios.map(admin => (
            <option key={admin.id} value={admin.id}>
              {admin.nickname}
            </option>
          ))}
        </select>
      )
    },
    {
      key: 'luminarias',
      title: 'Luminarias',
      width: 120,
      align: 'center',
      sortable: true,
      render: (value, row) => (
        <div className="luminarias-cell">
          <Icon name="coins" size="14" className="luminarias-icon" />
          <span className="luminarias-amount">{value?.toLocaleString() || 0}</span>
          <div className="luminarias-breakdown">
            <small>
              G: {row.luminarias_ganadas || 0} | 
              U: {row.luminarias_usadas || 0}
            </small>
          </div>
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
              handleEditUser(row);
            }}
            title="Editar usuario"
          >
            <Icon name="edit" size="14" />
          </button>
        </div>
      )
    }
  ];

  // Manejo de selección
  const handleUserSelect = (userId, selected) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedUsers(new Set(usuarios.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Reasignación individual
  const handleSingleReasign = async (userId, adminId) => {
    try {
      await fetch(`/api/admin/usuarios/${userId}/assign-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId || null })
      });
      
      // Actualizar estado local
      setUsuarios(prev => prev.map(user => 
        user.id === userId ? { ...user, admin_asignado: adminId } : user
      ));
    } catch (error) {
      console.error('Error reasignando admin:', error);
    }
  };

  // Reasignación masiva
  const handleMassiveReasign = async (adminId) => {
    try {
      const userIds = Array.from(selectedUsers);
      await fetch('/api/admin/usuarios/massive-assign-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_ids: userIds,
          admin_id: adminId || null 
        })
      });
      
      // Actualizar estado local
      setUsuarios(prev => prev.map(user => 
        userIds.includes(user.id) ? { ...user, admin_asignado: adminId } : user
      ));
      
      setSelectedUsers(new Set());
      setShowReasignModal(false);
    } catch (error) {
      console.error('Error en reasignación masiva:', error);
    }
  };

  const handleViewUserDetails = (user) => {
    // Implementar modal de detalles
    console.log('Ver detalles de:', user);
  };

  const handleEditUser = (user) => {
    // Implementar edición de usuario
    console.log('Editar usuario:', user);
  };

  // Filtros aplicados
  const getActiveFiltersCount = () => {
    return Object.values(filterConfig).filter(value => value && value !== 'all').length;
  };

  const clearFilters = () => {
    setFilterConfig({
      adminAsignado: 'all',
      bloquesMin: '',
      bloquesMax: '',
      luminariasMin: '',
      luminariasMax: ''
    });
  };

  if (loading) {
    return <LoadingSpinner size="medium" />;
  }

  return (
    <div className="usuarios-jugadores">
      {/* Header */}
      <div className="section-header">
        <div className="header-content">
          <h3>Usuarios/Jugadores</h3>
          <p>Gestión de usuarios finales ordenados por Luminarias</p>
        </div>

        <div className="header-actions">
          <SearchInput
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          {selectedUsers.size > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => setShowReasignModal(true)}
            >
              <Icon name="users" size="16" />
              Reasignar {selectedUsers.size} usuarios
            </button>
          )}
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Admin Asignado:</label>
            <select
              value={filterConfig.adminAsignado}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                adminAsignado: e.target.value
              }))}
            >
              <option value="all">Todos</option>
              <option value="">Sin asignar</option>
              {adminSecundarios.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.nickname}
                </option>
              ))}
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

          <div className="filter-group">
            <label>Luminarias:</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filterConfig.luminariasMin}
                onChange={(e) => setFilterConfig(prev => ({
                  ...prev,
                  luminariasMin: e.target.value
                }))}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filterConfig.luminariasMax}
                onChange={(e) => setFilterConfig(prev => ({
                  ...prev,
                  luminariasMax: e.target.value
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

      {/* Estadísticas */}
      <div className="stats-row">
        <div className="stat-card">
          <Icon name="users" size="24" />
          <div>
            <span className="stat-number">{usuarios.length}</span>
            <span className="stat-label">Usuarios Cargados</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="check-square" size="24" />
          <div>
            <span className="stat-number">{selectedUsers.size}</span>
            <span className="stat-label">Seleccionados</span>
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
          <Icon name="coins" size="24" />
          <div>
            <span className="stat-number">
              {usuarios.reduce((sum, u) => sum + (u.luminarias || 0), 0).toLocaleString()}
            </span>
            <span className="stat-label">Luminarias Totales</span>
          </div>
        </div>
      </div>

      {/* Controles de selección */}
      <div className="selection-controls">
        <div className="selection-info">
          <label className="select-all">
            <input
              type="checkbox"
              checked={selectedUsers.size > 0 && selectedUsers.size === usuarios.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            Seleccionar todos ({usuarios.length})
          </label>
        </div>

        {selectedUsers.size > 0 && (
          <div className="bulk-actions">
            <span>{selectedUsers.size} usuarios seleccionados</span>
            <button
              className="btn btn-outline"
              onClick={() => setShowReasignModal(true)}
            >
              Reasignar Admin
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setSelectedUsers(new Set())}
            >
              Deseleccionar
            </button>
          </div>
        )}
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

      {/* Modal de reasignación masiva */}
      <Modal
        isOpen={showReasignModal}
        onClose={() => setShowReasignModal(false)}
        title="Reasignación Masiva de Administrador"
        size="medium"
      >
        <div className="reasign-modal">
          <div className="selection-summary">
            <h4>Usuarios seleccionados: {selectedUsers.size}</h4>
            <p>Selecciona el administrador secundario al que deseas asignar estos usuarios:</p>
          </div>

          <div className="admin-options">
            <div className="admin-option">
              <input
                type="radio"
                id="no-admin"
                name="admin-selection"
                value=""
                onChange={() => {}}
              />
              <label htmlFor="no-admin">
                <Icon name="user-x" size="20" />
                <div>
                  <span className="admin-name">Sin asignar</span>
                  <span className="admin-description">Remover asignación actual</span>
                </div>
              </label>
            </div>

            {adminSecundarios.map(admin => (
              <div key={admin.id} className="admin-option">
                <input
                  type="radio"
                  id={`admin-${admin.id}`}
                  name="admin-selection"
                  value={admin.id}
                  onChange={() => {}}
                />
                <label htmlFor={`admin-${admin.id}`}>
                  <Icon name="user-check" size="20" />
                  <div>
                    <span className="admin-name">{admin.nickname}</span>
                    <span className="admin-description">
                      {admin.profesores_asignados || 0} profesores asignados
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowReasignModal(false)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const selectedAdmin = document.querySelector('input[name="admin-selection"]:checked');
                if (selectedAdmin) {
                  handleMassiveReasign(selectedAdmin.value);
                }
              }}
            >
              Reasignar Usuarios
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsuariosJugadores;