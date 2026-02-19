const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

router.get('/', leaveController.getAll);
router.post('/', leaveController.create);
router.put('/:id', leaveController.updateStatus);

module.exports = router;
