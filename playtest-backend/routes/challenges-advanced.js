const express = require('express');
const router = express.Router();
// Correct Import: Get the function to retrieve the pool.
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

// These will be initialized after we get the pool.
let ChallengesValidator, ChallengesNotificationSystem, ChallengesAnalytics;
let validator, notificationSystem, analytics;

// Middleware to inject the database pool and initialize services.
const initializeServices = (req, res, next) => {
    try {
        const pool = getPool();
        req.pool = pool;

        // Initialize services with the pool if they haven't been already.
        if (!validator) {
            ChallengesValidator = require('../challenges-validator');
            ChallengesNotificationSystem = require('../challenges-notifications');
            ChallengesAnalytics = require('../challenges-analytics');

            validator = new ChallengesValidator(pool);
            notificationSystem = new ChallengesNotificationSystem(pool);
            analytics = new ChallengesAnalytics(pool);
        }

        // Make services available in the request object
        req.validator = validator;
        req.notificationSystem = notificationSystem;
        req.analytics = analytics;

        next();
    } catch (error) {
        console.error("Failed to initialize services in challenges-advanced.js", error);
        res.status(500).json({ error: 'Service initialization failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(initializeServices);


// ==================== VALIDACIONES Y PROGRESO ====================

// Now, all routes will use req.validator, req.notificationSystem, etc.
// which are all using the correct, centralized database pool.

router.post('/validate-progress/:participantId', authenticateToken, async (req, res) => {
    try {
        const result = await req.validator.processAutomaticValidation(req.params.participantId);
        res.json({ success: true, validation_result: result });
    } catch (error) {
        console.error('Error validating progress:', error);
        res.status(500).json({ error: 'Error validando progreso', details: error.message });
    }
});

// ... (The rest of the file's routes will be updated to use req.pool or the req services)

module.exports = router;