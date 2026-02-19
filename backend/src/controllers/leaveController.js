const Leave = require('../models/Leave');

const leaveController = {
    async getAll(req, res) {
        const leaves = await Leave.findAll();
        res.json(leaves);
    },

    async create(req, res) {
        const newLeave = await Leave.create(req.body);
        res.status(201).json(newLeave);
    },

    async updateStatus(req, res) {
        const updated = await Leave.update(req.params.id, req.body);
        if (updated) res.json(updated);
        else res.status(404).json({ message: 'Leave request not found' });
    }
};

module.exports = leaveController;
