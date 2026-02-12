const { readData, writeData } = require('../utils/storage');

const FILE_NAME = 'payroll.json';
const EMP_FILE = 'employees.json';

// Get all payroll
exports.getAllPayroll = async (req, res) => {
    try {
        const payroll = await readData(FILE_NAME);
        const employees = await readData(EMP_FILE);

        const mappedPayroll = payroll.map(p => ({
            ...p,
            employeeName: employees.find(e => e.id === p.employee_id)?.name || 'Unknown'
        }));

        res.json(mappedPayroll.sort((a, b) => b.year - a.year || b.month - a.month));
    } catch (error) {
        console.error('Get payroll error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Generate payroll
exports.generatePayroll = async (req, res) => {
    try {
        const { month, year } = req.body;
        const employees = await readData(EMP_FILE);
        const activeEmployees = employees.filter(emp => emp.status === 'Active');
        const payroll = await readData(FILE_NAME);

        for (const emp of activeEmployees) {
            const allowances = emp.salary * 0.15; // 15% allowances
            const deductions = emp.salary * 0.12; // 12% deductions (Tax + PF)
            const net_pay = emp.salary + allowances - deductions;

            const existing = payroll.find(p => p.employee_id === emp.id && p.month === month && p.year === year);

            if (!existing) {
                const newRecord = {
                    id: payroll.length > 0 ? Math.max(...payroll.map(p => p.id)) + 1 : 1,
                    employee_id: emp.id,
                    month,
                    year,
                    base_salary: emp.salary,
                    allowances,
                    deductions,
                    net_pay,
                    tax_status: true,
                    pf_status: true,
                    esi_status: true,
                    created_at: new Date().toISOString()
                };
                payroll.push(newRecord);
            }
        }

        await writeData(FILE_NAME, payroll);
        res.json({ message: 'Payroll generated successfully' });
    } catch (error) {
        console.error('Generate payroll error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get employee payroll
exports.getEmployeePayroll = async (req, res) => {
    try {
        const payroll = await readData(FILE_NAME);
        const records = payroll.filter(p => p.employee_id === parseInt(req.params.employeeId));
        res.json(records.sort((a, b) => b.year - a.year || b.month - a.month));
    } catch (error) {
        console.error('Get employee payroll error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Update payroll record
exports.updatePayroll = async (req, res) => {
    try {
        const { base_salary, allowances, deductions } = req.body;
        const payroll = await readData(FILE_NAME);
        const recordId = parseInt(req.params.id);

        console.log(`[Payroll] Update Request - ID: ${recordId}, Body:`, req.body);

        const index = payroll.findIndex(p => p.id === recordId);

        if (index === -1) {
            console.warn(`[Payroll] Record not found for ID: ${recordId}`);
            return res.status(404).json({ message: `Payroll record with ID ${recordId} not found` });
        }

        // Ensure we have numbers
        const base = parseFloat(base_salary || 0);
        const allow = parseFloat(allowances || 0);
        const deduct = parseFloat(deductions || 0);

        if (isNaN(base) || isNaN(allow) || isNaN(deduct)) {
            return res.status(400).json({ message: 'Invalid salary values provided' });
        }

        const net_pay = base + allow - deduct;

        payroll[index] = {
            ...payroll[index],
            base_salary: base,
            allowances: allow,
            deductions: deduct,
            net_pay,
            updated_at: new Date().toISOString()
        };

        await writeData(FILE_NAME, payroll);
        console.log(`[Payroll] Successfully updated record ${recordId}. New Net Pay: ${net_pay}`);
        res.json({ message: 'Payroll updated successfully', record: payroll[index] });
    } catch (error) {
        console.error('Update payroll error:', error);
        res.status(500).json({ message: 'Server error during payroll update' });
    }
};
