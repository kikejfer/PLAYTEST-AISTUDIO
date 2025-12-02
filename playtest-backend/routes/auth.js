const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// User registration
router.post('/register', registerUser);

// User login
router.post('/login', loginUser);

// Verify token route - protected
router.get('/verify', authenticateToken, (req, res) => {
  // If authenticateToken middleware succeeds, the user is valid.
  res.status(200).json({
    message: 'Token is valid',
    user: req.user // req.user is populated by the middleware
  });
});

module.exports = router;
