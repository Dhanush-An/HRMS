const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, announcementController.getAllAnnouncements);
router.post('/', authMiddleware, adminOnly, announcementController.createAnnouncement);

module.exports = router;
