const Payroll = require('../models/Payroll');

const payrollService = {
    async calculateTaxes(salary) {
        return salary * 0.1; // Default 10% tax calculation
    },

    async processBatch(records) {
        return await Payroll.createMany(records);
    }
};

module.exports = payrollService;
