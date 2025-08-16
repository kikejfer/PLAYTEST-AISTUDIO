# 🎯 Sistema de Soporte Técnico PLAYTEST

## 📋 Descripción General

El Sistema de Soporte Técnico PLAYTEST es una solución integral y automatizada diseñada para gestionar de manera eficiente todas las consultas, problemas y solicitudes de los usuarios. Incorpora inteligencia artificial, automatización avanzada y herramientas de gestión masiva para optimizar la experiencia tanto de usuarios como de agentes de soporte.

## 🚀 Características Principales

### 🎛️ Dashboard en Tiempo Real
- **Métricas KPI**: Tickets abiertos, tiempo promedio de respuesta, satisfacción del cliente
- **Alertas Automáticas**: Notificaciones de SLA en riesgo, escalaciones pendientes
- **Gráficos de Tendencias**: Visualización de volumen de tickets, resoluciones por día
- **Estado del Sistema**: Monitoreo de salud del sistema y automation jobs

### 🤖 Agrupación Inteligente Automática
- **Algoritmo de Similitud**: Identifica tickets relacionados por contenido y categoría
- **Agrupación Temporal**: Detecta patrones de tickets similares en ventanas de tiempo
- **Gestión de Grupos**: Visualización y administración de grupos de tickets relacionados
- **Resolución Masiva**: Aplicar soluciones a todos los tickets de un grupo

### 📊 Gestión Masiva de Tickets
- **Selección Múltiple**: Checkbox para seleccionar tickets en lote
- **Acciones en Lote**: Cambio de estado, asignación, categorización masiva
- **Plantillas de Respuesta**: Respuestas automatizadas con personalización
- **Cierre Masivo**: Cerrar múltiples tickets con comentarios automáticos

### 📚 Base de Conocimiento Integrada
- **Editor Markdown**: Creación de artículos con formateo avanzado
- **Categorización**: Organización por categorías y etiquetas
- **Búsqueda Inteligente**: Búsqueda de texto completo con relevancia
- **Sugerencias Automáticas**: Recomendaciones basadas en el contenido del ticket
- **FAQ Automático**: Generación de preguntas frecuentes desde tickets resueltos

### ⚡ Sistema de Escalado Automático
- **Reglas Configurables**: Escalación basada en tiempo, prioridad, categoría
- **Escalación Temporal**: 24h sin respuesta → Admin, 48h sin resolución → Principal
- **Tickets Críticos**: Escalación inmediata para issues de alta prioridad
- **Notificaciones**: Alertas automáticas a administradores y supervisores
- **Historial de Escalaciones**: Tracking completo de todas las escalaciones

### 🏷️ Categorización Automática Avanzada
- **Machine Learning**: Clasificación automática basada en contenido
- **Análisis de Palabras Clave**: Detección de categorías por vocabulario específico
- **Predicción de Prioridad**: Estimación automática de urgencia
- **Confianza ML**: Sistema de puntuación de certeza en clasificaciones
- **Entrenamiento Continuo**: Mejora automática del algoritmo con feedback

### 📈 Analytics y Reportes Automatizados
- **Reportes Diarios**: Generación automática de métricas del día
- **Análisis de Tendencias**: Identificación de patrones y problemas recurrentes
- **Métricas de Satisfacción**: Tracking de calificaciones y feedback de usuarios
- **Reportes Semanales**: Resúmenes automáticos enviados a administradores
- **Dashboards Personalizables**: Métricas específicas por rol y departamento

### 🔔 Sistema de Comunicación Integrado
- **Chat Integrado**: Comunicación directa entre agentes y usuarios
- **Notificaciones Push**: Alertas en tiempo real en navegador
- **Email Automatizado**: Notificaciones por correo configurables
- **Historial Unificado**: Vista completa de todas las interacciones
- **Estados de Lectura**: Tracking de notificaciones leídas/no leídas

## 🛠️ Instalación y Configuración

### 1. Prerrequisitos
```bash
# Node.js 16+
# PostgreSQL 13+
# NPM/Yarn
```

### 2. Instalación de Dependencias
```bash
cd playtest-backend
npm install node-cron
```

### 3. Configuración de Base de Datos
```bash
# Ejecutar script de configuración
node setup-support-system.js
```

### 4. Variables de Entorno
Agregar al archivo `.env`:
```env
# Configuración de Soporte
SUPPORT_EMAIL_FROM=soporte@playtest.com
SUPPORT_ENABLE_AUTOMATION=true
SUPPORT_ML_CONFIDENCE_THRESHOLD=0.7
```

### 5. Inicializar Sistema
El sistema se inicializa automáticamente con el servidor:
```javascript
// En server.js
const supportAutomation = require('./support-automation');
supportAutomation.start();
```

## 📚 Guía de Uso

### Para Administradores

#### Dashboard Principal
1. Acceder a `/support-dashboard.html`
2. Revisar métricas en tiempo real
3. Atender alertas de SLA y escalaciones
4. Monitorear estado de automatización

#### Configuración del Sistema
```javascript
// Modificar configuraciones
const config = {
    sla_first_response_hours: 4,
    sla_resolution_hours: 24,
    auto_close_resolved_days: 7,
    ml_confidence_threshold: 0.7
};
```

#### Gestión de Reglas de Escalación
1. Acceder a API: `GET /api/support/escalation/rules`
2. Crear nueva regla: `POST /api/support/escalation/rules`
3. Activar/desactivar reglas existentes

### Para Agentes de Soporte

#### Gestión Diaria de Tickets
1. **Vista de Lista**: `/support-tickets.html`
   - Filtros por estado, categoría, prioridad
   - Búsqueda por texto completo
   - Ordenamiento por fecha, prioridad

2. **Vista Kanban**: Arrastrar y soltar tickets entre estados
   - Abierto → En Progreso → Esperando Usuario → Resuelto → Cerrado

3. **Acciones Masivas**:
   - Seleccionar múltiples tickets con checkbox
   - Aplicar cambios de estado en lote
   - Asignar tickets a agentes específicos
   - Aplicar plantillas de respuesta

#### Respuesta a Tickets
1. **Plantillas Disponibles**:
   - Bienvenida y confirmación
   - Solicitud de información adicional
   - Resolución y cierre
   - Escalación a especialistas

2. **Base de Conocimiento**:
   - Buscar artículos relacionados
   - Insertar enlaces a soluciones
   - Crear nuevos artículos desde tickets resueltos

### Para Usuarios Finales

#### Crear Nuevo Ticket
```javascript
// API para crear ticket
POST /api/support/tickets
{
    "subject": "Problema con quiz",
    "description": "No puedo acceder al quiz de matemáticas",
    "category_id": 6,
    "priority": "medium"
}
```

#### Seguimiento de Tickets
- Recibir notificaciones automáticas
- Acceder a historial completo
- Calificar servicio recibido
- Reabrir tickets si es necesario

## 🔧 API Reference

### Endpoints Principales

#### Tickets
```javascript
GET    /api/support/tickets              // Listar tickets
POST   /api/support/tickets              // Crear ticket
GET    /api/support/tickets/:id          // Obtener ticket específico
PUT    /api/support/tickets/:id          // Actualizar ticket
DELETE /api/support/tickets/:id          // Eliminar ticket

// Acciones masivas
POST   /api/support/tickets/bulk/update  // Actualizar múltiples tickets
POST   /api/support/tickets/bulk/assign  // Asignar múltiples tickets
POST   /api/support/tickets/bulk/close   // Cerrar múltiples tickets
```

#### Dashboard y Métricas
```javascript
GET /api/support/dashboard/metrics       // Métricas en tiempo real
GET /api/support/dashboard/alerts        // Alertas activas
GET /api/support/analytics/trends        // Tendencias y gráficos
GET /api/support/analytics/reports       // Reportes generados
```

#### Base de Conocimiento
```javascript
GET    /api/support/knowledge-base       // Listar artículos
POST   /api/support/knowledge-base       // Crear artículo
GET    /api/support/knowledge-base/search // Buscar artículos
GET    /api/support/faq                  // FAQ automático
```

#### Automatización
```javascript
GET /api/support/automation/status       // Estado del sistema
POST /api/support/automation/force-run   // Ejecutar procesos manualmente
GET /api/support/escalation/rules        // Reglas de escalación
```

## 🔍 Monitoreo y Mantenimiento

### Logs del Sistema
```bash
# Logs de automatización
tail -f logs/support-automation.log

# Logs de escalaciones
tail -f logs/escalations.log

# Logs de ML categorization
tail -f logs/ml-categorization.log
```

### Métricas de Rendimiento
- **Tickets procesados por hora**: > 100 tickets/hora
- **Precisión de categorización ML**: > 80%
- **Tiempo promedio de agrupación**: < 5 segundos
- **SLA compliance**: > 95%

### Tareas de Mantenimiento

#### Diario
- Revisar logs de errores
- Verificar métricas de SLA
- Monitorear queue de escalaciones

#### Semanal
- Analizar reportes automáticos
- Revisar precision de ML
- Actualizar reglas de escalación según necesidad

#### Mensual
- Limpieza de datos antiguos
- Optimización de índices de base de datos
- Revisión de performance del sistema

## 🔒 Seguridad y Permisos

### Roles y Permisos
```javascript
// Definición de roles
const roles = {
    'user': ['create_ticket', 'view_own_tickets'],
    'agent': ['view_tickets', 'update_tickets', 'create_comments'],
    'admin': ['manage_tickets', 'view_analytics', 'manage_escalations'],
    'super_admin': ['system_config', 'manage_automation', 'view_all_data']
};
```

### Seguridad de Datos
- **Encriptación**: Datos sensibles encriptados en BD
- **Auditoría**: Log completo de todas las acciones
- **Backup**: Respaldo automático diario de tickets y configuraciones
- **GDPR Compliance**: Herramientas de anonimización y eliminación de datos

## 🚨 Troubleshooting

### Problemas Comunes

#### Automatización no funciona
```bash
# Verificar estado
node -e "console.log(require('./support-automation').getStatus())"

# Reiniciar sistema
node -e "require('./support-automation').stop(); require('./support-automation').start()"
```

#### Tickets no se categorizan automáticamente
1. Verificar confianza ML en configuración
2. Revisar keywords en algoritmo de clasificación
3. Comprobar logs de categorización

#### Escalaciones no se procesan
1. Verificar reglas de escalación activas
2. Comprobar configuración de SLA
3. Revisar logs de cron jobs

### Contacto de Soporte
Para problemas técnicos con el sistema:
- **Email**: tech-support@playtest.com
- **Chat**: Integrado en el dashboard
- **Documentación**: Este archivo y comentarios en código

---

**🎯 Sistema de Soporte Técnico PLAYTEST v1.0**  
*Automatización inteligente para excelencia en servicio al cliente*