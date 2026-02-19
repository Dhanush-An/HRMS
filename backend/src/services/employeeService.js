const Employee = require('../models/Employee');

const employeeService = {
    async createWithRecord(data) {
        // Business logic for complex employee creation
        return await Employee.create(data);
    },

    async processTermination(id) {
        // Logic for employee termination logic
        const employee = await Employee.findById(id);
        if (employee) {
            return await Employee.update(id, { status: 'Terminated', endDate: new Date() });
        }
    }
};

module.exports = employeeService;
