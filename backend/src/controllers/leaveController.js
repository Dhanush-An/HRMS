const { readData, writeData } = require('../utils/storage');

const FILE_NAME = 'leaves.json';
const EMP_FILE = 'employees.json';

// Get all leaves
exports.getAllLeaves = async (req, res) => {
    try {
        const leaves = await readData(FILE_NAME);
        const employees = await readData(EMP_FILE);

        const mappedLeaves = leaves.map(leave => {
            const employee = employees.find(e => String(e.id) === String(leave.employee_id));
            return {
                id: leave.id,
                employeeId: leave.employee_id,
                employeeName: employee ? employee.name : 'Unknown',
                leaveType: leave.leave_type,
                startDate: leave.start_date,
                endDate: leave.end_date,
                days: leave.days,
                reason: leave.reason,
                status: leave.status,
                appliedOn: leave.applied_on
            };
        });

        res.json(mappedLeaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn)));
    } catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create leave request
exports.createLeave = async (req, res) => {
    try {
        const {
            employee_id, employeeId,
            leave_type, leaveType,
            start_date, startDate,
            end_date, endDate,
            days, reason
        } = req.body;

        const applied_on = new Date().toISOString().split('T')[0];

        const leaves = await readData(FILE_NAME);
        const newLeave = {
            id: leaves.length > 0 ? Math.max(...leaves.map(l => l.id)) + 1 : 1,
            employee_id: employeeId || employee_id,
            leave_type: leaveType || leave_type,
            start_date: startDate || start_date,
            end_date: endDate || end_date,
            days,
            reason,
            applied_on,
            status: 'Pending'
        };

        leaves.push(newLeave);
        await writeData(FILE_NAME, leaves);

        res.status(201).json({ message: 'Leave request submitted successfully' });
    } catch (error) {
        console.error('Create leave error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update leave status
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { status, approved_by } = req.body;
        const approved_on = new Date().toISOString().split('T')[0];

        const leaves = await readData(FILE_NAME);
        const index = leaves.findIndex(l => l.id === parseInt(req.params.id));

        if (index === -1) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        leaves[index] = { ...leaves[index], status, approved_by, approved_on };
        await writeData(FILE_NAME, leaves);

        res.json({ message: 'Leave status updated successfully' });
    } catch (error) {
        console.error('Update leave error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get employee leaves
exports.getEmployeeLeaves = async (req, res) => {
    try {
        const leaves = await readData(FILE_NAME);
        const targetId = String(req.params.employeeId);
        const records = leaves.filter(l => String(l.employee_id) === targetId);

        const mappedRecords = records.map(leave => ({
            id: leave.id,
            employeeId: leave.employee_id,
            leaveType: leave.leave_type,
            startDate: leave.start_date,
            endDate: leave.end_date,
            days: leave.days,
            reason: leave.reason,
            status: leave.status,
            appliedOn: leave.applied_on
        }));

        res.json(mappedRecords.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn)));
    } catch (error) {
        console.error('Get employee leaves error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
