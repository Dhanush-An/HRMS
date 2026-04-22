import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import connectDB from './config/db';
import Employee from './models/Employee';
import Attendance from './models/Attendance';
import Leave from './models/Leave';
import Payroll from './models/Payroll';
import Performance from './models/Performance';
import Announcement from './models/Announcement';
import Task from './models/Task';
import Policy from './models/Policy';
import DocumentModel from './models/Document';
import Admin from './models/Admin';
import Query from './models/Query';

import multer from 'multer';
import dns from 'dns';

dns.setServers(["1.1.1.1","8.8.8.8"])

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

// Handlers for unhandled errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
});

// Connect to Database
connectDB();

const JWT_SECRET = process.env.JWT_SECRET || 'hrms_dev_secret_change_in_production';

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ success: false, message: `Access denied. Requires one of roles: ${roles.join(', ')}` });
            return;
        }
        next();
    };
};

app.get('/', (req, res) => {
    res.send('Antigraviity HRMS API is running...');
});

// --- DEV-ONLY DEBUG LOGIN (bypasses DB, for frontend auth testing) ---
app.post('/api/debug-login', (req, res) => {
    const { email, role } = req.body;
    const testUser = {
        id: 'EMP001',
        name: 'Debug Employee',
        role: (role || 'employee').toLowerCase(),
        email: email || 'debug@hrms.com',
        department: 'Engineering'
    };
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, user: testUser });
});

// --- AUTH ROUTES (PUBLIC) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i');
    const usernameRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');

    // 1. Check Admin in MongoDB
    try {
        const admin = await Admin.findOne({
            email: emailRegex
        });

        if (admin) {
            let isMatch = false;
            if (admin.password && admin.password.startsWith('$2')) {
                isMatch = await bcrypt.compare(cleanPassword, admin.password);
            } else {
                // Fallback for plain text passwords (migration)
                isMatch = (cleanPassword === admin.password);
                if (isMatch) {
                    const salt = await bcrypt.genSalt(10);
                    admin.password = await bcrypt.hash(cleanPassword, salt);
                    await admin.save();
                }
            }

            if (isMatch) {
                const adminUser = {
                    id: 'ADMIN',
                    name: admin.name || 'System Admin',
                    role: 'admin',
                    email: admin.email
                };
                const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '8h' });
                return res.json({ success: true, token, user: adminUser });
            }
        }
    } catch (error) {
        console.error('[ERROR] Admin check failed:', error);
    }

    // 2. Check Employees in MongoDB
    try {
        const user = await Employee.findOne({
            $or: [
                { email: emailRegex },
                { username: usernameRegex }
            ]
        });

        if (user) {
            let isMatch = false;
            if (user.password && user.password.startsWith('$2')) {
                isMatch = await bcrypt.compare(cleanPassword, user.password);
            } else {
                // Fallback for plain text passwords
                isMatch = (cleanPassword === user.password);
                if (isMatch) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(cleanPassword, salt);
                    await user.save();
                }
            }

            if (isMatch) {
                const empUser = {
                    id: user.employeeId,
                    name: user.name,
                    role: (user.role || 'employee').toLowerCase(),
                    email: user.email,
                    department: user.department
                };
                const token = jwt.sign(empUser, JWT_SECRET, { expiresIn: '8h' });
                res.json({ success: true, token, user: empUser });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
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
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST new employee
app.post('/api/employees', authorizeRoles('admin'), async (req, res) => {
    try {
        const { id, name, email, role, department, status, phone, joiningDate } = req.body;

        let finalId = id;
        if (!finalId) {
            const count = await Employee.countDocuments();
            finalId = `EMP${String(count + 1).padStart(3, '0')}`;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password || 'Password123!', salt);

        const newEmployee = new Employee({
            employeeId: finalId,
            name,
            email,
            username: req.body.username || email,
            password: hashedPassword,
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
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use a unique value.`;
            return res.status(400).json({ success: false, message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update employee
app.put('/api/employees/:id', authorizeRoles('admin', 'hr'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        const updatedEmployee = await Employee.findOneAndUpdate(
            { employeeId: req.params.id },
            updateData,
            { new: true }
        );

        if (updatedEmployee) {
            res.json(updatedEmployee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error: any) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use a unique value.`;
            return res.status(400).json({ success: false, message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE employee
app.delete('/api/employees/:id', authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await Employee.findOneAndDelete({ employeeId: req.params.id });
        if (result) {
            res.json({ message: 'Employee deleted' });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- ADMIN ROUTES ---

// Update Admin Credentials
app.put('/api/admin/credentials', authorizeRoles('admin'), async (req, res) => {
    // Check if requester is admin
    const requester = (req as any).user;
    if (requester.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only administrators can perform this action' });
    }

    const { email, password, name } = req.body;
    try {
        const admin = await Admin.findOne(); // Assuming single admin for now
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (email) admin.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);
        }
        if (name) admin.name = name;

        await admin.save();
        res.json({ success: true, message: 'Admin credentials updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET Admin Dashboard Stats
app.get('/api/admin/stats', authorizeRoles('admin'), async (req, res) => {
    try {
        const [totalEmployees, pendingRequests, payrollData, tasks] = await Promise.all([
            Employee.countDocuments(),
            Leave.countDocuments({ status: 'Pending' }),
            Payroll.aggregate([
                { $unwind: '$records' },
                { $group: { _id: null, total: { $sum: '$records.netSalary' } } }
            ]),
            Task.distinct('projectName', { projectName: { $ne: null, $exists: true } })
        ]);

        res.json({
            totalEmployees,
            totalPayroll: payrollData[0]?.total || 0,
            activeProjects: tasks.filter(name => name && typeof name === 'string' && name.trim() !== '').length,
            pendingRequests
        });
    } catch (error: any) {
        console.error('[ERROR] Failed to fetch admin stats:', error);
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
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
            const loc = (attendance.location as any).toObject ? (attendance.location as any).toObject() : attendance.location;
            res.json({ success: true, ...loc });
        } else {
            res.status(404).json({ success: false, message: 'Location not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- ATTENDANCE ROUTES ---

// GET attendance (optional filter by date)
app.get('/api/attendance', async (req, res) => {
    const { date, employeeId, limit } = req.query;
    try {
        const query: any = {};
        if (date) query.date = date;
        if (employeeId) query.employeeId = employeeId;
        const attendance = await Attendance.find(query).sort({ createdAt: -1 }).limit(Number(limit) || 0);
        
        // Auto-correct 'Half Day' to 'Present' if it meets the new 9:45 AM rule
        const correctedAttendance = attendance.map(record => {
            const r = record.toObject ? record.toObject() : record;
            if (r.status === 'Half Day' && r.checkIn && r.shiftType === 'Day Shift') {
                const [h, m] = r.checkIn.split(':').map(Number);
                const totalMins = h * 60 + m;
                // If checked in at or before 9:45 AM, it should be Present
                if (totalMins <= 9 * 60 + 45) {
                    return { ...r, status: 'Present' };
                }
            }
            return r;
        });

        res.json(correctedAttendance);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST attendance (Check-in / Manual)
app.post('/api/attendance', async (req, res) => {
    try {
        const { employeeId, date } = req.body;

        // Check for existing record for this employee and date
        const existingRecord = await Attendance.findOne({ employeeId, date });
        if (existingRecord) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for today'
            });
        }

        const newRecord = new Attendance({
            ...req.body,
        });
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PAYROLL ROUTES ---

// UPDATE Salary Structure
app.put('/api/employees/:id/salary', authorizeRoles('admin'), async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
});

// GENERATE Payroll
app.post('/api/payroll/generate', authorizeRoles('admin'), async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET Payroll History
app.get('/api/payroll', async (req, res) => {
    try {
        const payroll = await Payroll.find();
        res.json(payroll);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- LEAVE ROUTES ---

// GET all leaves
app.get('/api/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find();
        res.json(leaves);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
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
                // Map frontend leave types to backend schema keys
                const typeMapping: Record<string, string> = {
                    'sick': 'sick',
                    'casual': 'casual',
                    'emergency': 'sick', // Emergency counts as Sick
                    'vacation': 'earned',  // Vacation counts as Earned
                    'paid': 'paid',
                    'remote': 'wfh'
                };

                const leaveTypeKey = leave.type.toLowerCase().split(' ')[0];
                const type = typeMapping[leaveTypeKey] as keyof typeof employee.leaveBalance;

                // Deduct days
                const days = Math.max(1, (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1);

                if (employee.leaveBalance && type && (employee.leaveBalance as any)[type] !== undefined) {
                    if ((employee.leaveBalance as any)[type] >= days) {
                        (employee.leaveBalance as any)[type] -= days;
                        // Mark modified for nested objects
                        employee.markModified('leaveBalance');
                        await employee.save();
                    } else {
                        return res.status(400).json({ message: `Insufficient ${type} leave balance. Required: ${days}, Available: ${(employee.leaveBalance as any)[type]}` });
                    }
                }
            }
        }

        leave.status = status;
        await leave.save();
        res.json(leave);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PERFORMANCE ROUTES ---

app.get('/api/performance', async (req, res) => {
    try {
        const performance = await Performance.find();
        res.json(performance);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/performance/:id', async (req, res) => {
    try {
        const result = await Performance.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Performance record deleted' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
    try {
        const { title, type, employeeId, uploadedBy } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const newDoc = new DocumentModel({
            employeeId,
            title,
            type,
            uploadedBy,
            fileUrl: `/uploads/${req.file.filename}`,
            uploadDate: new Date().toISOString().split('T')[0],
            status: 'Pending'
        });

        await newDoc.save();
        res.status(201).json(newDoc);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- ANNOUNCEMENT ROUTES ---

app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find();
        res.json(announcements);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/announcements', authorizeRoles('admin'), async (req, res) => {
    try {
        const newAnnouncement = new Announcement({
            date: new Date().toISOString().split('T')[0],
            ...req.body
        });
        await newAnnouncement.save();
        res.status(201).json(newAnnouncement);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/announcements/:id/seen', async (req, res) => {
    try {
        const { employeeId } = req.body;
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { seenBy: employeeId } },
            { new: true }
        );
        res.json({ success: true, announcement });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/announcements/:id', authorizeRoles('admin'), async (req, res) => {
    try {
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (updatedAnnouncement) {
            res.json(updatedAnnouncement);
        } else {
            res.status(404).json({ message: 'Announcement not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/announcements/:id', authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await Announcement.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Announcement deleted' });
        } else {
            res.status(404).json({ message: 'Announcement not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({
            ...req.body
        });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- POLICIES ROUTES ---


// --- QUERY ROUTES ---

app.get('/api/queries', async (req, res) => {
    const { employeeId } = req.query;
    try {
        const query: any = {};
        if (employeeId) query.employeeId = employeeId;
        const queries = await Query.find(query).sort({ createdAt: -1 });
        res.json(queries);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/queries', async (req, res) => {
    try {
        const newQuery = new Query({
            ...req.body,
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await newQuery.save();
        res.status(201).json(newQuery);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/queries/:id', authorizeRoles('admin', 'hr'), async (req, res) => {
    try {
        const { status } = req.body;
        const updatedQuery = await Query.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
        );
        if (updatedQuery) {
            res.json(updatedQuery);
        } else {
            res.status(404).json({ message: 'Query not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/queries/:id', authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await Query.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Query deleted' });
        } else {
            res.status(404).json({ message: 'Query not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/policies', async (req, res) => {
    try {
        const policies = await Policy.find();
        res.json(policies);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/policies', authorizeRoles('admin'), async (req, res) => {
    try {
        const newPolicy = new Policy({
            lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            ...req.body
        });
        await newPolicy.save();
        res.status(201).json(newPolicy);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/policies/:id', authorizeRoles('admin'), async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/policies/:id', authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await Policy.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Policy deleted' });
        } else {
            res.status(404).json({ message: 'Policy not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/policies/:id/seen', async (req, res) => {
    try {
        const { employeeId } = req.body;
        const policy = await Policy.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { seenBy: employeeId } },
            { new: true }
        );
        res.json({ success: true, policy });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});


app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    // Initialize Admin if not exists
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedAdminPassword = await bcrypt.hash('admin123', salt);
            await Admin.create({
                email: 'admin@hrms.com',
                password: hashedAdminPassword,
                name: 'System Admin'
            });
            console.log('[INIT] Default admin created: admin@hrms.com / admin123');
        }

        // FORCE ADD USER from screenshot
        const targetEmail = 'ab.antigraviity@gmail.com';
        const targetPassword = 'HR123@';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(targetPassword, salt);
        
        const userExists = await Admin.findOne({ email: targetEmail });
        if (!userExists) {
            await Admin.create({
                email: targetEmail,
                password: hashedPassword,
                name: 'Main Admin'
            });
            console.log(`[INIT] Target user created: ${targetEmail} / ${targetPassword}`);
        } else {
            // Update password just in case it was wrong
            await Admin.updateOne({ email: targetEmail }, { $set: { password: hashedPassword } });
            console.log(`[INIT] Target user updated: ${targetEmail}`);
        }

    } catch (err) {
        console.error('[INIT] Failed to initialize admin:', err);
    }
});
