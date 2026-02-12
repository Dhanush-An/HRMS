const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, attendanceController.getAllAttendance);
router.post('/checkin', authMiddleware, attendanceController.clockIn);
router.post('/checkout', authMiddleware, attendanceController.clockOut);
router.get('/employee/:employeeId', authMiddleware, attendanceController.getEmployeeAttendance);

module.exports = router;
