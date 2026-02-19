const fs = require('fs-extra');
const path = require('path');
const { DATA_DIR } = require('../config/db');

const FILE_NAME = 'attendance.json';
const FILE_PATH = path.join(DATA_DIR, FILE_NAME);

const Attendance = {
    async findAll() {
        try {
            if (!(await fs.pathExists(FILE_PATH))) return [];
            return await fs.readJson(FILE_PATH);
        } catch (error) {
            return [];
        }
    },

    async findByEmployee(employeeId) {
        const attendance = await this.findAll();
        return attendance.filter(att => String(att.employeeId) === String(employeeId));
    },

    async create(data) {
        const attendance = await this.findAll();
        const record = { ...data, id: Date.now() };
        attendance.push(record);
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(FILE_PATH, attendance, { spaces: 2 });
        return record;
    },

    async findToday(employeeId) {
        const attendance = await this.findAll();
        const today = new Date().toISOString().split('T')[0];
        return attendance.find(att =>
            String(att.employeeId) === String(employeeId) &&
            att.date === today &&
            !att.check_out
        );
    },

    async update(id, data) {
        const attendance = await this.findAll();
        const index = attendance.findIndex(att => String(att.id) === String(id));
        if (index !== -1) {
            attendance[index] = { ...attendance[index], ...data };
            await fs.writeJson(FILE_PATH, attendance, { spaces: 2 });
            return attendance[index];
        }
        return null;
    }
};

module.exports = Attendance;
