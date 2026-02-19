const Employee = require('../models/Employee');

const employeeController = {
    async getAll(req, res) {
        const employees = await Employee.findAll();
        res.json(employees);
    },

    async getById(req, res) {
        const employee = await Employee.findById(req.params.id);
        if (employee) res.json(employee);
        else res.status(404).json({ message: 'Employee not found' });
    },

    async create(req, res) {
        const newEmployee = await Employee.create(req.body);
        res.status(201).json(newEmployee);
    },

    async update(req, res) {
        const updated = await Employee.update(req.params.id, req.body);
        if (updated) res.json(updated);
        else res.status(404).json({ message: 'Employee not found' });
    },

    async delete(req, res) {
        await Employee.delete(req.params.id);
        res.status(204).send();
    }
};

module.exports = employeeController;
