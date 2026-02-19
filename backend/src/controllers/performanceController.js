const Performance = require('../models/Performance');

const performanceController = {
    async getAll(req, res) {
        const records = await Performance.findAll();
        res.json(records);
    }
};

module.exports = performanceController;
