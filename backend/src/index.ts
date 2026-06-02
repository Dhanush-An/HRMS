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
import Expense from './models/Expense';
import Branch from './models/Branch';
import JobPosting from './models/JobPosting';
import Resignation from './models/Resignation';
import Permission from './models/Permission';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dns from 'dns';

dns.setServers(["1.1.1.1","8.8.8.8"]);

const generateEmpId = async () => {
    let count = await Employee.countDocuments();
    let empId = `EMP${String(count + 1).padStart(3, '0')}`;
    while (await Employee.findOne({ employeeId: empId })) {
        count++;
        empId = `EMP${String(count + 1).padStart(3, '0')}`;
    }
    return empId;
};

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
connectDB().then(async () => {
    await seedBranches();
    await seedBranchHRManagers();
});

const seedBranches = async () => {
    try {
        const count = await Branch.countDocuments();
        if (count === 0) {
            const initialBranches = [
                {
                    branchId: 'BR001',
                    name: 'Chennai Branch',
                    branchCode: 'CHE01',
                    address: '123 Mount Road, Teynampet',
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600018',
                    managerName: 'John',
                    phone: '9876543210',
                    email: 'chennai@hrms.com',
                    employeeStrength: 120,
                    openingDate: '2020-01-15',
                    branchType: 'Head Office',
                    status: 'Active'
                },
                {
                    branchId: 'BR002',
                    name: 'Bangalore Branch',
                    branchCode: 'BLR02',
                    address: '456 MG Road, Indiranagar',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    country: 'India',
                    pincode: '560001',
                    managerName: 'Kumar',
                    phone: '9876543211',
                    email: 'bangalore@hrms.com',
                    employeeStrength: 85,
                    openingDate: '2021-06-20',
                    branchType: 'Regional Office',
                    status: 'Active'
                },
                {
                    branchId: 'BR003',
                    name: 'Krishnagiri Branch',
                    branchCode: 'KRI03',
                    address: '789 Bangalore Highway',
                    city: 'Krishnagiri',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '635001',
                    managerName: 'Arjun',
                    phone: '9876543212',
                    email: 'krishnagiri@hrms.com',
                    employeeStrength: 45,
                    openingDate: '2023-03-10',
                    branchType: 'Franchise',
                    status: 'Active'
                }
            ];
            await Branch.insertMany(initialBranches);
            console.log('[SEED] Initial branches seeded successfully!');
        }
    } catch (err) {
        console.error('[SEED ERROR] Failed to seed branches:', err);
    }
};

// Backfill HR manager employee accounts for existing branches
const seedBranchHRManagers = async () => {
    try {
        const branches = await Branch.find({ email: { $exists: true, $ne: '' } });
        for (const branch of branches) {
            if (!branch.email) continue;
            const existing = await Employee.findOne({ email: branch.email.toLowerCase() });
            if (!existing) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('Password123!', salt);
                const empId = await generateEmpId();
                const newEmp = new Employee({
                    employeeId: empId,
                    name: branch.managerName || `${branch.city} HR Manager`,
                    email: branch.email.toLowerCase(),
                    username: branch.email.toLowerCase(),
                    password: hashedPassword,
                    role: 'hr',
                    department: 'Human Resources',
                    status: 'Active',
                    joiningDate: branch.openingDate || new Date().toISOString().split('T')[0],
                    phone: branch.phone || '',
                    branchId: branch.branchId,
                    branchName: branch.name,
                    salary: { base: 0, hra: 0, transport: 0, other: 0 },
                    leaveBalance: { sick: 10, casual: 12, earned: 15, wfh: 10 }
                });
                await newEmp.save();
                console.log(`[SEED] HR Manager account created: ${branch.email} (Branch: ${branch.name})`);
            }
        }
    } catch (err) {
        console.error('[SEED ERROR] Failed to seed branch HR managers:', err);
    }
};

const JWT_SECRET = process.env.JWT_SECRET || 'hrms_dev_secret_change_in_production';

// Configure Cloudinary or Fallback to Local Storage
let storage: any;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'hrms_uploads',
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi'],
            resource_type: 'auto'
        } as any,
    });
    console.log('[INIT] Cloudinary configured for uploads');
} else {
    storage = multer.diskStorage({
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
    console.log('[INIT] Cloudinary credentials missing. Falling back to local disk storage for uploads');
}

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
    res.send('Forge India Connect HRMS API is running...');
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
                    department: user.department,
                    branchId: user.branchId || 'BR001',
                    branchName: user.branchName || 'Chennai'
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
        const user = (req as any).user;
        const query: any = {};
        if (user.role !== 'admin' && user.branchId) {
            query.branchId = user.branchId;
        }
        const employees = await Employee.find(query);
        res.json(employees);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST new employee
app.post('/api/employees', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const { id, name, email, role, department, status, phone, joiningDate, branchId, branchName } = req.body;
        const user = (req as any).user;

        let finalId = id;
        if (!finalId) {
            finalId = await generateEmpId();
        }

        let finalBranchId = branchId;
        let finalBranchName = branchName;
        if (user.role !== 'admin') {
            finalBranchId = user.branchId;
            finalBranchName = user.branchName;
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
            branchId: finalBranchId || 'BR001',
            branchName: finalBranchName || 'Chennai',
            salary: req.body.salary || { base: 0, hra: 0, transport: 0, other: 0 },
            leaveBalance: req.body.leaveBalance || { sick: 10, casual: 12, earned: 15, wfh: 10 },
            responsibilities: req.body.responsibilities || ''
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

app.put('/api/employees/:id', async (req, res) => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin' && user.role !== 'subadmin' && user.role !== 'hr' && user.id !== req.params.id) {
            res.status(403).json({ success: false, message: 'Access denied. You do not have permission to update this profile.' });
            return;
        }

        if (user.role !== 'admin' && user.id !== req.params.id) {
            const targetEmployee = await Employee.findOne({ employeeId: req.params.id });
            if (!targetEmployee || targetEmployee.branchId !== user.branchId) {
                res.status(403).json({ success: false, message: 'Access denied. Employee belongs to another branch.' });
                return;
            }
        }

        const updateData = { ...req.body };
        if (user.role !== 'admin' && user.role !== 'hr' && user.role !== 'subadmin') {
            // Employees can only update their personal fields
            delete updateData.role;
            delete updateData.department;
            delete updateData.salary;
            delete updateData.status;
            delete updateData.joiningDate;
            delete updateData.employeeId;
            delete updateData.leaveBalance;
            delete updateData.branchId;
            delete updateData.branchName;
        }

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

// POST upload avatar
app.post('/api/employees/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        const employee = await Employee.findOneAndUpdate(
            { employeeId: req.params.id },
            { $set: { avatar: avatarUrl } },
            { new: true }
        );

        if (employee) {
            res.json({ success: true, avatar: avatarUrl, employee });
        } else {
            res.status(404).json({ success: false, message: 'Employee not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE employee
app.delete('/api/employees/:id', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const user = (req as any).user;
        const targetEmployee = await Employee.findOne({ employeeId: req.params.id });
        if (!targetEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (user.role !== 'admin' && targetEmployee.branchId !== user.branchId) {
            return res.status(403).json({ success: false, message: 'Access denied. Employee belongs to another branch.' });
        }

        // Clean up branch manager references if this employee is a branch manager
        if (targetEmployee.email) {
            await Branch.updateMany(
                { email: targetEmployee.email.toLowerCase() },
                { $set: { managerName: '', phone: '', email: '' } }
            );
        }

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

// --- BRANCH ROUTES ---

// GET all branches
app.get('/api/branches', async (req, res) => {
    try {
        const branches = await Branch.find().sort({ branchId: 1 });
        res.json(branches);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST new branch
app.post('/api/branches', authorizeRoles('admin'), async (req, res) => {
    try {
        const { branchId, name, branchCode, address, city, state, country, pincode, managerName, phone, email, employeeStrength, openingDate, branchType, status, password, subAdminEmail, subAdminPassword } = req.body;
        
        let finalBranchId = branchId;
        if (!finalBranchId) {
            const count = await Branch.countDocuments();
            finalBranchId = `BR${String(count + 1).padStart(3, '0')}`;
        }

        const newBranch = new Branch({
            branchId: finalBranchId,
            name,
            branchCode,
            address,
            city,
            state,
            country,
            pincode,
            managerName,
            phone,
            email,
            employeeStrength: employeeStrength || 0,
            openingDate,
            branchType: branchType || 'Regional Office',
            status: status || 'Active'
        });

        await newBranch.save();

        if (email) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password || 'Password123!', salt);
            
            let existingEmp = await Employee.findOne({ email: email.toLowerCase() });
            if (existingEmp) {
                existingEmp.name = managerName || existingEmp.name;
                existingEmp.phone = phone || existingEmp.phone;
                existingEmp.password = hashedPassword;
                existingEmp.branchId = finalBranchId;
                existingEmp.branchName = name;
                existingEmp.role = 'hr';
                await existingEmp.save();
            } else {
                const empId = await generateEmpId();
                const newEmp = new Employee({
                    employeeId: empId,
                    name: managerName || 'Branch Manager',
                    email: email.toLowerCase(),
                    username: email.toLowerCase(),
                    password: hashedPassword,
                    role: 'hr',
                    department: 'Human Resources',
                    status: 'Active',
                    joiningDate: openingDate || new Date().toISOString().split('T')[0],
                    phone: phone || '',
                    branchId: finalBranchId,
                    branchName: name,
                    salary: { base: 0, hra: 0, transport: 0, other: 0 },
                    leaveBalance: { sick: 10, casual: 12, earned: 15, wfh: 10 }
                });
                await newEmp.save();
            }
        }

        // Create Sub Admin account if subAdminEmail is provided
        if (subAdminEmail) {
            const salt2 = await bcrypt.genSalt(10);
            const subAdminHash = await bcrypt.hash(subAdminPassword || 'Password123!', salt2);
            const existingSub = await Employee.findOne({ email: subAdminEmail.toLowerCase() });
            if (existingSub) {
                existingSub.role = 'subadmin';
                existingSub.branchId = finalBranchId;
                existingSub.branchName = name;
                existingSub.password = subAdminHash;
                await existingSub.save();
            } else {
                const subEmpId = await generateEmpId();
                const subEmp = new Employee({
                    employeeId: subEmpId,
                    name: managerName || `${name} Sub Admin`,
                    email: subAdminEmail.toLowerCase(),
                    username: subAdminEmail.toLowerCase(),
                    password: subAdminHash,
                    role: 'subadmin',
                    department: 'Administration',
                    status: 'Active',
                    joiningDate: openingDate || new Date().toISOString().split('T')[0],
                    phone: phone || '',
                    branchId: finalBranchId,
                    branchName: name,
                    salary: { base: 0, hra: 0, transport: 0, other: 0 },
                    leaveBalance: { sick: 10, casual: 12, earned: 15, wfh: 10 }
                });
                await subEmp.save();
            }
        }

        res.status(201).json(newBranch);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update branch
app.put('/api/branches/:id', authorizeRoles('admin'), async (req, res) => {
    try {
        const { password, subAdminPassword, subAdminEmail, ...branchData } = req.body;

        const updatedBranch = await Branch.findOneAndUpdate(
            { branchId: req.params.id },
            branchData,
            { new: true }
        );
        if (updatedBranch) {
            // Sync HR manager employee account if email is set
            if (updatedBranch.email) {
                const existingEmp = await Employee.findOne({ email: updatedBranch.email.toLowerCase() });
                if (existingEmp) {
                    existingEmp.name = updatedBranch.managerName || existingEmp.name;
                    existingEmp.phone = updatedBranch.phone || existingEmp.phone;
                    existingEmp.branchId = updatedBranch.branchId;
                    existingEmp.branchName = updatedBranch.name;
                    if (password) {
                        const salt = await bcrypt.genSalt(10);
                        existingEmp.password = await bcrypt.hash(password, salt);
                    }
                    await existingEmp.save();
                }
            }
            // Sync Sub Admin employee account if subAdminEmail is provided
            const targetSubEmail = subAdminEmail || (updatedBranch as any).subAdminEmail;
            if (targetSubEmail) {
                const existingSub = await Employee.findOne({ email: targetSubEmail.toLowerCase() });
                if (existingSub) {
                    existingSub.branchId = updatedBranch.branchId;
                    existingSub.branchName = updatedBranch.name;
                    if (updatedBranch.managerName) {
                        existingSub.name = updatedBranch.managerName;
                    }
                    if (subAdminPassword) {
                        const salt2 = await bcrypt.genSalt(10);
                        existingSub.password = await bcrypt.hash(subAdminPassword, salt2);
                    }
                    await existingSub.save();
                } else if (subAdminEmail) {
                    // Create new sub admin account
                    const salt2 = await bcrypt.genSalt(10);
                    const subHash = await bcrypt.hash(subAdminPassword || 'Password123!', salt2);
                    const subEmpId = await generateEmpId();
                    await new Employee({
                        employeeId: subEmpId,
                        name: updatedBranch.managerName || `${updatedBranch.name} Sub Admin`,
                        email: subAdminEmail.toLowerCase(),
                        username: subAdminEmail.toLowerCase(),
                        password: subHash,
                        role: 'subadmin',
                        department: 'Administration',
                        status: 'Active',
                        joiningDate: new Date().toISOString().split('T')[0],
                        phone: updatedBranch.phone || '',
                        branchId: updatedBranch.branchId,
                        branchName: updatedBranch.name,
                        salary: { base: 0, hra: 0, transport: 0, other: 0 },
                        leaveBalance: { sick: 10, casual: 12, earned: 15, wfh: 10 }
                    }).save();
                }
            }
            res.json(updatedBranch);
        } else {
            res.status(404).json({ success: false, message: 'Branch not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE branch
app.delete('/api/branches/:id', authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await Branch.findOneAndDelete({ branchId: req.params.id });
        if (result) {
            res.json({ message: 'Branch deleted successfully' });
        } else {
            res.status(404).json({ message: 'Branch not found' });
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

// GET SubAdmin Dashboard Stats
app.get('/api/subadmin/stats', authorizeRoles('subadmin'), async (req, res) => {
    try {
        const user = (req as any).user;
        const branchId = user.branchId;

        if (!branchId) {
            return res.status(400).json({ success: false, message: 'SubAdmin branch context missing' });
        }

        const [totalEmployees] = await Promise.all([
            Employee.countDocuments({ branchId })
        ]);

        // Fetch employees in this branch to filter leaves and payroll
        const branchEmployees = await Employee.find({ branchId }).select('employeeId');
        const empIds = branchEmployees.map(e => e.employeeId);

        const [actualPendingRequests, actualPayrollData, actualTasks] = await Promise.all([
            Leave.countDocuments({ status: 'Pending', employeeId: { $in: empIds } }),
            Payroll.aggregate([
                { $unwind: '$records' },
                { $match: { 'records.employeeId': { $in: empIds } } },
                { $group: { _id: null, total: { $sum: '$records.netSalary' } } }
            ]),
            Task.distinct('projectName', { projectName: { $ne: null, $exists: true }, employeeId: { $in: empIds } })
        ]);

        res.json({
            totalEmployees: totalEmployees || 0,
            totalPayroll: actualPayrollData[0]?.total || 0,
            activeProjects: actualTasks.filter(name => name && typeof name === 'string' && name.trim() !== '').length,
            pendingRequests: actualPendingRequests || 0
        });
    } catch (error: any) {
        console.error('[ERROR] Failed to fetch subadmin stats:', error);
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
        const user = (req as any).user;
        const query: any = {};
        if (date) query.date = date;

        if (user.role === 'employee' || user.role === 'staff') {
            query.employeeId = user.id;
        } else if (user.role !== 'admin' && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            if (employeeId && branchEmpIds.includes(employeeId as string)) {
                query.employeeId = employeeId;
            } else {
                query.employeeId = { $in: branchEmpIds };
            }
        } else {
            if (employeeId) query.employeeId = employeeId;
        }
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
app.post('/api/payroll/generate', authorizeRoles('admin', 'subadmin'), async (req, res) => {
    const { month, year, records } = req.body;
    const user = (req as any).user;

    try {
        let validRecords = records;
        let branchEmpIds: string[] = [];

        if (user.role !== 'admin') {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            validRecords = records.filter((r: any) => branchEmpIds.includes(r.employeeId));
        }

        let existingPayroll = await Payroll.findOne({ month, year });
        if (existingPayroll) {
            if (user.role !== 'admin') {
                // Keep records of other branches, replace only this branch's employees
                const otherRecords = existingPayroll.records.filter((r: any) => !branchEmpIds.includes(r.employeeId));
                existingPayroll.records = [...otherRecords, ...validRecords];
            } else {
                existingPayroll.records = validRecords;
            }
            existingPayroll.dateGenerated = new Date().toISOString();
            await existingPayroll.save();
            res.status(201).json(existingPayroll);
        } else {
            const newPayroll = new Payroll({
                month,
                year,
                dateGenerated: new Date().toISOString(),
                records: validRecords
            });
            await newPayroll.save();
            res.status(201).json(newPayroll);
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET Payroll History
app.get('/api/payroll', async (req, res) => {
    try {
        const user = (req as any).user;
        let payrolls: any[] = await Payroll.find();
        
        if (user.role === 'employee' || user.role === 'staff') {
            payrolls = payrolls.map(p => {
                const po = p.toObject ? p.toObject() : p;
                po.records = po.records.filter((r: any) => r.employeeId === user.id);
                return po;
            }).filter(p => p.records.length > 0);
        } else if (user.role !== 'admin' && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = new Set(branchEmps.map(e => e.employeeId));
            
            payrolls = payrolls.map(p => {
                const po = p.toObject ? p.toObject() : p;
                po.records = po.records.filter((r: any) => branchEmpIds.has(r.employeeId));
                return po;
            }).filter(p => p.records.length > 0);
        }
        res.json(payrolls);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- LEAVE ROUTES ---

// GET all leaves
app.get('/api/leaves', async (req, res) => {
    try {
        const user = (req as any).user;
        let leaves;
        if (user.role === 'employee' || user.role === 'staff') {
            leaves = await Leave.find({ employeeId: user.id });
        } else if (user.role !== 'admin' && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            leaves = await Leave.find({ employeeId: { $in: branchEmpIds } });
        } else {
            leaves = await Leave.find();
        }
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
        const user = (req as any).user;
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (user.role !== 'admin') {
            const employee = await Employee.findOne({ employeeId: leave.employeeId });
            if (!employee || employee.branchId !== user.branchId) {
                return res.status(403).json({ message: 'Access denied. Employee belongs to another branch.' });
            }
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


// --- EXPENSE ROUTES ---

// GET all expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const user = (req as any).user;
        if (user.role === 'admin') {
            const expenses = await Expense.find().sort({ createdAt: -1 });
            res.json(expenses);
        } else if ((user.role === 'subadmin' || user.role === 'hr') && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            const expenses = await Expense.find({ employeeId: { $in: branchEmpIds } }).sort({ createdAt: -1 });
            res.json(expenses);
        } else {
            const expenses = await Expense.find({ employeeId: user.id }).sort({ createdAt: -1 });
            res.json(expenses);
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST new expense claim
app.post('/api/expenses', upload.single('receipt'), async (req, res) => {
    try {
        const { employeeId, employeeName, employeeRole, category, amount, date, description } = req.body;
        const newExpense = new Expense({
            employeeId,
            employeeName,
            employeeRole: employeeRole || 'employee',
            category,
            amount: Number(amount),
            date,
            description,
            status: 'Pending',
            receiptName: req.file ? req.file.originalname : undefined,
            receiptUrl: req.file ? `/uploads/${req.file.filename}` : undefined
        });
        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update expense status (Approve/Reject)
app.put('/api/expenses/:id/status', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const { status } = req.body;
        const user = (req as any).user;
        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense claim not found' });
        }
        if (user.role !== 'admin') {
            const employee = await Employee.findOne({ employeeId: expense.employeeId });
            if (!employee || employee.branchId !== user.branchId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }
        expense.status = status;
        await expense.save();
        res.json(expense);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE delete pending expense claim
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const user = (req as any).user;
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense claim not found' });
        }
        if (user.role !== 'admin' && expense.employeeId !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Expense claim deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PERMISSION ROUTES ---

app.get('/api/permissions', authorizeRoles('admin'), async (req, res) => {
    try {
        const permissions = await Permission.find().sort({ createdAt: -1 });
        res.json(permissions);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/permissions/branch/:branchId', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const permissions = await Permission.find({ branchId: req.params.branchId }).sort({ createdAt: -1 });
        res.json(permissions);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/permissions/employee/:employeeId', async (req, res) => {
    try {
        const permissions = await Permission.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
        res.json(permissions);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/permissions', async (req, res) => {
    try {
        const newPermission = new Permission(req.body);
        await newPermission.save();
        res.status(201).json(newPermission);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/permissions/:id/status', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const { status, approvedBy } = req.body;
        if (!['Approved', 'Declined', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const permission = await Permission.findById(req.params.id);
        if (!permission) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }
        
        // Validation check for subadmin/hr: only approve for own branch
        const user = (req as any).user;
        if (user.role !== 'admin' && permission.branchId !== user.branchId) {
            return res.status(403).json({ success: false, message: 'Access denied to this branch\'s permissions' });
        }

        permission.status = status;
        permission.approvedBy = approvedBy;
        await permission.save();
        res.json(permission);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PERFORMANCE ROUTES ---

app.get('/api/performance', async (req, res) => {
    try {
        const user = (req as any).user;
        let query: any = {};
        if (user.role === 'employee' || user.role === 'staff') {
            query.employeeId = user.id;
        } else if (user.role !== 'admin' && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            query.employeeId = { $in: branchEmpIds };
        }
        const performance = await Performance.find(query);
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
        const user = (req as any).user;
        const query: any = {};
        if (user.role === 'employee' || user.role === 'staff') {
            query.employeeId = user.id;
        } else if (user.role !== 'admin' && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            if (employeeId && branchEmpIds.includes(employeeId as string)) {
                query.employeeId = employeeId;
            } else {
                query.employeeId = { $in: branchEmpIds };
            }
        } else {
            if (employeeId) query.employeeId = employeeId;
        }
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
        const user = (req as any).user;
        let query: any = {};
        if (user.role !== 'admin' && user.branchName) {
            query = {
                $or: [
                    { branch: user.branchName },
                    { branch: { $exists: false } },
                    { branch: null },
                    { branch: '' }
                ]
            };
        }
        const announcements = await Announcement.find(query);
        res.json(announcements);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/announcements', authorizeRoles('admin', 'subadmin'), async (req, res) => {
    try {
        const user = (req as any).user;
        const newAnnouncement = new Announcement({
            date: new Date().toISOString().split('T')[0],
            ...req.body
        });
        
        if (user.role !== 'admin') {
            newAnnouncement.branch = user.branchName;
        }

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
        const user = (req as any).user;
        const query: any = {};
        if (date) query.date = date;

        if (user.role === 'employee' || user.role === 'staff') {
            query.employeeId = user.id;
        } else if (user.role !== 'admin' && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            if (employeeId && branchEmpIds.includes(employeeId as string)) {
                query.employeeId = employeeId;
            } else {
                query.employeeId = { $in: branchEmpIds };
            }
        } else {
            if (employeeId) query.employeeId = employeeId;
        }
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
        const user = (req as any).user;
        const query: any = {};

        if (user.role === 'employee' || user.role === 'staff') {
            query.employeeId = user.id;
        } else if (user.role !== 'admin' && user.branchId) {
            const branchEmps = await Employee.find({ branchId: user.branchId }).select('employeeId');
            const branchEmpIds = branchEmps.map((e: any) => e.employeeId);
            if (employeeId && branchEmpIds.includes(employeeId as string)) {
                query.employeeId = employeeId;
            } else {
                query.employeeId = { $in: branchEmpIds };
            }
        } else {
            if (employeeId) query.employeeId = employeeId;
        }
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

app.put('/api/queries/:id', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const { status } = req.body;
        const user = (req as any).user;
        
        const query = await Query.findById(req.params.id);
        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        if (user.role !== 'admin') {
            const employee = await Employee.findOne({ employeeId: query.employeeId });
            if (!employee || employee.branchId !== user.branchId) {
                return res.status(403).json({ success: false, message: 'Access denied. Employee belongs to another branch.' });
            }
        }

        query.status = status;
        query.updatedAt = new Date();
        await query.save();
        res.json(query);
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
// --- JOB POSTINGS ROUTES ---

app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await JobPosting.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/jobs', authorizeRoles('admin', 'hr'), async (req, res) => {
    try {
        const newJob = new JobPosting(req.body);
        await newJob.save();
        res.status(201).json(newJob);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/jobs/:id', authorizeRoles('admin', 'hr'), async (req, res) => {
    try {
        const updatedJob = await JobPosting.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (updatedJob) {
            res.json(updatedJob);
        } else {
            res.status(404).json({ message: 'Job posting not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/jobs/:id', authorizeRoles('admin', 'hr'), async (req, res) => {
    try {
        const result = await JobPosting.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Job posting deleted' });
        } else {
            res.status(404).json({ message: 'Job posting not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- RESIGNATION ROUTES ---
app.get('/api/resignations', authMiddleware, async (req, res) => {
    try {
        const resignations = await Resignation.find().sort({ createdAt: -1 });
        res.json(resignations);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/resignations/:employeeId', authMiddleware, async (req, res) => {
    try {
        const resignations = await Resignation.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
        res.json(resignations);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/resignations', authMiddleware, async (req, res) => {
    try {
        const newResignation = new Resignation(req.body);
        await newResignation.save();
        res.status(201).json(newResignation);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/resignations/:id', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const updatedResignation = await Resignation.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (updatedResignation) {
            res.json(updatedResignation);
        } else {
            res.status(404).json({ message: 'Resignation not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- EMPLOYEE STATUS UPDATE ROUTE ---
app.put('/api/employees/:id/status', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            { id: req.params.id }, // Wait, id or _id? Let me check how ID is handled... employeeId
            { status: req.body.status },
            { new: true }
        );
        
        // Try fallback to employeeId
        if (!updatedEmployee) {
             const fallbackUpdate = await Employee.findOneAndUpdate(
                { employeeId: req.params.id },
                { status: req.body.status },
                { new: true }
            );
            if (!fallbackUpdate) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.json(fallbackUpdate);
        } else {
            res.json(updatedEmployee);
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PERMISSION ROUTES ---
app.get('/api/permissions', authMiddleware, async (req, res) => {
    try {
        const permissions = await Permission.find().sort({ createdAt: -1 });
        res.json(permissions);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/permissions/employee/:employeeId', authMiddleware, async (req, res) => {
    try {
        const permissions = await Permission.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
        res.json(permissions);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/permissions/branch/:branchId', authMiddleware, async (req, res) => {
    try {
        const permissions = await Permission.find({ branchId: req.params.branchId }).sort({ createdAt: -1 });
        res.json(permissions);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/permissions', authMiddleware, async (req, res) => {
    try {
        const permission = new Permission(req.body);
        await permission.save();
        res.status(201).json(permission);
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
});

app.put('/api/permissions/:id/status', authorizeRoles('admin', 'subadmin', 'hr'), async (req, res) => {
    try {
        const { status, approvedBy } = req.body;
        const updatedPermission = await Permission.findByIdAndUpdate(
            req.params.id,
            { status, approvedBy },
            { new: true }
        );
        if (!updatedPermission) {
            return res.status(404).json({ message: 'Permission not found' });
        }
        res.json(updatedPermission);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- FILE UPLOAD ROUTE ---
app.post('/api/upload', authorizeRoles('admin', 'hr'), upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // If Cloudinary is configured, req.file.path is the URL. Otherwise, we build the local URL.
        const isCloudinary = process.env.CLOUDINARY_CLOUD_NAME ? true : false;
        const fileUrl = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
        
        res.json({ success: true, url: fileUrl });
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
