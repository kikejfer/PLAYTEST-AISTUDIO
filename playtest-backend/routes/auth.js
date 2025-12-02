
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// User registration
router.post('/register', (req, res) => {
  // Mock registration logic
  console.log('Registration attempt:', req.body);
  // Simulate successful registration
  res.redirect(302, '/first-steps.html');
});

// User login
router.post('/login', authController.login);

// Verify token
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router;
