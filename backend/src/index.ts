import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import connectDB from './config/db';
import Employee from './models/Employee';
import Attendance from './models/Attendance';
import Leave from './models/Leave';
import Payroll from './models/Payroll';
import Performance from './models/Performance';
import Announcement from './models/Announcement';
import Task from './models/Task';
import Policy from './models/Policy';
import DocumentModel from './models/Document'; // Rename to avoid conflict with global Document type

dotenv.config();

// Connect to Database
connectDB();

const JWT_SECRET = process.env.JWT_SECRET || 'hrms_dev_secret_change_in_production';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
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
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Check Hardcoded Admin
    if (normalizedEmail === 'admin@hrms.com' && cleanPassword === 'admin123') {
        const adminUser = { id: 'ADMIN', name: 'System Admin', role: 'admin', email: 'admin@hrms.com' };
        const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ success: true, token, user: adminUser });
    }

    // 2. Check Employees in MongoDB
    try {
        const user = await Employee.findOne({
            $or: [{ email: normalizedEmail }, { username: email }],
            password: cleanPassword
        });

        if (user) {
            const empUser = {
                id: user.employeeId,
                name: user.name,
                role: user.role,
                email: user.email,
                department: user.department
            };
            const token = jwt.sign(empUser, JWT_SECRET, { expiresIn: '8h' });
            res.json({ success: true, token, user: empUser });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PROTECTED ROUTES (require valid JWT) ---
app.use(authMiddleware);

app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST new employee
app.post('/api/employees', async (req, res) => {
    try {
        const { id, name, email, role, department, status, phone, joiningDate } = req.body;

        let finalId = id;
        if (!finalId) {
            const count = await Employee.countDocuments();
            finalId = `EMP${String(count + 1).padStart(3, '0')}`;
        }

        const newEmployee = new Employee({
            employeeId: finalId,
            name,
            email,
            username: req.body.username || email,
            password: req.body.password || 'Password123!',
            role: role || 'employee',
            department,
            status: status || 'Active',
            joiningDate: joiningDate || new Date().toISOString().split('T')[0],
            phone: phone || '',
            salary: req.body.salary || { base: 0, hra: 0, transport: 0, other: 0 },
            leaveBalance: req.body.leaveBalance || { sick: 10, casual: 12, earned: 15, wfh: 10 }
        });

        await newEmployee.save();
        console.log(`[DEBUG] Employee added: ${newEmployee.name} (ID: ${newEmployee.employeeId})`);
        res.status(201).json(newEmployee);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PUT update employee
app.put('/api/employees/:id', async (req, res) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            { employeeId: req.params.id },
            req.body,
            { new: true }
        );

        if (updatedEmployee) {
            res.json(updatedEmployee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const result = await Employee.findOneAndDelete({ employeeId: req.params.id });
        if (result) {
            res.json({ message: 'Employee deleted' });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Update Employee Location
app.put('/api/employees/:id/location', async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    console.log(`[Location Update] Employee: ${id}, Lat: ${latitude}, Lng: ${longitude}`);

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    try {
        const attendance = await Attendance.findOneAndUpdate(
            { employeeId: id, date: new Date().toISOString().split('T')[0] },
            {
                $set: {
                    'location.lat': latitude,
                    'location.lng': longitude
                }
            },
            { upsert: true, new: true }
        );
        res.json({ success: true, location: attendance.location });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Get Employee Location
app.get('/api/employees/:id/location', async (req, res) => {
    const { id } = req.params;
    try {
        const attendance = await Attendance.findOne({
            employeeId: id,
            date: new Date().toISOString().split('T')[0]
        });

        if (attendance && attendance.location) {
            res.json(attendance.location);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- ATTENDANCE ROUTES ---

// GET attendance (optional filter by date)
app.get('/api/attendance', async (req, res) => {
    const { date } = req.query;
    try {
        const query: any = {};
        if (date) query.date = date;
        const attendance = await Attendance.find(query);
        res.json(attendance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST attendance (Check-in / Manual)
app.post('/api/attendance', async (req, res) => {
    try {
        const newRecord = new Attendance({
            ...req.body,
        });
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PUT attendance (Update / Checkout / Approve)
app.put('/api/attendance/:id', async (req, res) => {
    try {
        const updatedRecord = await Attendance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (updatedRecord) {
            res.json(updatedRecord);
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- PAYROLL ROUTES ---

// UPDATE Salary Structure
app.put('/api/employees/:id/salary', async (req, res) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            { employeeId: req.params.id },
            { $set: { salary: req.body } },
            { new: true }
        );

        if (updatedEmployee) {
            res.json(updatedEmployee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GENERATE Payroll
app.post('/api/payroll/generate', async (req, res) => {
    const { month, year, records } = req.body;

    try {
        const payroll = await Payroll.findOneAndUpdate(
            { month, year },
            {
                month,
                year,
                dateGenerated: new Date().toISOString(),
                records
            },
            { upsert: true, new: true }
        );
        res.status(201).json(payroll);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET Payroll History
app.get('/api/payroll', async (req, res) => {
    try {
        const payroll = await Payroll.find();
        res.json(payroll);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- LEAVE ROUTES ---

// GET all leaves
app.get('/api/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find();
        res.json(leaves);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST new leave request
app.post('/api/leaves', async (req, res) => {
    try {
        const newLeave = new Leave({
            status: 'Pending',
            appliedOn: new Date().toISOString().split('T')[0],
            ...req.body
        });
        await newLeave.save();
        res.status(201).json(newLeave);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PUT update leave status (Approve/Reject)
app.put('/api/leaves/:id', async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const { status } = req.body;

        // If approving, deduct balance
        if (status === 'Approved' && leave.status !== 'Approved') {
            const employee = await Employee.findOne({ employeeId: leave.employeeId });

            if (employee) {
                const type = leave.type.toLowerCase().split(' ')[0] as keyof typeof employee.leaveBalance;

                // Deduct days
                const days = (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1;

                if (employee.leaveBalance && (employee.leaveBalance as any)[type] !== undefined) {
                    if ((employee.leaveBalance as any)[type] >= days) {
                        (employee.leaveBalance as any)[type] -= days;
                        await employee.save();
                    } else {
                        return res.status(400).json({ message: 'Insufficient leave balance' });
                    }
                }
            }
        }

        leave.status = status;
        await leave.save();
        res.json(leave);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- PERFORMANCE ROUTES ---

app.get('/api/performance', async (req, res) => {
    try {
        const performance = await Performance.find();
        res.json(performance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/performance', async (req, res) => {
    try {
        const newRecord = new Performance({
            date: new Date().toISOString().split('T')[0],
            ...req.body
        });
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- DOCUMENT ROUTES ---

app.get('/api/documents', async (req, res) => {
    const { employeeId } = req.query;
    try {
        const query: any = {};
        if (employeeId) query.employeeId = employeeId;
        const documents = await DocumentModel.find(query);
        res.json(documents);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/documents', async (req, res) => {
    try {
        const newDoc = new DocumentModel({
            uploadDate: new Date().toISOString().split('T')[0],
            ...req.body
        });
        await newDoc.save();
        res.status(201).json(newDoc);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- ANNOUNCEMENT ROUTES ---

app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find();
        res.json(announcements);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/announcements', async (req, res) => {
    try {
        const newAnnouncement = new Announcement({
            date: new Date().toISOString().split('T')[0],
            ...req.body
        });
        await newAnnouncement.save();
        res.status(201).json(newAnnouncement);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- TASKS ROUTES ---

app.get('/api/tasks', async (req, res) => {
    const { date, employeeId } = req.query;
    try {
        const query: any = {};
        if (date) query.date = date;
        if (employeeId) query.employeeId = employeeId;
        const tasks = await Task.find(query);
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({
            status: 'Pending',
            ...req.body
        });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (updatedTask) {
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// --- POLICIES ROUTES ---

app.get('/api/policies', async (req, res) => {
    try {
        const policies = await Policy.find();
        res.json(policies);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/policies', async (req, res) => {
    try {
        const newPolicy = new Policy({
            lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            ...req.body
        });
        await newPolicy.save();
        res.status(201).json(newPolicy);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/policies/:id', async (req, res) => {
    try {
        const updatedPolicy = await Policy.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            },
            { new: true }
        );

        if (updatedPolicy) {
            res.json(updatedPolicy);
        } else {
            res.status(404).json({ message: 'Policy not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/policies/:id', async (req, res) => {
    try {
        const result = await Policy.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Policy deleted' });
        } else {
            res.status(404).json({ message: 'Policy not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
