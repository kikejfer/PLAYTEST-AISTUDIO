const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Endpoint para obtener una pregunta aleatoria
router.get('/question', gameController.getQuestion);

module.exports = router;
