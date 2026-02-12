const { readData, writeData } = require('../utils/storage');
const FILE_NAME = 'announcements.json';

// Get all announcements
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await readData(FILE_NAME);
        // Sort by date/time descending (newest first)
        const sorted = announcements.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        res.json(sorted);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const announcements = await readData(FILE_NAME);
        const newAnnouncement = {
            id: Date.now(),
            ...req.body,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        announcements.push(newAnnouncement);
        await writeData(FILE_NAME, announcements);

        res.status(201).json(newAnnouncement);
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
