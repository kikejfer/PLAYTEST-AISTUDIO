# PLAYTEST - FASE 2: SISTEMA DE ROLES Y APIS PRINCIPALES

## 🎯 OBJETIVO DE ESTA FASE

Generar las APIs principales del sistema:
- ✅ Rutas de bloques y preguntas
- ✅ Rutas de juegos y puntuaciones
- ✅ Rutas de luminarias (moneda virtual)
- ✅ Rutas de administración y roles
- ✅ Frontend base (index.html, auth-utils.js, api-data-service.js)

---

## 📦 ARCHIVOS YA GENERADOS EN FASE 1

- ✅ `database-schema.sql` - Schema completo
- ✅ `playtest-backend/server.js` - Servidor base
- ✅ `playtest-backend/package.json` - Dependencias
- ✅ `playtest-backend/database/connection.js` - Conexión DB
- ✅ `playtest-backend/middleware/auth.js` - Middleware JWT
- ✅ `playtest-backend/middleware/roles.js` - Middleware de roles
- ✅ `playtest-backend/routes/auth.js` - Autenticación
- ✅ `.gitignore` y `README.md`

---

## 1. RUTAS DE BLOQUES Y PREGUNTAS

### 1.1 Rutas de Bloques

**Archivo: `playtest-backend/routes/blocks.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const router = express.Router();

// GET /api/blocks - Listar bloques (públicos o del usuario)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = 'all' } = req.query; // all, public, my

    let query = '';
    let params = [];

    if (filter === 'public') {
      query = `
        SELECT b.*, u.nickname as creator_nickname
        FROM blocks b
        JOIN users u ON b.creator_id = u.id
        WHERE b.is_public = TRUE
        ORDER BY b.created_at DESC
      `;
    } else if (filter === 'my') {
      query = `
        SELECT b.*, u.nickname as creator_nickname
        FROM blocks b
        JOIN users u ON b.creator_id = u.id
        WHERE b.creator_id = $1
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT b.*, u.nickname as creator_nickname
        FROM blocks b
        JOIN users u ON b.creator_id = u.id
        WHERE b.is_public = TRUE OR b.creator_id = $1
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    }

    const result = await db.query(query, params);

    res.json({
      blocks: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo bloques:', error);
    res.status(500).json({ error: 'Error al obtener bloques' });
  }
});

// GET /api/blocks/:id - Obtener un bloque específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const blockId = req.params.id;
    const userId = req.user.id;

    const result = await db.query(`
      SELECT b.*, u.nickname as creator_nickname
      FROM blocks b
      JOIN users u ON b.creator_id = u.id
      WHERE b.id = $1 AND (b.is_public = TRUE OR b.creator_id = $2)
    `, [blockId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error obteniendo bloque:', error);
    res.status(500).json({ error: 'Error al obtener bloque' });
  }
});

// POST /api/blocks - Crear nuevo bloque
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, is_public, difficulty, category, tags } = req.body;
    const creator_id = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await db.query(`
      INSERT INTO blocks (name, description, creator_id, is_public, difficulty, category, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description, creator_id, is_public || false, difficulty || 5, category, tags || []]);

    res.status(201).json({
      message: 'Bloque creado exitosamente',
      block: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando bloque:', error);
    res.status(500).json({ error: 'Error al crear bloque' });
  }
});

// PUT /api/blocks/:id - Actualizar bloque
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const blockId = req.params.id;
    const userId = req.user.id;
    const { name, description, is_public, difficulty, category, tags } = req.body;

    // Verificar que el usuario sea el creador
    const checkResult = await db.query(
      'SELECT creator_id FROM blocks WHERE id = $1',
      [blockId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }

    if (checkResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar este bloque' });
    }

    const result = await db.query(`
      UPDATE blocks
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          is_public = COALESCE($3, is_public),
          difficulty = COALESCE($4, difficulty),
          category = COALESCE($5, category),
          tags = COALESCE($6, tags),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, description, is_public, difficulty, category, tags, blockId]);

    res.json({
      message: 'Bloque actualizado exitosamente',
      block: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando bloque:', error);
    res.status(500).json({ error: 'Error al actualizar bloque' });
  }
});

// DELETE /api/blocks/:id - Eliminar bloque
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const blockId = req.params.id;
    const userId = req.user.id;

    // Verificar que el usuario sea el creador
    const checkResult = await db.query(
      'SELECT creator_id FROM blocks WHERE id = $1',
      [blockId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bloque no encontrado' });
    }

    if (checkResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este bloque' });
    }

    await db.query('DELETE FROM blocks WHERE id = $1', [blockId]);

    res.json({ message: 'Bloque eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando bloque:', error);
    res.status(500).json({ error: 'Error al eliminar bloque' });
  }
});

// GET /api/blocks/:id/questions - Obtener preguntas de un bloque
router.get('/:id/questions', authenticateToken, async (req, res) => {
  try {
    const blockId = req.params.id;

    const result = await db.query(`
      SELECT q.*,
        json_agg(
          json_build_object(
            'id', a.id,
            'answer_text', a.answer_text,
            'is_correct', a.is_correct,
            'explanation', a.explanation
          ) ORDER BY a.id
        ) as answers
      FROM questions q
      LEFT JOIN answers a ON q.id = a.question_id
      WHERE q.block_id = $1
      GROUP BY q.id
      ORDER BY q.id
    `, [blockId]);

    res.json({
      questions: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    res.status(500).json({ error: 'Error al obtener preguntas' });
  }
});

module.exports = router;
```

### 1.2 Rutas de Preguntas

**Archivo: `playtest-backend/routes/questions.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/questions - Crear pregunta individual
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { block_id, text_question, topic, difficulty, explanation, answers } = req.body;

    if (!block_id || !text_question || !answers || answers.length < 2) {
      return res.status(400).json({
        error: 'block_id, text_question y al menos 2 respuestas son requeridos'
      });
    }

    // Verificar que al menos una respuesta sea correcta
    const hasCorrect = answers.some(a => a.is_correct);
    if (!hasCorrect) {
      return res.status(400).json({ error: 'Debe haber al menos una respuesta correcta' });
    }

    // Insertar pregunta
    const questionResult = await db.query(`
      INSERT INTO questions (block_id, text_question, topic, difficulty, explanation)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [block_id, text_question, topic, difficulty || 5, explanation]);

    const questionId = questionResult.rows[0].id;

    // Insertar respuestas
    const answerValues = answers.map(a =>
      `(${questionId}, '${a.answer_text.replace(/'/g, "''")}', ${a.is_correct || false}, '${(a.explanation || '').replace(/'/g, "''")}')`
    ).join(',');

    await db.query(`
      INSERT INTO answers (question_id, answer_text, is_correct, explanation)
      VALUES ${answerValues}
    `);

    res.status(201).json({
      message: 'Pregunta creada exitosamente',
      question: questionResult.rows[0]
    });

  } catch (error) {
    console.error('Error creando pregunta:', error);
    res.status(500).json({ error: 'Error al crear pregunta' });
  }
});

// POST /api/questions/bulk - Crear preguntas masivamente
router.post('/bulk', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { block_id, questions } = req.body;

    if (!block_id || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'block_id y questions son requeridos' });
    }

    await client.query('BEGIN');

    let created = 0;
    for (const q of questions) {
      if (!q.text_question || !q.answers || q.answers.length < 2) {
        continue;
      }

      // Insertar pregunta
      const questionResult = await client.query(`
        INSERT INTO questions (block_id, text_question, topic, difficulty, explanation)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [block_id, q.text_question, q.topic, q.difficulty || 5, q.explanation]);

      const questionId = questionResult.rows[0].id;

      // Insertar respuestas
      for (const a of q.answers) {
        await client.query(`
          INSERT INTO answers (question_id, answer_text, is_correct, explanation)
          VALUES ($1, $2, $3, $4)
        `, [questionId, a.answer_text, a.is_correct || false, a.explanation]);
      }

      created++;
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `${created} preguntas creadas exitosamente`,
      created: created
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creando preguntas masivamente:', error);
    res.status(500).json({ error: 'Error al crear preguntas' });
  } finally {
    client.release();
  }
});

module.exports = router;
```

---

## 2. RUTAS DE JUEGOS

**Archivo: `playtest-backend/routes/games.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/games - Crear nueva partida
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { game_type, block_id, game_state } = req.body;
    const userId = req.user.id;

    if (!game_type || !block_id) {
      return res.status(400).json({ error: 'game_type y block_id son requeridos' });
    }

    const result = await db.query(`
      INSERT INTO games (game_type, block_id, created_by, game_state)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [game_type, block_id, userId, game_state || {}]);

    res.status(201).json({
      message: 'Partida creada exitosamente',
      game: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando partida:', error);
    res.status(500).json({ error: 'Error al crear partida' });
  }
});

// GET /api/games/:id - Obtener estado de partida
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const gameId = req.params.id;

    const result = await db.query('SELECT * FROM games WHERE id = $1', [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error obteniendo partida:', error);
    res.status(500).json({ error: 'Error al obtener partida' });
  }
});

// PUT /api/games/:id/state - Actualizar estado de partida
router.put('/:id/state', authenticateToken, async (req, res) => {
  try {
    const gameId = req.params.id;
    const { game_state } = req.body;

    const result = await db.query(`
      UPDATE games
      SET game_state = $1
      WHERE id = $2
      RETURNING *
    `, [game_state, gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    res.json({
      message: 'Estado actualizado',
      game: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// POST /api/games/:id/score - Guardar puntuación final
router.post('/:id/score', authenticateToken, async (req, res) => {
  try {
    const gameId = req.params.id;
    const userId = req.user.id;
    const {
      score,
      correct_answers,
      total_questions,
      time_spent,
      difficulty_average
    } = req.body;

    // Obtener tipo de juego
    const gameResult = await db.query(
      'SELECT game_type FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    const gameType = gameResult.rows[0].game_type;
    const accuracy = total_questions > 0 ? (correct_answers / total_questions) * 100 : 0;

    // Guardar puntuación
    await db.query(`
      INSERT INTO game_scores (
        game_id, user_id, game_type, score, correct_answers,
        total_questions, accuracy, time_spent, difficulty_average
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [gameId, userId, gameType, score, correct_answers, total_questions,
        accuracy, time_spent, difficulty_average]);

    // Actualizar estado de partida
    await db.query(`
      UPDATE games
      SET status = 'completed',
          completed_at = NOW(),
          duration_seconds = $1
      WHERE id = $2
    `, [time_spent, gameId]);

    // Calcular luminarias ganadas (fórmula básica)
    const luminariaEarned = Math.floor(score / 10) + (correct_answers * 5);

    // Otorgar luminarias
    await db.query(
      "SELECT process_luminarias_transaction($1, 'earn', $2, 'gaming', $3)",
      [userId, luminariaEarned, `Completó juego ${gameType}`]
    );

    res.json({
      message: 'Puntuación guardada exitosamente',
      score: score,
      luminarias_earned: luminariaEarned
    });

  } catch (error) {
    console.error('Error guardando puntuación:', error);
    res.status(500).json({ error: 'Error al guardar puntuación' });
  }
});

// GET /api/games/leaderboard/:gameType - Rankings por tipo de juego
router.get('/leaderboard/:gameType', authenticateToken, async (req, res) => {
  try {
    const { gameType } = req.params;
    const { limit = 10 } = req.query;

    const result = await db.query(`
      SELECT
        gs.user_id,
        u.nickname,
        gs.score,
        gs.accuracy,
        gs.time_spent,
        gs.created_at
      FROM game_scores gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.game_type = $1
      ORDER BY gs.score DESC, gs.created_at ASC
      LIMIT $2
    `, [gameType, limit]);

    res.json({
      gameType: gameType,
      leaderboard: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    res.status(500).json({ error: 'Error al obtener leaderboard' });
  }
});

module.exports = router;
```

---

## 3. RUTAS DE LUMINARIAS

**Archivo: `playtest-backend/routes/luminarias.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET /api/luminarias/balance - Obtener balance actual
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT get_user_luminarias_balance($1) as balance',
      [userId]
    );

    const statsResult = await db.query(
      'SELECT * FROM user_luminarias WHERE user_id = $1',
      [userId]
    );

    const stats = statsResult.rows[0] || {
      actuales: 0,
      ganadas: 0,
      gastadas: 0,
      abonadas: 0,
      compradas: 0
    };

    res.json({
      balance: result.rows[0].balance,
      ...stats
    });

  } catch (error) {
    console.error('Error obteniendo balance:', error);
    res.status(500).json({ error: 'Error al obtener balance' });
  }
});

// GET /api/luminarias/transactions - Historial de transacciones
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(`
      SELECT *
      FROM luminarias_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM luminarias_transactions WHERE user_id = $1',
      [userId]
    );

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

// POST /api/luminarias/transaction - Procesar transacción manual (admin)
router.post('/transaction', authenticateToken, async (req, res) => {
  try {
    const { user_id, transaction_type, amount, category, description } = req.body;

    // Solo admins pueden hacer transacciones manuales
    // (En producción, agregar verificación de rol admin)

    const result = await db.query(
      "SELECT process_luminarias_transaction($1, $2, $3, $4, $5) as transaction_id",
      [user_id, transaction_type, amount, category, description]
    );

    res.json({
      message: 'Transacción procesada exitosamente',
      transaction_id: result.rows[0].transaction_id
    });

  } catch (error) {
    console.error('Error procesando transacción:', error);
    res.status(500).json({ error: error.message || 'Error al procesar transacción' });
  }
});

module.exports = router;
```

---

## 4. RUTAS DE ADMINISTRACIÓN Y ROLES

**Archivo: `playtest-backend/routes/roles.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const router = express.Router();

// GET /api/roles/my-roles - Obtener roles del usuario actual
router.get('/my-roles', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT r.id, r.name, r.description, r.hierarchy_level
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
      ORDER BY r.hierarchy_level
    `, [userId]);

    res.json({
      roles: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// GET /api/roles/admin-principal-panel - Datos para panel de admin principal
router.get('/admin-principal-panel',
  authenticateToken,
  requireRole('administrador_principal'),
  async (req, res) => {
    try {
      // Obtener admins secundarios
      const adminsResult = await db.query(`
        SELECT
          u.id,
          u.nickname,
          u.email,
          COUNT(DISTINCT aa.assigned_user_id) as usuarios_asignados
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN admin_assignments aa ON u.id = aa.admin_id
        WHERE r.name = 'administrador_secundario'
        GROUP BY u.id, u.nickname, u.email
      `);

      // Obtener profesores/creadores con luminarias
      const profesoresResult = await db.query(`
        SELECT
          u.id,
          u.nickname,
          u.email,
          ul.actuales as luminarias_actuales,
          ul.ganadas as luminarias_ganadas,
          ul.gastadas as luminarias_gastadas,
          COUNT(DISTINCT b.id) as bloques_creados
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN user_luminarias ul ON u.id = ul.user_id
        LEFT JOIN blocks b ON u.id = b.creator_id
        WHERE r.name IN ('profesor_creador', 'profesor_centro_fisico')
        GROUP BY u.id, u.nickname, u.email, ul.actuales, ul.ganadas, ul.gastadas
        ORDER BY ul.actuales DESC NULLS LAST
      `);

      // Obtener usuarios/jugadores
      const usuariosResult = await db.query(`
        SELECT
          u.id,
          u.nickname,
          u.email,
          ul.actuales as luminarias_actuales,
          COUNT(DISTINCT ulb.block_id) as bloques_cargados
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN user_luminarias ul ON u.id = ul.user_id
        LEFT JOIN user_loaded_blocks ulb ON u.id = ulb.user_id
        WHERE r.name = 'usuario'
        GROUP BY u.id, u.nickname, u.email, ul.actuales
        ORDER BY u.created_at DESC
      `);

      res.json({
        admins_secundarios: adminsResult.rows,
        profesores: profesoresResult.rows,
        usuarios: usuariosResult.rows
      });

    } catch (error) {
      console.error('Error obteniendo datos de panel:', error);
      res.status(500).json({ error: 'Error al obtener datos del panel' });
    }
  }
);

// POST /api/roles/assign-admin-secundario - Asignar rol de admin secundario
router.post('/assign-admin-secundario',
  authenticateToken,
  requireRole('administrador_principal'),
  async (req, res) => {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id es requerido' });
      }

      // Asignar rol
      const roleResult = await db.query(
        'SELECT id FROM roles WHERE name = $1',
        ['administrador_secundario']
      );

      await db.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, auto_assigned)
        VALUES ($1, $2, $3, FALSE)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [user_id, roleResult.rows[0].id, req.user.id]);

      res.json({ message: 'Rol asignado exitosamente' });

    } catch (error) {
      console.error('Error asignando rol:', error);
      res.status(500).json({ error: 'Error al asignar rol' });
    }
  }
);

module.exports = router;
```

---

## 5. ACTUALIZAR SERVER.JS

**Modificar: `playtest-backend/server.js`**

Agregar las nuevas rutas al archivo existente:

```javascript
// ... código existente ...

// Import routes
const authRoutes = require('./routes/auth');
const blockRoutes = require('./routes/blocks');
const questionRoutes = require('./routes/questions');
const gameRoutes = require('./routes/games');
const luminariasRoutes = require('./routes/luminarias');
const rolesRoutes = require('./routes/roles');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/luminarias', luminariasRoutes);
app.use('/api/roles', rolesRoutes);

// ... resto del código ...
```

---

## 6. FRONTEND BASE

### 6.1 Landing/Login

**Archivo: `index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLAYTEST - Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 min-h-screen">

  <div class="container mx-auto px-4 py-16">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">

      <!-- Header -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
        <h1 class="text-4xl font-bold text-white">PLAYTEST</h1>
        <p class="text-indigo-100 mt-2">Aprende jugando</p>
      </div>

      <!-- Login Form -->
      <div class="p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>

        <form id="loginForm">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              required
            >
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              required
            >
          </div>

          <button
            type="submit"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-200"
          >
            Entrar
          </button>
        </form>

        <div id="errorMessage" class="mt-4 hidden">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span id="errorText"></span>
          </div>
        </div>

        <div class="mt-6 text-center">
          <p class="text-gray-600">
            ¿No tienes cuenta?
            <a href="register.html" class="text-indigo-600 hover:underline">Regístrate aquí</a>
          </p>
        </div>
      </div>

    </div>
  </div>

  <script src="api-data-service.js"></script>
  <script src="auth-utils.js"></script>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const data = await apiService.post('/auth/login', { email, password });

        // Guardar token y usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirigir según roles
        if (data.user.roles.includes('administrador_principal') ||
            data.user.roles.includes('administrador_secundario')) {
          window.location.href = 'admin-principal-panel.html';
        } else if (data.user.roles.includes('profesor_centro_fisico')) {
          window.location.href = 'teachers-panel-main.html';
        } else if (data.user.roles.includes('profesor_creador')) {
          window.location.href = 'creators-panel-content.html';
        } else {
          window.location.href = 'jugadores-panel-gaming.html';
        }

      } catch (error) {
        document.getElementById('errorText').textContent = error.message;
        document.getElementById('errorMessage').classList.remove('hidden');
      }
    });
  </script>

</body>
</html>
```

### 6.2 API Data Service

**Archivo: `api-data-service.js`**

```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // Cambiar en producción

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

### 6.3 Auth Utils

**Archivo: `auth-utils.js`**

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

---

## ✅ CHECKLIST DE ARCHIVOS GENERADOS EN FASE 2

- [ ] `playtest-backend/routes/blocks.js` - CRUD de bloques
- [ ] `playtest-backend/routes/questions.js` - Crear preguntas
- [ ] `playtest-backend/routes/games.js` - Sistema de juegos
- [ ] `playtest-backend/routes/luminarias.js` - Moneda virtual
- [ ] `playtest-backend/routes/roles.js` - Administración y roles
- [ ] `index.html` - Landing/Login
- [ ] `api-data-service.js` - Cliente API
- [ ] `auth-utils.js` - Utilidades de autenticación
- [ ] Actualizar `server.js` - Agregar nuevas rutas

---

## 🎯 SIGUIENTE PASO

Una vez generados todos estos archivos, continuar con:
**FASE 3: Paneles de profesores y creadores**
