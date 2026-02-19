const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, '../data');

// Helper to read/write JSON files
const readData = async (file) => {
    const filePath = path.join(DATA_DIR, file);
    try {
        if (!(await fs.pathExists(filePath))) {
            return [];
        }
        return await fs.readJson(filePath);
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
};

const writeData = async (file, data) => {
    const filePath = path.join(DATA_DIR, file);
    await fs.ensureDir(DATA_DIR);
    await fs.writeJson(filePath, data, { spaces: 2 });
};

// --- AUTH ROUTE ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    const employees = await readData('employees.json');
    const user = employees.find(e =>
        e.email === email &&
        e.password === password
    );

    if (user) {
        const { password, ...userWithoutPassword } = user;
        // Mock token and role for stability
        res.json({
            user: userWithoutPassword,
            token: 'mock-jwt-token',
            role: user.role === 'HR Manager' ? 'Admin' : 'Employee'
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    // For simplicity, return first active user if token exists
    const employees = await readData('employees.json');
    const user = employees[0];
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// --- EMPLOYEES ROUTES ---
app.get('/api/employees', async (req, res) => {
    const employees = await readData('employees.json');
    res.json(employees);
});

app.get('/api/employees/:id', async (req, res) => {
    const employees = await readData('employees.json');
    const employee = employees.find(e => e.id === parseInt(req.params.id));
    if (employee) res.json(employee);
    else res.status(404).json({ error: 'Employee not found' });
});

app.post('/api/employees', async (req, res) => {
    const employees = await readData('employees.json');
    const newEmployee = { ...req.body, id: Date.now() };
    employees.push(newEmployee);
    await writeData('employees.json', employees);
    res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', async (req, res) => {
    const employees = await readData('employees.json');
    const index = employees.findIndex(e => e.id === parseInt(req.params.id));
    if (index !== -1) {
        employees[index] = { ...employees[index], ...req.body };
        await writeData('employees.json', employees);
        res.json(employees[index]);
    } else {
        res.status(404).json({ error: 'Employee not found' });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    let employees = await readData('employees.json');
    employees = employees.filter(e => e.id !== parseInt(req.params.id));
    await writeData('employees.json', employees);
    res.status(204).send();
});

// --- ATTENDANCE ROUTES ---
app.get('/api/attendance', async (req, res) => {
    const attendance = await readData('attendance.json');
    res.json(attendance);
});

app.get('/api/attendance/employee/:employeeId', async (req, res) => {
    const attendance = await readData('attendance.json');
    const filtered = attendance.filter(a => String(a.employeeId) === String(req.params.employeeId));
    res.json(filtered);
});

app.post('/api/attendance/checkin', async (req, res) => {
    const attendance = await readData('attendance.json');
    const record = {
        id: Date.now(),
        employeeId: req.body.employee_id,
        date: new Date().toISOString().split('T')[0],
        check_in: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Present'
    };
    attendance.push(record);
    await writeData('attendance.json', attendance);
    res.status(201).json(record);
});

app.post('/api/attendance/checkout', async (req, res) => {
    const attendance = await readData('attendance.json');
    const today = new Date().toISOString().split('T')[0];
    const index = attendance.findIndex(a =>
        String(a.employeeId) === String(req.body.employee_id) &&
        a.date === today &&
        !a.check_out
    );
    if (index !== -1) {
        attendance[index].check_out = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await writeData('attendance.json', attendance);
        res.json(attendance[index]);
    } else {
        res.status(404).json({ message: 'No active check-in found for today' });
    }
});

// --- LEAVES ROUTES ---
app.get('/api/leaves', async (req, res) => {
    const leaves = await readData('leaves.json');
    res.json(leaves);
});

app.get('/api/leaves/employee/:employeeId', async (req, res) => {
    const leaves = await readData('leaves.json');
    const filtered = leaves.filter(l => String(l.employeeId) === String(req.params.employeeId));
    res.json(filtered);
});

app.post('/api/leaves', async (req, res) => {
    const leaves = await readData('leaves.json');
    const newLeave = {
        ...req.body,
        id: Date.now(),
        status: 'Pending',
        applied_on: new Date().toISOString().split('T')[0]
    };
    leaves.push(newLeave);
    await writeData('leaves.json', leaves);
    res.status(201).json(newLeave);
});

app.put('/api/leaves/:id', async (req, res) => {
    const leaves = await readData('leaves.json');
    const index = leaves.findIndex(l => l.id === parseInt(req.params.id));
    if (index !== -1) {
        leaves[index] = { ...leaves[index], ...req.body };
        await writeData('leaves.json', leaves);
        res.json(leaves[index]);
    } else {
        res.status(404).json({ error: 'Leave request not found' });
    }
});

// --- PAYROLL ROUTES ---
app.get('/api/payroll', async (req, res) => {
    const payroll = await readData('payroll.json');
    res.json(payroll);
});

app.get('/api/payroll/employee/:employeeId', async (req, res) => {
    const payroll = await readData('payroll.json');
    const filtered = payroll.filter(p => String(p.employeeId) === String(req.params.employeeId));
    res.json(filtered);
});

app.post('/api/payroll/generate', async (req, res) => {
    const { month, year } = req.body;
    const employees = await readData('employees.json');
    const payroll = await readData('payroll.json');

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

    const updatedPayroll = [...payroll, ...newRecords];
    await writeData('payroll.json', updatedPayroll);
    res.status(201).json({ message: 'Payroll generated successfully', count: newRecords.length });
});

app.put('/api/payroll/:id', async (req, res) => {
    const payroll = await readData('payroll.json');
    const index = payroll.findIndex(p => p.id === parseFloat(req.params.id));
    if (index !== -1) {
        payroll[index] = { ...payroll[index], ...req.body };
        await writeData('payroll.json', payroll);
        res.json({ record: payroll[index] });
    } else {
        res.status(404).json({ message: 'Payroll record not found' });
    }
});

// --- ANNOUNCEMENTS ROUTES ---
app.get('/api/announcements', async (req, res) => {
    const announcements = await readData('announcements.json');
    res.json(announcements);
});

app.post('/api/announcements', async (req, res) => {
    const announcements = await readData('announcements.json');
    const newAnn = { ...req.body, id: Date.now(), date: new Date().toISOString() };
    announcements.push(newAnn);
    await writeData('announcements.json', announcements);
    res.status(201).json(newAnn);
});

app.delete('/api/announcements/:id', async (req, res) => {
    let announcements = await readData('announcements.json');
    announcements = announcements.filter(a => a.id !== parseInt(req.params.id));
    await writeData('announcements.json', announcements);
    res.status(204).send();
});

// --- REPORTS ROUTES ---
app.get('/api/reports/daily', async (req, res) => {
    const attendance = await readData('attendance.json');
    const leaves = await readData('leaves.json');
    const today = new Date().toISOString().split('T')[0];

    res.json({
        date: today,
        present: attendance.filter(a => a.date === today).length,
        onLeave: leaves.filter(l => l.startDate <= today && l.endDate >= today && l.status === 'Approved').length
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
