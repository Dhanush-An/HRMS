const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic data directory for Vercel vs Local
// In Vercel, files are often located relative to the root or current working directory
const DATA_DIR = process.env.VERCEL
    ? path.join(process.cwd(), 'backend/data')
    : path.join(__dirname, '../data');

console.log('Backend starting...');
console.log('Data Directory:', DATA_DIR);

// Robust CORS configuration
const corsOptions = {
    origin: '*', // Allow all for debugging, or specify Vercel domains
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Helper to read/write JSON files
const readData = async (file) => {
    const filePath = path.join(DATA_DIR, file);
    try {
        if (!(await fs.pathExists(filePath))) {
            console.warn(`File not found: ${filePath}`);
            return [];
        }
        return await fs.readJson(filePath);
    } catch (error) {
        console.error(`Error reading ${file} at ${filePath}:`, error.message);
        return [];
    }
};

const writeData = async (file, data) => {
    const filePath = path.join(DATA_DIR, file);
    try {
        await fs.ensureDir(DATA_DIR);
        await fs.writeJson(filePath, data, { spaces: 2 });
    } catch (error) {
        console.error(`Error writing ${file} at ${filePath}:`, error.message);
    }
};

// Route wrapper for common /api/ prefix logic
const apiRouter = express.Router();

// --- AUTH ROUTE ---
apiRouter.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);

        const employees = await readData('employees.json');
        const user = employees.find(e =>
            String(e.email).toLowerCase() === String(email).toLowerCase() &&
            String(e.password) === String(password)
        );

        if (user) {
            const { password, ...userWithoutPassword } = user;
            res.json({
                user: userWithoutPassword,
                token: 'mock-jwt-token',
                role: (user.role === 'HR Manager' || user.role === 'Admin') ? 'Admin' : 'Employee'
            });
        } else {
            console.log('Invalid credentials');
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
});

apiRouter.get('/auth/me', async (req, res) => {
    const employees = await readData('employees.json');
    if (employees.length > 0) {
        const { password, ...userWithoutPassword } = employees[0];
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ message: 'No users found' });
    }
});

// --- EMPLOYEES ROUTES ---
apiRouter.get('/employees', async (req, res) => {
    const employees = await readData('employees.json');
    res.json(employees);
});

apiRouter.get('/employees/:id', async (req, res) => {
    const employees = await readData('employees.json');
    const employee = employees.find(e => String(e.id) === String(req.params.id));
    if (employee) res.json(employee);
    else res.status(404).json({ message: 'Employee not found' });
});

apiRouter.post('/employees', async (req, res) => {
    const employees = await readData('employees.json');
    const newEmployee = { ...req.body, id: Date.now() };
    employees.push(newEmployee);
    await writeData('employees.json', employees);
    res.status(201).json(newEmployee);
});

apiRouter.put('/employees/:id', async (req, res) => {
    const employees = await readData('employees.json');
    const index = employees.findIndex(e => String(e.id) === String(req.params.id));
    if (index !== -1) {
        employees[index] = { ...employees[index], ...req.body };
        await writeData('employees.json', employees);
        res.json(employees[index]);
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

apiRouter.delete('/employees/:id', async (req, res) => {
    let employees = await readData('employees.json');
    employees = employees.filter(e => String(e.id) !== String(req.params.id));
    await writeData('employees.json', employees);
    res.status(204).send();
});

// --- ATTENDANCE ROUTES ---
apiRouter.get('/attendance', async (req, res) => {
    const attendance = await readData('attendance.json');
    res.json(attendance);
});

apiRouter.get('/attendance/employee/:employeeId', async (req, res) => {
    const attendance = await readData('attendance.json');
    const filtered = attendance.filter(a => String(a.employeeId) === String(req.params.employeeId));
    res.json(filtered);
});

apiRouter.post('/attendance/checkin', async (req, res) => {
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

apiRouter.post('/attendance/checkout', async (req, res) => {
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
apiRouter.get('/leaves', async (req, res) => {
    const leaves = await readData('leaves.json');
    res.json(leaves);
});

apiRouter.get('/leaves/employee/:employeeId', async (req, res) => {
    const leaves = await readData('leaves.json');
    const filtered = leaves.filter(l => String(l.employeeId) === String(req.params.employeeId));
    res.json(filtered);
});

apiRouter.post('/leaves', async (req, res) => {
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

apiRouter.put('/leaves/:id', async (req, res) => {
    const leaves = await readData('leaves.json');
    const index = leaves.findIndex(l => String(l.id) === String(req.params.id));
    if (index !== -1) {
        leaves[index] = { ...leaves[index], ...req.body };
        await writeData('leaves.json', leaves);
        res.json(leaves[index]);
    } else {
        res.status(404).json({ message: 'Leave request not found' });
    }
});

// --- PAYROLL ROUTES ---
apiRouter.get('/payroll', async (req, res) => {
    const payroll = await readData('payroll.json');
    res.json(payroll);
});

apiRouter.get('/payroll/employee/:employeeId', async (req, res) => {
    const payroll = await readData('payroll.json');
    const filtered = payroll.filter(p => String(p.employeeId) === String(req.params.employeeId));
    res.json(filtered);
});

apiRouter.post('/payroll/generate', async (req, res) => {
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

apiRouter.put('/payroll/:id', async (req, res) => {
    const payroll = await readData('payroll.json');
    const index = payroll.findIndex(p => String(p.id) === String(req.params.id));
    if (index !== -1) {
        payroll[index] = { ...payroll[index], ...req.body };
        await writeData('payroll.json', payroll);
        res.json({ record: payroll[index] });
    } else {
        res.status(404).json({ message: 'Payroll record not found' });
    }
});

// --- ANNOUNCEMENTS ROUTES ---
apiRouter.get('/announcements', async (req, res) => {
    const announcements = await readData('announcements.json');
    res.json(announcements);
});

apiRouter.post('/announcements', async (req, res) => {
    const announcements = await readData('announcements.json');
    const newAnn = { ...req.body, id: Date.now(), date: new Date().toISOString() };
    announcements.push(newAnn);
    await writeData('announcements.json', announcements);
    res.status(201).json(newAnn);
});

apiRouter.delete('/announcements/:id', async (req, res) => {
    let announcements = await readData('announcements.json');
    announcements = announcements.filter(a => String(a.id) !== String(req.params.id));
    await writeData('announcements.json', announcements);
    res.status(204).send();
});

// --- REPORTS ROUTES ---
apiRouter.get('/reports/daily', async (req, res) => {
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
apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), env: process.env.VERCEL ? 'vercel' : 'local' });
});

// Mount the router on /api
app.use('/api', apiRouter);

// Root health check for Vercel
app.get('/', (req, res) => {
    res.json({ status: 'server-running', version: '1.1.0' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
