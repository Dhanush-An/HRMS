const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, leaveController.getAllLeaves);
router.post('/', authMiddleware, leaveController.createLeave);
router.put('/:id', authMiddleware, adminOnly, leaveController.updateLeaveStatus);
router.get('/employee/:employeeId', authMiddleware, leaveController.getEmployeeLeaves);

module.exports = router;
