const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');

router.get('/', performanceController.getAll);

module.exports = router;
