const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware: protect } = require('../middleware/auth');

router.post('/', protect, reportController.createReport);
router.get('/', protect, reportController.getAllReports);
router.get('/my-reports', protect, reportController.getEmployeeReports);

module.exports = router;
