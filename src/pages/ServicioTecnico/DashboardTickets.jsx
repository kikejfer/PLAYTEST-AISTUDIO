import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualizedTable from '../../components/UI/VirtualizedTable';
import SearchInput from '../../components/UI/SearchInput';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import Icon from '../../components/UI/Icon';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import './DashboardTickets.scss';

/**
 * Dashboard de Tickets para Servicio Técnico
 * Gestión centralizada de tickets de soporte con prioridades y estados
 */
const DashboardTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fecha_creacion', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState({
    estado: 'all',
    prioridad: 'all',
    categoria: 'all',
    tecnico: 'all'
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Infinite scroll
  const { isLoading: loadingMore, loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    onLoadMore: loadMoreTickets,
    threshold: 10
  });

  // Cargar tickets
  const loadTickets = useCallback(async (page = 1, append = false) => {
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

      const response = await fetch(`/api/servicio-tecnico/tickets?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setTickets(prev => [...prev, ...data.tickets]);
        } else {
          setTickets(data.tickets || []);
        }
        
        setHasNextPage(data.hasNextPage);
        setCurrentPage(data.currentPage);
      }
    } catch (error) {
      console.error('Error cargando tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortConfig, filterConfig]);

  // Cargar más tickets
  async function loadMoreTickets() {
    if (hasNextPage && !loadingMore) {
      await loadTickets(currentPage + 1, true);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Configuración de columnas
  const columns = [
    {
      key: 'id',
      title: 'ID',
      width: 80,
      render: (value) => (
        <span className="ticket-id">#{value}</span>
      )
    },
    {
      key: 'prioridad',
      title: 'Prioridad',
      width: 100,
      render: (value) => (
        <span className={`priority-badge ${value.toLowerCase()}`}>
          <Icon 
            name={
              value === 'Crítica' ? 'alert-circle' :
              value === 'Alta' ? 'alert-triangle' :
              value === 'Media' ? 'info' : 'minus-circle'
            } 
            size="12" 
          />
          {value}
        </span>
      )
    },
    {
      key: 'estado',
      title: 'Estado',
      width: 100,
      render: (value) => (
        <span className={`status-badge ${value.toLowerCase().replace(' ', '-')}`}>
          {value}
        </span>
      )
    },
    {
      key: 'titulo',
      title: 'Título',
      width: 250,
      render: (value, row) => (
        <div className="ticket-title">
          <span className="title-text">{value}</span>
          <div className="ticket-meta">
            <Icon name="user" size="12" />
            <span>{row.usuario_reporta}</span>
          </div>
        </div>
      )
    },
    {
      key: 'categoria',
      title: 'Categoría',
      width: 120,
      render: (value) => (
        <span className="category-tag">
          <Icon 
            name={
              value === 'Sistema' ? 'server' :
              value === 'Usuario' ? 'user' :
              value === 'Contenido' ? 'layers' :
              value === 'Juego' ? 'gamepad' : 'help-circle'
            } 
            size="12" 
          />
          {value}
        </span>
      )
    },
    {
      key: 'tecnico_asignado',
      title: 'Asignado a',
      width: 140,
      render: (value) => (
        <div className="assigned-tech">
          {value ? (
            <>
              <Icon name="user-check" size="12" />
              <span>{value}</span>
            </>
          ) : (
            <span className="unassigned">Sin asignar</span>
          )}
        </div>
      )
    },
    {
      key: 'fecha_creacion',
      title: 'Creado',
      width: 120,
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        return (
          <div className="date-cell">
            <span className="relative-time">
              {diffHours < 1 ? 'Hace minutos' :
               diffHours < 24 ? `${diffHours}h` :
               `${Math.floor(diffHours / 24)}d`}
            </span>
            <small>{date.toLocaleDateString()}</small>
          </div>
        );
      }
    },
    {
      key: 'sla_restante',
      title: 'SLA',
      width: 100,
      render: (value, row) => {
        const isOverdue = value < 0;
        const isUrgent = value < 2;
        
        return (
          <div className={`sla-indicator ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : 'normal'}`}>
            <Icon 
              name={isOverdue ? 'x-circle' : isUrgent ? 'clock' : 'check-circle'} 
              size="12" 
            />
            <span>
              {isOverdue ? `+${Math.abs(value)}h` : `${value}h`}
            </span>
          </div>
        );
      }
    },
    {
      key: 'acciones',
      title: 'Acciones',
      width: 120,
      render: (value, row) => (
        <div className="action-buttons">
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleViewTicket(row);
            }}
            title="Ver ticket"
          >
            <Icon name="eye" size="14" />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleAssignTicket(row);
            }}
            title="Asignar ticket"
          >
            <Icon name="user-plus" size="14" />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(row);
            }}
            title="Actualizar estado"
          >
            <Icon name="edit" size="14" />
          </button>
        </div>
      )
    }
  ];

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleAssignTicket = (ticket) => {
    // Implementar asignación de ticket
    console.log('Asignar ticket:', ticket);
  };

  const handleUpdateStatus = (ticket) => {
    // Implementar actualización de estado
    console.log('Actualizar estado:', ticket);
  };

  // Estadísticas de tickets
  const getTicketStats = () => {
    return {
      total: tickets.length,
      abiertos: tickets.filter(t => ['Nuevo', 'En Progreso'].includes(t.estado)).length,
      criticos: tickets.filter(t => t.prioridad === 'Crítica').length,
      vencidos: tickets.filter(t => t.sla_restante < 0).length
    };
  };

  const stats = getTicketStats();

  if (loading) {
    return <LoadingSpinner size="medium" />;
  }

  return (
    <div className="dashboard-tickets">
      {/* Header */}
      <div className="section-header">
        <div className="header-content">
          <h3>Dashboard de Tickets</h3>
          <p>Gestión centralizada de tickets de soporte técnico</p>
        </div>

        <div className="header-actions">
          <SearchInput
            placeholder="Buscar tickets..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <button className="btn btn-primary">
            <Icon name="plus" size="16" />
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Estadísticas de tickets */}
      <div className="ticket-stats">
        <div className="stat-card total">
          <Icon name="list" size="24" />
          <div>
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
        </div>
        
        <div className="stat-card open">
          <Icon name="clock" size="24" />
          <div>
            <span className="stat-number">{stats.abiertos}</span>
            <span className="stat-label">Abiertos</span>
          </div>
        </div>
        
        <div className="stat-card critical">
          <Icon name="alert-circle" size="24" />
          <div>
            <span className="stat-number">{stats.criticos}</span>
            <span className="stat-label">Críticos</span>
          </div>
        </div>
        
        <div className="stat-card overdue">
          <Icon name="x-circle" size="24" />
          <div>
            <span className="stat-number">{stats.vencidos}</span>
            <span className="stat-label">Vencidos</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Estado:</label>
            <select
              value={filterConfig.estado}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                estado: e.target.value
              }))}
            >
              <option value="all">Todos</option>
              <option value="nuevo">Nuevo</option>
              <option value="en-progreso">En Progreso</option>
              <option value="esperando">Esperando Respuesta</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Prioridad:</label>
            <select
              value={filterConfig.prioridad}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                prioridad: e.target.value
              }))}
            >
              <option value="all">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Categoría:</label>
            <select
              value={filterConfig.categoria}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                categoria: e.target.value
              }))}
            >
              <option value="all">Todas</option>
              <option value="sistema">Sistema</option>
              <option value="usuario">Usuario</option>
              <option value="contenido">Contenido</option>
              <option value="juego">Juego</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Técnico:</label>
            <select
              value={filterConfig.tecnico}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                tecnico: e.target.value
              }))}
            >
              <option value="all">Todos</option>
              <option value="sin-asignar">Sin asignar</option>
              <option value="yo">Mis tickets</option>
              <option value="tecnico-a">Técnico A</option>
              <option value="tecnico-b">Técnico B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de tickets */}
      <div className="table-container">
        <VirtualizedTable
          data={tickets}
          columns={columns}
          height={500}
          sortable={true}
          onSort={setSortConfig}
          hasNextPage={hasNextPage}
          onLoadMore={loadMoreTickets}
          className="tickets-table"
          onRowClick={handleViewTicket}
        />
        
        {loadingMore && (
          <div className="loading-more">
            <LoadingSpinner size="small" />
            <span>Cargando más tickets...</span>
          </div>
        )}
      </div>

      {/* Modal de detalles del ticket */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title={`Ticket #${selectedTicket?.id || ''}`}
        size="large"
      >
        {selectedTicket && (
          <div className="ticket-details">
            <div className="ticket-header">
              <div className="ticket-info">
                <h3>{selectedTicket.titulo}</h3>
                <div className="ticket-badges">
                  <span className={`priority-badge ${selectedTicket.prioridad.toLowerCase()}`}>
                    {selectedTicket.prioridad}
                  </span>
                  <span className={`status-badge ${selectedTicket.estado.toLowerCase().replace(' ', '-')}`}>
                    {selectedTicket.estado}
                  </span>
                  <span className="category-tag">
                    {selectedTicket.categoria}
                  </span>
                </div>
              </div>
              
              <div className="sla-info">
                <div className={`sla-indicator ${selectedTicket.sla_restante < 0 ? 'overdue' : selectedTicket.sla_restante < 2 ? 'urgent' : 'normal'}`}>
                  <Icon name="clock" size="16" />
                  <span>SLA: {selectedTicket.sla_restante}h</span>
                </div>
              </div>
            </div>

            <div className="ticket-content">
              <div className="section">
                <h4>Descripción</h4>
                <p>{selectedTicket.descripcion}</p>
              </div>

              <div className="section">
                <h4>Información del Reporte</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Reportado por:</span>
                    <span className="value">{selectedTicket.usuario_reporta}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Fecha:</span>
                    <span className="value">{new Date(selectedTicket.fecha_creacion).toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Asignado a:</span>
                    <span className="value">{selectedTicket.tecnico_asignado || 'Sin asignar'}</span>
                  </div>
                </div>
              </div>

              <div className="section">
                <h4>Acciones</h4>
                <div className="action-buttons">
                  <button className="btn btn-primary">
                    <Icon name="user-plus" size="16" />
                    Asignarme
                  </button>
                  <button className="btn btn-secondary">
                    <Icon name="message-circle" size="16" />
                    Añadir Comentario
                  </button>
                  <button className="btn btn-secondary">
                    <Icon name="arrow-up" size="16" />
                    Escalar
                  </button>
                  <button className="btn btn-success">
                    <Icon name="check" size="16" />
                    Resolver
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardTickets;