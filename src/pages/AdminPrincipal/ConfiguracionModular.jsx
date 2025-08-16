import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useNotificationBadges } from '../../hooks/useNotificationBadges';
import Card from '../../components/UI/Card';
import Toggle from '../../components/UI/Toggle';
import Modal from '../../components/UI/Modal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Icon from '../../components/UI/Icon';
import './ConfiguracionModular.scss';

/**
 * Sección de Configuración Modular - Panel Admin Principal
 * Sistema de Feature Flags con 9 grupos de funcionalidades
 */
const ConfiguracionModular = () => {
  const { 
    features, 
    loading, 
    updateFeatureFlags, 
    getFeatureStats, 
    lastUpdate 
  } = useFeatureFlags();
  const { addLocalNotification } = useNotificationBadges();
  
  const [localFeatures, setLocalFeatures] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changeToConfirm, setChangeToConfirm] = useState(null);
  const [stats, setStats] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Configuración de grupos de features
  const featureGroups = {
    competition: {
      title: 'Sistema de Competición',
      icon: 'trophy',
      description: 'Duelos, Trivial, Torneos y Rankings',
      color: '#ff6b6b',
      features: [
        { key: 'competition_duels', name: 'Duelos', description: 'Enfrentamientos 1v1 entre usuarios' },
        { key: 'competition_trivial', name: 'Trivial', description: 'Modo de juego trivial clásico' },
        { key: 'competition_tournaments', name: 'Torneos', description: 'Competiciones organizadas' },
        { key: 'competition_rankings', name: 'Rankings', description: 'Clasificaciones y leaderboards' }
      ],
      dependencies: [],
      conflicts: []
    },
    monetization: {
      title: 'Sistema de Monetización',
      icon: 'dollar-sign',
      description: 'Planes de pago, Marketplace, Conversión Luminarias',
      color: '#4ecdc4',
      features: [
        { key: 'monetization_plans', name: 'Planes de Pago', description: 'Suscripciones y membresías premium' },
        { key: 'monetization_marketplace', name: 'Marketplace', description: 'Tienda de contenidos y servicios' },
        { key: 'monetization_luminarias', name: 'Conversión Luminarias', description: 'Sistema de moneda virtual' }
      ],
      dependencies: ['financial_system'],
      conflicts: []
    },
    ai: {
      title: 'Sistema de IA',
      icon: 'cpu',
      description: 'Generación automática, Sugerencias inteligentes',
      color: '#9c88ff',
      features: [
        { key: 'ai_question_generation', name: 'Generación de Preguntas', description: 'IA para crear preguntas automáticamente' },
        { key: 'ai_suggestions', name: 'Sugerencias', description: 'Recomendaciones inteligentes' },
        { key: 'ai_analytics', name: 'Analytics de IA', description: 'Análisis predictivo y patrones' }
      ],
      dependencies: ['tools_advanced_analytics'],
      conflicts: []
    },
    communication: {
      title: 'Sistema de Comunicación',
      icon: 'message-circle',
      description: 'Chat, Tickets, Correo interno',
      color: '#20bf6b',
      features: [
        { key: 'communication_chat', name: 'Chat', description: 'Mensajería en tiempo real' },
        { key: 'communication_tickets', name: 'Tickets', description: 'Sistema de soporte técnico' },
        { key: 'communication_email', name: 'Correo Interno', description: 'Mensajería por email' }
      ],
      dependencies: ['notifications_push'],
      conflicts: []
    },
    levels: {
      title: 'Sistema de Niveles',
      icon: 'trending-up',
      description: 'Progresión usuarios, Niveles creadores',
      color: '#fa8231',
      features: [
        { key: 'levels_users', name: 'Niveles de Usuario', description: 'Sistema de progresión para jugadores' },
        { key: 'levels_creators', name: 'Niveles de Creador', description: 'Ranking para creadores de contenido' },
        { key: 'levels_progression', name: 'Progresión', description: 'Mecánicas de avance y logros' }
      ],
      dependencies: ['game_system'],
      conflicts: []
    },
    challenges: {
      title: 'Sistema de Retos',
      icon: 'target',
      description: 'Retos personalizados, Premios, Planificación',
      color: '#fd79a8',
      features: [
        { key: 'challenges_custom', name: 'Retos Personalizados', description: 'Crear retos específicos' },
        { key: 'challenges_rewards', name: 'Premios', description: 'Sistema de recompensas' },
        { key: 'challenges_planning', name: 'Planificación', description: 'Cronograma de retos' }
      ],
      dependencies: ['game_system', 'monetization_luminarias'],
      conflicts: []
    },
    notifications: {
      title: 'Sistema de Notificaciones',
      icon: 'bell',
      description: 'Push, Email, Badges',
      color: '#a29bfe',
      features: [
        { key: 'notifications_push', name: 'Push', description: 'Notificaciones push del navegador' },
        { key: 'notifications_email', name: 'Email', description: 'Notificaciones por correo' },
        { key: 'notifications_badges', name: 'Badges', description: 'Indicadores visuales' }
      ],
      dependencies: [],
      conflicts: []
    },
    tools: {
      title: 'Herramientas Avanzadas',
      icon: 'settings',
      description: 'Analytics detallados, Exportación datos',
      color: '#6c5ce7',
      features: [
        { key: 'tools_advanced_analytics', name: 'Analytics Detallados', description: 'Análisis profundo de datos' },
        { key: 'tools_data_export', name: 'Exportación', description: 'Exportar datos en múltiples formatos' },
        { key: 'tools_bulk_operations', name: 'Operaciones Masivas', description: 'Acciones en lote' }
      ],
      dependencies: [],
      conflicts: []
    },
    mobile: {
      title: 'App Móvil',
      icon: 'smartphone',
      description: 'Sincronización, Notificaciones push, Modo offline',
      color: '#00b894',
      features: [
        { key: 'mobile_sync', name: 'Sincronización', description: 'Sync datos entre web y móvil' },
        { key: 'mobile_notifications', name: 'Notificaciones Push', description: 'Push notifications nativas' },
        { key: 'mobile_offline', name: 'Modo Offline', description: 'Funcionalidad sin conexión' }
      ],
      dependencies: ['notifications_push'],
      conflicts: []
    }
  };

  // Sincronizar features locales
  useEffect(() => {
    setLocalFeatures(features);
  }, [features]);

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statsData = await getFeatureStats();
    setStats(statsData);
  };

  // Manejar cambio de feature
  const handleFeatureChange = (featureKey, enabled, requiresConfirmation = false) => {
    if (requiresConfirmation && !enabled) {
      setChangeToConfirm({ featureKey, enabled });
      setShowConfirmModal(true);
      return;
    }

    applyFeatureChange(featureKey, enabled);
  };

  const applyFeatureChange = (featureKey, enabled) => {
    setLocalFeatures(prev => ({
      ...prev,
      [featureKey]: enabled
    }));

    setPendingChanges(prev => ({
      ...prev,
      [featureKey]: enabled
    }));
  };

  // Verificar dependencias
  const checkDependencies = (groupKey, enabled) => {
    const group = featureGroups[groupKey];
    if (!group.dependencies.length) return { valid: true, missing: [] };

    const missing = group.dependencies.filter(dep => !localFeatures[dep]);
    return {
      valid: !enabled || missing.length === 0,
      missing
    };
  };

  // Verificar conflictos
  const checkConflicts = (groupKey, enabled) => {
    const group = featureGroups[groupKey];
    if (!group.conflicts.length) return { valid: true, conflicts: [] };

    const conflicts = group.conflicts.filter(conflict => localFeatures[conflict]);
    return {
      valid: !enabled || conflicts.length === 0,
      conflicts
    };
  };

  // Aplicar cambios
  const applyChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    try {
      const success = await updateFeatureFlags(pendingChanges);
      
      if (success) {
        setPendingChanges({});
        addLocalNotification('admin-principal', {
          type: 'success',
          title: 'Features actualizadas',
          message: `${Object.keys(pendingChanges).length} features modificadas`,
          priority: 'info'
        });
        loadStats();
      } else {
        addLocalNotification('admin-principal', {
          type: 'error',
          title: 'Error al actualizar',
          message: 'No se pudieron aplicar los cambios',
          priority: 'important'
        });
      }
    } catch (error) {
      console.error('Error aplicando cambios:', error);
    }
  };

  // Descartar cambios
  const discardChanges = () => {
    setLocalFeatures(features);
    setPendingChanges({});
  };

  // Toggle grupo completo
  const toggleGroup = (groupKey, enabled) => {
    const group = featureGroups[groupKey];
    const changes = {};
    
    group.features.forEach(feature => {
      changes[feature.key] = enabled;
    });

    setLocalFeatures(prev => ({ ...prev, ...changes }));
    setPendingChanges(prev => ({ ...prev, ...changes }));
  };

  // Verificar si grupo está completamente habilitado
  const isGroupEnabled = (groupKey) => {
    const group = featureGroups[groupKey];
    return group.features.every(feature => localFeatures[feature.key]);
  };

  // Contar features habilitadas en grupo
  const getEnabledFeaturesCount = (groupKey) => {
    const group = featureGroups[groupKey];
    return group.features.filter(feature => localFeatures[feature.key]).length;
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="configuracion-modular">
      <div className="section-header">
        <div className="header-content">
          <h2>Configuración Modular de la Aplicación</h2>
          <p>Gestiona las funcionalidades disponibles para los usuarios</p>
          {lastUpdate && (
            <small>Última actualización: {new Date(lastUpdate).toLocaleString()}</small>
          )}
        </div>

        {Object.keys(pendingChanges).length > 0 && (
          <div className="pending-changes">
            <div className="changes-info">
              <Icon name="clock" size="16" />
              <span>{Object.keys(pendingChanges).length} cambios pendientes</span>
            </div>
            <div className="changes-actions">
              <button 
                className="btn btn-secondary"
                onClick={discardChanges}
              >
                Descartar
              </button>
              <button 
                className="btn btn-primary"
                onClick={applyChanges}
              >
                Aplicar Cambios
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas globales */}
      {stats && (
        <Card className="stats-overview">
          <div className="stats-grid">
            <div className="stat-item">
              <Icon name="toggle-left" size="24" />
              <div>
                <span className="stat-value">{stats.totalFeatures}</span>
                <span className="stat-label">Features Totales</span>
              </div>
            </div>
            <div className="stat-item">
              <Icon name="check-circle" size="24" />
              <div>
                <span className="stat-value">{stats.enabledFeatures}</span>
                <span className="stat-label">Habilitadas</span>
              </div>
            </div>
            <div className="stat-item">
              <Icon name="users" size="24" />
              <div>
                <span className="stat-value">{stats.activeUsers}</span>
                <span className="stat-label">Usuarios Activos</span>
              </div>
            </div>
            <div className="stat-item">
              <Icon name="activity" size="24" />
              <div>
                <span className="stat-value">{stats.usageRate}%</span>
                <span className="stat-label">Tasa de Uso</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grupos de features */}
      <div className="feature-groups">
        {Object.entries(featureGroups).map(([groupKey, group]) => {
          const dependencyCheck = checkDependencies(groupKey, true);
          const conflictCheck = checkConflicts(groupKey, true);
          const enabledCount = getEnabledFeaturesCount(groupKey);
          const isExpanded = expandedGroups[groupKey];
          
          return (
            <motion.div
              key={groupKey}
              className={`feature-group ${!dependencyCheck.valid ? 'has-dependencies' : ''}`}
              layout
            >
              <Card>
                <div className="group-header">
                  <div className="group-info">
                    <div 
                      className="group-icon"
                      style={{ backgroundColor: group.color }}
                    >
                      <Icon name={group.icon} size="24" />
                    </div>
                    <div className="group-details">
                      <h3>{group.title}</h3>
                      <p>{group.description}</p>
                      <div className="group-status">
                        <span className="features-count">
                          {enabledCount}/{group.features.length} features activas
                        </span>
                        {!dependencyCheck.valid && (
                          <span className="dependency-warning">
                            <Icon name="alert-triangle" size="14" />
                            Dependencias faltantes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="group-controls">
                    <Toggle
                      checked={isGroupEnabled(groupKey)}
                      onChange={(enabled) => toggleGroup(groupKey, enabled)}
                      size="large"
                      color={group.color}
                    />
                    <button
                      className="expand-btn"
                      onClick={() => setExpandedGroups(prev => ({
                        ...prev,
                        [groupKey]: !prev[groupKey]
                      }))}
                    >
                      <Icon 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size="20" 
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="group-features"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Dependencias */}
                      {group.dependencies.length > 0 && (
                        <div className="dependencies">
                          <h4>Dependencias:</h4>
                          <div className="dependency-list">
                            {group.dependencies.map(dep => (
                              <span 
                                key={dep}
                                className={`dependency ${localFeatures[dep] ? 'satisfied' : 'missing'}`}
                              >
                                <Icon 
                                  name={localFeatures[dep] ? 'check' : 'x'} 
                                  size="12" 
                                />
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Features individuales */}
                      <div className="individual-features">
                        {group.features.map(feature => (
                          <div key={feature.key} className="feature-item">
                            <div className="feature-info">
                              <h5>{feature.name}</h5>
                              <p>{feature.description}</p>
                            </div>
                            <Toggle
                              checked={localFeatures[feature.key] || false}
                              onChange={(enabled) => handleFeatureChange(
                                feature.key, 
                                enabled,
                                feature.requiresConfirmation
                              )}
                              disabled={!dependencyCheck.valid && !localFeatures[feature.key]}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Cambio"
        size="medium"
      >
        <div className="confirmation-content">
          <Icon name="alert-triangle" size="48" color="#f39c12" />
          <h3>¿Estás seguro?</h3>
          <p>
            Esta acción deshabilitará una funcionalidad crítica del sistema.
            Los usuarios podrían perder acceso a características importantes.
          </p>
          <div className="confirmation-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (changeToConfirm) {
                  applyFeatureChange(changeToConfirm.featureKey, changeToConfirm.enabled);
                  setChangeToConfirm(null);
                }
                setShowConfirmModal(false);
              }}
            >
              Confirmar Cambio
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConfiguracionModular;