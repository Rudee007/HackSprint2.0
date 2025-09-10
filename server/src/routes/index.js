const express = require('express');
const router = express.Router();


router.use('/auth', require('./auth.routes'));
router.use('/doctors', require('./doctor.routes'));
router.use('/therapists', require('./therapist.routes')); // Add this line
router.use('/consultations', require('./consultation.routes')); // ← Ensure this exists
router.use('/booking',require('./booking.routes'));
// src/routes/index.js
router.use('/realtime', require('./realtime.routes'));

router.use('/users', require('./user.routes'));
router.use('/scheduling', require('./scheduling.routes'));
// router.use('/therapy', require('./therapy.routes'));
router.use('/feedback', require('./feedback.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
