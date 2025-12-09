const express = require('express');
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const ImageSearchService = require('../image-search');

const router = express.Router();
const imageSearch = new ImageSearchService();

// Helper function to reduce boilerplate
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

router.use(getDBPool);

router.get('/', authenticateToken, async (req, res) => {
  const pool = req.pool;
  try {
    console.log('🔍 /blocks endpoint called for user:', req.user.id);

    const blocksResult = await pool.query(`
      SELECT DISTINCT b.id, b.name, b.description, b.observaciones, b.user_role_id, b.is_public, b.created_at, b.image_url,
        b.block_scope,
        b.tipo_id, b.nivel_id, b.estado_id,
        u.nickname as creator_nickname,
        u.id as creator_id,
        r.name as created_with_role,
        COALESCE(ba.total_questions, 0) as question_count
      FROM blocks b
      LEFT JOIN user_roles ur ON b.user_role_id = ur.id
      LEFT JOIN users u ON ur.user_id = u.id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN block_answers ba ON b.id = ba.block_id
      LEFT JOIN block_assignments bla ON b.id = bla.block_id
      LEFT JOIN group_members gm ON bla.group_id = gm.group_id
      WHERE (
        (b.block_scope = 'PUBLICO' OR b.block_scope IS NULL)
        OR
        (b.block_scope = 'CLASE' AND (
          b.owner_user_id = $1
          OR bla.assigned_to_user = $1
          OR gm.user_id = $1
        ))
      )
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    
    const blocks = [];
    for (const block of blocksResult.rows) {
      const questionsResult = await pool.query(
        'SELECT id, text_question, topic FROM questions WHERE block_id = $1',
        [block.id]
      );
      block.questions = questionsResult.rows;
      blocks.push(block);
    }

    res.json(blocks);
  } catch (error) {
    console.error('❌ Error fetching blocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const pool = req.pool;
  const { name, description, observaciones, isPublic = true, tipo_id, nivel_id, estado_id } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Block name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentRole = req.headers['x-current-role'];
    const panelToRoleMapping = { 'PCC': 'creador', 'PPF': 'profesor', 'PAP': 'administrador_principal', 'PAS': 'administrador_secundario' };
    const actualRoleName = panelToRoleMapping[currentRole] || currentRole;

    const userRoleResult = await client.query('SELECT ur.id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = $2', [req.user.id, actualRoleName]);
    if (userRoleResult.rows.length === 0) {
        throw new Error('User role not found');
    }
    const userRoleId = userRoleResult.rows[0].id;

    let imageUrl = await imageSearch.searchImage(name, description || '', '').catch(e => imageSearch.getRandomFallbackImage());

    const blockScope = (actualRoleName === 'profesor') ? 'CLASE' : 'PUBLICO';

    const result = await client.query(
      'INSERT INTO blocks (name, description, observaciones, user_role_id, is_public, image_url, tipo_id, nivel_id, estado_id, block_scope, owner_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [name, description, observaciones, userRoleId, isPublic, imageUrl, tipo_id, nivel_id, estado_id, blockScope, req.user.id]
    );
    const newBlock = result.rows[0];

    await client.query('COMMIT');
    res.status(201).json({ message: 'Block created successfully', block: newBlock });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating block:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/types', async (req, res) => {
  const pool = req.pool;
  try {
    const result = await pool.query('SELECT id, name FROM block_types ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching block types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/levels', async (req, res) => {
    const pool = req.pool;
    try {
        const result = await pool.query('SELECT id, name FROM block_levels ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching block levels:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/states', async (req, res) => {
    const pool = req.pool;
    try {
        const result = await pool.query('SELECT id, name FROM block_states ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching block states:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id/history', authenticateToken, async (req, res) => {
    const pool = req.pool;
    try {
        const blockId = req.params.id;
        const historyResult = await pool.query(
            'SELECT * FROM get_block_history_for_user($1, $2)',
            [blockId, req.user.id]
        );
        res.json(historyResult.rows);
    } catch (error) {
        console.error('Error fetching block history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
