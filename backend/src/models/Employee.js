const fs = require('fs-extra');
const path = require('path');
const { DATA_DIR } = require('../config/db');

const FILE_NAME = 'employees.json';
const FILE_PATH = path.join(DATA_DIR, FILE_NAME);

const Employee = {
    async findAll() {
        try {
            if (!(await fs.pathExists(FILE_PATH))) return [];
            return await fs.readJson(FILE_PATH);
        } catch (error) {
            console.error('Model Error (findAll):', error.message);
            return [];
        }
    },

    async findById(id) {
        const employees = await this.findAll();
        return employees.find(emp => String(emp.id) === String(id));
    },

    async findByEmail(email) {
        const employees = await this.findAll();
        return employees.find(emp => String(emp.email).toLowerCase() === String(email).toLowerCase());
    },

    async create(data) {
        const employees = await this.findAll();
        const newEmployee = { ...data, id: Date.now() };
        employees.push(newEmployee);
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(FILE_PATH, employees, { spaces: 2 });
        return newEmployee;
    },

    async update(id, data) {
        const employees = await this.findAll();
        const index = employees.findIndex(emp => String(emp.id) === String(id));
        if (index !== -1) {
            employees[index] = { ...employees[index], ...data };
            await fs.writeJson(FILE_PATH, employees, { spaces: 2 });
            return employees[index];
        }
        return null;
    },

    async delete(id) {
        let employees = await this.findAll();
        employees = employees.filter(emp => String(emp.id) !== String(id));
        await fs.writeJson(FILE_PATH, employees, { spaces: 2 });
        return true;
    }
};

module.exports = Employee;
