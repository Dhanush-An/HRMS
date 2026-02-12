const { readData, writeData } = require('../utils/storage');

const FILE_NAME = 'attendance.json';
const EMP_FILE = 'employees.json';

// Get all attendance
exports.getAllAttendance = async (req, res) => {
    try {
        const attendance = await readData(FILE_NAME);
        const employees = await readData(EMP_FILE);

        const mappedAttendance = attendance.map(att => ({
            ...att,
            employeeName: employees.find(e => e.id === att.employee_id)?.name || 'Unknown'
        }));

        res.json(mappedAttendance.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Clock in
exports.clockIn = async (req, res) => {
    try {
        const { employee_id } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];

        const attendance = await readData(FILE_NAME);
        const existing = attendance.find(a => a.employee_id === employee_id && a.date === today);

        if (existing) {
            return res.status(400).json({ message: 'Already clocked in today' });
        }

        const newRecord = {
            id: attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1,
            employee_id,
            date: today,
            check_in: currentTime,
            status: "Present"
        };

        attendance.push(newRecord);
        await writeData(FILE_NAME, attendance);

        res.json({ message: 'Clocked in successfully', time: currentTime });
    } catch (error) {
        console.error('Clock in error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Clock out
exports.clockOut = async (req, res) => {
    try {
        const { employee_id } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];

        const attendance = await readData(FILE_NAME);
        const index = attendance.findIndex(a => a.employee_id === employee_id && a.date === today);

        if (index === -1) {
            return res.status(400).json({ message: 'No clock-in record found for today' });
        }

        attendance[index].check_out = currentTime;
        await writeData(FILE_NAME, attendance);

        res.json({ message: 'Clocked out successfully', time: currentTime });
    } catch (error) {
        console.error('Clock out error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get employee attendance
exports.getEmployeeAttendance = async (req, res) => {
    try {
        const attendance = await readData(FILE_NAME);
        const records = attendance.filter(a => a.employee_id === parseInt(req.params.employeeId));
        res.json(records.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
        console.error('Get employee attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
