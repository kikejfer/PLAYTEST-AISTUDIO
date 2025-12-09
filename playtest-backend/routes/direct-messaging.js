const express = require('express');
const router = express.Router();
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in direct-messaging.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

router.use(getDBPool);
router.use(authenticateToken);


async function validateConversationAccess(req, res, next) {
    const conversationId = req.params.conversationId || req.body.conversationId;
    const userId = req.user.id;
    try {
        const result = await req.pool.query(
            `SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
            [conversationId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
        }
        req.conversation = result.rows[0];
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error validando acceso' });
    }
}

// FIX: Add route for getting unread messages count.
router.get('/unread-count', async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await req.pool.query(
            'SELECT COUNT(*) as unread_count FROM direct_messages WHERE recipient_id = $1 AND is_read = false',
            [userId]
        );
        const unreadCount = parseInt(result.rows[0].unread_count, 10);
        res.json({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread messages count:', error);
        res.status(500).json({ error: 'Error al obtener el número de mensajes no leídos' });
    }
});

router.get('/conversations', async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await req.pool.query(
            `SELECT c.id, u.nickname as other_user_nickname, lm.message_text as last_message
             FROM conversations c
             JOIN users u ON (CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END) = u.id
             LEFT JOIN (SELECT conversation_id, message_text, ROW_NUMBER() OVER(PARTITION BY conversation_id ORDER BY created_at DESC) as rn FROM direct_messages) lm ON c.id = lm.conversation_id AND lm.rn = 1
             WHERE (c.user1_id = $1 OR c.user2_id = $1) AND c.is_active = true`,
            [userId]
        );
        res.json({ conversations: result.rows });
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: 'Error obteniendo conversaciones' });
    }
});

router.post('/conversations', async (req, res) => {
    const userId = req.user.id;
    const { recipientId } = req.body;
    try {
        const [user1Id, user2Id] = userId < recipientId ? [userId, recipientId] : [recipientId, userId];
        let conv = await req.pool.query('SELECT id FROM conversations WHERE user1_id = $1 AND user2_id = $2', [user1Id, user2Id]);
        if (conv.rows.length === 0) {
            conv = await req.pool.query('INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id', [user1Id, user2Id]);
        }
        res.status(201).json({ conversationId: conv.rows[0].id });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Error creando conversación' });
    }
});

router.get('/conversations/:conversationId/messages', validateConversationAccess, async (req, res) => {
    const conversationId = req.params.conversationId;
    try {
        const result = await req.pool.query(
            `SELECT dm.*, u.nickname as sender_nickname
             FROM direct_messages dm
             JOIN users u ON dm.sender_id = u.id
             WHERE dm.conversation_id = $1 ORDER BY dm.created_at ASC`,
            [conversationId]
        );
        res.json({ messages: result.rows });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Error obteniendo mensajes' });
    }
});

router.post('/conversations/:conversationId/messages', validateConversationAccess, async (req, res) => {
    const conversationId = req.params.conversationId;
    const senderId = req.user.id;
    const { messageText } = req.body;
    const recipientId = req.conversation.user1_id === senderId ? req.conversation.user2_id : req.conversation.user1_id;

    try {
        const result = await req.pool.query(
            `INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, message_text) VALUES ($1, $2, $3, $4) RETURNING *`,
            [conversationId, senderId, recipientId, messageText]
        );
        res.status(201).json({ message: 'Mensaje enviado', data: result.rows[0] });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error enviando mensaje' });
    }
});

module.exports = router;
