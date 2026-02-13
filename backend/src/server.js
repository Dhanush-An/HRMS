const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const announcementRoutes = require('./routes/announcements');
const reportRoutes = require('./routes/reports');

const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
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

    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) {
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
    // In production (Vercel), just have a simple API 404
    app.use('/api/*', (req, res) => {
        res.status(404).json({ message: `API Route not found: ${req.method} ${req.originalUrl}` });
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Only start the server if we're not running in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
