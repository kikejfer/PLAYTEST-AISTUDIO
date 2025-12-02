document.addEventListener('DOMContentLoaded', () => {
  const questionText = document.getElementById('question-text');
  const answersContainer = document.getElementById('answers-container');
  const feedbackText = document.getElementById('feedback-text');
  const scoreElement = document.getElementById('score');

  let score = 0;
  let currentQuestion = null;

  const fetchQuestion = async () => {
    try {
      const response = await fetch('https://playtest-backend.onrender.com/api/game/question');
      if (!response.ok) {
        throw new Error('Error al cargar la pregunta');
      }
      currentQuestion = await response.json();
      renderQuestion(currentQuestion);
    } catch (error) {
      console.error(error);
      questionText.textContent = 'No se pudo cargar la pregunta. Inténtalo de nuevo más tarde.';
    }
  };

  const renderQuestion = (question) => {
    questionText.textContent = question.question_text;
    answersContainer.innerHTML = '';
    question.answers.forEach(answer => {
      const answerButton = document.createElement('button');
      answerButton.classList.add('answer-btn');
      answerButton.textContent = answer.answer_text;
      answerButton.dataset.answerId = answer.answer_id;
      answerButton.addEventListener('click', handleAnswerClick);
      answersContainer.appendChild(answerButton);
    });
  };

  const handleAnswerClick = (event) => {
    const selectedAnswerId = event.target.dataset.answerId;
    // Lógica para comprobar la respuesta (se implementará más adelante)
    console.log(`Respuesta seleccionada: ${selectedAnswerId}`); 
    feedbackText.textContent = `Has seleccionado la respuesta con ID ${selectedAnswerId}`;
  };

  // Iniciar el juego cargando la primera pregunta
  fetchQuestion();
});
