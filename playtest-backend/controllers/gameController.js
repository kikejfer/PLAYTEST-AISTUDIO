const pool = require('../database/connection');

// Obtener una pregunta aleatoria
const getQuestion = async (req, res) => {
  try {
    // Por ahora, simplemente obtenemos la primera pregunta. 
    // Más adelante implementaremos una selección aleatoria y gestión de dificultad.
    const result = await pool.query(`
      SELECT 
        q.question_id, q.question_text, 
        json_agg(json_build_object('answer_id', a.answer_id, 'answer_text', a.answer_text, 'is_correct', a.is_correct)) as answers
      FROM questions q
      JOIN answers a ON q.question_id = a.question_id
      GROUP BY q.question_id, q.question_text
      ORDER BY random()
      LIMIT 1;
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron preguntas' });
    }

    const question = result.rows[0];

    // La query devuelve todas las respuestas con la propiedad is_correct.
    // Para el frontend, no debemos enviar si la respuesta es correcta o no.
    // Simplemente barajamos las respuestas y las enviamos.
    const sanitizedAnswers = question.answers.map(({ answer_id, answer_text }) => ({ answer_id, answer_text }));
    
    // Barajar las respuestas para que no aparezcan siempre en el mismo orden
    const shuffledAnswers = sanitizedAnswers.sort(() => Math.random() - 0.5);

    res.json({
      question_id: question.question_id,
      question_text: question.question_text,
      answers: shuffledAnswers
    });

  } catch (error) {
    console.error('Error al obtener la pregunta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getQuestion,
};
