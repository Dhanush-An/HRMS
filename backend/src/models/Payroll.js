const fs = require('fs-extra');
const path = require('path');
const { DATA_DIR } = require('../config/db');

const FILE_NAME = 'payroll.json';
const FILE_PATH = path.join(DATA_DIR, FILE_NAME);

const Payroll = {
    async findAll() {
        try {
            if (!(await fs.pathExists(FILE_PATH))) return [];
            return await fs.readJson(FILE_PATH);
        } catch (error) {
            return [];
        }
    },

    async createMany(records) {
        const payroll = await this.findAll();
        const updatedPayroll = [...payroll, ...records];
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(FILE_PATH, updatedPayroll, { spaces: 2 });
        return records.length;
    },

    async update(id, data) {
        const payroll = await this.findAll();
        const index = payroll.findIndex(p => String(p.id) === String(id));
        if (index !== -1) {
            payroll[index] = { ...payroll[index], ...data };
            await fs.writeJson(FILE_PATH, payroll, { spaces: 2 });
            return payroll[index];
        }
        return null;
    }
};

module.exports = Payroll;
