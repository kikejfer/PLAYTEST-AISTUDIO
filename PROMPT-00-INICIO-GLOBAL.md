# PLAYTEST - GENERACIÓN COMPLETA DEL PROYECTO EN 5 FASES

## 🎯 OBJETIVO GLOBAL

Vas a generar **TODOS los archivos** necesarios para recrear completamente el proyecto **PLAYTEST/LUMIQUIZ**, una plataforma educativa gamificada de aprendizaje mediante quizzes.

Este proyecto se ha dividido en **5 fases sucesivas** para evitar exceder el límite de tokens de modelos de IA. Debes ejecutar cada fase en orden secuencial.

---

## 📋 DESCRIPCIÓN GENERAL DEL PROYECTO

**PLAYTEST (LUMIQUIZ)** es una plataforma educativa completa que incluye:

### Características Principales:
- ✅ **9 modalidades de juego** (Classic, Time Trial, Lives, Streak, Marathon, Duel, Trivial, Exam, By Levels)
- ✅ **Sistema de roles jerárquico no excluyente** (5 roles con asignación automática)
- ✅ **Moneda virtual "Luminarias"** con economía completa
- ✅ **Sistema dual de profesores**:
  - **PPF (Profesor de Centro Físico)**: Ambiente académico formal
  - **PCC (Profesor Creador de Contenido)**: Marketplace y monetización
- ✅ **Sistema de soporte con tickets** y escalación automática
- ✅ **Mensajería en tiempo real** (WebSocket)
- ✅ **Integraciones LMS** (Canvas, Moodle, Google Classroom)
- ✅ **IA pedagógica** (detección de estudiantes en riesgo)
- ✅ **Feature flags modulares** (9 grupos de funcionalidades)

### Stack Tecnológico:
- **Frontend**: HTML5 + Tailwind CSS + JavaScript Vanilla + React (CDN)
- **Backend**: Node.js 18.x + Express 4.18.2 + Socket.IO 4.8.1
- **Base de Datos**: PostgreSQL 12+
- **Autenticación**: JWT + Bcrypt
- **Despliegue**: Render.com (backend) + Aiven (PostgreSQL)

### Arquitectura:
- **27 tablas** PostgreSQL con relaciones completas
- **51 índices** optimizados
- **26 triggers** automáticos
- **28 funciones** PL/pgSQL
- **Backend** con 27+ rutas API
- **WebSocket** para tiempo real
- **65+ archivos HTML** frontend
- **35+ componentes JavaScript**

---

## 📑 ESTRUCTURA DE LAS 5 FASES

Cada fase está diseñada para ser independiente pero conectada con las anteriores. Debes ejecutarlas en orden:

### **FASE 1: Base de Datos y Backend Core** ⚙️
**Archivo**: `PROMPT-FASE-1-BASE-DATOS-BACKEND.md`

**Genera:**
- ✅ Schema completo de base de datos PostgreSQL
  - Tablas: users, roles, user_roles, blocks, questions, answers, games, luminarias
  - Triggers de asignación automática de roles
  - Funciones de luminarias
- ✅ Estructura del backend Node.js/Express
  - server.js (servidor principal)
  - database/connection.js (pool PostgreSQL)
  - middleware/auth.js (JWT)
  - middleware/roles.js (verificación de roles)
  - routes/auth.js (registro y login)
  - scripts/migrate.js (migración de DB)
- ✅ Archivos de configuración
  - package.json
  - .env.example
  - .gitignore
  - README.md

**Resultado**: Backend funcional con autenticación JWT y base de datos lista.

---

### **FASE 2: Sistema de Roles y APIs Principales** 🎮
**Archivo**: `PROMPT-FASE-2-ROLES-APIS.md`

**Genera:**
- ✅ Rutas de bloques y preguntas
  - CRUD completo de bloques
  - Creación de preguntas (individual y masiva)
  - Obtener preguntas con respuestas
- ✅ Rutas de juegos
  - Crear partidas
  - Guardar puntuaciones
  - Leaderboards
  - Otorgamiento automático de luminarias
- ✅ Rutas de luminarias
  - Balance y transacciones
  - Procesamiento de transacciones
- ✅ Rutas de administración
  - Panel de admin principal
  - Asignación de roles
- ✅ Frontend base
  - index.html (login)
  - api-data-service.js
  - auth-utils.js

**Resultado**: APIs principales funcionando y sistema de login completo.

---

### **FASE 3: Paneles de Profesores y Creadores** 👨‍🏫👨‍🎨
**Archivo**: `PROMPT-FASE-3-PROFESORES-CREADORES.md`

**Genera:**
- ✅ Tablas adicionales en DB
  - teacher_classes, class_enrollments, attendance_tracking
  - academic_progress, content_assignments
  - creator_market_analytics, creator_subscriptions, marketing_campaigns
- ✅ Rutas de profesores (PPF)
  - Crear y gestionar clases
  - Inscribir estudiantes
  - Asignar bloques
  - Ver progreso académico
- ✅ Rutas de creadores (PCC)
  - Analytics de mercado
  - Gestión de jugadores
  - Campañas de marketing
- ✅ HTML de paneles
  - jugadores-panel-gaming.html
  - teachers-panel-main.html
  - creators-panel-content.html

**Resultado**: Paneles funcionales para todos los tipos de usuarios.

---

### **FASE 4: Sistema de Soporte y Mensajería** 💬🎫
**Archivo**: `PROMPT-FASE-4-SOPORTE-MENSAJERIA.md`

**Genera:**
- ✅ Tablas de soporte y mensajería
  - tickets, ticket_messages, ticket_participants
  - conversations, direct_messages
  - notifications, user_online_status
- ✅ Triggers y funciones de soporte
  - Asignación automática de tickets
  - Generación de ticket number
  - Escalación automática
- ✅ Rutas de soporte
  - Crear y gestionar tickets
  - Sistema de mensajes en tickets
  - Dashboard de soporte
- ✅ Rutas de mensajería
  - Mensajería directa en tiempo real
  - Adjuntos de archivos
  - Estado online/offline
- ✅ WebSocket handlers
  - Eventos de mensajería
  - Indicador "escribiendo..."
- ✅ HTML de soporte
  - support-dashboard.html
  - ticket-chat.html
  - direct-messaging.html

**Resultado**: Sistema completo de soporte y chat en tiempo real.

---

### **FASE 5: Frontend de Juegos e Instrucciones de Despliegue** 🎮📦
**Archivo**: `PROMPT-FASE-5-JUEGOS-DESPLIEGUE.md`

**Genera:**
- ✅ HTML de las 9 modalidades de juego
  - game-classic.html
  - game-time-trial.html
  - game-lives.html
  - game-streak.html
  - game-marathon.html
  - game-duel.html
  - game-trivial.html
  - game-exam.html
  - game-by-levels.html
- ✅ Componentes JavaScript de juegos
  - Lógica de cada modalidad
  - Contador de tiempo
  - Sistema de vidas
  - Sistema de rachas
- ✅ Archivos de configuración de despliegue
  - render.yaml
- ✅ Scripts de utilidad
  - health-check.js
  - seed-data.js
- ✅ **INSTRUCCIONES DETALLADAS** para:
  - **PostgreSQL/pgAdmin4**: Crear y configurar base de datos local
  - **Aiven**: Configurar base de datos en la nube
  - **GitHub**: Crear repositorio y configurar ramas
  - **Render**: Desplegar backend y frontend
  - **Enlace de componentes**: Conectar todos los servicios

**Resultado**: Proyecto completo con juegos funcionales y listo para desplegar.

---

## 🔄 CÓMO USAR ESTAS FASES

### Paso 1: Ejecutar Fase 1
1. Abre el archivo `PROMPT-FASE-1-BASE-DATOS-BACKEND.md`
2. Copia TODO el contenido
3. Pégalo en tu modelo de IA (Google AI Studio, Claude, GPT-4, etc.)
4. La IA generará TODOS los archivos de la Fase 1
5. Guarda todos los archivos generados en tu proyecto

### Paso 2: Ejecutar Fase 2
1. Abre el archivo `PROMPT-FASE-2-ROLES-APIS.md`
2. Copia TODO el contenido
3. Pégalo en tu modelo de IA
4. La IA generará TODOS los archivos de la Fase 2
5. Guarda todos los archivos (algunos actualizarán archivos de Fase 1)

### Paso 3: Ejecutar Fase 3
(Repetir el mismo proceso con `PROMPT-FASE-3-PROFESORES-CREADORES.md`)

### Paso 4: Ejecutar Fase 4
(Repetir el mismo proceso con `PROMPT-FASE-4-SOPORTE-MENSAJERIA.md`)

### Paso 5: Ejecutar Fase 5
(Repetir el mismo proceso con `PROMPT-FASE-5-JUEGOS-DESPLIEGUE.md`)

---

## ⚠️ NOTAS IMPORTANTES

### Durante la Generación:
1. **Ejecuta las fases EN ORDEN** (1 → 2 → 3 → 4 → 5)
2. **No saltes fases**: Cada fase depende de las anteriores
3. **Guarda TODOS los archivos**: Algunos se crean nuevos, otros se actualizan
4. **Lee los checklists**: Cada fase tiene un checklist de archivos al final

### Archivos que se Actualizan:
- `database-schema.sql`: Se añaden tablas en Fases 3 y 4
- `playtest-backend/server.js`: Se añaden rutas en Fases 2, 3 y 4

### Estructura Final del Proyecto:
```
PLAYTEST-AISTUDIO/
├── playtest-backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── database/
│   │   └── connection.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── blocks.js
│   │   ├── questions.js
│   │   ├── games.js
│   │   ├── luminarias.js
│   │   ├── roles.js
│   │   ├── teachers.js
│   │   ├── creators-panel.js
│   │   ├── support.js
│   │   └── messages.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roles.js
│   ├── websocket/
│   │   ├── messaging.js
│   │   └── games.js
│   ├── cron/
│   │   └── ticket-escalation.js
│   └── scripts/
│       ├── migrate.js
│       ├── health-check.js
│       └── seed-data.js
│
├── database-schema.sql
├── render.yaml
├── .gitignore
├── README.md
│
├── index.html
├── api-data-service.js
├── auth-utils.js
├── jugadores-panel-gaming.html
├── teachers-panel-main.html
├── creators-panel-content.html
├── admin-principal-panel.html
├── support-dashboard.html
├── ticket-chat.html
├── direct-messaging.html
├── game-classic.html
├── game-time-trial.html
├── game-lives.html
├── game-streak.html
├── game-marathon.html
├── game-duel.html
├── game-trivial.html
├── game-exam.html
└── game-by-levels.html
```

---

## 🎉 RESULTADO FINAL

Después de completar las 5 fases, tendrás:

✅ **Base de datos completa** (27 tablas, 51 índices, 26 triggers, 28 funciones)
✅ **Backend funcional** (Node.js/Express con 27+ rutas API)
✅ **Sistema de autenticación** (JWT + Bcrypt)
✅ **5 tipos de roles** con asignación automática
✅ **Sistema de luminarias** (moneda virtual)
✅ **9 modalidades de juego** completamente funcionales
✅ **Paneles especializados** (Jugadores, Profesores, Creadores, Admin)
✅ **Sistema de soporte** con tickets y escalación automática
✅ **Mensajería en tiempo real** (WebSocket)
✅ **Instrucciones completas de despliegue** (Aiven, GitHub, Render)

---

## 🚀 EMPEZAR AHORA

**Siguiente paso**: Abre el archivo `PROMPT-FASE-1-BASE-DATOS-BACKEND.md` y comienza la generación.

¡Buena suerte con la generación de PLAYTEST! 🎮✨
