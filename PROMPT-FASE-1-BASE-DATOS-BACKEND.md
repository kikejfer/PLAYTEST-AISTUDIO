# PLAYTEST - FASE 1: BASE DE DATOS Y BACKEND CORE

## 🎯 OBJETIVO DE ESTA FASE

Generar la estructura fundamental del proyecto:
- ✅ Schema completo de base de datos PostgreSQL
- ✅ Estructura del backend Node.js/Express
- ✅ Sistema de autenticación (JWT)
- ✅ Conexión a base de datos
- ✅ Archivos de configuración base

---

## 📋 DESCRIPCIÓN GENERAL DEL PROYECTO PLAYTEST

**PLAYTEST (LUMIQUIZ)** es una plataforma educativa gamificada de aprendizaje mediante quizzes con:
- 9 modalidades de juego
- Sistema de roles jerárquico no excluyente (5 roles)
- Moneda virtual "Luminarias"
- Dual sistema de profesores (Académico + Marketplace)
- Mensajería en tiempo real
- Integraciones LMS

**Stack Tecnológico:**
- **Frontend**: HTML5 + Tailwind CSS + JavaScript Vanilla + React (CDN)
- **Backend**: Node.js 18.x + Express 4.18.2 + Socket.IO 4.8.1
- **Base de datos**: PostgreSQL 12+
- **Autenticación**: JWT + Bcrypt
- **Despliegue**: Render.com (backend) + Aiven (PostgreSQL)

---

## 1. ESTRUCTURA DE CARPETAS DEL PROYECTO

```
PLAYTEST-AISTUDIO/
├── playtest-backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── database/
│   │   └── connection.js
│   ├── routes/
│   │   └── auth.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roles.js
│   └── scripts/
│       └── migrate.js
├── database-schema.sql
├── .gitignore
└── README.md
```

---

## 2. DATABASE SCHEMA COMPLETO (PostgreSQL)

**Archivo: `database-schema.sql`**

```sql
-- =====================================================
-- PLAYTEST/LUMIQUIZ - DATABASE SCHEMA COMPLETO
-- PostgreSQL 12+
-- =====================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PARTE 1: USUARIOS Y AUTENTICACIÓN
-- =====================================================

-- Tabla principal de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);

-- Perfiles extendidos de usuarios
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answer_history JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  loaded_blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles del sistema
CREATE TABLE IF NOT EXISTS roles (
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
('servicio_tecnico', 'Soporte técnico global', 5, '{"manage_global_tickets": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Relación usuarios-roles (muchos a muchos)
CREATE TABLE IF NOT EXISTS user_roles (
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

-- Asignaciones de administrador secundario
CREATE TABLE IF NOT EXISTS admin_assignments (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES users(id) ON DELETE CASCADE,
  assigned_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assigned_user_id)
);

CREATE INDEX idx_admin_assignments_admin ON admin_assignments(admin_id);
CREATE INDEX idx_admin_assignments_user ON admin_assignments(assigned_user_id);

-- Sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- =====================================================
-- PARTE 2: SISTEMA DE LUMINARIAS (MONEDA VIRTUAL)
-- =====================================================

-- Balance de luminarias por usuario
CREATE TABLE IF NOT EXISTS user_luminarias (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  actuales INT DEFAULT 0 CHECK (actuales >= 0),
  ganadas INT DEFAULT 0 CHECK (ganadas >= 0),
  gastadas INT DEFAULT 0 CHECK (gastadas >= 0),
  abonadas INT DEFAULT 0 CHECK (abonadas >= 0),
  compradas INT DEFAULT 0 CHECK (compradas >= 0),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_luminarias_balance ON user_luminarias(actuales DESC);

-- Transacciones de luminarias
CREATE TABLE IF NOT EXISTS luminarias_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- earn, spend, transfer_in, transfer_out
  amount INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  user_role VARCHAR(100),
  category VARCHAR(100), -- gaming, monetization, admin, store
  subcategory VARCHAR(100),
  action_type VARCHAR(100),
  description TEXT,
  reference_id INT,
  reference_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_luminarias_trans_user ON luminarias_transactions(user_id);
CREATE INDEX idx_luminarias_trans_type ON luminarias_transactions(transaction_type);
CREATE INDEX idx_luminarias_trans_date ON luminarias_transactions(created_at DESC);

-- =====================================================
-- PARTE 3: BLOQUES Y PREGUNTAS
-- =====================================================

-- Bloques de preguntas
CREATE TABLE IF NOT EXISTS blocks (
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
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  block_id INT REFERENCES blocks(id) ON DELETE CASCADE,
  text_question TEXT NOT NULL,
  topic VARCHAR(255),
  difficulty INT CHECK (difficulty BETWEEN 1 AND 10),
  explanation TEXT,
  image_url TEXT,
  time_limit INT,
  points INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_block ON questions(block_id);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Respuestas
CREATE TABLE IF NOT EXISTS answers (
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
CREATE TABLE IF NOT EXISTS user_loaded_blocks (
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

-- =====================================================
-- PARTE 4: SISTEMA DE JUEGOS
-- =====================================================

-- Partidas de juego
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL,
  block_id INT REFERENCES blocks(id),
  created_by INT REFERENCES users(id) ON DELETE CASCADE,
  game_state JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INT
);

CREATE INDEX idx_games_type ON games(game_type);
CREATE INDEX idx_games_creator ON games(created_by);
CREATE INDEX idx_games_status ON games(status);

-- Puntuaciones
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  correct_answers INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  accuracy DECIMAL(5, 2),
  time_spent INT,
  difficulty_average DECIMAL(5, 2),
  score_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_game_scores_user ON game_scores(user_id);
CREATE INDEX idx_game_scores_type ON game_scores(game_type);
CREATE INDEX idx_game_scores_score ON game_scores(score DESC);

-- =====================================================
-- PARTE 5: NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  action_url TEXT,
  priority VARCHAR(50) DEFAULT 'normal',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- =====================================================
-- PARTE 6: TRIGGERS PRINCIPALES
-- =====================================================

-- Trigger: Asignar rol Admin Principal automáticamente
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
    VALUES (NEW.id, 200);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_admin_principal
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION check_admin_principal_registration();

-- Trigger: Asignar rol Profesor Creador al crear bloque público
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

    -- Inicializar luminarias si no existen
    INSERT INTO user_luminarias (user_id, actuales)
    VALUES (NEW.creator_id, 200)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_profesor_creador
AFTER INSERT OR UPDATE ON blocks
FOR EACH ROW EXECUTE FUNCTION auto_assign_profesor_creador();

-- Trigger: Asignar rol Usuario al cargar bloque ajeno
CREATE OR REPLACE FUNCTION auto_assign_usuario_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_id, auto_assigned)
  SELECT NEW.user_id, r.id, TRUE
  FROM roles r
  WHERE r.name = 'usuario'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = NEW.user_id
    AND ur.role_id = r.id
  );

  -- Inicializar luminarias si no existen
  INSERT INTO user_luminarias (user_id, actuales)
  VALUES (NEW.user_id, 200)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_usuario
AFTER INSERT ON user_loaded_blocks
FOR EACH ROW EXECUTE FUNCTION auto_assign_usuario_role();

-- =====================================================
-- PARTE 7: FUNCIONES ÚTILES
-- =====================================================

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
  p_category VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL
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
    category, description
  ) VALUES (
    p_user_id, p_transaction_type, p_amount, current_balance, new_balance,
    p_category, p_description
  ) RETURNING id INTO transaction_id;

  -- Actualizar balance
  INSERT INTO user_luminarias (user_id, actuales, ganadas, gastadas)
  VALUES (
    p_user_id,
    new_balance,
    CASE WHEN p_transaction_type = 'earn' THEN p_amount ELSE 0 END,
    CASE WHEN p_transaction_type = 'spend' THEN p_amount ELSE 0 END
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
```

---

## 3. BACKEND - ARCHIVOS DE CONFIGURACIÓN

### 3.1 package.json

**Archivo: `playtest-backend/package.json`**

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

### 3.2 .env.example

**Archivo: `playtest-backend/.env.example`**

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
LUMINARIAS_INITIAL_BALANCE=200
```

### 3.3 .gitignore

**Archivo: `.gitignore`**

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

# Certificados
*.pem
ca.pem
```

---

## 4. BACKEND - CONEXIÓN A BASE DE DATOS

**Archivo: `playtest-backend/database/connection.js`**

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL no está definida en las variables de entorno');
  process.exit(1);
}

// Configuración del pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Verificar conexión
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

---

## 5. BACKEND - MIDDLEWARE DE AUTENTICACIÓN

### 5.1 Middleware de JWT

**Archivo: `playtest-backend/middleware/auth.js`**

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

### 5.2 Middleware de Roles

**Archivo: `playtest-backend/middleware/roles.js`**

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

      req.userRoles = userRoles;
      next();
    } catch (error) {
      console.error('Error verificando roles:', error);
      res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
}

module.exports = { requireRole };
```

---

## 6. BACKEND - RUTAS DE AUTENTICACIÓN

**Archivo: `playtest-backend/routes/auth.js`**

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const router = express.Router();

// POST /api/auth/register - Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

    // Validaciones
    if (!nickname || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR nickname = $2',
      [email, nickname]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario o email ya están registrados' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await db.query(
      `INSERT INTO users (nickname, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nickname, email, created_at`,
      [nickname, email, hashedPassword]
    );

    const user = result.rows[0];

    // Crear perfil de usuario
    await db.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)',
      [user.id]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const result = await db.query(
      'SELECT id, nickname, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Obtener roles del usuario
    const rolesResult = await db.query(`
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [user.id]);

    const roles = rolesResult.rows.map(row => row.name);

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        roles: roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token: token,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        roles: roles
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', (req, res) => {
  // El cliente debe eliminar el token
  res.json({ message: 'Sesión cerrada exitosamente' });
});

module.exports = router;
```

---

## 7. BACKEND - SERVER PRINCIPAL

**Archivo: `playtest-backend/server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
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

app.use('/api', generalLimiter);

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

---

## 8. SCRIPT DE MIGRACIÓN

**Archivo: `playtest-backend/scripts/migrate.js`**

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
    console.log('✅ Tablas creadas: users, user_profiles, roles, user_roles, blocks, questions, answers, games, etc.');
    console.log('✅ Triggers creados: auto_assign roles');
    console.log('✅ Funciones creadas: get_user_luminarias_balance, process_luminarias_transaction');

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

---

## 9. README

**Archivo: `README.md`**

```markdown
# PLAYTEST / LUMIQUIZ

Plataforma educativa gamificada de aprendizaje mediante quizzes.

## Fase 1: Base de datos y Backend Core ✅

Esta fase incluye:
- ✅ Schema completo de PostgreSQL
- ✅ Backend Node.js/Express básico
- ✅ Sistema de autenticación JWT
- ✅ Conexión a base de datos
- ✅ Sistema de roles
- ✅ Middleware de seguridad

## Instalación

```bash
cd playtest-backend
npm install
```

## Configuración

1. Copiar `.env.example` a `.env`
2. Configurar `DATABASE_URL` con tu PostgreSQL
3. Configurar `JWT_SECRET` con una clave segura

## Migración de Base de Datos

```bash
npm run migrate
```

## Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Endpoints Disponibles (Fase 1)

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /health` - Health check

## Próximas Fases

- Fase 2: Sistema de roles y APIs principales
- Fase 3: Paneles de profesores y creadores
- Fase 4: Sistema de soporte y mensajería
- Fase 5: Frontend de juegos e instrucciones de despliegue
```

---

## ✅ CHECKLIST DE ARCHIVOS GENERADOS EN FASE 1

- [ ] `database-schema.sql` - Schema completo de PostgreSQL
- [ ] `playtest-backend/package.json` - Dependencias
- [ ] `playtest-backend/.env.example` - Variables de entorno
- [ ] `playtest-backend/server.js` - Servidor principal
- [ ] `playtest-backend/database/connection.js` - Conexión DB
- [ ] `playtest-backend/middleware/auth.js` - Middleware JWT
- [ ] `playtest-backend/middleware/roles.js` - Middleware de roles
- [ ] `playtest-backend/routes/auth.js` - Rutas de autenticación
- [ ] `playtest-backend/scripts/migrate.js` - Script de migración
- [ ] `.gitignore` - Archivos ignorados
- [ ] `README.md` - Documentación

---

## 🎯 SIGUIENTE PASO

Una vez generados todos estos archivos, continuar con:
**FASE 2: Sistema de roles y APIs principales**
