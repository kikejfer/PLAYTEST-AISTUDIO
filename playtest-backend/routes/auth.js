
const express = require('express');
const router = express.Router();
// const authController = require('../controllers/authController'); // Temporarily removed
const { authenticateToken } = require('../middleware/auth');

// User registration
router.post('/register', (req, res) => {
  // Mock registration logic
  console.log('Registration attempt:', req.body);
  // Simulate successful registration
  res.redirect(302, '/first-steps.html');
});

// User login - Temporarily simplified to avoid dependency error
router.post('/login', (req, res) => {
    res.status(501).send('Login not implemented');
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.status(200).json({
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router;
