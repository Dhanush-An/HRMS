const fs = require('fs-extra');
const path = require('path');
const { DATA_DIR } = require('../config/db');

const FILE_NAME = 'leaves.json';
const FILE_PATH = path.join(DATA_DIR, FILE_NAME);

const Leave = {
    async findAll() {
        try {
            if (!(await fs.pathExists(FILE_PATH))) return [];
            return await fs.readJson(FILE_PATH);
        } catch (error) {
            return [];
        }
    },

    async create(data) {
        const leaves = await this.findAll();
        const record = {
            ...data,
            id: Date.now(),
            status: 'Pending',
            applied_on: new Date().toISOString().split('T')[0]
        };
        leaves.push(record);
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(FILE_PATH, leaves, { spaces: 2 });
        return record;
    },

    async update(id, data) {
        const leaves = await this.findAll();
        const index = leaves.findIndex(l => String(l.id) === String(id));
        if (index !== -1) {
            leaves[index] = { ...leaves[index], ...data };
            await fs.writeJson(FILE_PATH, leaves, { spaces: 2 });
            return leaves[index];
        }
        return null;
    }
};

module.exports = Leave;
