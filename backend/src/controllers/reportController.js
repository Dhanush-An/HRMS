const { readData, writeData } = require('../utils/storage');

const FILE_NAME = 'daily_reports.json';

// Create a new report
exports.createReport = async (req, res) => {
    try {
        const reports = await readData(FILE_NAME);
        const { date, department, morningReport, afternoonReport } = req.body;

        // Validation
        if (!date || !morningReport || !afternoonReport) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newReport = {
            id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
            employeeId: req.user.id,
            employeeName: req.user.name,
            role: req.user.role,
            date,
            department: department || req.user.department,
            morningReport,
            afternoonReport,
            timestamp: new Date().toISOString()
        };

        reports.push(newReport);
        await writeData(FILE_NAME, reports);

        res.status(201).json({ message: 'Daily report submitted successfully', report: newReport });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all reports (Admin view)
exports.getAllReports = async (req, res) => {
    try {
        const reports = await readData(FILE_NAME);
        // Sort by newest first
        const sortedReports = reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(sortedReports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get reports for a specific employee
exports.getEmployeeReports = async (req, res) => {
    try {
        const reports = await readData(FILE_NAME);
        const employeeReports = reports
            .filter(r => String(r.employeeId) === String(req.user.id))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json(employeeReports);
    } catch (error) {
        console.error('Get employee reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
