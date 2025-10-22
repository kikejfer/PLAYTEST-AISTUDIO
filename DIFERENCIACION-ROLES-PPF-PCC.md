# Diferenciación de Roles: Profesor (PPF) vs Creador (PCC)

## Resumen Ejecutivo

Este documento describe la diferenciación clara implementada entre los roles **Profesor (PPF)** y **Creador (PCC)** en LumiQuiz.

**Fecha de implementación:** Octubre 2025
**Estado:** ✅ Fase 1 completada

---

## Filosofía de Diferenciación

### PPF (Profesor) - Contexto Académico Formal
**Objetivo:** Gestión académica y seguimiento pedagógico de alumnos

| Aspecto | Descripción |
|---------|-------------|
| **Usuario típico** | Profesor de instituto/colegio con clases asignadas |
| **Contexto de uso** | Ambiente académico estructurado (curso escolar, clases, grupos, notas) |
| **Relación con usuarios** | Profesor-Alumno (formal, institucional) |
| **Usuarios finales** | **Alumnos** inscritos en clases mediante códigos |
| **Métricas clave** | Rendimiento académico, asistencia, progreso curricular |

### PCC (Creador) - Contexto Marketplace/Negocio
**Objetivo:** Creación y monetización de contenido educativo

| Aspecto | Descripción |
|---------|-------------|
| **Usuario típico** | Content creator independiente o educador freelance |
| **Contexto de uso** | Plataforma de mercado abierto |
| **Relación con usuarios** | Creador-Jugador (consumidor, marketplace) |
| **Usuarios finales** | **Jugadores** que cargan contenido libremente |
| **Métricas clave** | Engagement, revenue, market share, conversiones |

---

## Cambios Implementados en Fase 1

### 1. Headers de Paneles Actualizados

#### Panel PPF:
```html
<h1>👨‍🏫 Panel de Profesores</h1>
<p>Sistema de gestión académica para facilitar la enseñanza,
   planificación de contenidos y seguimiento del progreso de tus alumnos</p>
```

#### Panel PCC:
```html
<h1>🎨 Panel de Creadores</h1>
<p>Herramientas completas para crear, gestionar y monetizar contenido educativo.
   Analiza el rendimiento de tu contenido y el engagement de tus jugadores.</p>
```

### 2. Tabs Organizados por Contexto

#### PPF - Tabs Académicos:
```
📚 Recursos
   └─ Mis Bloques
   └─ Añadir Preguntas
👥 Gestión de Alumnos
   └─ Mis Clases
   └─ Gestión de Estudiantes
   └─ Registro de Asistencia
   └─ Rendimiento Académico
👥 Gestión de Grupos
🏆 Torneos (educativos)
📊 Analytics (académico)
🎯 Intervenciones (pedagógicas)
```

#### PCC - Tabs de Negocio:
```
📝 Contenido
➕ Añadir Preguntas
👥 Gestión de Jugadores
   └─ Resumen
   └─ Gestión de Jugadores
   └─ Engagement
   └─ Feedback
📊 Estadísticas
🏆 Torneos (virales/marketing)
💰 Monetización
📢 Marketing
📊 Analytics de Mercado
```

### 3. Componentes Actualizados

#### bloques-creados-component.js

```javascript
// Instanciación según rol
PPF: renderBloquesCreados('container', 'alumnos')
PCC: renderBloquesCreados('container', 'jugadores')

// Context descriptions añadidas
contextDescriptions: {
    'alumnos': 'Contexto académico - Gestión de clases y alumnos',
    'jugadores': 'Contexto marketplace - Jugadores que cargan tu contenido',
    'estudiantes': 'Contexto académico - Gestión de estudiantes'
}
```

#### students-management-component.js

```javascript
// Configuración por rol diferenciada
profesor: {
    title: 'Gestión de Alumnos',
    subtitle: 'Administra y supervisa el progreso académico de tus alumnos inscritos en tus clases',
    context: 'académico',
    userLabel: 'Alumnos'
}

creador: {
    title: 'Gestión de Jugadores',
    subtitle: 'Administra jugadores que han cargado tu contenido del marketplace y analiza su engagement',
    context: 'marketplace',
    userLabel: 'Jugadores'
}
```

---

## Terminología Estandarizada

| Rol | Usuarios Gestionados | Contexto | Relación |
|-----|---------------------|----------|----------|
| **PPF** | Alumnos/Estudiantes | Académico | Inscripción formal en clases |
| **PCC** | Jugadores | Marketplace | Carga libre de contenido |

---

## Funcionalidades por Rol

### PPF (Profesor) - Exclusivas

✅ **Gestión de Clases**
- Crear clases con códigos de acceso únicos
- Inscribir alumnos mediante códigos
- Ver lista de alumnos por clase

✅ **Seguimiento Académico**
- Registro de asistencia
- Calificaciones oficiales
- Rendimiento académico por alumno

✅ **Intervenciones Pedagógicas**
- Detección de alumnos en riesgo
- Planes de mejora personalizados
- Estrategias de intervención

✅ **Integración Educativa** (futuro)
- Canvas, Moodle, Google Classroom
- Sincronización de calificaciones
- Exportación a SIS (Student Information Systems)

### PCC (Creador) - Exclusivas

✅ **Monetización**
- Suscripciones mensuales/anuales
- Venta de productos digitales (cursos, ebooks)
- Servicios premium (tutorías, coaching)

✅ **Marketing**
- Campañas promocionales (descuentos, bundles)
- Torneos virales para adquisición
- Cupones y códigos promocionales

✅ **Analytics de Mercado**
- Ranking de creadores
- Análisis de competencia
- Share de mercado
- Pricing dinámico con A/B testing

✅ **Engagement**
- Métricas de retención de jugadores
- Lifetime value (LTV)
- Cost per acquisition (CPA)
- Tasa de conversión

### Funcionalidades Compartidas (con enfoque diferente)

| Funcionalidad | PPF (Enfoque) | PCC (Enfoque) |
|---------------|---------------|---------------|
| **Crear Contenido** | Alineado con currículum académico | Optimizado para viralidad y ventas |
| **Gestión de Usuarios** | Alumnos (contexto académico) | Jugadores (contexto consumo) |
| **Torneos** | Educativos, parte de actividades de clase | Marketing/viral, aumentar usuarios |
| **Analytics** | Rendimiento académico, progreso | Revenue, conversiones, engagement |

---

## Flujos de Usuario

### Flujo PPF (Profesor)

```
1. Profesor crea clase → Genera código único (ej: MATH2024-A)
2. Comparte código con alumnos
3. Alumno ingresa código → Se inscribe en clase
4. Profesor asigna bloques a la clase
5. Alumno ve bloques asignados en "Mis Clases"
6. Profesor hace seguimiento: asistencia, calificaciones, intervenciones
```

### Flujo PCC (Creador)

```
1. Creador crea bloque → Lo marca como público
2. Bloque aparece en marketplace
3. Jugador busca contenido → Encuentra bloque
4. Jugador carga bloque a su perfil
5. Creador ve analytics: engagement, conversiones
6. Creador optimiza pricing, lanza campañas
```

---

## Base de Datos

### PPF - Tablas Específicas (17+)

| Tabla | Propósito |
|-------|-----------|
| `teacher_classes` | Gestión de clases |
| `class_enrollments` | Inscripciones de alumnos |
| `attendance_tracking` | Registro de asistencia |
| `student_academic_profiles` | Perfiles académicos detallados |
| `academic_progress` | Progreso por alumno |
| `teacher_assessments` | Evaluaciones y exámenes |
| `assessment_results` | Resultados por alumno |
| `pedagogical_interventions` | Intervenciones pedagógicas |
| `academic_schedules` | Cronogramas académicos |
| `content_assignments` | Asignaciones de contenido |
| `educational_tournaments` | Torneos educativos |
| `integration_configurations` | Integraciones LMS |

### PCC - Tablas Específicas (13+)

| Tabla | Propósito |
|-------|-----------|
| `creator_market_analytics` | Analytics de mercado |
| `competitor_analysis` | Análisis de competencia |
| `marketing_campaigns` | Campañas promocionales |
| `marketing_tournaments` | Torneos virales |
| `creator_subscriptions` | Suscripciones |
| `creator_premium_services` | Servicios premium |
| `creator_digital_products` | Productos digitales |
| `service_bookings` | Reservas de servicios |
| `dynamic_pricing` | Optimización de precios |
| `ab_tests` | Pruebas A/B |
| `content_analytics` | Analytics de contenido |
| `market_opportunities` | Oportunidades de mercado |

---

## Estado Actual vs Futuro

### ✅ Fase 1 Completada (Diferenciación Básica)
- Headers y descripciones actualizadas
- Terminología estandarizada (Alumnos vs Jugadores)
- Componentes diferenciados
- Tabs organizados por contexto

### 🚧 Fase 2 (Próxima - Flujo de Clases)
- UI para crear clases con códigos
- UI para inscripción de alumnos
- UI para ver bloques asignados vs marketplace
- Separación clara en panel de jugadores

### 📋 Fase 3 (Futuro - Features Específicas)
- Sistema de asignaciones completo (PPF)
- Sistema de monetización (PCC)
- Analytics diferenciados
- Integraciones LMS (PPF)
- Marketing automation (PCC)

---

## Archivos Modificados

```
✅ /teachers-panel-schedules.html - Header actualizado
✅ /creators-panel-content.html - Header actualizado
✅ /bloques-creados-component.js - Context descriptions añadidas
✅ /students-management-component.js - Configuraciones diferenciadas
📝 /DIFERENCIACION-ROLES-PPF-PCC.md - Este documento
```

---

## Próximos Pasos

1. **Implementar Fase 2:**
   - Crear UI de gestión de clases
   - Implementar sistema de códigos de inscripción
   - Separar "Mis Clases" de "Marketplace" en panel de jugadores

2. **Testing:**
   - Verificar que los labels sean consistentes
   - Probar flujos de profesor
   - Probar flujos de creador

3. **Documentación:**
   - Actualizar guías de usuario
   - Crear tutoriales de onboarding diferenciados

---

**Documento creado:** Octubre 2025
**Última actualización:** Fase 1 completada
**Próxima revisión:** Inicio de Fase 2
