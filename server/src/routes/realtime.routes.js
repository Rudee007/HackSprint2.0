// src/routes/realtime.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const realtimeSessionController = require('../controllers/realtime/session.controller');

// All real-time routes require authentication
router.use(authenticate);

// Session management
router.get('/session/:sessionId', realtimeSessionController.getSessionDetails);
router.put('/session/:sessionId/status', realtimeSessionController.updateSessionStatus);
router.post('/session/:sessionId/join', realtimeSessionController.joinSession);
router.post('/session/:sessionId/start', realtimeSessionController.startSession);

module.exports = router;
