import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import VirtualizedTable from '../../components/UI/VirtualizedTable';
import Modal from '../../components/UI/Modal';
import SearchInput from '../../components/UI/SearchInput';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Icon from '../../components/UI/Icon';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import './AdministradoresSecundarios.scss';

/**
 * Sección 1 - Administradores Secundarios
 * Gestión de administradores delegados con validación y búsqueda
 */
const AdministradoresSecundarios = () => {
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nickname', direction: 'asc' });
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Estados para el modal de agregar
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Cargar administradores
  const loadAdministradores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/administradores-secundarios');
      if (response.ok) {
        const data = await response.json();
        setAdministradores(data.administradores || []);
      }
    } catch (error) {
      console.error('Error cargando administradores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar usuarios por nickname (debounced)
  const searchUsers = useDebouncedCallback(async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar usuarios que no sean ya administradores
        const existingAdminIds = new Set(administradores.map(admin => admin.id));
        const filteredResults = data.users.filter(user => !existingAdminIds.has(user.id));
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, 300);

  // Cargar datos al montar
  useEffect(() => {
    loadAdministradores();
  }, [loadAdministradores]);

  // Efecto para búsqueda de usuarios
  useEffect(() => {
    searchUsers(userSearchTerm);
  }, [userSearchTerm, searchUsers]);

  // Configuración de columnas para la tabla
  const columns = [
    {
      key: 'nickname',
      title: 'Nickname',
      width: 150,
      render: (value, row) => (
        <div className="admin-nickname">
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
      key: 'profesores_asignados',
      title: 'Profesores Asignados',
      width: 120,
      align: 'center',
      render: (value) => (
        <span className="count-badge">{value || 0}</span>
      )
    },
    {
      key: 'total_bloques',
      title: 'Total Bloques',
      width: 100,
      align: 'center',
      render: (value) => (
        <span className="count-badge secondary">{value || 0}</span>
      )
    },
    {
      key: 'total_preguntas',
      title: 'Total Preguntas',
      width: 120,
      align: 'center',
      render: (value) => (
        <span className="count-badge tertiary">{value || 0}</span>
      )
    },
    {
      key: 'luminarias',
      title: 'Luminarias',
      width: 100,
      align: 'center',
      render: (value) => (
        <div className="luminarias-cell">
          <Icon name="coins" size="14" />
          <span>{value || 0}</span>
        </div>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      width: 120,
      align: 'center',
      render: (value, row) => (
        <div className="action-buttons">
          <button
            className="btn-icon"
            onClick={() => handleEditAdmin(row)}
            title="Editar administrador"
          >
            <Icon name="edit" size="16" />
          </button>
          <button
            className="btn-icon danger"
            onClick={() => handleRemoveAdmin(row)}
            title="Remover administrador"
          >
            <Icon name="trash" size="16" />
          </button>
        </div>
      )
    }
  ];

  // Manejar ordenación
  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  // Manejar edición de administrador
  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    // Aquí iría la lógica para abrir modal de edición
    console.log('Editar admin:', admin);
  };

  // Manejar eliminación de administrador
  const handleRemoveAdmin = async (admin) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas remover a ${admin.nickname} como administrador secundario?`
    );
    
    if (confirmed) {
      try {
        const response = await fetch(`/api/admin/administradores-secundarios/${admin.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          loadAdministradores(); // Recargar lista
        }
      } catch (error) {
        console.error('Error removiendo administrador:', error);
      }
    }
  };

  // Agregar nuevo administrador
  const handleAddAdmin = async (user) => {
    try {
      const response = await fetch('/api/admin/administradores-secundarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          nickname: user.nickname,
          email: user.email
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setUserSearchTerm('');
        setSearchResults([]);
        loadAdministradores(); // Recargar lista
      }
    } catch (error) {
      console.error('Error agregando administrador:', error);
    }
  };

  // Filtrar administradores por búsqueda
  const filteredAdministradores = administradores.filter(admin => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      admin.nickname?.toLowerCase().includes(term) ||
      admin.nombre_completo?.toLowerCase().includes(term) ||
      admin.email?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingSpinner size="medium" />;
  }

  return (
    <div className="administradores-secundarios">
      {/* Header de sección */}
      <div className="section-header">
        <div className="header-content">
          <h3>Administradores Secundarios</h3>
          <p>Gestión de administradores delegados y sus asignaciones</p>
        </div>

        <div className="header-actions">
          <SearchInput
            placeholder="Buscar administradores..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="admin-search"
          />
          
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Icon name="plus" size="16" />
            Añadir Admin Secundario
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-row">
        <div className="stat-card">
          <Icon name="users" size="24" />
          <div>
            <span className="stat-number">{administradores.length}</span>
            <span className="stat-label">Administradores</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="graduation-cap" size="24" />
          <div>
            <span className="stat-number">
              {administradores.reduce((sum, admin) => sum + (admin.profesores_asignados || 0), 0)}
            </span>
            <span className="stat-label">Profesores Gestionados</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="layers" size="24" />
          <div>
            <span className="stat-number">
              {administradores.reduce((sum, admin) => sum + (admin.total_bloques || 0), 0)}
            </span>
            <span className="stat-label">Bloques Totales</span>
          </div>
        </div>
      </div>

      {/* Tabla de administradores */}
      <div className="table-container">
        <VirtualizedTable
          data={filteredAdministradores}
          columns={columns}
          height={400}
          sortable={true}
          onSort={handleSort}
          className="admins-table"
          virtualizationMode={filteredAdministradores.length > 100 ? 'window' : 'normal'}
        />
      </div>

      {/* Modal para agregar administrador */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setUserSearchTerm('');
          setSearchResults([]);
        }}
        title="Añadir Administrador Secundario"
        size="medium"
      >
        <div className="add-admin-modal">
          <div className="search-section">
            <h4>Buscar Usuario por Nickname</h4>
            <SearchInput
              placeholder="Ingresa el nickname del usuario..."
              value={userSearchTerm}
              onChange={setUserSearchTerm}
              className="user-search"
              autoFocus
            />
          </div>

          {/* Resultados de búsqueda */}
          <div className="search-results">
            {searchingUsers && (
              <div className="searching-indicator">
                <LoadingSpinner size="small" />
                <span>Buscando usuarios...</span>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="results-list">
                <h5>Usuarios encontrados:</h5>
                {searchResults.map(user => (
                  <motion.div
                    key={user.id}
                    className="user-result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ backgroundColor: '#f8f9fa' }}
                  >
                    <div className="user-info">
                      <div className="user-avatar">
                        <Icon name="user" size="20" />
                      </div>
                      <div className="user-details">
                        <span className="user-nickname">{user.nickname}</span>
                        <span className="user-email">{user.email}</span>
                        {user.nombre_completo && (
                          <span className="user-name">{user.nombre_completo}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddAdmin(user)}
                    >
                      Añadir como Admin
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {userSearchTerm.length >= 2 && !searchingUsers && searchResults.length === 0 && (
              <div className="no-results">
                <Icon name="search-x" size="32" />
                <p>No se encontraron usuarios con ese nickname</p>
                <small>Asegúrate de que el nickname sea correcto</small>
              </div>
            )}

            {userSearchTerm.length < 2 && (
              <div className="search-hint">
                <Icon name="info" size="16" />
                <span>Ingresa al menos 2 caracteres para buscar</span>
              </div>
            )}
          </div>

          {/* Validación y confirmación */}
          <div className="validation-section">
            <div className="validation-info">
              <Icon name="shield-check" size="16" />
              <span>Se verificará que el usuario no sea ya administrador</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdministradoresSecundarios;