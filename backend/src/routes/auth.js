const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/pending', authMiddleware, authController.getPendingRegistrations);
router.post('/approve', authMiddleware, authController.approveRegistration);
router.post('/reject', authMiddleware, authController.rejectRegistration);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
