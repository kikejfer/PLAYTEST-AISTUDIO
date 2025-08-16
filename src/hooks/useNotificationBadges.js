import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Hook para gestión de notificaciones y badges contextuales
 * Maneja contadores, prioridades y marcado automático como leído
 */
export const useNotificationBadges = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState({});
  const [lastRead, setLastRead] = useState({});

  // Cargar notificaciones desde el servidor
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/badges', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || {});
        setLastRead(data.lastRead || {});
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }, [user]);

  // Cargar notificaciones al montar y cuando cambie el usuario
  useEffect(() => {
    loadNotifications();
    
    // Configurar polling cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Configurar WebSocket para notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(`ws://localhost:3001/notifications?token=${user.token}`);
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      setNotifications(prev => ({
        ...prev,
        [notification.context]: {
          ...prev[notification.context],
          count: (prev[notification.context]?.count || 0) + 1,
          items: [
            notification,
            ...(prev[notification.context]?.items || [])
          ].slice(0, 50), // Mantener solo últimas 50
          lastUpdate: Date.now()
        }
      }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  // Función para obtener conteo de notificaciones por contexto
  const getNotificationCount = useCallback((context) => {
    const contextNotifications = notifications[context];
    if (!contextNotifications) return 0;

    const lastReadTime = lastRead[context] || 0;
    const unreadCount = contextNotifications.items?.filter(
      notification => notification.timestamp > lastReadTime
    ).length || 0;

    return unreadCount;
  }, [notifications, lastRead]);

  // Función para obtener todas las notificaciones con conteos
  const getNotificationCounts = useCallback(() => {
    const counts = {};
    
    Object.keys(notifications).forEach(context => {
      counts[context] = getNotificationCount(context);
      counts[`${context}_details`] = notifications[context]?.items || [];
    });
    
    return counts;
  }, [notifications, getNotificationCount]);

  // Función para marcar como leído
  const markAsRead = useCallback(async (context) => {
    if (!user) return;

    const now = Date.now();
    
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ context, timestamp: now })
      });
      
      setLastRead(prev => ({
        ...prev,
        [context]: now
      }));
    } catch (error) {
      console.error('Error marcando como leído:', error);
    }
  }, [user]);

  // Función para marcar múltiples contextos como leídos
  const markMultipleAsRead = useCallback(async (contexts) => {
    if (!user) return;

    const now = Date.now();
    const updates = {};
    
    contexts.forEach(context => {
      updates[context] = now;
    });

    try {
      await fetch('/api/notifications/mark-multiple-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ updates })
      });
      
      setLastRead(prev => ({
        ...prev,
        ...updates
      }));
    } catch (error) {
      console.error('Error marcando múltiples como leído:', error);
    }
  }, [user]);

  // Función para obtener prioridad máxima de notificaciones
  const getMaxPriority = useCallback((context) => {
    const contextNotifications = notifications[context];
    if (!contextNotifications?.items) return null;

    const lastReadTime = lastRead[context] || 0;
    const unreadNotifications = contextNotifications.items.filter(
      notification => notification.timestamp > lastReadTime
    );

    if (unreadNotifications.length === 0) return null;

    // Determinar prioridad máxima
    const priorities = unreadNotifications.map(n => n.priority);
    if (priorities.includes('critical')) return 'critical';
    if (priorities.includes('important')) return 'important';
    if (priorities.includes('warning')) return 'warning';
    return 'info';
  }, [notifications, lastRead]);

  // Función para agregar notificación local (testing/preview)
  const addLocalNotification = useCallback((context, notification) => {
    setNotifications(prev => ({
      ...prev,
      [context]: {
        ...prev[context],
        count: (prev[context]?.count || 0) + 1,
        items: [
          {
            ...notification,
            id: Date.now(),
            timestamp: Date.now()
          },
          ...(prev[context]?.items || [])
        ].slice(0, 50),
        lastUpdate: Date.now()
      }
    }));
  }, []);

  // Función para limpiar notificaciones antiguas
  const cleanupOldNotifications = useCallback(async (olderThanDays = 30) => {
    if (!user) return;

    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    try {
      await fetch('/api/notifications/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ cutoffTime })
      });
      
      // Actualizar estado local
      setNotifications(prev => {
        const updated = {};
        Object.entries(prev).forEach(([context, data]) => {
          updated[context] = {
            ...data,
            items: data.items?.filter(item => item.timestamp > cutoffTime) || []
          };
        });
        return updated;
      });
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
    }
  }, [user]);

  // Función para obtener resumen de notificaciones
  const getNotificationSummary = useCallback(() => {
    const summary = {
      totalUnread: 0,
      byPriority: {
        critical: 0,
        important: 0,
        warning: 0,
        info: 0
      },
      byContext: {}
    };

    Object.keys(notifications).forEach(context => {
      const count = getNotificationCount(context);
      const priority = getMaxPriority(context);
      
      summary.totalUnread += count;
      summary.byContext[context] = {
        count,
        priority
      };
      
      if (priority && count > 0) {
        summary.byPriority[priority] += count;
      }
    });

    return summary;
  }, [notifications, getNotificationCount, getMaxPriority]);

  return {
    notifications,
    notificationCounts: getNotificationCounts(),
    getNotificationCount,
    getMaxPriority,
    markAsRead,
    markMultipleAsRead,
    addLocalNotification,
    cleanupOldNotifications,
    getNotificationSummary,
    refresh: loadNotifications
  };
};

/**
 * Hook específico para auto-marcado como leído
 */
export const useAutoMarkAsRead = (context, enabled = true) => {
  const { markAsRead } = useNotificationBadges();

  useEffect(() => {
    if (!enabled || !context) return;

    // Marcar como leído cuando el componente se monta/contexto cambia
    const timer = setTimeout(() => {
      markAsRead(context);
    }, 1000); // Esperar 1 segundo antes de marcar como leído

    return () => clearTimeout(timer);
  }, [context, enabled, markAsRead]);
};

/**
 * Hook para notificaciones en tiempo real específicas de contexto
 */
export const useContextNotifications = (context) => {
  const { notifications, getNotificationCount, getMaxPriority, markAsRead } = useNotificationBadges();
  
  const contextData = notifications[context] || { items: [], count: 0 };
  const unreadCount = getNotificationCount(context);
  const maxPriority = getMaxPriority(context);

  return {
    notifications: contextData.items,
    unreadCount,
    maxPriority,
    markAsRead: () => markAsRead(context),
    lastUpdate: contextData.lastUpdate
  };
};