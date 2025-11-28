# PLAYTEST - FASE 4: SISTEMA DE SOPORTE Y MENSAJERÍA

## 🎯 OBJETIVO DE ESTA FASE

Generar el sistema completo de soporte y mensajería:
- ✅ Tablas de tickets y mensajería en base de datos
- ✅ Triggers de asignación y escalación automática
- ✅ Rutas de soporte (tickets)
- ✅ Rutas de mensajería directa
- ✅ WebSocket handlers para tiempo real
- ✅ HTML de soporte y chat

---

## 📦 ARCHIVOS YA GENERADOS EN FASES ANTERIORES

**Fases 1-3:**
- ✅ Schema base (users, roles, blocks, games, luminarias, profesores, creadores)
- ✅ Backend con autenticación y roles
- ✅ Rutas de bloques, juegos, luminarias, teachers, creators
- ✅ Frontend base y paneles (jugadores, profesores, creadores)

---

## 1. SCHEMA ADICIONAL - SOPORTE Y MENSAJERÍA

**Agregar al archivo: `database-schema.sql`**

```sql
-- =====================================================
-- SISTEMA DE SOPORTE (TICKETS)
-- =====================================================

-- Tickets de soporte
CREATE TABLE IF NOT EXISTS tickets (
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

-- Mensajes de tickets
CREATE TABLE IF NOT EXISTS ticket_messages (
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

-- Participantes en tickets
CREATE TABLE IF NOT EXISTS ticket_participants (
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

-- =====================================================
-- SISTEMA DE MENSAJERÍA DIRECTA
-- =====================================================

-- Conversaciones directas
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_id INT REFERENCES users(id) ON DELETE CASCADE,
  user2_id INT REFERENCES users(id) ON DELETE CASCADE,
  context_type VARCHAR(50), -- class, block, general
  context_id INT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id, context_type, context_id),
  CHECK (user1_id < user2_id)
);

CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Mensajes directos
CREATE TABLE IF NOT EXISTS direct_messages (
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
CREATE INDEX idx_direct_messages_unread ON direct_messages(read_at) WHERE read_at IS NULL;

-- Adjuntos en mensajes
CREATE TABLE IF NOT EXISTS message_attachments (
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

-- Estado "escribiendo..."
CREATE TABLE IF NOT EXISTS typing_status (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_status_conversation ON typing_status(conversation_id);

-- Estado online/offline
CREATE TABLE IF NOT EXISTS user_online_status (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT NOW(),
  socket_id TEXT
);

CREATE INDEX idx_online_status_online ON user_online_status(is_online);

-- =====================================================
-- TRIGGERS DE TICKETS
-- =====================================================

-- Trigger: Generar número de ticket
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
```

---

## 2. RUTAS DE SOPORTE

**Archivo: `playtest-backend/routes/support.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/support/tickets - Crear ticket
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { origin_type, block_id, title, description, priority } = req.body;
    const created_by = req.user.id;

    if (!origin_type || !title) {
      return res.status(400).json({ error: 'origin_type y title son requeridos' });
    }

    const result = await db.query(`
      INSERT INTO tickets (origin_type, block_id, created_by, title, description, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [origin_type, block_id, created_by, title, description, priority || 'media']);

    res.status(201).json({
      message: 'Ticket creado exitosamente',
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando ticket:', error);
    res.status(500).json({ error: 'Error al crear ticket' });
  }
});

// GET /api/support/tickets - Listar tickets
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, assigned_to_me } = req.query;

    let query = `
      SELECT t.*, u.nickname as created_by_nickname
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      WHERE (t.created_by = $1 OR t.assigned_to = $1 OR EXISTS (
        SELECT 1 FROM ticket_participants tp WHERE tp.ticket_id = t.id AND tp.user_id = $1
      ))
    `;

    const params = [userId];

    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    if (assigned_to_me === 'true') {
      query += ` AND t.assigned_to = $1`;
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      tickets: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo tickets:', error);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// GET /api/support/tickets/:id - Detalles de ticket
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;

    const result = await db.query(`
      SELECT t.*, u.nickname as created_by_nickname,
             a.nickname as assigned_to_nickname
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = $1
    `, [ticketId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
});

// POST /api/support/tickets/:id/messages - Añadir mensaje al ticket
router.post('/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const sender_id = req.user.id;
    const { message_text, message_html } = req.body;

    if (!message_text && !message_html) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const result = await db.query(`
      INSERT INTO ticket_messages (ticket_id, sender_id, message_text, message_html)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [ticketId, sender_id, message_text, message_html]);

    // Actualizar timestamp del ticket
    await db.query('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [ticketId]);

    res.status(201).json({
      message: 'Mensaje añadido',
      ticket_message: result.rows[0]
    });

  } catch (error) {
    console.error('Error añadiendo mensaje:', error);
    res.status(500).json({ error: 'Error al añadir mensaje' });
  }
});

// GET /api/support/tickets/:id/messages - Obtener mensajes del ticket
router.get('/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;

    const result = await db.query(`
      SELECT tm.*, u.nickname as sender_nickname
      FROM ticket_messages tm
      JOIN users u ON tm.sender_id = u.id
      WHERE tm.ticket_id = $1
      ORDER BY tm.created_at ASC
    `, [ticketId]);

    res.json({
      messages: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// PUT /api/support/tickets/:id - Actualizar ticket
router.put('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status, priority, resolution_notes } = req.body;

    const result = await db.query(`
      UPDATE tickets
      SET status = COALESCE($1, status),
          priority = COALESCE($2, priority),
          resolution_notes = COALESCE($3, resolution_notes),
          resolved_at = CASE WHEN $1 = 'resuelto' THEN NOW() ELSE resolved_at END,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [status, priority, resolution_notes, ticketId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json({
      message: 'Ticket actualizado',
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando ticket:', error);
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

module.exports = router;
```

---

## 3. RUTAS DE MENSAJERÍA DIRECTA

**Archivo: `playtest-backend/routes/messages.js`**

```javascript
const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET /api/messages/conversations - Listar conversaciones
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT
        c.*,
        CASE
          WHEN c.user1_id = $1 THEN u2.nickname
          ELSE u1.nickname
        END as other_user_nickname,
        CASE
          WHEN c.user1_id = $1 THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        (SELECT COUNT(*) FROM direct_messages dm
         WHERE dm.conversation_id = c.id
         AND dm.recipient_id = $1
         AND dm.read_at IS NULL) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST
    `, [userId]);

    res.json({
      conversations: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// POST /api/messages/conversations - Crear conversación
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { other_user_id, context_type, context_id } = req.body;
    const userId = req.user.id;

    if (!other_user_id) {
      return res.status(400).json({ error: 'other_user_id es requerido' });
    }

    const [user1_id, user2_id] = [userId, other_user_id].sort((a, b) => a - b);

    const result = await db.query(`
      INSERT INTO conversations (user1_id, user2_id, context_type, context_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user1_id, user2_id, context_type, context_id) DO UPDATE
      SET updated_at = NOW()
      RETURNING *
    `, [user1_id, user2_id, context_type, context_id]);

    res.status(201).json({
      message: 'Conversación creada',
      conversation: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando conversación:', error);
    res.status(500).json({ error: 'Error al crear conversación' });
  }
});

// GET /api/messages/conversations/:id/messages - Mensajes de conversación
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { limit = 50 } = req.query;

    const result = await db.query(`
      SELECT dm.*, u.nickname as sender_nickname
      FROM direct_messages dm
      JOIN users u ON dm.sender_id = u.id
      WHERE dm.conversation_id = $1
      ORDER BY dm.created_at DESC
      LIMIT $2
    `, [conversationId, limit]);

    res.json({
      messages: result.rows.reverse(),
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// POST /api/messages/conversations/:id/messages - Enviar mensaje
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const sender_id = req.user.id;
    const { message_text, message_html } = req.body;

    if (!message_text && !message_html) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Obtener recipient_id
    const convResult = await db.query(`
      SELECT user1_id, user2_id FROM conversations WHERE id = $1
    `, [conversationId]);

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const { user1_id, user2_id } = convResult.rows[0];
    const recipient_id = user1_id === sender_id ? user2_id : user1_id;

    const result = await db.query(`
      INSERT INTO direct_messages (
        conversation_id, sender_id, recipient_id, message_text, message_html
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [conversationId, sender_id, recipient_id, message_text, message_html]);

    res.status(201).json({
      message: 'Mensaje enviado',
      direct_message: result.rows[0]
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// PATCH /api/messages/:id/read - Marcar mensaje como leído
router.patch('/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const result = await db.query(`
      UPDATE direct_messages
      SET read_at = NOW()
      WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL
      RETURNING *
    `, [messageId, userId]);

    res.json({
      message: 'Mensaje marcado como leído',
      direct_message: result.rows[0]
    });

  } catch (error) {
    console.error('Error marcando mensaje:', error);
    res.status(500).json({ error: 'Error al marcar mensaje' });
  }
});

// GET /api/messages/unread-count - Conteo de no leídos
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT COUNT(*) as unread_count
      FROM direct_messages
      WHERE recipient_id = $1 AND read_at IS NULL
    `, [userId]);

    res.json({
      unread_count: parseInt(result.rows[0].unread_count)
    });

  } catch (error) {
    console.error('Error obteniendo conteo:', error);
    res.status(500).json({ error: 'Error al obtener conteo' });
  }
});

module.exports = router;
```

---

## 4. WEBSOCKET HANDLERS

### 4.1 Mensajería

**Archivo: `playtest-backend/websocket/messaging.js`**

```javascript
const db = require('../database/connection');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  const messagingNamespace = io.of('/messaging');

  messagingNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }

      socket.userId = decoded.id;
      socket.userNickname = decoded.nickname;
      next();
    });
  });

  messagingNamespace.on('connection', (socket) => {
    console.log(`User ${socket.userNickname} connected to messaging`);

    // Actualizar estado online
    db.query(`
      INSERT INTO user_online_status (user_id, is_online, socket_id)
      VALUES ($1, TRUE, $2)
      ON CONFLICT (user_id) DO UPDATE
      SET is_online = TRUE, socket_id = $2, last_seen = NOW()
    `, [socket.userId, socket.id]);

    // Unirse a conversación
    socket.on('join_conversation', (data) => {
      socket.join(`conversation_${data.conversationId}`);
      console.log(`User ${socket.userNickname} joined conversation ${data.conversationId}`);
    });

    // Indicador "escribiendo..."
    socket.on('typing_start', async (data) => {
      await db.query(`
        INSERT INTO typing_status (conversation_id, user_id, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '10 seconds')
        ON CONFLICT (conversation_id, user_id) DO UPDATE
        SET is_typing = TRUE, expires_at = NOW() + INTERVAL '10 seconds'
      `, [data.conversationId, socket.userId]);

      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: socket.userId,
        nickname: socket.userNickname
      });
    });

    socket.on('typing_stop', async (data) => {
      await db.query(`
        DELETE FROM typing_status
        WHERE conversation_id = $1 AND user_id = $2
      `, [data.conversationId, socket.userId]);

      socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });

    // Nuevo mensaje
    socket.on('new_message', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('message_received', {
        ...data,
        sender_nickname: socket.userNickname
      });
    });

    // Mensaje leído
    socket.on('message_read', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('message_read_confirmation', {
        messageId: data.messageId,
        readBy: socket.userId
      });
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`User ${socket.userNickname} disconnected from messaging`);

      db.query(`
        UPDATE user_online_status
        SET is_online = FALSE, last_seen = NOW(), socket_id = NULL
        WHERE user_id = $1
      `, [socket.userId]);
    });
  });
};
```

---

## 5. ACTUALIZAR SERVER.JS

**Modificar: `playtest-backend/server.js`**

Agregar Socket.IO y nuevas rutas:

```javascript
// ... imports existentes ...
const { createServer } = require('http');
const { Server } = require('socket.io');

const server = createServer(app);

// ... configuración existente ...

// Configure Socket.IO
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// ... código existente ...

// Import routes
const supportRoutes = require('./routes/support');
const messagesRoutes = require('./routes/messages');

// Use routes
app.use('/api/support', supportRoutes);
app.use('/api/messages', messagesRoutes);

// WebSocket handlers
require('./websocket/messaging')(io);

// ... resto del código, pero cambiar app.listen por server.listen ...

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
});
```

---

## 6. FRONTEND - PANEL DE SOPORTE

**Archivo: `support-dashboard.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLAYTEST - Soporte</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">

  <header class="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold">Panel de Soporte</h1>
      <button onclick="logout()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
        Salir
      </button>
    </div>
  </header>

  <div class="container mx-auto px-4 py-8">

    <!-- Crear Ticket -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Crear Nuevo Ticket</h2>

      <form id="createTicketForm" class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
          <select id="originType" class="w-full px-3 py-2 border rounded-lg">
            <option value="global">Problema Técnico Global</option>
            <option value="block">Problema con Bloque</option>
          </select>
        </div>

        <div id="blockSelectContainer" class="hidden">
          <label class="block text-sm font-bold text-gray-700 mb-2">Bloque</label>
          <select id="blockId" class="w-full px-3 py-2 border rounded-lg">
            <option value="">Seleccionar bloque...</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Título</label>
          <input type="text" id="title" required
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
          <textarea id="description" rows="4" required
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">Prioridad</label>
          <select id="priority" class="w-full px-3 py-2 border rounded-lg">
            <option value="baja">Baja</option>
            <option value="media" selected>Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
          Crear Ticket
        </button>
      </form>
    </div>

    <!-- Mis Tickets -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Mis Tickets</h2>

      <div id="ticketsList" class="space-y-4">
        <!-- Tickets se cargarán aquí -->
      </div>
    </div>

  </div>

  <script src="api-data-service.js"></script>
  <script src="auth-utils.js"></script>
  <script>
    requireAuth();

    // Toggle block select
    document.getElementById('originType').addEventListener('change', (e) => {
      const container = document.getElementById('blockSelectContainer');
      if (e.target.value === 'block') {
        container.classList.remove('hidden');
        loadBlocks();
      } else {
        container.classList.add('hidden');
      }
    });

    async function loadBlocks() {
      try {
        const data = await apiService.get('/blocks?filter=all');
        const select = document.getElementById('blockId');

        data.blocks.forEach(block => {
          const option = document.createElement('option');
          option.value = block.id;
          option.textContent = block.name;
          select.appendChild(option);
        });
      } catch (error) {
        console.error('Error cargando bloques:', error);
      }
    }

    // Crear ticket
    document.getElementById('createTicketForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        origin_type: document.getElementById('originType').value,
        block_id: document.getElementById('blockId').value || null,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value
      };

      try {
        await apiService.post('/support/tickets', data);
        alert('Ticket creado exitosamente');
        document.getElementById('createTicketForm').reset();
        loadTickets();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });

    // Cargar tickets
    async function loadTickets() {
      try {
        const data = await apiService.get('/support/tickets');

        const container = document.getElementById('ticketsList');
        container.innerHTML = '';

        if (data.tickets.length === 0) {
          container.innerHTML = '<p class="text-gray-500">No tienes tickets aún</p>';
          return;
        }

        data.tickets.forEach(ticket => {
          const priorityColors = {
            baja: 'blue',
            media: 'yellow',
            alta: 'orange',
            critica: 'red'
          };

          const statusColors = {
            abierto: 'gray',
            en_progreso: 'blue',
            resuelto: 'green',
            cerrado: 'gray'
          };

          const ticketDiv = document.createElement('div');
          ticketDiv.className = 'bg-gray-50 p-4 rounded-lg border hover:border-green-500 cursor-pointer';
          ticketDiv.onclick = () => window.location.href = `ticket-chat.html?id=${ticket.id}`;
          ticketDiv.innerHTML = `
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-lg">${ticket.title}</h3>
                <p class="text-sm text-gray-600 mt-1">${ticket.ticket_number}</p>
              </div>
              <div class="flex gap-2">
                <span class="px-2 py-1 rounded text-xs bg-${priorityColors[ticket.priority]}-100 text-${priorityColors[ticket.priority]}-800">
                  ${ticket.priority}
                </span>
                <span class="px-2 py-1 rounded text-xs bg-${statusColors[ticket.status]}-100 text-${statusColors[ticket.status]}-800">
                  ${ticket.status}
                </span>
              </div>
            </div>
          `;
          container.appendChild(ticketDiv);
        });

      } catch (error) {
        console.error('Error cargando tickets:', error);
      }
    }

    loadTickets();
  </script>

</body>
</html>
```

---

## ✅ CHECKLIST DE ARCHIVOS GENERADOS EN FASE 4

- [ ] Agregar tablas al `database-schema.sql` (tickets, conversations, direct_messages)
- [ ] `playtest-backend/routes/support.js` - API de tickets
- [ ] `playtest-backend/routes/messages.js` - API de mensajería
- [ ] `playtest-backend/websocket/messaging.js` - WebSocket handler
- [ ] `support-dashboard.html` - Panel de soporte
- [ ] Actualizar `server.js` - Socket.IO y nuevas rutas

---

## 🎯 SIGUIENTE PASO

Una vez generados todos estos archivos, continuar con:
**FASE 5: Frontend de juegos e instrucciones de despliegue**
