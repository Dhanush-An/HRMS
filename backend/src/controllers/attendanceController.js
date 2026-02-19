const Attendance = require('../models/Attendance');

const attendanceController = {
    async getAll(req, res) {
        const attendance = await Attendance.findAll();
        res.json(attendance);
    },

    async getByEmployee(req, res) {
        const attendance = await Attendance.findByEmployee(req.params.employeeId);
        res.json(attendance);
    },

    async checkIn(req, res) {
        const record = await Attendance.create({
            employeeId: req.body.employee_id,
            date: new Date().toISOString().split('T')[0],
            check_in: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Present'
        });
        res.status(201).json(record);
    },

    async checkOut(req, res) {
        const activeRecord = await Attendance.findToday(req.body.employee_id);
        if (activeRecord) {
            const updated = await Attendance.update(activeRecord.id, {
                check_out: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            res.json(updated);
        } else {
            res.status(404).json({ message: 'No active check-in found for today' });
        }
    }
};

module.exports = attendanceController;
