const fs = require('fs-extra');
const path = require('path');
const { DATA_DIR } = require('../config/db');

const FILE_NAME = 'performance.json';
const FILE_PATH = path.join(DATA_DIR, FILE_NAME);

const Performance = {
    async findAll() {
        try {
            if (!(await fs.pathExists(FILE_PATH))) return [];
            return await fs.readJson(FILE_PATH);
        } catch (error) {
            return [];
        }
    }
};

module.exports = Performance;
