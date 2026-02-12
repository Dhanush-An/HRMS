const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, payrollController.getAllPayroll);
router.post('/generate', authMiddleware, adminOnly, payrollController.generatePayroll);
router.put('/:id', authMiddleware, adminOnly, payrollController.updatePayroll);
router.get('/employee/:employeeId', authMiddleware, payrollController.getEmployeePayroll);

module.exports = router;
