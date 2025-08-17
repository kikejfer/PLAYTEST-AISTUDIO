/**
 * Sistema de Configuración Modular Avanzado - PLAYTEST
 * Configuración de Feature Flags con Dependencias y Grupos
 */

export const FEATURE_GROUPS = {
  COMPETITION: 'competition',
  MONETIZATION: 'monetization', 
  AI: 'ai',
  COMMUNICATION: 'communication',
  LEVELS: 'levels',
  CHALLENGES: 'challenges',
  NOTIFICATIONS: 'notifications',
  ADVANCED_TOOLS: 'advanced_tools',
  MOBILE_APP: 'mobile_app'
};

export const FEATURE_FLAGS_CONFIG = {
  // Grupo 1 - Sistema de Competición
  [FEATURE_GROUPS.COMPETITION]: {
    name: 'Sistema de Competición',
    description: 'Duelos, Trivial, Torneos, Rankings y Desafíos',
    dependencies: [FEATURE_GROUPS.COMMUNICATION],
    impact: 'Oculta modos de competición en configurador de partidas',
    features: {
      'competition.duels.enabled': {
        name: 'Duelos',
        description: 'Sistema de duelos entre usuarios',
        default: true,
        dependencies: ['communication.notifications.enabled'],
        impact_users: 'all_users'
      },
      'competition.trivial.enabled': {
        name: 'Trivial',
        description: 'Modo de juego trivial',
        default: true,
        dependencies: [],
        impact_users: 'all_users'
      },
      'competition.tournaments.enabled': {
        name: 'Torneos',
        description: 'Sistema de torneos organizados',
        default: true,
        dependencies: ['communication.notifications.enabled'],
        impact_users: 'all_users'
      },
      'competition.rankings.enabled': {
        name: 'Rankings',
        description: 'Sistema de clasificaciones y leaderboards',
        default: true,
        dependencies: ['levels.user_progression.enabled'],
        impact_users: 'all_users'
      },
      'competition.challenges.enabled': {
        name: 'Desafíos',
        description: 'Desafíos de competición',
        default: true,
        dependencies: ['communication.notifications.enabled'],
        impact_users: 'all_users'
      }
    }
  },

  // Grupo 2 - Sistema de Monetización
  [FEATURE_GROUPS.MONETIZATION]: {
    name: 'Sistema de Monetización',
    description: 'Planes de pago, Marketplace, Conversión Luminarias',
    dependencies: ['luminarias_system'], // Sistema externo existente
    impact: 'Oculta opciones de pago y conversión en panel financiero',
    features: {
      'monetization.paid_plans.enabled': {
        name: 'Planes de Pago',
        description: 'Suscripciones y planes premium',
        default: false,
        dependencies: ['luminarias_system'],
        impact_users: 'creators_and_admins'
      },
      'monetization.marketplace.enabled': {
        name: 'Marketplace',
        description: 'Mercado de contenido premium',
        default: false,
        dependencies: ['luminarias_system'],
        impact_users: 'all_users'
      },
      'monetization.currency_conversion.enabled': {
        name: 'Conversión de Luminarias',
        description: 'Conversión de luminarias a dinero real',
        default: false,
        dependencies: ['luminarias_system'],
        impact_users: 'creators_and_admins'
      },
      'monetization.discounts.enabled': {
        name: 'Sistema de Descuentos',
        description: 'Cupones y promociones',
        default: false,
        dependencies: ['monetization.paid_plans.enabled'],
        impact_users: 'all_users'
      }
    }
  },

  // Grupo 3 - Sistema de IA
  [FEATURE_GROUPS.AI]: {
    name: 'Sistema de IA',
    description: 'Generación automática, Sugerencias, Analytics predictivos',
    dependencies: [],
    impact: 'Oculta opciones de IA en creación de contenido',
    features: {
      'ai.content_generation.enabled': {
        name: 'Generación de Contenido',
        description: 'IA para generar preguntas y respuestas automáticamente',
        default: false,
        dependencies: [],
        impact_users: 'creators_and_admins'
      },
      'ai.suggestions.enabled': {
        name: 'Sugerencias Inteligentes',
        description: 'Recomendaciones de contenido y mejoras',
        default: false,
        dependencies: [],
        impact_users: 'creators_and_admins'
      },
      'ai.predictive_analytics.enabled': {
        name: 'Analytics Predictivos',
        description: 'Predicciones de engagement y performance',
        default: false,
        dependencies: ['advanced_tools.detailed_analytics.enabled'],
        impact_users: 'admins_only'
      },
      'ai.auto_review.enabled': {
        name: 'Revisión Automática',
        description: 'Revisión automática de contenido generado',
        default: false,
        dependencies: ['ai.content_generation.enabled'],
        impact_users: 'creators_and_admins'
      }
    }
  },

  // Grupo 4 - Sistema de Comunicación
  [FEATURE_GROUPS.COMMUNICATION]: {
    name: 'Sistema de Comunicación',
    description: 'Chat, Tickets, Correo interno, Notificaciones',
    dependencies: [],
    impact: 'Elimina toda comunicación entre usuarios y soporte',
    features: {
      'communication.chat.enabled': {
        name: 'Chat',
        description: 'Sistema de chat en tiempo real',
        default: true,
        dependencies: [],
        impact_users: 'all_users'
      },
      'communication.tickets.enabled': {
        name: 'Sistema de Tickets',
        description: 'Soporte técnico via tickets',
        default: true,
        dependencies: [],
        impact_users: 'all_users'
      },
      'communication.internal_mail.enabled': {
        name: 'Correo Interno',
        description: 'Sistema de mensajería interna',
        default: true,
        dependencies: [],
        impact_users: 'all_users'
      },
      'communication.notifications.enabled': {
        name: 'Notificaciones',
        description: 'Sistema base de notificaciones',
        default: true,
        dependencies: [],
        impact_users: 'all_users'
      }
    }
  },

  // Grupo 5 - Sistema de Niveles
  [FEATURE_GROUPS.LEVELS]: {
    name: 'Sistema de Niveles',
    description: 'Progresión usuarios, Niveles creadores, Badges',
    dependencies: ['luminarias_system'],
    impact: 'Elimina progression tracking y badges',
    features: {
      'levels.user_progression.enabled': {
        name: 'Progresión de Usuarios',
        description: 'Sistema de niveles y experiencia de usuarios',
        default: true,
        dependencies: ['luminarias_system'],
        impact_users: 'all_users'
      },
      'levels.creator_levels.enabled': {
        name: 'Niveles de Creadores',
        description: 'Niveles específicos para creadores de contenido',
        default: true,
        dependencies: ['levels.user_progression.enabled'],
        impact_users: 'creators_only'
      },
      'levels.badges.enabled': {
        name: 'Sistema de Badges',
        description: 'Insignias y logros',
        default: true,
        dependencies: ['levels.user_progression.enabled'],
        impact_users: 'all_users'
      },
      'levels.achievements.enabled': {
        name: 'Logros',
        description: 'Sistema de logros y objetivos',
        default: true,
        dependencies: ['levels.user_progression.enabled'],
        impact_users: 'all_users'
      }
    }
  },

  // Grupo 6 - Sistema de Retos
  [FEATURE_GROUPS.CHALLENGES]: {
    name: 'Sistema de Retos',
    description: 'Retos personalizados, Premios, Planificación',
    dependencies: [FEATURE_GROUPS.LEVELS, 'luminarias_system', FEATURE_GROUPS.COMMUNICATION],
    impact: 'Oculta creación y gestión de retos personalizados',
    features: {
      'challenges.custom_challenges.enabled': {
        name: 'Retos Personalizados',
        description: 'Creación de retos customizados',
        default: true,
        dependencies: ['levels.user_progression.enabled', 'communication.notifications.enabled'],
        impact_users: 'creators_and_admins'
      },
      'challenges.prizes.enabled': {
        name: 'Sistema de Premios',
        description: 'Premios automáticos para retos',
        default: true,
        dependencies: ['luminarias_system', 'challenges.custom_challenges.enabled'],
        impact_users: 'all_users'
      },
      'challenges.planning.enabled': {
        name: 'Planificación de Retos',
        description: 'Programación de retos futuros',
        default: true,
        dependencies: ['challenges.custom_challenges.enabled'],
        impact_users: 'creators_and_admins'
      },
      'challenges.tracking.enabled': {
        name: 'Seguimiento de Retos',
        description: 'Analytics y tracking de progreso',
        default: true,
        dependencies: ['challenges.custom_challenges.enabled'],
        impact_users: 'all_users'
      }
    }
  },

  // Grupo 7 - Sistema de Notificaciones
  [FEATURE_GROUPS.NOTIFICATIONS]: {
    name: 'Sistema de Notificaciones',
    description: 'Push web, Email, Badges, Alertas tiempo real',
    dependencies: [FEATURE_GROUPS.COMMUNICATION],
    impact: 'Elimina todas las notificaciones automáticas',
    features: {
      'notifications.web_push.enabled': {
        name: 'Push Web',
        description: 'Notificaciones push en navegador',
        default: true,
        dependencies: ['communication.notifications.enabled'],
        impact_users: 'all_users'
      },
      'notifications.email.enabled': {
        name: 'Email',
        description: 'Notificaciones por correo electrónico',
        default: true,
        dependencies: ['communication.notifications.enabled'],
        impact_users: 'all_users'
      },
      'notifications.tab_badges.enabled': {
        name: 'Badges en Pestañas',
        description: 'Contadores de notificaciones en UI',
        default: true,
        dependencies: ['communication.notifications.enabled'],
        impact_users: 'all_users'
      },
      'notifications.real_time_alerts.enabled': {
        name: 'Alertas Tiempo Real',
        description: 'Notificaciones instantáneas en la aplicación',
        default: true,
        dependencies: ['communication.notifications.enabled'],
        impact_users: 'all_users'
      }
    }
  },

  // Grupo 8 - Herramientas Avanzadas
  [FEATURE_GROUPS.ADVANCED_TOOLS]: {
    name: 'Herramientas Avanzadas',
    description: 'Analytics detallados, Exportación, Reportes, API',
    dependencies: [],
    impact: 'Oculta funciones de analytics profesionales',
    features: {
      'advanced_tools.detailed_analytics.enabled': {
        name: 'Analytics Detallados',
        description: 'Métricas avanzadas y dashboards profesionales',
        default: false,
        dependencies: [],
        impact_users: 'admins_only'
      },
      'advanced_tools.data_export.enabled': {
        name: 'Exportación de Datos',
        description: 'Exportar datos en múltiples formatos',
        default: false,
        dependencies: ['advanced_tools.detailed_analytics.enabled'],
        impact_users: 'admins_only'
      },
      'advanced_tools.reports.enabled': {
        name: 'Reportes Automáticos',
        description: 'Generación automática de reportes',
        default: false,
        dependencies: ['advanced_tools.detailed_analytics.enabled'],
        impact_users: 'admins_only'
      },
      'advanced_tools.external_api.enabled': {
        name: 'API Externa',
        description: 'Acceso API para integraciones externas',
        default: false,
        dependencies: [],
        impact_users: 'developers_only'
      }
    }
  },

  // Grupo 9 - App Móvil
  [FEATURE_GROUPS.MOBILE_APP]: {
    name: 'App Móvil',
    description: 'Sincronización, Push móvil, Modo offline',
    dependencies: [FEATURE_GROUPS.NOTIFICATIONS],
    impact: 'Elimina capacidades móviles y sincronización',
    features: {
      'mobile_app.sync.enabled': {
        name: 'Sincronización',
        description: 'Sincronización entre web y móvil',
        default: false,
        dependencies: [],
        impact_users: 'mobile_users'
      },
      'mobile_app.push_notifications.enabled': {
        name: 'Push Móvil',
        description: 'Notificaciones push nativas móviles',
        default: false,
        dependencies: ['notifications.web_push.enabled'],
        impact_users: 'mobile_users'
      },
      'mobile_app.offline_mode.enabled': {
        name: 'Modo Offline',
        description: 'Funcionalidad sin conexión',
        default: false,
        dependencies: ['mobile_app.sync.enabled'],
        impact_users: 'mobile_users'
      }
    }
  }
};

export const USER_SEGMENTS = {
  ALL_USERS: 'all_users',
  ADMINS_ONLY: 'admins_only',
  CREATORS_ONLY: 'creators_only',
  CREATORS_AND_ADMINS: 'creators_and_admins',
  MOBILE_USERS: 'mobile_users',
  DEVELOPERS_ONLY: 'developers_only'
};

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

export const ROLLOUT_STRATEGIES = {
  IMMEDIATE: 'immediate',
  GRADUAL: 'gradual',
  SCHEDULED: 'scheduled',
  AB_TEST: 'ab_test'
};

// Configuración por defecto del sistema
export const DEFAULT_FEATURE_FLAGS = {
  // Features esenciales activadas por defecto
  'communication.chat.enabled': true,
  'communication.tickets.enabled': true,
  'communication.notifications.enabled': true,
  'levels.user_progression.enabled': true,
  'levels.badges.enabled': true,
  'competition.duels.enabled': true,
  'competition.trivial.enabled': true,
  'competition.tournaments.enabled': true,
  'challenges.custom_challenges.enabled': true,
  'notifications.web_push.enabled': true,
  'notifications.email.enabled': true,
  
  // Features avanzadas desactivadas por defecto
  'monetization.paid_plans.enabled': false,
  'ai.content_generation.enabled': false,
  'advanced_tools.detailed_analytics.enabled': false,
  'mobile_app.sync.enabled': false
};