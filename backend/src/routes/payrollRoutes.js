const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

router.get('/', payrollController.getAll);
router.post('/generate', payrollController.generate);
router.put('/:id', payrollController.update);

module.exports = router;
