const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

router.put('/:id/profile',authenticate, userController.updateProfile);

module.exports = router;




