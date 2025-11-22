# PROMPT PARA GENERAR EL PROYECTO PLAYTEST COMPLETO DESDE CERO

## INSTRUCCIONES PARA LA IA GENERADORA

Tu tarea es generar **TODOS los archivos** necesarios para recrear el proyecto **PLAYTEST/LUMIQUIZ** desde cero, una plataforma educativa gamificada de aprendizaje mediante quizzes.

**IMPORTANTE**: Además de generar todos los archivos, debes proporcionar al final:
1. **Instrucciones para pgAdmin4/PostgreSQL**: Cómo crear y configurar la base de datos
2. **Instrucciones para Aiven**: Cómo configurar la base de datos en la nube
3. **Instrucciones para GitHub**: Cómo crear el repositorio y configurar las ramas
4. **Instrucciones para Render**: Cómo desplegar backend y frontend
5. **Instrucciones de enlace**: Cómo conectar todos los servicios entre sí

---

# ESPECIFICACIÓN COMPLETA DEL PROYECTO PLAYTEST

## 1. DESCRIPCIÓN GENERAL DEL SISTEMA

**PLAYTEST (también conocido como LUMIQUIZ)** es una plataforma educativa que combina:
- Sistema de quizzes gamificado con 9 modalidades de juego
- Gestión académica completa para profesores y estudiantes
- Marketplace de contenido educativo con monetización
- Sistema de tickets y soporte técnico
- Mensajería en tiempo real (WebSocket)
- Economía virtual con moneda "Luminarias"
- Integraciones con LMS (Canvas, Moodle, Google Classroom)
- Sistema de roles jerárquico no excluyente
- Analytics e IA pedagógica

---

## 2. ARQUITECTURA TÉCNICA

### 2.1 Stack Tecnológico

**Frontend:**
- HTML5 + CSS3 (Tailwind CSS vía CDN)
- JavaScript ES6+ Vanilla
- React 18 (solo vía CDN para componentes específicos)
- Babel Standalone (transpilación en navegador)
- Socket.IO Client
- Import Maps para módulos ES6

**Backend:**
- Node.js 18.x
- Express.js 4.18.2
- PostgreSQL 12+
- Socket.IO 4.8.1 (WebSocket)
- JWT (jsonwebtoken 9.0.2)
- Bcrypt 5.1.1
- Multer 2.0.2
- Node-cron 4.2.1
- Helmet + Compression + CORS

**Base de Datos:**
- PostgreSQL 12+
- 27 tablas principales
- 51 índices optimizados
- 26 triggers automáticos
- 28 funciones PL/pgSQL
- 4 vistas materializadas

**Despliegue:**
- Backend: Render.com (Web Service)
- Base de datos: Aiven (PostgreSQL cloud)
- Frontend: Render.com (Static Site o Web Service)
- Repositorio: GitHub

### 2.2 Estructura del Proyecto

```
PLAYTEST-AISTUDIO/
│
├── playtest-backend/                 # Backend Node.js/Express
│   ├── server.js                     # Punto de entrada principal
│   ├── package.json                  # Dependencias npm
│   ├── .env.example                  # Variables de entorno ejemplo
│   │
│   ├── database/
│   │   ├── connection.js             # Pool de conexión PostgreSQL
│   │   └── ca.pem                    # Certificado SSL Aiven (opcional)
│   │
│   ├── routes/                       # 27 archivos de rutas API
│   │   ├── auth.js                   # Autenticación (login, registro)
│   │   ├── users.js                  # Gestión usuarios
│   │   ├── blocks.js                 # Bloques de preguntas
│   │   ├── questions.js              # Preguntas y respuestas
│   │   ├── games.js                  # Partidas y juegos
│   │   ├── luminarias.js             # Sistema de moneda virtual
│   │   ├── roles.js                  # Gestión de roles
│   │   ├── teachers.js               # Panel de profesores (PPF)
│   │   ├── creators-panel.js         # Panel de creadores (PCC)
│   │   ├── support.js                # Sistema de tickets
│   │   ├── messages.js               # Mensajería directa
│   │   ├── integrations.js           # Integraciones LMS
│   │   └── ...                       # Más rutas especializadas
│   │
│   ├── middleware/
│   │   ├── auth.js                   # Verificación JWT
│   │   ├── roles.js                  # Verificación de roles
│   │   └── upload.js                 # Configuración Multer
│   │
│   ├── websocket/
│   │   ├── messaging.js              # Eventos de mensajería
│   │   └── games.js                  # Eventos de juegos en tiempo real
│   │
│   ├── cron/
│   │   ├── ticket-escalation.js      # Escalación automática tickets
│   │   ├── intervention-detection.js # Detección de estudiantes en riesgo
│   │   └── market-analytics.js       # Cálculo de métricas de mercado
│   │
│   ├── scripts/                      # Utilidades y herramientas
│   │   ├── migrate.js                # Aplicar migraciones
│   │   ├── list-users.js             # Listar usuarios
│   │   ├── delete-user.js            # Eliminar usuario
│   │   └── reset-password.js         # Resetear contraseña
│   │
│   └── migrations/                   # Migraciones SQL (opcional)
│
├── database-schema.sql               # Schema completo de base de datos
│
├── *.html                            # 65+ archivos HTML (frontend)
│   ├── index.html                    # Landing/Login
│   ├── jugadores-panel-gaming.html   # Panel jugadores
│   ├── teachers-panel-main.html      # Panel profesores
│   ├── creators-panel-content.html   # Panel creadores
│   ├── admin-principal-panel.html    # Panel admin principal
│   ├── admin-secundario-panel.html   # Panel admin secundario
│   │
│   ├── game-*.html                   # 9 modalidades de juego
│   │   ├── game-classic.html
│   │   ├── game-time-trial.html
│   │   ├── game-lives.html
│   │   ├── game-streak.html
│   │   ├── game-marathon.html
│   │   ├── game-duel.html
│   │   ├── game-trivial.html
│   │   ├── game-exam.html
│   │   └── game-by-levels.html
│   │
│   ├── block-*.html                  # Gestión de bloques
│   ├── support-*.html                # Sistema de soporte
│   ├── teachers-panel-*.html         # Vistas de profesores
│   ├── creators-panel-*.html         # Vistas de creadores
│   ├── luminarias-*.html             # Sistema de luminarias
│   └── ...
│
├── *.js                              # 35+ componentes JavaScript
│   ├── api-data-service.js           # Cliente API universal
│   ├── auth-utils.js                 # Utilidades autenticación
│   ├── header-loader.js              # Componente header
│   ├── navigation-service.js         # Navegación
│   ├── role-validation.js            # Validación de roles
│   └── ...
│
├── package.json                      # Dependencias frontend (si aplica)
├── render.yaml                       # Configuración Render
├── .gitignore                        # Archivos ignorados Git
└── README.md                         # Documentación
```

---

## 3. SISTEMA DE ROLES Y PERMISOS

### 3.1 Roles (No Excluyentes - Jerárquicos)

El sistema permite que un usuario tenga **múltiples roles simultáneamente**. La asignación es automática según acciones:

#### **Nivel 1: Administrador Principal** (`administrador_principal`)
- **Asignación automática**: Al registrarse con nickname exacto `AdminPrincipal`
- **Único en el sistema**: Solo puede existir uno
- **Permisos**:
  - Gestión completa de administradores secundarios
  - Visualización de TODAS las luminarias del sistema
  - Asignación y reasignación de usuarios entre admins
  - Configuración modular (feature flags)
  - Escalado final de tickets sin resolver
  - Acceso a todos los paneles

**Tabla en BD**:
```sql
roles (id: 1, name: 'administrador_principal', hierarchy_level: 1)
```

#### **Nivel 2: Administrador Secundario** (`administrador_secundario`)
- **Asignación manual**: Por el Administrador Principal
- **Permisos**:
  - Gestión de usuarios asignados (profesores y jugadores)
  - Vista de información académica
  - SIN acceso a luminarias
  - SIN capacidad de reasignación
  - Vista filtrada solo de sus usuarios asignados

**Relación**:
```sql
admin_assignments (
  admin_id INT REFERENCES users(id),
  assigned_user_id INT REFERENCES users(id)
)
```

#### **Nivel 3: Profesor de Centro Físico (PPF)** (`profesor_centro_fisico`)
- **Asignación manual o por LMS**
- **Contexto**: Ambiente académico formal
- **Funcionalidades**:
  - Crear clases con códigos únicos
  - Inscripción de alumnos
  - Registro de asistencia y engagement
  - Cronogramas académicos
  - Asignaciones obligatorias
  - Intervenciones pedagógicas
  - Analytics académicos
  - Integración LMS

**Panel principal**: `teachers-panel-main.html`

**Tablas clave**:
```sql
teacher_classes (id, teacher_id, class_name, class_code, academic_year)
class_enrollments (class_id, student_id, enrollment_status)
attendance_tracking (class_id, student_id, attendance_date, status, engagement_score)
academic_progress (student_id, class_id, block_id, score, percentage)
```

#### **Nivel 3: Profesor Creador de Contenido (PCC)** (`profesor_creador`)
- **Asignación automática**: Al crear primer bloque público
- **Contexto**: Marketplace/Monetización
- **Funcionalidades**:
  - Creación y monetización de bloques
  - Analytics de mercado
  - Gestión de jugadores (no alumnos)
  - Campañas de marketing
  - Suscripciones y productos digitales
  - Torneos virales
  - Pricing dinámico

**Panel principal**: `creators-panel-content.html`

**Trigger de asignación**:
```sql
CREATE OR REPLACE FUNCTION auto_assign_profesor_creador()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = TRUE THEN
    INSERT INTO user_roles (user_id, role_id, auto_assigned)
    SELECT NEW.creator_id, r.id, TRUE
    FROM roles r
    WHERE r.name = 'profesor_creador'
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = NEW.creator_id
      AND ur.role_id = r.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_profesor_creador
AFTER INSERT OR UPDATE ON blocks
FOR EACH ROW EXECUTE FUNCTION auto_assign_profesor_creador();
```

#### **Nivel 4: Usuario/Jugador** (`usuario`)
- **Asignación automática**: Al cargar primer bloque ajeno
- **Funcionalidades**:
  - Acceso a 9 modalidades de juego
  - Carga de bloques del marketplace
  - Sistema de luminarias
  - Torneos y retos
  - Niveles y badges
  - Mensajería
  - Perfil académico (si está en clases)

**Panel principal**: `jugadores-panel-gaming.html`

**Trigger de asignación**:
```sql
CREATE OR REPLACE FUNCTION auto_assign_usuario_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el bloque no es del usuario (bloque ajeno)
  IF NEW.loaded_blocks IS NOT NULL
     AND jsonb_array_length(NEW.loaded_blocks) > 0 THEN

    INSERT INTO user_roles (user_id, role_id, auto_assigned)
    SELECT NEW.user_id, r.id, TRUE
    FROM roles r
    WHERE r.name = 'usuario'
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = NEW.user_id
      AND ur.role_id = r.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_usuario
AFTER UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION auto_assign_usuario_role();
```

#### **Nivel 5: Servicio Técnico** (`servicio_tecnico`)
- **Asignación manual**
- **Permisos**:
  - Recibir y gestionar tickets globales
  - Dashboard de soporte técnico
  - Base de conocimiento
  - NO gestiona tickets de bloques específicos

**Panel**: `support-dashboard.html`

### 3.2 Matriz de Permisos Detallada

| Funcionalidad | Admin Principal | Admin Secundario | PPF | PCC | Usuario | Servicio Técnico |
|---------------|-----------------|------------------|-----|-----|---------|------------------|
| Ver luminarias sistema | ✅ Todas | ❌ | ✅ Propias | ✅ Propias | ✅ Propias | ❌ |
| Reasignar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Crear bloques | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gestionar clases | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Marketplace | ✅ Ver | ✅ Ver | ❌ | ✅ Vender | ✅ Comprar | ❌ |
| Tickets globales | ✅ Escalar | ✅ Escalar | ❌ | ❌ | ✅ Crear | ✅ Gestionar |
| Tickets bloques | ✅ Ver | ❌ | ❌ | ✅ Gestionar | ✅ Crear | ❌ |
| Feature flags | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Analytics académicos | ✅ | ✅ Limitado | ✅ | ❌ | ❌ | ❌ |
| Analytics mercado | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Integraciones LMS | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 4. BASE DE DATOS - SCHEMA COMPLETO

### 4.1 Tablas Principales (27 tablas)

#### **4.1.1 Usuarios y Autenticación**

```sql
-- Tabla principal de usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);

-- Perfiles extendidos
CREATE TABLE user_profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answer_history JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  loaded_blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles del sistema
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  hierarchy_level INT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar roles básicos
INSERT INTO roles (name, description, hierarchy_level, permissions) VALUES
('administrador_principal', 'Administrador principal único del sistema', 1, '{"all": true}'::jsonb),
('administrador_secundario', 'Administrador secundario con usuarios asignados', 2, '{"manage_assigned_users": true}'::jsonb),
('profesor_centro_fisico', 'Profesor en ambiente académico formal', 3, '{"manage_classes": true, "manage_students": true}'::jsonb),
('profesor_creador', 'Creador de contenido en marketplace', 3, '{"monetize": true, "analytics": true}'::jsonb),
('usuario', 'Usuario/jugador básico', 4, '{"play_games": true, "load_blocks": true}'::jsonb),
('servicio_tecnico', 'Soporte técnico global', 5, '{"manage_global_tickets": true}'::jsonb);

-- Relación usuarios-roles (muchos a muchos)
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INT REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  auto_assigned BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- Asignaciones de admin secundario
CREATE TABLE admin_assignments (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES users(id) ON DELETE CASCADE,
  assigned_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assigned_user_id)
);

CREATE INDEX idx_admin_assignments_admin ON admin_assignments(admin_id);
CREATE INDEX idx_admin_assignments_user ON admin_assignments(assigned_user_id);

-- Sesiones de usuario
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

#### **4.1.2 Sistema de Luminarias (Moneda Virtual)**

```sql
-- Balance de luminarias por usuario
CREATE TABLE user_luminarias (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  actuales INT DEFAULT 0 CHECK (actuales >= 0),
  ganadas INT DEFAULT 0 CHECK (ganadas >= 0),
  gastadas INT DEFAULT 0 CHECK (gastadas >= 0),
  abonadas INT DEFAULT 0 CHECK (abonadas >= 0),
  compradas INT DEFAULT 0 CHECK (compradas >= 0),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_luminarias_balance ON user_luminarias(actuales DESC);

-- Transacciones de luminarias (historial completo)
CREATE TABLE luminarias_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- earn, spend, transfer_in, transfer_out, conversion
  amount INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  user_role VARCHAR(100),
  category VARCHAR(100), -- gaming, monetization, admin, store, etc.
  subcategory VARCHAR(100),
  action_type VARCHAR(100),
  description TEXT,
  reference_id INT,
  reference_type VARCHAR(50), -- game, ticket, purchase, etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_luminarias_trans_user ON luminarias_transactions(user_id);
CREATE INDEX idx_luminarias_trans_type ON luminarias_transactions(transaction_type);
CREATE INDEX idx_luminarias_trans_date ON luminarias_transactions(created_at DESC);
CREATE INDEX idx_luminarias_trans_ref ON luminarias_transactions(reference_type, reference_id);

-- Tasas de conversión (luminarias ↔ dinero real)
CREATE TABLE luminarias_conversion_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(10), -- 'LUM' o 'USD'
  to_currency VARCHAR(10),
  rate DECIMAL(10, 6) NOT NULL,
  volume_min INT DEFAULT 0,
  volume_max INT,
  bonus_percentage DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasas por defecto
INSERT INTO luminarias_conversion_rates (from_currency, to_currency, rate, volume_min, bonus_percentage) VALUES
('LUM', 'USD', 0.001, 0, 0),      -- 1000 LUM = $1
('LUM', 'USD', 0.0012, 50000, 20), -- Bonus 20% a partir de 50k
('LUM', 'USD', 0.0015, 100000, 50), -- Bonus 50% a partir de 100k
('USD', 'LUM', 1200, 0, 20),       -- $1 = 1200 LUM (20% bonus)
('USD', 'LUM', 1300, 5, 30),       -- $5+ = 1300 LUM/$ (30% bonus)
('USD', 'LUM', 1400, 10, 40);      -- $10+ = 1400 LUM/$ (40% bonus)
```

#### **4.1.3 Bloques y Preguntas**

```sql
-- Bloques de preguntas
CREATE TABLE blocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  difficulty INT CHECK (difficulty BETWEEN 1 AND 10),
  category VARCHAR(100),
  tags TEXT[],
  price_luminarias INT DEFAULT 0,
  times_loaded INT DEFAULT 0,
  average_score DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blocks_creator ON blocks(creator_id);
CREATE INDEX idx_blocks_public ON blocks(is_public);
CREATE INDEX idx_blocks_category ON blocks(category);
CREATE INDEX idx_blocks_difficulty ON blocks(difficulty);

-- Preguntas
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  block_id INT REFERENCES blocks(id) ON DELETE CASCADE,
  text_question TEXT NOT NULL,
  topic VARCHAR(255),
  difficulty INT CHECK (difficulty BETWEEN 1 AND 10),
  explanation TEXT,
  image_url TEXT,
  time_limit INT, -- segundos
  points INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_block ON questions(block_id);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Respuestas
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_correct ON answers(is_correct);

-- Bloques cargados por usuarios
CREATE TABLE user_loaded_blocks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  block_id INT REFERENCES blocks(id) ON DELETE CASCADE,
  loaded_at TIMESTAMP DEFAULT NOW(),
  last_played_at TIMESTAMP,
  times_played INT DEFAULT 0,
  best_score INT DEFAULT 0,
  UNIQUE(user_id, block_id)
);

CREATE INDEX idx_loaded_blocks_user ON user_loaded_blocks(user_id);
CREATE INDEX idx_loaded_blocks_block ON user_loaded_blocks(block_id);
```

#### **4.1.4 Sistema de Juegos**

```sql
-- Partidas de juego
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL, -- classic, time_trial, lives, streak, marathon, duel, trivial, exam, by_levels
  block_id INT REFERENCES blocks(id),
  created_by INT REFERENCES users(id) ON DELETE CASCADE,
  game_state JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INT
);

CREATE INDEX idx_games_type ON games(game_type);
CREATE INDEX idx_games_creator ON games(created_by);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_started ON games(started_at DESC);

-- Jugadores en partidas (para multijugador)
CREATE TABLE game_players (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  player_index INT,
  nickname VARCHAR(100),
  score INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);

-- Puntuaciones
CREATE TABLE game_scores (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  correct_answers INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  accuracy DECIMAL(5, 2),
  time_spent INT, -- segundos
  difficulty_average DECIMAL(5, 2),
  score_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_game_scores_user ON game_scores(user_id);
CREATE INDEX idx_game_scores_type ON game_scores(game_type);
CREATE INDEX idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX idx_game_scores_date ON game_scores(created_at DESC);
```

#### **4.1.5 Sistema de Profesores (PPF - Ambiente Académico)**

```sql
-- Clases académicas
CREATE TABLE teacher_classes (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  class_name VARCHAR(255) NOT NULL,
  class_code VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(100),
  academic_year VARCHAR(20),
  grade_level VARCHAR(50),
  description TEXT,
  max_students INT DEFAULT 30,
  schedule JSONB, -- horarios de la clase
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX idx_teacher_classes_code ON teacher_classes(class_code);
CREATE INDEX idx_teacher_classes_status ON teacher_classes(status);

-- Inscripciones de estudiantes en clases
CREATE TABLE class_enrollments (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  enrollment_status VARCHAR(50) DEFAULT 'active', -- active, inactive, withdrawn
  enrolled_at TIMESTAMP DEFAULT NOW(),
  withdrawn_at TIMESTAMP,
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_status ON class_enrollments(enrollment_status);

-- Registro de asistencia
CREATE TABLE attendance_tracking (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL, -- present, absent, tardy, excused
  engagement_score INT CHECK (engagement_score BETWEEN 1 AND 10),
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, student_id, attendance_date)
);

CREATE INDEX idx_attendance_class ON attendance_tracking(class_id);
CREATE INDEX idx_attendance_student ON attendance_tracking(student_id);
CREATE INDEX idx_attendance_date ON attendance_tracking(attendance_date DESC);

-- Progreso académico
CREATE TABLE academic_progress (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  block_id INT REFERENCES blocks(id) ON DELETE CASCADE,
  date_started TIMESTAMP,
  date_completed TIMESTAMP,
  score INT,
  percentage DECIMAL(5, 2),
  attempts INT DEFAULT 1,
  time_spent_minutes INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_academic_progress_student ON academic_progress(student_id);
CREATE INDEX idx_academic_progress_class ON academic_progress(class_id);
CREATE INDEX idx_academic_progress_block ON academic_progress(block_id);

-- Perfiles académicos de estudiantes
CREATE TABLE student_academic_profiles (
  student_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  learning_style VARCHAR(100),
  accommodations TEXT[],
  strengths TEXT[],
  areas_improvement TEXT[],
  goals TEXT,
  parent_contact JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Intervenciones pedagógicas
CREATE TABLE pedagogical_interventions (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  intervention_name VARCHAR(255),
  intervention_type VARCHAR(100), -- remedial, enrichment, behavioral
  urgency_level VARCHAR(50), -- critical, high, medium, low
  identified_issues JSONB,
  intervention_strategy JSONB,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  effectiveness_score INT CHECK (effectiveness_score BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interventions_student ON pedagogical_interventions(student_id);
CREATE INDEX idx_interventions_teacher ON pedagogical_interventions(teacher_id);
CREATE INDEX idx_interventions_urgency ON pedagogical_interventions(urgency_level);
CREATE INDEX idx_interventions_status ON pedagogical_interventions(status);

-- Evaluaciones/exámenes
CREATE TABLE teacher_assessments (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  block_id INT REFERENCES blocks(id),
  assessment_name VARCHAR(255) NOT NULL,
  assessment_type VARCHAR(100), -- quiz, exam, project, homework
  total_points INT NOT NULL,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessments_teacher ON teacher_assessments(teacher_id);
CREATE INDEX idx_assessments_class ON teacher_assessments(class_id);

-- Resultados de evaluaciones
CREATE TABLE assessment_results (
  id SERIAL PRIMARY KEY,
  assessment_id INT REFERENCES teacher_assessments(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  percentage DECIMAL(5, 2),
  submitted_at TIMESTAMP,
  graded_at TIMESTAMP,
  feedback TEXT,
  UNIQUE(assessment_id, student_id)
);

CREATE INDEX idx_assessment_results_assessment ON assessment_results(assessment_id);
CREATE INDEX idx_assessment_results_student ON assessment_results(student_id);

-- Cronogramas académicos
CREATE TABLE academic_schedules (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  block_id INT REFERENCES blocks(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  deadline_date DATE,
  session_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedules_class ON academic_schedules(class_id);
CREATE INDEX idx_schedules_date ON academic_schedules(scheduled_date);

-- Asignaciones de contenido
CREATE TABLE content_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  block_id INT REFERENCES blocks(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  is_mandatory BOOLEAN DEFAULT TRUE,
  instructions TEXT
);

CREATE INDEX idx_content_assignments_class ON content_assignments(class_id);
CREATE INDEX idx_content_assignments_block ON content_assignments(block_id);
```

#### **4.1.6 Sistema de Creadores (PCC - Marketplace)**

```sql
-- Analytics de mercado para creadores
CREATE TABLE creator_market_analytics (
  creator_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  market_rank INT,
  total_blocks INT DEFAULT 0,
  public_blocks INT DEFAULT 0,
  total_players INT DEFAULT 0,
  active_players_30d INT DEFAULT 0,
  revenue_current_month DECIMAL(10, 2) DEFAULT 0,
  revenue_last_month DECIMAL(10, 2) DEFAULT 0,
  revenue_all_time DECIMAL(10, 2) DEFAULT 0,
  avg_block_rating DECIMAL(3, 2),
  market_share_percentage DECIMAL(5, 2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Análisis de competencia
CREATE TABLE competitor_analysis (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  competitor_id INT REFERENCES users(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5, 2),
  market_overlap JSONB,
  pricing_comparison JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(creator_id, competitor_id)
);

CREATE INDEX idx_competitor_analysis_creator ON competitor_analysis(creator_id);

-- Campañas de marketing
CREATE TABLE marketing_campaigns (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(100), -- discount, referral, tournament, bundle
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  budget DECIMAL(10, 2),
  target_audience JSONB,
  discount_percentage INT,
  promo_code VARCHAR(50) UNIQUE,
  impressions INT DEFAULT 0,
  conversions INT DEFAULT 0,
  roi DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_creator ON marketing_campaigns(creator_id);
CREATE INDEX idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_campaigns_dates ON marketing_campaigns(start_date, end_date);

-- Suscripciones de creadores
CREATE TABLE creator_subscriptions (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  plan_name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2),
  price_annual DECIMAL(10, 2),
  features JSONB,
  max_subscribers INT,
  current_subscribers INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_creator ON creator_subscriptions(creator_id);
CREATE INDEX idx_subscriptions_active ON creator_subscriptions(is_active);

-- Compras de suscripciones
CREATE TABLE subscription_purchases (
  id SERIAL PRIMARY KEY,
  subscription_id INT REFERENCES creator_subscriptions(id) ON DELETE CASCADE,
  buyer_id INT REFERENCES users(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP DEFAULT NOW(),
  billing_cycle VARCHAR(20), -- monthly, annual
  amount_paid DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active', -- active, expired, cancelled
  next_billing_date DATE,
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_subscription_purchases_subscription ON subscription_purchases(subscription_id);
CREATE INDEX idx_subscription_purchases_buyer ON subscription_purchases(buyer_id);

-- Productos digitales
CREATE TABLE creator_digital_products (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  product_type VARCHAR(100), -- ebook, course, bundle, certificate
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  file_url TEXT,
  sales_count INT DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_digital_products_creator ON creator_digital_products(creator_id);

-- Servicios premium (tutorías, coaching)
CREATE TABLE creator_premium_services (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  service_type VARCHAR(100), -- tutoring_1on1, group_coaching, consultation
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT,
  max_participants INT DEFAULT 1,
  booking_slots JSONB, -- horarios disponibles
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_premium_services_creator ON creator_premium_services(creator_id);

-- Reservas de servicios
CREATE TABLE service_bookings (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES creator_premium_services(id) ON DELETE CASCADE,
  buyer_id INT REFERENCES users(id) ON DELETE CASCADE,
  booking_date TIMESTAMP NOT NULL,
  participants INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  amount_paid DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_bookings_service ON service_bookings(service_id);
CREATE INDEX idx_service_bookings_buyer ON service_bookings(buyer_id);

-- Pricing dinámico
CREATE TABLE dynamic_pricing (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  block_id INT REFERENCES blocks(id) ON DELETE CASCADE,
  base_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  price_multiplier DECIMAL(5, 2) DEFAULT 1.0,
  demand_factor DECIMAL(5, 2),
  last_adjustment TIMESTAMP DEFAULT NOW(),
  UNIQUE(creator_id, block_id)
);

CREATE INDEX idx_dynamic_pricing_block ON dynamic_pricing(block_id);

-- A/B Testing
CREATE TABLE ab_tests (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  variant_a JSONB NOT NULL, -- configuración variante A
  variant_b JSONB NOT NULL, -- configuración variante B
  impressions_a INT DEFAULT 0,
  impressions_b INT DEFAULT 0,
  conversions_a INT DEFAULT 0,
  conversions_b INT DEFAULT 0,
  conversion_rate_a DECIMAL(5, 2),
  conversion_rate_b DECIMAL(5, 2),
  winner VARCHAR(10), -- 'A', 'B', null
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE INDEX idx_ab_tests_creator ON ab_tests(creator_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);

-- Oportunidades de mercado (IA)
CREATE TABLE market_opportunities (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  opportunity_type VARCHAR(100), -- niche, category, pricing, timing
  title VARCHAR(255),
  description TEXT,
  confidence_score DECIMAL(5, 2), -- 0-1
  potential_revenue DECIMAL(10, 2),
  market_size_estimate INT,
  competition_level VARCHAR(50), -- low, medium, high
  recommended_actions JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_market_opportunities_creator ON market_opportunities(creator_id);
```

#### **4.1.7 Sistema de Soporte y Tickets**

```sql
-- Tickets de soporte
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  origin_type VARCHAR(50) NOT NULL, -- 'global', 'block'
  block_id INT REFERENCES blocks(id),
  category_id INT,
  created_by INT REFERENCES users(id) ON DELETE CASCADE,
  assigned_to INT REFERENCES users(id),
  escalated_to INT REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'abierto', -- abierto, en_progreso, resuelto, cerrado
  priority VARCHAR(50) DEFAULT 'media', -- baja, media, alta, critica
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  escalate_at TIMESTAMP
);

CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_creator ON tickets(created_by);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_origin ON tickets(origin_type, block_id);

-- Mensajes de tickets
CREATE TABLE ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT,
  message_html TEXT,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender ON ticket_messages(sender_id);
CREATE INDEX idx_ticket_messages_created ON ticket_messages(created_at);

-- Participantes en tickets
CREATE TABLE ticket_participants (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50), -- reporter, assignee, cc
  notifications_enabled BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

CREATE INDEX idx_ticket_participants_ticket ON ticket_participants(ticket_id);
CREATE INDEX idx_ticket_participants_user ON ticket_participants(user_id);

-- Categorías de tickets
CREATE TABLE ticket_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  origin_type VARCHAR(50), -- global, block
  description TEXT,
  auto_escalate BOOLEAN DEFAULT FALSE,
  escalate_hours INT DEFAULT 24,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categorías por defecto
INSERT INTO ticket_categories (name, origin_type, auto_escalate) VALUES
('Problema Técnico', 'global', TRUE),
('Pregunta General', 'global', FALSE),
('Error de Contenido', 'block', TRUE),
('Sugerencia', 'block', FALSE),
('Pregunta sobre Bloque', 'block', FALSE);
```

#### **4.1.8 Sistema de Mensajería Directa**

```sql
-- Conversaciones directas
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user1_id INT REFERENCES users(id) ON DELETE CASCADE,
  user2_id INT REFERENCES users(id) ON DELETE CASCADE,
  context_type VARCHAR(50), -- class, block, general
  context_id INT, -- ID de la clase o bloque
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id, context_type, context_id),
  CHECK (user1_id < user2_id) -- Evitar duplicados
);

CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Mensajes directos
CREATE TABLE direct_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INT REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT,
  message_html TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX idx_direct_messages_unread ON direct_messages(read_at) WHERE read_at IS NULL;

-- Adjuntos en mensajes (tabla unificada)
CREATE TABLE message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INT REFERENCES ticket_messages(id) ON DELETE CASCADE,
  direct_message_id INT REFERENCES direct_messages(id) ON DELETE CASCADE,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  uploaded_by INT REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  is_image BOOLEAN DEFAULT FALSE,
  thumbnail_path TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  CHECK (
    (message_id IS NOT NULL AND direct_message_id IS NULL AND ticket_id IS NULL) OR
    (message_id IS NULL AND direct_message_id IS NOT NULL AND ticket_id IS NULL) OR
    (message_id IS NULL AND direct_message_id IS NULL AND ticket_id IS NOT NULL)
  )
);

CREATE INDEX idx_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_attachments_direct ON message_attachments(direct_message_id);
CREATE INDEX idx_attachments_ticket ON message_attachments(ticket_id);

-- Estado "escribiendo..."
CREATE TABLE typing_status (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_status_conversation ON typing_status(conversation_id);
CREATE INDEX idx_typing_status_expires ON typing_status(expires_at);

-- Estado online/offline
CREATE TABLE user_online_status (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT NOW(),
  socket_id TEXT
);

CREATE INDEX idx_online_status_online ON user_online_status(is_online);

-- Configuración de conversaciones por usuario
CREATE TABLE conversation_settings (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  is_muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_settings_conv ON conversation_settings(conversation_id);
CREATE INDEX idx_conversation_settings_user ON conversation_settings(user_id);
```

#### **4.1.9 Sistema de Notificaciones**

```sql
-- Notificaciones
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- ticket, message, assignment, intervention, etc.
  title VARCHAR(255),
  message TEXT,
  action_url TEXT,
  priority VARCHAR(50) DEFAULT 'normal',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

#### **4.1.10 Integraciones LMS**

```sql
-- Configuraciones de integración
CREATE TABLE integration_configurations (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL, -- lms, oauth, api
  provider_name VARCHAR(100) NOT NULL, -- Canvas, Moodle, Google Classroom, etc.
  base_url TEXT,
  api_version VARCHAR(50),
  credentials JSONB, -- encrypted
  field_mappings JSONB,
  sync_settings JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_teacher ON integration_configurations(teacher_id);
CREATE INDEX idx_integrations_provider ON integration_configurations(provider_name);

-- Operaciones de sincronización
CREATE TABLE sync_operations (
  id SERIAL PRIMARY KEY,
  integration_id INT REFERENCES integration_configurations(id) ON DELETE CASCADE,
  operation_type VARCHAR(100), -- import_students, export_grades, sync_classes
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  records_processed INT DEFAULT 0,
  records_created INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  error_log TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_sync_operations_integration ON sync_operations(integration_id);
CREATE INDEX idx_sync_operations_status ON sync_operations(status);
```

#### **4.1.11 Feature Flags (Configuración Modular)**

```sql
-- Características modulares
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  feature_group VARCHAR(100) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  dependencies TEXT[], -- nombres de otras features requeridas
  conflicts_with TEXT[], -- nombres de features conflictivas
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feature_group, feature_name)
);

CREATE INDEX idx_feature_flags_group ON feature_flags(feature_group);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Feature flags por defecto
INSERT INTO feature_flags (feature_group, feature_name, description, is_enabled) VALUES
-- Grupo 1: Competición
('competition', 'duels', 'Modo duelo 1vs1', TRUE),
('competition', 'trivial', 'Modo trivial multijugador', TRUE),
('competition', 'tournaments', 'Sistema de torneos', TRUE),
('competition', 'rankings', 'Rankings y leaderboards', TRUE),
('competition', 'matchmaking', 'Matchmaking automático', TRUE),

-- Grupo 2: Monetización
('monetization', 'plans', 'Planes de suscripción', FALSE),
('monetization', 'marketplace', 'Marketplace de bloques', TRUE),
('monetization', 'luminarias', 'Sistema de luminarias', TRUE),
('monetization', 'subscriptions', 'Suscripciones de creadores', TRUE),
('monetization', 'digital_products', 'Productos digitales', FALSE),

-- Grupo 3: IA
('ai', 'question_generation', 'Generación de preguntas con IA', FALSE),
('ai', 'suggestions', 'Sugerencias de IA', TRUE),
('ai', 'analytics', 'Analytics con IA', TRUE),
('ai', 'auto_categorization', 'Categorización automática', TRUE),
('ai', 'intervention_detection', 'Detección de intervenciones', TRUE),

-- Grupo 4: Herramientas
('tools', 'advanced_analytics', 'Analytics avanzados', TRUE),
('tools', 'bulk_operations', 'Operaciones masivas', TRUE),
('tools', 'export_tools', 'Herramientas de exportación', TRUE),
('tools', 'api_access', 'Acceso API', FALSE),

-- Grupo 5: Sistema Financiero
('financial', 'luminarias_conversion', 'Conversión de luminarias', TRUE),
('financial', 'payment_gateway', 'Pasarela de pagos', TRUE),
('financial', 'invoicing', 'Sistema de facturación', FALSE),
('financial', 'tax_management', 'Gestión de impuestos', FALSE),

-- Grupo 6: Integraciones
('integrations', 'lms_canvas', 'Canvas LMS', TRUE),
('integrations', 'lms_moodle', 'Moodle', TRUE),
('integrations', 'lms_blackboard', 'Blackboard', FALSE),
('integrations', 'google_classroom', 'Google Classroom', TRUE),
('integrations', 'social_login', 'Login con redes sociales', TRUE),

-- Grupo 7: Gamificación
('gamification', 'levels', 'Sistema de niveles', TRUE),
('gamification', 'badges', 'Badges y logros', TRUE),
('gamification', 'achievements', 'Logros', TRUE),
('gamification', 'leaderboards', 'Tablas de clasificación', TRUE),
('gamification', 'daily_challenges', 'Desafíos diarios', FALSE),

-- Grupo 8: Analytics
('analytics', 'realtime_metrics', 'Métricas en tiempo real', TRUE),
('analytics', 'predictive_analytics', 'Analytics predictivo', TRUE),
('analytics', 'market_intelligence', 'Inteligencia de mercado', TRUE),
('analytics', 'competitor_tracking', 'Seguimiento de competencia', FALSE),
('analytics', 'custom_dashboards', 'Dashboards personalizados', FALSE),

-- Grupo 9: Experimental
('experimental', 'vr_integration', 'Integración VR', FALSE),
('experimental', 'blockchain_certificates', 'Certificados blockchain', FALSE),
('experimental', 'ai_tutor_chat', 'Chat con tutor IA', FALSE),
('experimental', 'voice_questions', 'Preguntas por voz', FALSE);
```

### 4.2 Triggers Principales

```sql
-- Trigger: Asignar rol Administrador Principal al registrarse con nickname "AdminPrincipal"
CREATE OR REPLACE FUNCTION check_admin_principal_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nickname = 'AdminPrincipal' THEN
    -- Verificar que no exista otro admin principal
    IF EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'administrador_principal'
    ) THEN
      RAISE EXCEPTION 'Ya existe un Administrador Principal en el sistema';
    END IF;

    -- Asignar rol
    INSERT INTO user_roles (user_id, role_id, auto_assigned)
    SELECT NEW.id, r.id, TRUE
    FROM roles r
    WHERE r.name = 'administrador_principal';

    -- Inicializar luminarias
    INSERT INTO user_luminarias (user_id, actuales)
    VALUES (NEW.id, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_admin_principal
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION check_admin_principal_registration();

-- Trigger: Generar número de ticket automáticamente
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  sequence_num TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  sequence_num := LPAD(NEW.id::TEXT, 6, '0');
  NEW.ticket_number := 'SPT-' || year_str || '-' || sequence_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON tickets
FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Trigger: Asignar ticket automáticamente
CREATE OR REPLACE FUNCTION auto_assign_ticket()
RETURNS TRIGGER AS $$
DECLARE
  assignee_id INT;
BEGIN
  IF NEW.origin_type = 'global' THEN
    -- Buscar servicio técnico
    SELECT u.id INTO assignee_id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'servicio_tecnico'
    LIMIT 1;

    -- Si no hay servicio técnico, asignar a admin principal
    IF assignee_id IS NULL THEN
      SELECT u.id INTO assignee_id
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'administrador_principal'
      LIMIT 1;
    END IF;

  ELSIF NEW.origin_type = 'block' AND NEW.block_id IS NOT NULL THEN
    -- Asignar al creador del bloque
    SELECT creator_id INTO assignee_id
    FROM blocks
    WHERE id = NEW.block_id;
  END IF;

  NEW.assigned_to := assignee_id;

  -- Crear participantes
  IF assignee_id IS NOT NULL THEN
    INSERT INTO ticket_participants (ticket_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'reporter'),
           (NEW.id, assignee_id, 'assignee')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_ticket
BEFORE INSERT ON tickets
FOR EACH ROW EXECUTE FUNCTION auto_assign_ticket();

-- Trigger: Actualizar timestamp de conversación
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON direct_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Trigger: Generar código de clase único
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    LOOP
      -- Generar código alfanumérico único (ejemplo: MATH2024-A)
      new_code := UPPER(SUBSTRING(NEW.subject FROM 1 FOR 4)) ||
                  TO_CHAR(NOW(), 'YYYY') || '-' ||
                  CHR(65 + FLOOR(RANDOM() * 26)::INT);

      -- Verificar si existe
      SELECT EXISTS (
        SELECT 1 FROM teacher_classes WHERE class_code = new_code
      ) INTO code_exists;

      EXIT WHEN NOT code_exists;
    END LOOP;

    NEW.class_code := new_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_class_code
BEFORE INSERT ON teacher_classes
FOR EACH ROW EXECUTE FUNCTION generate_class_code();
```

### 4.3 Funciones Principales

```sql
-- Función: Obtener balance de luminarias
CREATE OR REPLACE FUNCTION get_user_luminarias_balance(p_user_id INT)
RETURNS INT AS $$
DECLARE
  balance INT;
BEGIN
  SELECT COALESCE(actuales, 0) INTO balance
  FROM user_luminarias
  WHERE user_id = p_user_id;

  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Función: Procesar transacción de luminarias
CREATE OR REPLACE FUNCTION process_luminarias_transaction(
  p_user_id INT,
  p_transaction_type VARCHAR,
  p_amount INT,
  p_user_role VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_subcategory VARCHAR DEFAULT NULL,
  p_action_type VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_reference_id INT DEFAULT NULL,
  p_reference_type VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INT AS $$
DECLARE
  current_balance INT;
  new_balance INT;
  transaction_id INT;
BEGIN
  -- Obtener balance actual
  SELECT COALESCE(actuales, 0) INTO current_balance
  FROM user_luminarias
  WHERE user_id = p_user_id;

  -- Calcular nuevo balance
  IF p_transaction_type IN ('earn', 'transfer_in') THEN
    new_balance := current_balance + p_amount;
  ELSIF p_transaction_type IN ('spend', 'transfer_out') THEN
    new_balance := current_balance - p_amount;
    IF new_balance < 0 THEN
      RAISE EXCEPTION 'Balance insuficiente';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tipo de transacción inválido';
  END IF;

  -- Insertar transacción
  INSERT INTO luminarias_transactions (
    user_id, transaction_type, amount, balance_before, balance_after,
    user_role, category, subcategory, action_type, description,
    reference_id, reference_type, metadata
  ) VALUES (
    p_user_id, p_transaction_type, p_amount, current_balance, new_balance,
    p_user_role, p_category, p_subcategory, p_action_type, p_description,
    p_reference_id, p_reference_type, p_metadata
  ) RETURNING id INTO transaction_id;

  -- Actualizar balance
  INSERT INTO user_luminarias (user_id, actuales, ganadas, gastadas, abonadas, compradas)
  VALUES (
    p_user_id,
    new_balance,
    CASE WHEN p_transaction_type = 'earn' THEN p_amount ELSE 0 END,
    CASE WHEN p_transaction_type = 'spend' THEN p_amount ELSE 0 END,
    0,
    0
  )
  ON CONFLICT (user_id) DO UPDATE SET
    actuales = new_balance,
    ganadas = CASE
      WHEN p_transaction_type = 'earn'
      THEN user_luminarias.ganadas + p_amount
      ELSE user_luminarias.ganadas
    END,
    gastadas = CASE
      WHEN p_transaction_type = 'spend'
      THEN user_luminarias.gastadas + p_amount
      ELSE user_luminarias.gastadas
    END,
    updated_at = NOW();

  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Calcular métricas de progreso académico
CREATE OR REPLACE FUNCTION calculate_student_progress_metrics(
  p_student_id INT,
  p_class_id INT
)
RETURNS JSONB AS $$
DECLARE
  attendance_rate DECIMAL;
  average_score DECIMAL;
  completion_rate DECIMAL;
  avg_engagement DECIMAL;
  result JSONB;
BEGIN
  -- Tasa de asistencia (últimos 30 días)
  SELECT
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'present')::DECIMAL /
       NULLIF(COUNT(*), 0)) * 100,
      2
    )
  INTO attendance_rate
  FROM attendance_tracking
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND attendance_date >= CURRENT_DATE - INTERVAL '30 days';

  -- Promedio de calificaciones
  SELECT ROUND(AVG(percentage), 2)
  INTO average_score
  FROM academic_progress
  WHERE student_id = p_student_id
    AND class_id = p_class_id;

  -- Tasa de completación
  SELECT
    ROUND(
      (COUNT(*) FILTER (WHERE date_completed IS NOT NULL)::DECIMAL /
       NULLIF(COUNT(*), 0)) * 100,
      2
    )
  INTO completion_rate
  FROM academic_progress
  WHERE student_id = p_student_id
    AND class_id = p_class_id;

  -- Engagement promedio
  SELECT ROUND(AVG(engagement_score), 2)
  INTO avg_engagement
  FROM attendance_tracking
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND engagement_score IS NOT NULL;

  result := jsonb_build_object(
    'attendance_rate', COALESCE(attendance_rate, 0),
    'average_score', COALESCE(average_score, 0),
    'completion_rate', COALESCE(completion_rate, 0),
    'engagement_score', COALESCE(avg_engagement, 0)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. BACKEND - NODE.JS/EXPRESS

### 5.1 Estructura de Archivos Backend

```
playtest-backend/
├── server.js                    # Punto de entrada
├── package.json                 # Dependencias
├── .env.example                 # Template variables entorno
│
├── database/
│   └── connection.js            # Pool PostgreSQL
│
├── routes/                      # 27 archivos de rutas
│   ├── auth.js
│   ├── users.js
│   ├── blocks.js
│   ├── questions.js
│   ├── games.js
│   ├── luminarias.js
│   ├── roles.js
│   ├── teachers.js
│   ├── creators-panel.js
│   ├── support.js
│   ├── messages.js
│   ├── integrations.js
│   └── ...
│
├── middleware/
│   ├── auth.js                  # Verificación JWT
│   ├── roles.js                 # Verificación roles
│   └── upload.js                # Multer config
│
├── websocket/
│   ├── messaging.js             # Eventos mensajería
│   └── games.js                 # Eventos juegos
│
├── cron/
│   ├── ticket-escalation.js     # Escalación tickets
│   ├── intervention-detection.js
│   └── market-analytics.js
│
└── scripts/
    ├── migrate.js
    ├── list-users.js
    ├── delete-user.js
    └── reset-password.js
```

### 5.2 package.json

```json
{
  "name": "playtest-backend",
  "version": "1.0.0",
  "description": "Backend API for PlayTest application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.0.2",
    "node-cron": "^4.2.1",
    "pg": "^8.11.3",
    "socket.io": "^4.8.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 5.3 server.js (Estructura Principal)

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Trust proxy para Render.com
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000
});

const questionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 200
});

app.use('/api', generalLimiter);
app.use('/api/questions', questionLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://playtest-frontend.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Current-Role'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const blockRoutes = require('./routes/blocks');
const questionRoutes = require('./routes/questions');
const gameRoutes = require('./routes/games');
const luminariasRoutes = require('./routes/luminarias');
const rolesRoutes = require('./routes/roles');
const teachersRoutes = require('./routes/teachers');
const creatorsPanelRoutes = require('./routes/creators-panel');
const supportRoutes = require('./routes/support');
const messagesRoutes = require('./routes/messages');
const integrationsRoutes = require('./routes/integrations');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/luminarias', luminariasRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/creators-panel', creatorsPanelRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/integrations', integrationsRoutes);

// WebSocket handlers
require('./websocket/messaging')(io);
require('./websocket/games')(io);

// Cron jobs
cron.schedule('0 * * * *', () => { // Cada hora
  require('./cron/ticket-escalation')();
});

cron.schedule('0 2 * * *', () => { // Diario a las 2 AM
  require('./cron/intervention-detection')();
});

cron.schedule('0 3 * * *', () => { // Diario a las 3 AM
  require('./cron/market-analytics')();
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`⏰ Cron jobs scheduled`);
});
```

### 5.4 database/connection.js

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL no está definida');
  process.exit(1);
}

// Configuración SSL para Aiven
const sslConfig = databaseUrl.includes('sslmode=no-verify') ? {
  rejectUnauthorized: false
} : {
  ca: fs.existsSync(path.join(__dirname, 'ca.pem'))
    ? fs.readFileSync(path.join(__dirname, 'ca.pem'))
    : undefined,
  rejectUnauthorized: true
};

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig,
  max: 20, // Conexiones máximas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.stack);
  } else {
    console.log('✅ Conectado a PostgreSQL');
    release();
  }
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
```

### 5.5 middleware/auth.js

```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
```

### 5.6 middleware/roles.js

```javascript
const db = require('../database/connection');

function requireRole(...roleNames) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const result = await db.query(`
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `, [userId]);

      const userRoles = result.rows.map(row => row.name);

      const hasRequiredRole = roleNames.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({
          error: 'No tienes permisos para esta acción',
          requiredRoles: roleNames,
          userRoles: userRoles
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando roles:', error);
      res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
}

module.exports = { requireRole };
```

### 5.7 .env.example

```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Servidor
NODE_ENV=production
PORT=3000

# Frontend URL (para CORS)
FRONTEND_URL=https://playtest-frontend.onrender.com

# Luminarias
LUMINARIAS_CONVERSION_RATE=0.001
LUMINARIAS_INITIAL_BALANCE=200

# Integraciones (opcional)
CANVAS_API_KEY=
MOODLE_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Pagos (opcional)
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
```

---

## 6. FRONTEND - HTML/JAVASCRIPT

### 6.1 Archivos HTML Principales (65+ archivos)

**index.html** - Landing/Login:
- Formulario de login
- Enlace a registro
- Logo y branding
- Redirección según rol tras login

**jugadores-panel-gaming.html** - Panel de Jugadores:
- Lista de bloques cargados
- 9 botones de modalidades de juego
- Balance de luminarias
- Perfil y estadísticas
- Navegación a otros paneles

**teachers-panel-main.html** - Panel de Profesores (PPF):
- Crear clases
- Ver estudiantes
- Cronogramas
- Asistencia
- Analytics

**creators-panel-content.html** - Panel de Creadores (PCC):
- Crear/editar bloques
- Gestión de preguntas
- Analytics de mercado
- Monetización
- Jugadores

**admin-principal-panel.html** - Panel Admin Principal:
- 4 secciones expandibles:
  1. Administradores secundarios
  2. Profesores/Creadores
  3. Usuarios/Jugadores
  4. Feature flags

**admin-secundario-panel.html** - Panel Admin Secundario:
- Usuarios asignados
- Vista limitada
- Sin luminarias

**Juegos (9 modalidades)**:
- game-classic.html
- game-time-trial.html
- game-lives.html
- game-streak.html
- game-marathon.html
- game-duel.html
- game-trivial.html
- game-exam.html
- game-by-levels.html

**Soporte**:
- support-dashboard.html
- support-form.html
- ticket-chat.html
- tickets-list.html

**Mensajería**:
- direct-messaging.html
- block-messaging.html

### 6.2 Componentes JavaScript Principales

**api-data-service.js** - Cliente API universal:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';

class ApiDataService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

const apiService = new ApiDataService();
```

**auth-utils.js** - Utilidades de autenticación:
```javascript
function isAuthenticated() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/index.html';
  }
}

function getUserFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}
```

**header-loader.js** - Componente de header universal:
```javascript
async function loadHeader() {
  const user = getUserFromToken();
  if (!user) return;

  const headerHTML = `
    <header class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold">PLAYTEST</h1>
          <span class="text-sm opacity-80">${user.nickname}</span>
        </div>

        <nav class="flex items-center space-x-6">
          <a href="/jugadores-panel-gaming.html" class="hover:underline">Juegos</a>
          ${user.roles.includes('profesor_centro_fisico') ?
            '<a href="/teachers-panel-main.html" class="hover:underline">Clases</a>' : ''}
          ${user.roles.includes('profesor_creador') ?
            '<a href="/creators-panel-content.html" class="hover:underline">Creador</a>' : ''}
          ${user.roles.includes('administrador_principal') || user.roles.includes('administrador_secundario') ?
            '<a href="/admin-principal-panel.html" class="hover:underline">Admin</a>' : ''}

          <div class="flex items-center space-x-2">
            <span class="text-yellow-300">💎</span>
            <span id="luminarias-balance">...</span>
          </div>

          <button onclick="logout()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
            Salir
          </button>
        </nav>
      </div>
    </header>
  `;

  document.body.insertAdjacentHTML('afterbegin', headerHTML);

  // Cargar balance de luminarias
  try {
    const data = await apiService.get('/luminarias/balance');
    document.getElementById('luminarias-balance').textContent = data.actuales;
  } catch (error) {
    console.error('Error cargando luminarias:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadHeader);
```

---

## 7. MODALIDADES DE JUEGO (9 MODOS)

Cada modalidad debe implementarse en su archivo HTML correspondiente con lógica JavaScript específica:

### 7.1 Classic Mode (game-classic.html)
- Modo tradicional sin límite de tiempo
- Feedback inmediato por pregunta
- Botones: Siguiente, Anterior
- Mostrar explicación tras responder

### 7.2 Time Trial (game-time-trial.html)
- Contador regresivo por pregunta (configurable: 30s default)
- Bonus de puntos por velocidad
- Sistema de rachas
- Progreso visual

### 7.3 Lives Mode (game-lives.html)
- 3 vidas al inicio
- Pierde vida al fallar
- Game over al perder todas
- Opción: Comprar vida extra con luminarias

### 7.4 Streak Mode (game-streak.html)
- Racha de aciertos consecutivos
- Multiplicador de puntos por racha
- Pérdida de racha al fallar
- Guardar mejor racha

### 7.5 Marathon Mode (game-marathon.html)
- Máximas preguntas sin fallar
- Sin límite de tiempo total
- Un fallo = fin
- Premios escalonados (10, 25, 50, 100 preguntas)

### 7.6 Duel Mode (game-duel.html)
- 1 vs 1 en tiempo real (WebSocket)
- Mismas preguntas simultáneas
- Gana quien acumule más puntos
- Sistema de matchmaking

### 7.7 Trivial Mode (game-trivial.html)
- Estilo Trivial Pursuit
- Tablero virtual con casillas
- Categorías por color
- Multijugador hasta 6 personas

### 7.8 Exam Mode (game-exam.html)
- Simulación de examen real
- Sin feedback hasta finalizar
- Tiempo total por examen
- Informe detallado al terminar

### 7.9 By Levels (game-by-levels.html)
- Progresión por niveles
- Desbloqueo gradual
- Dificultad creciente
- Sistema de checkpoints

---

## 8. CONFIGURACIÓN DE DESPLIEGUE

### 8.1 render.yaml

```yaml
services:
  # Backend API
  - type: web
    name: playtest-backend
    env: node
    rootDir: playtest-backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Configurar manualmente en Render
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://playtest-frontend.onrender.com

  # Frontend (si se sirve desde Node)
  - type: web
    name: playtest-frontend
    env: static
    buildCommand: echo "No build needed"
    staticPublishPath: .
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### 8.2 .gitignore

```
# Node modules
node_modules/

# Environment variables
.env
.env.local
.env.production

# Logs
*.log
npm-debug.log*

# Uploads
uploads/
!uploads/.gitkeep

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Certificados
*.pem
ca.pem
```

---

## 9. INSTRUCCIONES DE ENLACE Y CONFIGURACIÓN

**Después de generar todos los archivos, debes proporcionar las siguientes instrucciones detalladas para el usuario:**

### 9.1 Configuración de PostgreSQL (pgAdmin4 / Local)

**Instrucciones para crear la base de datos localmente:**

```bash
# 1. Instalar PostgreSQL 12+ si no está instalado
# 2. Abrir pgAdmin4
# 3. Crear nueva base de datos:
#    - Nombre: playtest
#    - Encoding: UTF8
#    - Owner: tu_usuario

# 4. Abrir Query Tool en la base de datos "playtest"

# 5. Ejecutar el archivo database-schema.sql completo
#    (copiar todo el contenido y ejecutar)

# 6. Verificar que se crearon:
#    - 27 tablas
#    - 51 índices
#    - 26 triggers
#    - 28 funciones
#    - 1 usuario con nickname "AdminPrincipal" (crear manualmente si no existe)

# 7. Crear usuario AdminPrincipal manualmente:
INSERT INTO users (nickname, email, password_hash)
VALUES ('AdminPrincipal', 'admin@playtest.com', '$2b$10$...');
# El trigger automáticamente asignará el rol administrador_principal

# 8. Obtener la cadena de conexión:
postgresql://usuario:contraseña@localhost:5432/playtest
```

### 9.2 Configuración en Aiven (Base de Datos en la Nube)

**Instrucciones paso a paso:**

```
1. Crear cuenta en Aiven.io (https://aiven.io)

2. Crear nuevo servicio PostgreSQL:
   - Plan: Startup-4 o superior (según necesidades)
   - Cloud: AWS / Google Cloud / Azure (el que prefieras)
   - Región: Más cercana a tus usuarios
   - Versión: PostgreSQL 12+

3. Esperar a que el servicio esté "Running" (2-5 minutos)

4. Obtener credenciales:
   - Host: lumiquiz-db-xxxxx.aivencloud.com
   - Port: 12345
   - User: avnadmin
   - Password: [copiado automáticamente]
   - Database: defaultdb

5. Descargar certificado SSL:
   - En la consola de Aiven, ir a "Connection Information"
   - Descargar "CA Certificate"
   - Guardar como: playtest-backend/database/ca.pem

6. Construir DATABASE_URL:
   postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require

7. Conectar con pgAdmin4 (opcional):
   - Crear nueva conexión
   - Usar credenciales de Aiven
   - Activar SSL mode: "Require"
   - Cargar CA certificate

8. Ejecutar database-schema.sql:
   - Desde pgAdmin4 conectado a Aiven, o
   - Usar script de migración (ver siguiente sección)

9. Configurar IP Whitelist (si aplica):
   - Aiven permite "Allow access from anywhere" (0.0.0.0/0) por defecto
   - Para producción, restringir a IPs de Render
```

### 9.3 Configuración de GitHub

**Instrucciones:**

```bash
# 1. Crear repositorio en GitHub:
#    - Nombre: PLAYTEST-AISTUDIO
#    - Visibilidad: Private (recomendado) o Public
#    - NO inicializar con README (ya lo tienes)

# 2. Clonar o inicializar localmente:
cd /ruta/del/proyecto
git init
git add .
git commit -m "Initial commit: Playtest project"

# 3. Conectar con repositorio remoto:
git remote add origin https://github.com/tu-usuario/PLAYTEST-AISTUDIO.git
git branch -M main
git push -u origin main

# 4. Crear rama de desarrollo (opcional):
git checkout -b develop
git push -u origin develop

# 5. Configurar .gitignore (ya está generado)

# 6. Proteger rama main (en GitHub):
#    Settings > Branches > Add rule
#    - Branch name: main
#    - Require pull request reviews
#    - Require status checks to pass

# 7. Agregar colaboradores (si aplica):
#    Settings > Collaborators > Add people
```

### 9.4 Configuración de Render (Despliegue Backend)

**Instrucciones detalladas:**

```
A. DESPLEGAR BACKEND:

1. Crear cuenta en Render.com (https://render.com)

2. Conectar GitHub:
   - Dashboard > "New +" > "Web Service"
   - Connect GitHub account
   - Seleccionar repositorio: PLAYTEST-AISTUDIO

3. Configurar Web Service:
   - Name: playtest-backend
   - Root Directory: playtest-backend
   - Environment: Node
   - Branch: main
   - Build Command: npm install
   - Start Command: npm start
   - Plan: Starter ($7/mes) o Free (con limitaciones)

4. Variables de entorno (Environment):
   Agregar las siguientes:

   NODE_ENV = production

   DATABASE_URL = postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
   (copiar de Aiven)

   JWT_SECRET = [generar random: openssl rand -base64 32]

   FRONTEND_URL = https://playtest-frontend.onrender.com
   (ajustar según tu dominio de frontend)

   PORT = 3000
   (Render lo asignará automáticamente, pero es buena práctica)

5. Deploy:
   - Click "Create Web Service"
   - Render iniciará el despliegue automáticamente
   - Monitorear logs en tiempo real

6. Obtener URL del backend:
   - Ejemplo: https://playtest-backend.onrender.com
   - Guardar esta URL para configurar el frontend

7. Verificar que funciona:
   - Abrir: https://playtest-backend.onrender.com/health
   - Debería retornar: {"status": "OK", "timestamp": "..."}

B. DESPLEGAR FRONTEND:

1. En Render Dashboard: "New +" > "Static Site"

2. Conectar repositorio GitHub (mismo que antes)

3. Configurar Static Site:
   - Name: playtest-frontend
   - Root Directory: . (raíz del proyecto)
   - Build Command: echo "No build needed"
   - Publish Directory: . (todos los HTML están en raíz)

4. Variables de entorno:
   BACKEND_URL = https://playtest-backend.onrender.com

5. Deploy:
   - Click "Create Static Site"
   - Esperar despliegue

6. Obtener URL del frontend:
   - Ejemplo: https://playtest-frontend.onrender.com

7. Actualizar CORS en backend:
   - Volver a playtest-backend en Render
   - Environment > FRONTEND_URL
   - Actualizar con la URL real del frontend
   - Trigger manual deploy si es necesario

C. CONFIGURAR SSL PERSONALIZADO (Opcional):

1. Comprar dominio (ej: playtest.com)

2. En Render, para cada servicio:
   - Settings > Custom Domain
   - Add: api.playtest.com (para backend)
   - Add: www.playtest.com (para frontend)

3. Configurar DNS en tu registrador:
   - Tipo CNAME
   - Host: api
   - Value: playtest-backend.onrender.com
   - TTL: 3600

4. Render provee SSL automáticamente (Let's Encrypt)
```

### 9.5 Enlace Final entre Componentes

**Checklist de conexiones:**

```
☐ Base de datos Aiven → Backend Render
  ✓ DATABASE_URL configurado en variables de entorno de Render
  ✓ Certificado SSL ca.pem incluido en repo (si aplica)
  ✓ Migración database-schema.sql ejecutada
  ✓ Trigger test: INSERT AdminPrincipal exitoso

☐ Backend Render → Frontend Render
  ✓ FRONTEND_URL en backend apunta a URL real del frontend
  ✓ CORS configurado correctamente
  ✓ Backend acepta requests desde frontend

☐ Frontend → Backend
  ✓ API_BASE_URL en api-data-service.js apunta a backend
  ✓ Ejemplo: const API_BASE_URL = 'https://playtest-backend.onrender.com/api';
  ✓ Tokens JWT se envían en headers Authorization

☐ GitHub → Render
  ✓ Render conectado a repositorio GitHub
  ✓ Auto-deploy activado en rama main
  ✓ Webhooks configurados (automático)

☐ WebSocket
  ✓ Socket.IO server en backend escuchando
  ✓ Socket.IO client en frontend conectando a backend
  ✓ CORS de Socket.IO configurado igual que Express

☐ Uploads/Archivos estáticos
  ✓ Carpeta uploads/ creada con .gitkeep
  ✓ Multer configurado en backend
  ✓ Ruta /uploads servida como static

☐ Cron Jobs
  ✓ node-cron configurado en server.js
  ✓ Escalación de tickets: cada hora
  ✓ Detección intervenciones: diario 2 AM
  ✓ Market analytics: diario 3 AM

☐ Verificación Final
  ✓ Login funciona desde frontend
  ✓ Token JWT se genera y almacena
  ✓ Crear bloque funciona
  ✓ Cargar preguntas funciona
  ✓ Jugar partida funciona
  ✓ Luminarias se actualizan
  ✓ Tickets se crean y asignan
  ✓ Mensajes directos en tiempo real
  ✓ Roles se asignan automáticamente
```

### 9.6 Script de Migración Automática

**Crear archivo: playtest-backend/scripts/migrate.js**

```javascript
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando migración de base de datos...');

    // Leer schema
    const schemaPath = path.join(__dirname, '..', '..', 'database-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar
    await client.query(schemaSQL);

    console.log('✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
```

**Ejecutar localmente:**
```bash
cd playtest-backend
npm run migrate
```

**Ejecutar en Render:**
```
# Agregar en Render > Settings > Build & Deploy
# Build Command: npm install && node scripts/migrate.js
# (Esto ejecutará la migración cada vez que se deploya)
```

### 9.7 Verificación de Salud del Sistema

**Crear archivo: playtest-backend/scripts/health-check.js**

```javascript
const { pool } = require('../database/connection');

async function healthCheck() {
  console.log('🏥 Verificación de salud del sistema...\n');

  try {
    // 1. Verificar conexión a base de datos
    const dbResult = await pool.query('SELECT NOW()');
    console.log('✅ Base de datos conectada:', dbResult.rows[0].now);

    // 2. Contar tablas
    const tablesResult = await pool.query(`
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('✅ Tablas creadas:', tablesResult.rows[0].count);

    // 3. Verificar roles
    const rolesResult = await pool.query('SELECT COUNT(*) FROM roles');
    console.log('✅ Roles configurados:', rolesResult.rows[0].count);

    // 4. Verificar admin principal
    const adminResult = await pool.query(`
      SELECT u.nickname FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'administrador_principal'
    `);

    if (adminResult.rows.length > 0) {
      console.log('✅ Admin Principal:', adminResult.rows[0].nickname);
    } else {
      console.log('⚠️  No hay Admin Principal creado');
    }

    // 5. Verificar feature flags
    const flagsResult = await pool.query('SELECT COUNT(*) FROM feature_flags');
    console.log('✅ Feature flags:', flagsResult.rows[0].count);

    console.log('\n🎉 Sistema saludable!');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    pool.end();
  }
}

healthCheck();
```

---

## 10. DATOS DE PRUEBA (OPCIONAL)

**Crear archivo: playtest-backend/scripts/seed-data.js**

```javascript
const bcrypt = require('bcrypt');
const { pool } = require('../database/connection');

async function seedData() {
  const client = await pool.connect();

  try {
    console.log('🌱 Sembrando datos de prueba...');

    // 1. Crear Admin Principal
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(`
      INSERT INTO users (nickname, email, password_hash)
      VALUES ('AdminPrincipal', 'admin@playtest.com', $1)
      ON CONFLICT (nickname) DO NOTHING
      RETURNING id
    `, [hashedPassword]);

    console.log('✅ Admin Principal creado');

    // 2. Crear profesores de prueba
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    await client.query(`
      INSERT INTO users (nickname, email, password_hash)
      VALUES
        ('ProfesorMath', 'math@playtest.com', $1),
        ('ProfesorPhysics', 'physics@playtest.com', $1),
        ('CreadorContenido', 'creator@playtest.com', $1)
      ON CONFLICT (nickname) DO NOTHING
    `, [teacherPassword]);

    console.log('✅ Profesores de prueba creados');

    // 3. Crear estudiantes de prueba
    const studentPassword = await bcrypt.hash('student123', 10);
    await client.query(`
      INSERT INTO users (nickname, email, password_hash)
      VALUES
        ('Estudiante1', 'student1@playtest.com', $1),
        ('Estudiante2', 'student2@playtest.com', $1),
        ('Estudiante3', 'student3@playtest.com', $1)
      ON CONFLICT (nickname) DO NOTHING
    `, [studentPassword]);

    console.log('✅ Estudiantes de prueba creados');

    console.log('\n🎉 Datos de prueba sembrados exitosamente!');
    console.log('\nCredenciales de prueba:');
    console.log('Admin: AdminPrincipal / admin123');
    console.log('Profesor: ProfesorMath / teacher123');
    console.log('Estudiante: Estudiante1 / student123');

  } catch (error) {
    console.error('❌ Error sembrando datos:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedData();
```

---

## 11. TESTING Y VALIDACIÓN

**Comandos útiles:**

```bash
# 1. Verificar instalación de dependencias
cd playtest-backend
npm install
npm list

# 2. Ejecutar migración
npm run migrate

# 3. Sembrar datos de prueba
node scripts/seed-data.js

# 4. Verificar salud del sistema
node scripts/health-check.js

# 5. Iniciar servidor en desarrollo
npm run dev

# 6. Iniciar servidor en producción
npm start

# 7. Listar usuarios
node scripts/list-users.js

# 8. Resetear contraseña de usuario
node scripts/reset-password.js <nickname> <nueva_contraseña>
```

---

## 12. CONSIDERACIONES FINALES

### 12.1 Seguridad
- **NUNCA** commitear .env al repositorio
- Usar JWT_SECRET seguro (mínimo 32 caracteres aleatorios)
- Validar TODOS los inputs en backend
- Sanitizar HTML en mensajes y tickets
- Rate limiting activo en todas las rutas

### 12.2 Escalabilidad
- Aiven permite escalar verticalmente el plan de PostgreSQL
- Render permite escalar instancias horizontalmente
- Socket.IO soporta Redis Adapter para múltiples servidores
- Considerar CDN para archivos estáticos grandes

### 12.3 Monitoreo
- Render provee logs en tiempo real
- Aiven provee métricas de base de datos
- Implementar logging estructurado (Winston, Bunyan)
- Alertas en Render para errores críticos

### 12.4 Backup
- Aiven hace backups automáticos diarios
- Exportar manualmente database schema periódicamente
- Git como backup de código (push frecuente)

---

## RESUMEN EJECUTIVO

Has generado un proyecto completo de **PLAYTEST/LUMIQUIZ** que incluye:

✅ **27 tablas** PostgreSQL con relaciones completas
✅ **51 índices** optimizados
✅ **26 triggers** para automatización
✅ **28 funciones** PL/pgSQL
✅ **Backend Node.js/Express** con 27 rutas API
✅ **WebSocket** para tiempo real
✅ **Sistema de roles** jerárquico no excluyente
✅ **Moneda virtual** (Luminarias) con economía completa
✅ **9 modalidades de juego**
✅ **Sistema dual de profesores** (PPF + PCC)
✅ **Mensajería híbrida** (Tickets + Chat)
✅ **65+ archivos HTML** frontend
✅ **35+ componentes JavaScript**
✅ **Integraciones LMS** (Canvas, Moodle, Google Classroom)
✅ **Feature flags modulares** (9 grupos)
✅ **Configuración completa** para Aiven, GitHub y Render

**Próximos pasos:**
1. Crear base de datos en Aiven
2. Crear repositorio en GitHub
3. Desplegar backend en Render
4. Desplegar frontend en Render
5. Ejecutar migración
6. Sembrar datos de prueba
7. Verificar salud del sistema
8. ¡A jugar! 🎮

---

**FIN DEL PROMPT DE GENERACIÓN**
