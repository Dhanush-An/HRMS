const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

const payrollController = {
    async getAll(req, res) {
        const payroll = await Payroll.findAll();
        res.json(payroll);
    },

    async generate(req, res) {
        const { month, year } = req.body;
        const employees = await Employee.findAll();

        const newRecords = employees.map(emp => ({
            id: Date.now() + Math.random(),
            employee_id: emp.id,
            employee_name: emp.name,
            base_salary: emp.salary || 50000,
            month,
            year,
            net_pay: (emp.salary || 50000) * 0.9,
            status: 'Pending',
            payment_date: null
        }));

        const count = await Payroll.createMany(newRecords);
        res.status(201).json({ message: 'Payroll generated successfully', count });
    },

    async update(req, res) {
        const updated = await Payroll.update(req.params.id, req.body);
        if (updated) res.json({ record: updated });
        else res.status(404).json({ message: 'Payroll record not found' });
    }
};

module.exports = payrollController;
