# PLAYTEST - FASE 3: PANELES DE PROFESORES Y CREADORES

## 🎯 OBJETIVO DE ESTA FASE

Generar los sistemas de profesores y creadores:
- ✅ Tablas adicionales en base de datos (profesores y creadores)
- ✅ Rutas de profesores (PPF - académico)
- ✅ Rutas de creadores (PCC - marketplace)
- ✅ HTML de paneles principales
- ✅ Panel de jugadores

---

## 📦 ARCHIVOS YA GENERADOS EN FASES ANTERIORES

**Fase 1:**
- ✅ Schema base de datos (users, roles, blocks, questions, games, luminarias)
- ✅ Backend base con autenticación
- ✅ Middleware de auth y roles

**Fase 2:**
- ✅ Rutas de bloques, preguntas, juegos, luminarias, roles
- ✅ Frontend base (index.html, api-data-service.js, auth-utils.js)

---

## 1. SCHEMA ADICIONAL - PROFESORES Y CREADORES

**Agregar al archivo: `database-schema.sql` (DESPUÉS de las tablas existentes)**

```sql
-- =====================================================
-- TABLAS DE PROFESORES (PPF - AMBIENTE ACADÉMICO)
-- =====================================================

-- Clases académicas
CREATE TABLE IF NOT EXISTS teacher_classes (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  class_name VARCHAR(255) NOT NULL,
  class_code VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(100),
  academic_year VARCHAR(20),
  grade_level VARCHAR(50),
  description TEXT,
  max_students INT DEFAULT 30,
  schedule JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX idx_teacher_classes_code ON teacher_classes(class_code);

-- Inscripciones de estudiantes en clases
CREATE TABLE IF NOT EXISTS class_enrollments (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  enrollment_status VARCHAR(50) DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT NOW(),
  withdrawn_at TIMESTAMP,
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);

-- Registro de asistencia
CREATE TABLE IF NOT EXISTS attendance_tracking (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  engagement_score INT CHECK (engagement_score BETWEEN 1 AND 10),
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, student_id, attendance_date)
);

CREATE INDEX idx_attendance_class ON attendance_tracking(class_id);
CREATE INDEX idx_attendance_student ON attendance_tracking(student_id);

-- Progreso académico
CREATE TABLE IF NOT EXISTS academic_progress (
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

-- Asignaciones de contenido
CREATE TABLE IF NOT EXISTS content_assignments (
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

-- =====================================================
-- TABLAS DE CREADORES (PCC - MARKETPLACE)
-- =====================================================

-- Analytics de mercado para creadores
CREATE TABLE IF NOT EXISTS creator_market_analytics (
  creator_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  market_rank INT,
  total_blocks INT DEFAULT 0,
  public_blocks INT DEFAULT 0,
  total_players INT DEFAULT 0,
  active_players_30d INT DEFAULT 0,
  revenue_current_month DECIMAL(10, 2) DEFAULT 0,
  revenue_all_time DECIMAL(10, 2) DEFAULT 0,
  avg_block_rating DECIMAL(3, 2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Suscripciones de creadores
CREATE TABLE IF NOT EXISTS creator_subscriptions (
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

-- Campañas de marketing
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id SERIAL PRIMARY KEY,
  creator_id INT REFERENCES users(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(100),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  discount_percentage INT,
  promo_code VARCHAR(50) UNIQUE,
  impressions INT DEFAULT 0,
  conversions INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_creator ON marketing_campaigns(creator_id);

-- =====================================================
-- TRIGGER: Generar código de clase automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
    LOOP
      new_code := UPPER(SUBSTRING(COALESCE(NEW.subject, 'CLASS') FROM 1 FOR 4)) ||
                  TO_CHAR(NOW(), 'YYYY') || '-' ||
                  CHR(65 + FLOOR(RANDOM() * 26)::INT);

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

---

## 2. RUTAS DE PROFESORES (PPF)

**Archivo: `playtest-backend/routes/teachers.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const router = express.Router();

// POST /api/teachers/classes - Crear nueva clase
router.post('/classes',
  authenticateToken,
  requireRole('profesor_centro_fisico', 'administrador_principal'),
  async (req, res) => {
    try {
      const { class_name, subject, academic_year, grade_level, description, max_students } = req.body;
      const teacher_id = req.user.id;

      if (!class_name || !subject) {
        return res.status(400).json({ error: 'class_name y subject son requeridos' });
      }

      const result = await db.query(`
        INSERT INTO teacher_classes (
          teacher_id, class_name, subject, academic_year,
          grade_level, description, max_students
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [teacher_id, class_name, subject, academic_year,
          grade_level, description, max_students || 30]);

      res.status(201).json({
        message: 'Clase creada exitosamente',
        class: result.rows[0]
      });

    } catch (error) {
      console.error('Error creando clase:', error);
      res.status(500).json({ error: 'Error al crear clase' });
    }
  }
);

// GET /api/teachers/classes - Listar clases del profesor
router.get('/classes',
  authenticateToken,
  requireRole('profesor_centro_fisico'),
  async (req, res) => {
    try {
      const teacher_id = req.user.id;

      const result = await db.query(`
        SELECT
          tc.*,
          COUNT(DISTINCT ce.student_id) as enrolled_students
        FROM teacher_classes tc
        LEFT JOIN class_enrollments ce ON tc.id = ce.class_id
          AND ce.enrollment_status = 'active'
        WHERE tc.teacher_id = $1
        GROUP BY tc.id
        ORDER BY tc.created_at DESC
      `, [teacher_id]);

      res.json({
        classes: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo clases:', error);
      res.status(500).json({ error: 'Error al obtener clases' });
    }
  }
);

// GET /api/teachers/classes/:id/students - Estudiantes de una clase
router.get('/classes/:id/students',
  authenticateToken,
  requireRole('profesor_centro_fisico'),
  async (req, res) => {
    try {
      const class_id = req.params.id;

      const result = await db.query(`
        SELECT
          u.id,
          u.nickname,
          u.email,
          ce.enrolled_at,
          ce.enrollment_status,
          COALESCE(AVG(ap.percentage), 0) as average_score,
          COUNT(DISTINCT ap.block_id) as completed_blocks
        FROM class_enrollments ce
        JOIN users u ON ce.student_id = u.id
        LEFT JOIN academic_progress ap ON u.id = ap.student_id
          AND ap.class_id = ce.class_id
        WHERE ce.class_id = $1
        GROUP BY u.id, u.nickname, u.email, ce.enrolled_at, ce.enrollment_status
        ORDER BY u.nickname
      `, [class_id]);

      res.json({
        students: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo estudiantes:', error);
      res.status(500).json({ error: 'Error al obtener estudiantes' });
    }
  }
);

// POST /api/teachers/classes/:code/enroll - Inscribir estudiante con código
router.post('/classes/:code/enroll',
  authenticateToken,
  async (req, res) => {
    try {
      const class_code = req.params.code;
      const student_id = req.user.id;

      // Buscar clase
      const classResult = await db.query(
        'SELECT id, max_students, status FROM teacher_classes WHERE class_code = $1',
        [class_code]
      );

      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: 'Código de clase inválido' });
      }

      const classData = classResult.rows[0];

      if (classData.status !== 'active') {
        return res.status(400).json({ error: 'La clase no está activa' });
      }

      // Verificar cupo
      const enrolledResult = await db.query(
        `SELECT COUNT(*) FROM class_enrollments
         WHERE class_id = $1 AND enrollment_status = 'active'`,
        [classData.id]
      );

      if (parseInt(enrolledResult.rows[0].count) >= classData.max_students) {
        return res.status(400).json({ error: 'La clase está llena' });
      }

      // Inscribir
      await db.query(`
        INSERT INTO class_enrollments (class_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (class_id, student_id) DO NOTHING
      `, [classData.id, student_id]);

      res.json({ message: 'Inscripción exitosa' });

    } catch (error) {
      console.error('Error inscribiendo estudiante:', error);
      res.status(500).json({ error: 'Error al inscribir estudiante' });
    }
  }
);

// POST /api/teachers/assignments - Asignar bloque a clase
router.post('/assignments',
  authenticateToken,
  requireRole('profesor_centro_fisico'),
  async (req, res) => {
    try {
      const { class_id, block_id, due_date, is_mandatory, instructions } = req.body;
      const teacher_id = req.user.id;

      if (!class_id || !block_id) {
        return res.status(400).json({ error: 'class_id y block_id son requeridos' });
      }

      const result = await db.query(`
        INSERT INTO content_assignments (
          teacher_id, class_id, block_id, due_date, is_mandatory, instructions
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [teacher_id, class_id, block_id, due_date, is_mandatory, instructions]);

      res.status(201).json({
        message: 'Bloque asignado exitosamente',
        assignment: result.rows[0]
      });

    } catch (error) {
      console.error('Error asignando bloque:', error);
      res.status(500).json({ error: 'Error al asignar bloque' });
    }
  }
);

module.exports = router;
```

---

## 3. RUTAS DE CREADORES (PCC)

**Archivo: `playtest-backend/routes/creators-panel.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const router = express.Router();

// GET /api/creators-panel/analytics - Analytics del creador
router.get('/analytics',
  authenticateToken,
  requireRole('profesor_creador'),
  async (req, res) => {
    try {
      const creator_id = req.user.id;

      // Bloques del creador
      const blocksResult = await db.query(`
        SELECT
          COUNT(*) as total_blocks,
          COUNT(*) FILTER (WHERE is_public = TRUE) as public_blocks,
          ROUND(AVG(difficulty), 2) as avg_difficulty
        FROM blocks
        WHERE creator_id = $1
      `, [creator_id]);

      // Jugadores que cargaron bloques
      const playersResult = await db.query(`
        SELECT COUNT(DISTINCT ulb.user_id) as total_players
        FROM user_loaded_blocks ulb
        JOIN blocks b ON ulb.block_id = b.id
        WHERE b.creator_id = $1
      `, [creator_id]);

      // Revenue (luminarias ganadas de ventas)
      const revenueResult = await db.query(`
        SELECT
          COALESCE(SUM(amount), 0) as total_revenue
        FROM luminarias_transactions
        WHERE user_id = $1
          AND category = 'monetization'
          AND transaction_type = 'earn'
      `, [creator_id]);

      res.json({
        blocks: blocksResult.rows[0],
        players: playersResult.rows[0],
        revenue: revenueResult.rows[0]
      });

    } catch (error) {
      console.error('Error obteniendo analytics:', error);
      res.status(500).json({ error: 'Error al obtener analytics' });
    }
  }
);

// GET /api/creators-panel/players - Jugadores del creador
router.get('/players',
  authenticateToken,
  requireRole('profesor_creador'),
  async (req, res) => {
    try {
      const creator_id = req.user.id;

      const result = await db.query(`
        SELECT DISTINCT
          u.id,
          u.nickname,
          u.email,
          COUNT(DISTINCT ulb.block_id) as blocks_loaded,
          MAX(ulb.loaded_at) as last_activity
        FROM users u
        JOIN user_loaded_blocks ulb ON u.id = ulb.user_id
        JOIN blocks b ON ulb.block_id = b.id
        WHERE b.creator_id = $1
        GROUP BY u.id, u.nickname, u.email
        ORDER BY last_activity DESC
      `, [creator_id]);

      res.json({
        players: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo jugadores:', error);
      res.status(500).json({ error: 'Error al obtener jugadores' });
    }
  }
);

// POST /api/creators-panel/campaigns - Crear campaña de marketing
router.post('/campaigns',
  authenticateToken,
  requireRole('profesor_creador'),
  async (req, res) => {
    try {
      const { campaign_name, campaign_type, start_date, end_date, discount_percentage } = req.body;
      const creator_id = req.user.id;

      if (!campaign_name || !campaign_type || !start_date) {
        return res.status(400).json({
          error: 'campaign_name, campaign_type y start_date son requeridos'
        });
      }

      // Generar promo code
      const promo_code = `${campaign_name.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const result = await db.query(`
        INSERT INTO marketing_campaigns (
          creator_id, campaign_name, campaign_type, start_date,
          end_date, discount_percentage, promo_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [creator_id, campaign_name, campaign_type, start_date,
          end_date, discount_percentage, promo_code]);

      res.status(201).json({
        message: 'Campaña creada exitosamente',
        campaign: result.rows[0]
      });

    } catch (error) {
      console.error('Error creando campaña:', error);
      res.status(500).json({ error: 'Error al crear campaña' });
    }
  }
);

module.exports = router;
```

---

## 4. ACTUALIZAR SERVER.JS

**Modificar: `playtest-backend/server.js`**

Agregar las nuevas rutas:

```javascript
// ... imports existentes ...

const teachersRoutes = require('./routes/teachers');
const creatorsPanelRoutes = require('./routes/creators-panel');

// ... código existente ...

app.use('/api/teachers', teachersRoutes);
app.use('/api/creators-panel', creatorsPanelRoutes);

// ... resto del código ...
```

---

## 5. FRONTEND - PANEL DE JUGADORES

**Archivo: `jugadores-panel-gaming.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLAYTEST - Panel de Jugadores</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">

  <!-- Header -->
  <header class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <h1 class="text-2xl font-bold">PLAYTEST</h1>
        <span id="userNickname" class="text-sm opacity-80"></span>
      </div>

      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2">
          <span class="text-yellow-300 text-xl">💎</span>
          <span id="luminariasBalance" class="font-bold text-xl">0</span>
        </div>

        <button onclick="logout()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
          Salir
        </button>
      </div>
    </div>
  </header>

  <div class="container mx-auto px-4 py-8">

    <!-- Bloques Cargados -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Mis Bloques</h2>

      <div class="mb-4">
        <button onclick="loadPublicBlocks()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded mr-2">
          Cargar Nuevo Bloque
        </button>
      </div>

      <div id="loadedBlocks" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Bloques se cargarán aquí -->
      </div>
    </div>

    <!-- Modalidades de Juego -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Modalidades de Juego</h2>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <button onclick="selectGameMode('classic')" class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">📚</div>
          <div class="font-bold">Classic</div>
        </button>

        <button onclick="selectGameMode('time_trial')" class="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">⏱️</div>
          <div class="font-bold">Time Trial</div>
        </button>

        <button onclick="selectGameMode('lives')" class="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">❤️</div>
          <div class="font-bold">Lives</div>
        </button>

        <button onclick="selectGameMode('streak')" class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">🔥</div>
          <div class="font-bold">Streak</div>
        </button>

        <button onclick="selectGameMode('marathon')" class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">🏃</div>
          <div class="font-bold">Marathon</div>
        </button>

        <button onclick="selectGameMode('duel')" class="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">⚔️</div>
          <div class="font-bold">Duel</div>
        </button>

        <button onclick="selectGameMode('trivial')" class="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">🎲</div>
          <div class="font-bold">Trivial</div>
        </button>

        <button onclick="selectGameMode('exam')" class="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">📝</div>
          <div class="font-bold">Exam</div>
        </button>

        <button onclick="selectGameMode('by_levels')" class="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg">
          <div class="text-3xl mb-2">🎯</div>
          <div class="font-bold">By Levels</div>
        </button>
      </div>
    </div>

  </div>

  <script src="api-data-service.js"></script>
  <script src="auth-utils.js"></script>
  <script>
    requireAuth();

    const user = getUserFromToken();
    document.getElementById('userNickname').textContent = user.nickname;

    let selectedBlockId = null;

    async function loadLuminarias() {
      try {
        const data = await apiService.get('/luminarias/balance');
        document.getElementById('luminariasBalance').textContent = data.actuales;
      } catch (error) {
        console.error('Error cargando luminarias:', error);
      }
    }

    async function loadMyBlocks() {
      try {
        const data = await apiService.get('/blocks?filter=public');

        const container = document.getElementById('loadedBlocks');
        container.innerHTML = '';

        if (data.blocks.length === 0) {
          container.innerHTML = '<p class="text-gray-500">No tienes bloques cargados aún</p>';
          return;
        }

        data.blocks.forEach(block => {
          const blockDiv = document.createElement('div');
          blockDiv.className = 'bg-gray-50 p-4 rounded-lg border hover:border-indigo-500 cursor-pointer';
          blockDiv.onclick = () => selectBlock(block.id);
          blockDiv.innerHTML = `
            <h3 class="font-bold text-lg">${block.name}</h3>
            <p class="text-sm text-gray-600 mt-1">${block.description || ''}</p>
            <div class="flex justify-between items-center mt-3">
              <span class="text-xs text-gray-500">Dificultad: ${block.difficulty}/10</span>
              <span class="text-xs text-gray-500">Por: ${block.creator_nickname}</span>
            </div>
          `;
          container.appendChild(blockDiv);
        });

      } catch (error) {
        console.error('Error cargando bloques:', error);
      }
    }

    function selectBlock(blockId) {
      selectedBlockId = blockId;
      alert('Bloque seleccionado. Ahora elige una modalidad de juego.');
    }

    function selectGameMode(mode) {
      if (!selectedBlockId) {
        alert('Primero selecciona un bloque');
        return;
      }

      window.location.href = `game-${mode}.html?blockId=${selectedBlockId}`;
    }

    // Cargar datos al inicio
    loadLuminarias();
    loadMyBlocks();
  </script>

</body>
</html>
```

---

## 6. FRONTEND - PANEL DE PROFESORES

**Archivo: `teachers-panel-main.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLAYTEST - Panel de Profesores</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">

  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Panel de Profesores</h1>
        <span id="userNickname" class="text-sm opacity-80"></span>
      </div>

      <button onclick="logout()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
        Salir
      </button>
    </div>
  </header>

  <div class="container mx-auto px-4 py-8">

    <!-- Crear Nueva Clase -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Crear Nueva Clase</h2>

      <form id="createClassForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Nombre de la Clase</label>
          <input type="text" id="className" required
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Asignatura</label>
          <input type="text" id="subject" required
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Año Académico</label>
          <input type="text" id="academicYear" value="2024-2025"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Nivel</label>
          <input type="text" id="gradeLevel" placeholder="ej: 3° ESO"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
        </div>

        <div class="md:col-span-2">
          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Crear Clase
          </button>
        </div>
      </form>
    </div>

    <!-- Mis Clases -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Mis Clases</h2>

      <div id="classesList" class="space-y-4">
        <!-- Clases se cargarán aquí -->
      </div>
    </div>

  </div>

  <script src="api-data-service.js"></script>
  <script src="auth-utils.js"></script>
  <script>
    requireAuth();

    const user = getUserFromToken();
    document.getElementById('userNickname').textContent = user.nickname;

    // Crear clase
    document.getElementById('createClassForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        class_name: document.getElementById('className').value,
        subject: document.getElementById('subject').value,
        academic_year: document.getElementById('academicYear').value,
        grade_level: document.getElementById('gradeLevel').value
      };

      try {
        await apiService.post('/teachers/classes', data);
        alert('Clase creada exitosamente');
        document.getElementById('createClassForm').reset();
        loadClasses();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });

    // Cargar clases
    async function loadClasses() {
      try {
        const data = await apiService.get('/teachers/classes');

        const container = document.getElementById('classesList');
        container.innerHTML = '';

        if (data.classes.length === 0) {
          container.innerHTML = '<p class="text-gray-500">No tienes clases creadas aún</p>';
          return;
        }

        data.classes.forEach(cls => {
          const classDiv = document.createElement('div');
          classDiv.className = 'bg-gray-50 p-4 rounded-lg border';
          classDiv.innerHTML = `
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-lg">${cls.class_name}</h3>
                <p class="text-sm text-gray-600">${cls.subject} - ${cls.grade_level || ''}</p>
                <p class="text-xs text-gray-500 mt-1">Código: <span class="font-mono font-bold">${cls.class_code}</span></p>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-blue-600">${cls.enrolled_students}</div>
                <div class="text-xs text-gray-500">estudiantes</div>
              </div>
            </div>
          `;
          container.appendChild(classDiv);
        });

      } catch (error) {
        console.error('Error cargando clases:', error);
      }
    }

    loadClasses();
  </script>

</body>
</html>
```

---

## 7. FRONTEND - PANEL DE CREADORES

**Archivo: `creators-panel-content.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLAYTEST - Panel de Creadores</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">

  <!-- Header -->
  <header class="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Panel de Creadores</h1>
        <span id="userNickname" class="text-sm opacity-80"></span>
      </div>

      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2">
          <span class="text-yellow-300 text-xl">💎</span>
          <span id="luminariasBalance" class="font-bold text-xl">0</span>
        </div>

        <button onclick="logout()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
          Salir
        </button>
      </div>
    </div>
  </header>

  <div class="container mx-auto px-4 py-8">

    <!-- Analytics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-sm text-gray-600">Bloques Creados</div>
        <div id="totalBlocks" class="text-3xl font-bold text-purple-600">0</div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-sm text-gray-600">Jugadores Totales</div>
        <div id="totalPlayers" class="text-3xl font-bold text-pink-600">0</div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-sm text-gray-600">Revenue Total</div>
        <div id="totalRevenue" class="text-3xl font-bold text-green-600">0 💎</div>
      </div>
    </div>

    <!-- Crear Bloque -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Crear Nuevo Bloque</h2>

      <form id="createBlockForm" class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Nombre del Bloque</label>
          <input type="text" id="blockName" required
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
          <textarea id="blockDescription" rows="3"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Dificultad (1-10)</label>
            <input type="number" id="blockDifficulty" min="1" max="10" value="5"
              class="w-full px-3 py-2 border rounded-lg">
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Categoría</label>
            <input type="text" id="blockCategory"
              class="w-full px-3 py-2 border rounded-lg">
          </div>
        </div>

        <div class="flex items-center">
          <input type="checkbox" id="isPublic" class="mr-2">
          <label for="isPublic" class="text-sm font-bold text-gray-700">Hacer público</label>
        </div>

        <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
          Crear Bloque
        </button>
      </form>
    </div>

    <!-- Mis Bloques -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Mis Bloques</h2>

      <div id="myBlocks" class="space-y-4">
        <!-- Bloques se cargarán aquí -->
      </div>
    </div>

  </div>

  <script src="api-data-service.js"></script>
  <script src="auth-utils.js"></script>
  <script>
    requireAuth();

    const user = getUserFromToken();
    document.getElementById('userNickname').textContent = user.nickname;

    // Cargar analytics
    async function loadAnalytics() {
      try {
        const data = await apiService.get('/creators-panel/analytics');

        document.getElementById('totalBlocks').textContent = data.blocks.total_blocks;
        document.getElementById('totalPlayers').textContent = data.players.total_players;
        document.getElementById('totalRevenue').textContent = data.revenue.total_revenue + ' 💎';

        // Luminarias
        const lumData = await apiService.get('/luminarias/balance');
        document.getElementById('luminariasBalance').textContent = lumData.actuales;

      } catch (error) {
        console.error('Error cargando analytics:', error);
      }
    }

    // Crear bloque
    document.getElementById('createBlockForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        name: document.getElementById('blockName').value,
        description: document.getElementById('blockDescription').value,
        difficulty: parseInt(document.getElementById('blockDifficulty').value),
        category: document.getElementById('blockCategory').value,
        is_public: document.getElementById('isPublic').checked
      };

      try {
        await apiService.post('/blocks', data);
        alert('Bloque creado exitosamente');
        document.getElementById('createBlockForm').reset();
        loadMyBlocks();
        loadAnalytics();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });

    // Cargar bloques
    async function loadMyBlocks() {
      try {
        const data = await apiService.get('/blocks?filter=my');

        const container = document.getElementById('myBlocks');
        container.innerHTML = '';

        if (data.blocks.length === 0) {
          container.innerHTML = '<p class="text-gray-500">No has creado bloques aún</p>';
          return;
        }

        data.blocks.forEach(block => {
          const blockDiv = document.createElement('div');
          blockDiv.className = 'bg-gray-50 p-4 rounded-lg border';
          blockDiv.innerHTML = `
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-lg">${block.name}</h3>
                <p class="text-sm text-gray-600 mt-1">${block.description || ''}</p>
                <div class="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Dificultad: ${block.difficulty}/10</span>
                  <span>${block.is_public ? '🌐 Público' : '🔒 Privado'}</span>
                  <span>Categoría: ${block.category || 'Sin categoría'}</span>
                </div>
              </div>
            </div>
          `;
          container.appendChild(blockDiv);
        });

      } catch (error) {
        console.error('Error cargando bloques:', error);
      }
    }

    loadAnalytics();
    loadMyBlocks();
  </script>

</body>
</html>
```

---

## ✅ CHECKLIST DE ARCHIVOS GENERADOS EN FASE 3

- [ ] Agregar tablas al `database-schema.sql` (teacher_classes, class_enrollments, etc.)
- [ ] `playtest-backend/routes/teachers.js` - API de profesores
- [ ] `playtest-backend/routes/creators-panel.js` - API de creadores
- [ ] `jugadores-panel-gaming.html` - Panel de jugadores
- [ ] `teachers-panel-main.html` - Panel de profesores
- [ ] `creators-panel-content.html` - Panel de creadores
- [ ] Actualizar `server.js` - Agregar rutas de teachers y creators

---

## 🎯 SIGUIENTE PASO

Una vez generados todos estos archivos, continuar con:
**FASE 4: Sistema de soporte y mensajería**
