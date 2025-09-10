// ✅ CORRECT - therapist.routes.js
const express = require('express');
const router = express.Router();
const therapistController = require('../controllers/therapist.controller'); // Check this path!
const { authenticate } = require('../middleware/auth.middleware');







// ✅ Make sure all these functions exist in the controller
router.post('/register', authenticate, therapistController.registerTherapist);
router.get('/profile', authenticate, therapistController.getMyProfile);
router.get('/search', therapistController.searchTherapists);
router.get('/:id', therapistController.getTherapist);
router.put('/:id', authenticate, therapistController.updateProfile);

module.exports = router;
