const express = require('express');
const { pool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add question to block
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { blockId, textoPregunta, tema, respuestas, difficulty = 1, explicacionRespuesta } = req.body;

    console.log(`📝 Backend received question:`, {
      blockId,
      tema,
      question: textoPregunta.substring(0, 50) + '...'
    });

    // CRITICAL: Validate that tema is preserved (topic separation protection)
    if (!tema || tema.trim() === '' || tema === 'General') {
      console.error('🚨 CRITICAL: Question received with invalid/missing tema:', { tema, blockId, question: textoPregunta.substring(0, 30) });
      return res.status(400).json({ 
        error: 'CRITICAL: Topic (tema) is required and cannot be empty or "General". Topic separation functionality compromised.',
        receivedTema: tema
      });
    }

    if (!blockId || !textoPregunta || !respuestas || respuestas.length < 2) {
      return res.status(400).json({ 
        error: 'Block ID, question text, and at least 2 answers are required' 
      });
    }

    // Check if user owns the block
    const blockCheck = await client.query(`
      SELECT b.id, ur.user_id 
      FROM blocks b
      LEFT JOIN user_roles ur ON b.user_role_id = ur.id
      WHERE b.id = $1
    `, [blockId]);

    if (blockCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    if (blockCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add questions to this block' });
    }

    // Create question
    const questionResult = await client.query(
      'INSERT INTO questions (block_id, text_question, topic, difficulty, explanation) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [blockId, textoPregunta, tema, difficulty, explicacionRespuesta]
    );

    const questionId = questionResult.rows[0].id;

    // Add answers
    for (const respuesta of respuestas) {
      await client.query(
        'INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)',
        [questionId, respuesta.textoRespuesta, respuesta.esCorrecta]
      );
    }

    // Update statistics tables: block_answers and topic_answers
    console.log('📊 Updating statistics tables...');
    
    // Update or insert block_answers (total questions per block)
    await client.query(`
      INSERT INTO block_answers (block_id, total_questions) 
      VALUES ($1, 1) 
      ON CONFLICT (block_id) 
      DO UPDATE SET 
        total_questions = block_answers.total_questions + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [blockId]);

    // Update or insert topic_answers (total questions per topic in block)
    await client.query(`
      INSERT INTO topic_answers (block_id, topic, total_questions) 
      VALUES ($1, $2, 1) 
      ON CONFLICT (block_id, topic) 
      DO UPDATE SET 
        total_questions = topic_answers.total_questions + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [blockId, tema]);

    console.log(`✅ Statistics updated - Block ${blockId}, Topic: ${tema}`);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Question added successfully',
      questionId: questionId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Update question
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const questionId = req.params.id;
    const { textoPregunta, tema, respuestas, difficulty } = req.body;

    // Check if user owns the question's block
    const ownerCheck = await client.query(`
      SELECT b.id, ur.user_id
      FROM questions q
      JOIN blocks b ON q.block_id = b.id
      LEFT JOIN user_roles ur ON b.user_role_id = ur.id
      WHERE q.id = $1
    `, [questionId]);

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this question' });
    }

    // Update question
    await client.query(
      'UPDATE questions SET text_question = $1, topic = $2, difficulty = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [textoPregunta, tema, difficulty, questionId]
    );

    // Delete old answers and add new ones
    await client.query('DELETE FROM answers WHERE question_id = $1', [questionId]);

    for (const respuesta of respuestas) {
      await client.query(
        'INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)',
        [questionId, respuesta.textoRespuesta, respuesta.esCorrecta]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Question updated successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete question
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;

    // Check if user owns the question's block
    const ownerCheck = await pool.query(`
      SELECT b.id, ur.user_id
      FROM questions q
      JOIN blocks b ON q.block_id = b.id
      LEFT JOIN user_roles ur ON b.user_role_id = ur.id
      WHERE q.id = $1
    `, [questionId]);

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk add questions
router.post('/bulk', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { blockId, questions } = req.body;

    console.log(`📝 Backend received bulk questions:`, {
      blockId,
      questionCount: questions?.length || 0
    });

    if (!blockId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        error: 'Block ID and questions array are required'
      });
    }

    // Check if user owns the block (support both oposiciones blocks and regular blocks)
    // First try oposiciones blocks (bloques_temas)
    let blockCheck = await client.query(`
      SELECT bt.id, o.profesor_id as user_id
      FROM bloques_temas bt
      JOIN oposiciones o ON bt.oposicion_id = o.id
      WHERE bt.id = $1
    `, [blockId]);

    // If not found in oposiciones, try regular blocks
    if (blockCheck.rows.length === 0) {
      blockCheck = await client.query(`
        SELECT b.id, ur.user_id
        FROM blocks b
        LEFT JOIN user_roles ur ON b.user_role_id = ur.id
        WHERE b.id = $1
      `, [blockId]);
    }

    if (blockCheck.rows.length === 0) {
      console.error(`❌ Block ${blockId} not found in bloques_temas or blocks tables`);
      return res.status(404).json({ error: 'Block not found' });
    }

    if (blockCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add questions to this block' });
    }

    const createdQuestions = [];
    const topicCounts = {};
    const temaIds = {}; // Map tema names to IDs for oposiciones

    // Determine if this is an oposiciones block
    const isOposicionesCheck = await client.query(
      'SELECT 1 FROM bloques_temas WHERE id = $1',
      [blockId]
    );
    const isOposicionesBlock = isOposicionesCheck.rows.length > 0;

    console.log(`📦 Block ${blockId} is ${isOposicionesBlock ? 'OPOSICIONES' : 'REGULAR'} block`);

    // Process each question
    for (const questionData of questions) {
      const { textoPregunta, tema, respuestas, difficulty = 1, explicacionRespuesta } = questionData;

      // CRITICAL: Validate that tema is preserved (topic separation protection)
      if (!tema || tema.trim() === '' || tema === 'General') {
        console.error('🚨 CRITICAL: Question received with invalid/missing tema:', { tema, blockId, question: textoPregunta?.substring(0, 30) });
        return res.status(400).json({
          error: 'CRITICAL: Topic (tema) is required and cannot be empty or \"General\". Topic separation functionality compromised.',
          receivedTema: tema
        });
      }

      if (!textoPregunta || !respuestas || respuestas.length < 2) {
        return res.status(400).json({
          error: 'Question text and at least 2 answers are required for each question'
        });
      }

      let questionResult;

      // For oposiciones blocks, find or create tema and use tema_id
      if (isOposicionesBlock) {
        let temaId;

        // Check if we already processed this tema
        if (temaIds[tema]) {
          temaId = temaIds[tema];
        } else {
          // Find or create tema
          let temaResult = await client.query(
            'SELECT id FROM temas WHERE bloque_id = $1 AND nombre = $2',
            [blockId, tema]
          );

          if (temaResult.rows.length === 0) {
            // Create new tema
            const maxOrdenResult = await client.query(
              'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM temas WHERE bloque_id = $1',
              [blockId]
            );
            const nextOrden = maxOrdenResult.rows[0].next_orden;

            const newTemaResult = await client.query(
              'INSERT INTO temas (bloque_id, nombre, orden) VALUES ($1, $2, $3) RETURNING id',
              [blockId, tema, nextOrden]
            );
            temaId = newTemaResult.rows[0].id;
            console.log(`✨ Created new tema: "${tema}" (ID: ${temaId}) in block ${blockId}`);
          } else {
            temaId = temaResult.rows[0].id;
          }

          temaIds[tema] = temaId;
        }

        // Insert question with tema_id (block_id NULL for oposiciones)
        questionResult = await client.query(
          'INSERT INTO questions (tema_id, text_question, topic, difficulty, explanation) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [temaId, textoPregunta, tema, difficulty, explicacionRespuesta]
        );
      } else {
        // For regular blocks, use block_id as before
        questionResult = await client.query(
          'INSERT INTO questions (block_id, text_question, topic, difficulty, explanation) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [blockId, textoPregunta, tema, difficulty, explicacionRespuesta]
        );
      }

      const questionId = questionResult.rows[0].id;
      createdQuestions.push(questionId);

      // Add answers
      for (const respuesta of respuestas) {
        await client.query(
          'INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)',
          [questionId, respuesta.textoRespuesta, respuesta.esCorrecta]
        );
      }

      // Count topics for bulk statistics update
      topicCounts[tema] = (topicCounts[tema] || 0) + 1;
    }

    // Update statistics tables in bulk
    console.log('📊 Updating statistics tables for bulk operation...');

    if (isOposicionesBlock) {
      // For oposiciones: Update temas num_preguntas
      for (const [tema, temaId] of Object.entries(temaIds)) {
        const questionCount = topicCounts[tema] || 0;
        await client.query(
          'UPDATE temas SET num_preguntas = num_preguntas + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [questionCount, temaId]
        );
      }

      // Update bloques_temas total_preguntas
      await client.query(
        'UPDATE bloques_temas SET total_preguntas = total_preguntas + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [questions.length, blockId]
      );

      console.log(`✅ Oposiciones statistics updated - Block ${blockId}, ${questions.length} questions, Temas: ${Object.keys(temaIds).join(', ')}`);
    } else {
      // For regular blocks: Update block_answers and topic_answers
      await client.query(`
        INSERT INTO block_answers (block_id, total_questions)
        VALUES ($1, $2)
        ON CONFLICT (block_id)
        DO UPDATE SET
          total_questions = block_answers.total_questions + $2,
          updated_at = CURRENT_TIMESTAMP
      `, [blockId, questions.length]);

      // Update topic_answers (total questions per topic in block)
      for (const [topic, count] of Object.entries(topicCounts)) {
        await client.query(`
          INSERT INTO topic_answers (block_id, topic, total_questions)
          VALUES ($1, $2, $3)
          ON CONFLICT (block_id, topic)
          DO UPDATE SET
            total_questions = topic_answers.total_questions + $3,
            updated_at = CURRENT_TIMESTAMP
        `, [blockId, topic, count]);
      }

      console.log(`✅ Regular block statistics updated - Block ${blockId}, ${questions.length} questions, Topics: ${Object.keys(topicCounts).join(', ')}`);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `${questions.length} questions added successfully`,
      questionIds: createdQuestions,
      questionsCreated: questions.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding bulk questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;