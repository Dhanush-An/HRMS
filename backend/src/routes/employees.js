const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware, adminOnly, adminOrSelf } = require('../middleware/auth');

router.get('/', authMiddleware, employeeController.getAllEmployees);
router.get('/:id', authMiddleware, employeeController.getEmployeeById);
router.post('/', authMiddleware, adminOnly, employeeController.createEmployee);
router.put('/:id', authMiddleware, adminOrSelf, employeeController.updateEmployee);
router.delete('/:id', authMiddleware, adminOnly, employeeController.deleteEmployee);

module.exports = router;
