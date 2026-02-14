import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes using dynamic imports or type them as any for now since they are .js files
// Setting them to 'any' to avoid "missing module" errors while they remain .js
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const announcementRoutes = require('./routes/announcements');
const reportRoutes = require('./routes/reports');

const app = express();

// Middleware
// Middleware
const frontendUrl = (process.env.FRONTEND_URL || '').trim();
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? (frontendUrl || true) : true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);

// Only serve static files and SPA catch-all in development
// Vercel handles this via vercel.json rewrites
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));

    app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api')) {
            console.log(`[Route Error] API 404: ${req.method} ${req.path}`);
            return res.status(404).json({ message: `API Route not found: ${req.method} ${req.path}` });
        }
        const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
        res.sendFile(indexPath, (err) => {
            if (err) {
                res.status(404).json({ message: "Frontend build not found. Please run 'npm run build' or use dev server." });
            }
        });
    });
} else {
    // In production (Vercel/Render), just have a simple API 404
    app.use("/api", (req: Request, res: Response) => {
        console.log(`[Route Error] API 404: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ message: `API Route not found: ${req.method} ${req.originalUrl}` });
    });
}

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Only start the server if we're not running in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL || process.env.RENDER) {
    app.listen(Number(PORT), () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

export default app;
