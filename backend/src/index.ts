import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'hrms_dev_secret_change_in_production';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        console.log(`[DEBUG] CORS Request from origin: ${origin}`);
        // Allow requests with no origin (Postman, curl, mobile apps)
        if (!origin) return callback(null, true);
        // Allow explicitly configured origins
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow any vercel.app subdomain as a safety fallback
        if (origin?.endsWith('.vercel.app')) return callback(null, true);

        console.warn(`[DEBUG] CORS Rejected Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());

const DATA_FILE = path.join(__dirname, '../data/employees.json');
const ATTENDANCE_FILE = path.join(__dirname, '../data/attendance.json');
const PAYROLL_FILE = path.join(__dirname, '../data/payroll.json');
const LEAVES_FILE = path.join(__dirname, '../data/leaves.json');
const PERFORMANCE_FILE = path.join(__dirname, '../data/performance.json');
const DOCUMENTS_FILE = path.join(__dirname, '../data/documents.json');
const ANNOUNCEMENTS_FILE = path.join(__dirname, '../data/announcements.json');
const TASKS_FILE = path.join(__dirname, '../data/tasks.json');
const LOCATIONS_FILE = path.join(__dirname, '../data/locations.json');

// Helper to read data
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        console.log(`[DEBUG] readData from ${DATA_FILE}: ${parsed.length} employees`);
        return parsed;
    } catch (error) {
        console.error(`[DEBUG] readData ERROR from ${DATA_FILE}:`, error);
        return [];
    }
};

// Helper to write data
const writeData = (data: any) => {
    console.log(`[DEBUG] writeData to ${DATA_FILE}: ${data.length} employees`);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Helper for Attendance
const readAttendance = () => {
    try {
        const data = fs.readFileSync(ATTENDANCE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeAttendance = (data: any) => {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(data, null, 2));
};

// Helper for Payroll
const readPayroll = () => {
    try {
        const data = fs.readFileSync(PAYROLL_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writePayroll = (data: any) => {
    fs.writeFileSync(PAYROLL_FILE, JSON.stringify(data, null, 2));
};

// Helper for Leaves
const readLeaves = () => {
    try {
        const data = fs.readFileSync(LEAVES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeLeaves = (data: any) => {
    fs.writeFileSync(LEAVES_FILE, JSON.stringify(data, null, 2));
};

// Helper for Performance
const readPerformance = () => {
    try {
        const data = fs.readFileSync(PERFORMANCE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writePerformance = (data: any) => {
    fs.writeFileSync(PERFORMANCE_FILE, JSON.stringify(data, null, 2));
};

// Helper for Documents
const readDocuments = () => {
    try {
        const data = fs.readFileSync(DOCUMENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeDocuments = (data: any) => {
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(data, null, 2));
};

// Helper for Announcements
const readAnnouncements = () => {
    try {
        const data = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeAnnouncements = (data: any) => {
    fs.writeFileSync(ANNOUNCEMENTS_FILE, JSON.stringify(data, null, 2));
};

// Helper for Tasks
const readTasks = () => {
    try {
        const data = fs.readFileSync(TASKS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeTasks = (data: any) => {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
};

// Helper for Locations
const readLocations = () => {
    try {
        if (!fs.existsSync(LOCATIONS_FILE)) return {};
        const data = fs.readFileSync(LOCATIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

const writeLocations = (data: any) => {
    fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(data, null, 2));
};

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
};

app.get('/', (req, res) => {
    res.send('Antigraviity HRMS API is running...');
});

// --- AUTH ROUTES (PUBLIC) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[DEBUG] Login attempt for: ${email}`);

    // 1. Check Hardcoded Admin
    if (email === 'admin@hrms.com' && password === 'admin123') {
        console.log(`[DEBUG] Admin login successful`);
        const adminUser = { id: 'ADMIN', name: 'System Admin', role: 'admin', email: 'admin@hrms.com' };
        const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ success: true, token, user: adminUser });
    }

    // 2. Check Employees
    const employees = readData();
    const user = employees.find((e: any) =>
        (e.email === email || e.username === email) && e.password === password
    );

    if (user) {
        console.log(`[DEBUG] Employee login successful: ${user.name}`);
        const empUser = {
            id: user.id,
            name: user.name,
            role: 'employee',
            email: user.email,
            department: user.department
        };
        const token = jwt.sign(empUser, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token, user: empUser });
    } else {
        console.log(`[DEBUG] Login failed for email: ${email}`);
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// --- PROTECTED ROUTES (require valid JWT) ---
app.use(authMiddleware);

app.get('/api/employees', (req, res) => {
    const employees = readData();
    res.json(employees);
});

// POST new employee
app.post('/api/employees', (req, res) => {
    const employees = readData();
    const { id, name, email, role, department, status, phone, joiningDate } = req.body;

    // Auto-generate ID if not provided
    const newId = `EMP${String(employees.length + 1).padStart(3, '0')}`;

    console.log(`[DEBUG] Adding new employee: ${req.body.name} (ID: ${req.body.id || newId})`);

    // Extract password from body or use default
    const customPassword = req.body.password || 'Password123!';

    const newEmployee = {
        id: req.body.id || `EMP${String(employees.length + 1).padStart(3, '0')}`,
        name: req.body.name,
        email: req.body.email,
        username: req.body.username || req.body.email, // Default username to email
        password: customPassword, // Use the custom or default password
        role: req.body.role,
        department: req.body.department,
        status: req.body.status || 'Active',
        joiningDate: req.body.joiningDate || new Date().toISOString().split('T')[0],
        phone: req.body.phone || '',
        salary: {
            base: 0,
            hra: 0,
            transport: 0,
            other: 0
        },
        leaveBalance: {
            sick: 10,
            casual: 12,
            earned: 15,
            wfh: 10
        }
    };

    employees.push(newEmployee);
    console.log(`[DEBUG] Employees count before write: ${employees.length}`);
    writeData(employees);
    console.log(`[DEBUG] Write successful to ${DATA_FILE}`);
    res.status(201).json(newEmployee);
});

// PUT update employee
app.put('/api/employees/:id', (req, res) => {
    const employees = readData();
    const index = employees.findIndex((e: any) => e.id === req.params.id);

    if (index !== -1) {
        employees[index] = { ...employees[index], ...req.body };
        writeData(employees);
        res.json(employees[index]);
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

// DELETE employee
app.delete('/api/employees/:id', (req, res) => {
    let employees = readData();
    const newEmployees = employees.filter((e: any) => e.id !== req.params.id);

    if (employees.length !== newEmployees.length) {
        writeData(newEmployees);
        res.json({ message: 'Employee deleted' });
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

// Update Employee Location
app.put('/api/employees/:id/location', (req, res) => {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    console.log(`[Location Update] Employee: ${id}, Lat: ${latitude}, Lng: ${longitude}`);

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    const locations = readLocations();
    locations[id] = {
        latitude,
        longitude,
        lastUpdated: new Date().toISOString()
    };

    writeLocations(locations);
    res.json({ success: true, location: locations[id] });
});

// Get Employee Location
app.get('/api/employees/:id/location', (req, res) => {
    const { id } = req.params;
    const locations = readLocations();
    const location = locations[id];

    if (location) {
        res.json(location);
    } else {
        res.status(404).json({ message: 'Location not found' });
    }
});

// --- ATTENDANCE ROUTES ---

// GET attendance (optional filter by date)
app.get('/api/attendance', (req, res) => {
    const { date } = req.query;
    const attendance = readAttendance();

    if (date) {
        const filtered = attendance.filter((r: any) => r.date === date);
        res.json(filtered);
    } else {
        res.json(attendance);
    }
});

// POST attendance (Check-in / Manual)
app.post('/api/attendance', (req, res) => {
    const attendance = readAttendance();
    const newRecord = {
        id: Date.now().toString(),
        ...req.body,
    };
    attendance.push(newRecord);
    writeAttendance(attendance);
    res.status(201).json(newRecord);
});

// PUT attendance (Update / Checkout / Approve)
app.put('/api/attendance/:id', (req, res) => {
    const attendance = readAttendance();
    const index = attendance.findIndex((r: any) => r.id === req.params.id);

    if (index !== -1) {
        attendance[index] = { ...attendance[index], ...req.body };
        writeAttendance(attendance);
        res.json(attendance[index]);
    } else {
        res.status(404).json({ message: 'Record not found' });
    }
});

// --- PAYROLL ROUTES ---

// UPDATE Salary Structure
app.put('/api/employees/:id/salary', (req, res) => {
    const employees = readData();
    const index = employees.findIndex((e: any) => e.id === req.params.id);

    if (index !== -1) {
        employees[index].salary = { ...employees[index].salary, ...req.body };
        writeData(employees);
        res.json(employees[index]);
    } else {
        res.status(404).json({ message: 'Employee not found' });
    }
});

// GENERATE Payroll
app.post('/api/payroll/generate', (req, res) => {
    const payroll = readPayroll();
    const { month, year, records } = req.body;

    // Check if payroll already exists for this month
    const index = payroll.findIndex((p: any) => p.month === month && p.year === year);

    const newPayroll = {
        id: index !== -1 ? payroll[index].id : Date.now().toString(),
        month,
        year,
        dateGenerated: new Date().toISOString(),
        records // Array of { employeeId, name, base, bonus, deductions, netSalary }
    };

    if (index !== -1) {
        payroll[index] = newPayroll;
    } else {
        payroll.push(newPayroll);
    }

    writePayroll(payroll);
    res.status(201).json(newPayroll);
});

// GET Payroll History
app.get('/api/payroll', (req, res) => {
    const payroll = readPayroll();
    res.json(payroll);
});

// --- LEAVE ROUTES ---

// GET all leaves
app.get('/api/leaves', (req, res) => {
    const leaves = readLeaves();
    res.json(leaves);
});

// POST new leave request
app.post('/api/leaves', (req, res) => {
    const leaves = readLeaves();
    const newLeave = {
        id: Date.now().toString(),
        status: 'Pending',
        appliedOn: new Date().toISOString().split('T')[0],
        ...req.body
    };
    leaves.push(newLeave);
    writeLeaves(leaves);
    res.status(201).json(newLeave);
});

// PUT update leave status (Approve/Reject)
app.put('/api/leaves/:id', (req, res) => {
    const leaves = readLeaves();
    const index = leaves.findIndex((l: any) => l.id === req.params.id);

    if (index !== -1) {
        const leave = leaves[index];
        const { status } = req.body;

        // If approving, deduct balance
        if (status === 'Approved' && leave.status !== 'Approved') {
            const employees = readData();
            const empIndex = employees.findIndex((e: any) => e.id === leave.employeeId);

            if (empIndex !== -1) {
                const emp = employees[empIndex];
                const type = leave.type.toLowerCase().split(' ')[0]; // sick, casual, paid

                // Initialize balance if missing
                if (!emp.leaveBalance) {
                    emp.leaveBalance = { sick: 12, casual: 12, paid: 15, wfh: 10 };
                }

                // Deduct days
                const days = (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1;

                if (emp.leaveBalance[type] >= days) {
                    emp.leaveBalance[type] -= days;
                    writeData(employees);
                } else {
                    return res.status(400).json({ message: 'Insufficient leave balance' });
                }
            }
        }

        leaves[index] = { ...leave, status };
        writeLeaves(leaves);
        res.json(leaves[index]);
    } else {
        res.status(404).json({ message: 'Leave request not found' });
    }
});

// --- PERFORMANCE ROUTES ---

app.get('/api/performance', (req, res) => {
    const performance = readPerformance();
    res.json(performance);
});

app.post('/api/performance', (req, res) => {
    const performance = readPerformance();
    const newRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...req.body
    };
    performance.push(newRecord);
    writePerformance(performance);
    res.status(201).json(newRecord);
});

// --- DOCUMENT ROUTES ---

app.get('/api/documents', (req, res) => {
    const { employeeId } = req.query;
    let documents = readDocuments();
    if (employeeId) {
        documents = documents.filter((doc: any) => doc.employeeId === employeeId);
    }
    res.json(documents);
});

app.post('/api/documents', (req, res) => {
    const documents = readDocuments();
    const newDoc = {
        id: Date.now().toString(),
        uploadDate: new Date().toISOString().split('T')[0],
        ...req.body
    };
    documents.push(newDoc);
    writeDocuments(documents);
    res.status(201).json(newDoc);
});

// --- ANNOUNCEMENT ROUTES ---

app.get('/api/announcements', (req, res) => {
    const announcements = readAnnouncements();
    res.json(announcements);
});

app.post('/api/announcements', (req, res) => {
    const announcements = readAnnouncements();
    const newAnnouncement = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...req.body
    };
    announcements.push(newAnnouncement);
    writeAnnouncements(announcements);
    res.status(201).json(newAnnouncement);
});

// --- TASKS ROUTES ---

app.get('/api/tasks', (req, res) => {
    const { date, employeeId } = req.query;
    let tasks = readTasks();

    if (date) {
        tasks = tasks.filter((t: any) => t.date === date);
    }
    if (employeeId) {
        tasks = tasks.filter((t: any) => t.employeeId === employeeId);
    }
    res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
    const tasks = readTasks();
    const newTask = {
        id: Date.now().toString(),
        status: 'Pending',
        ...req.body
    };
    tasks.push(newTask);
    writeTasks(tasks);
    res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
    const tasks = readTasks();
    const index = tasks.findIndex((t: any) => t.id === req.params.id);

    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...req.body };
        writeTasks(tasks);
        res.json(tasks[index]);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
