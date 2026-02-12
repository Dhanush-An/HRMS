const bcrypt = require('bcryptjs');
const { readData, writeData } = require('../utils/storage');

const FILE_NAME = 'employees.json';

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await readData(FILE_NAME);
        const activeEmployees = employees.filter(emp => emp.status === 'Active').map(sanitizeEmployee);
        res.json(activeEmployees);
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper to remove sensitive fields
const sanitizeEmployee = (employee) => {
    const { password, password_hash, ...safeData } = employee;
    return safeData;
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employees = await readData(FILE_NAME);
        const employee = employees.find(emp => emp.id === parseInt(req.params.id));

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(sanitizeEmployee(employee));
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create employee
exports.createEmployee = async (req, res) => {
    try {
        const employees = await readData(FILE_NAME);
        const { password, ...otherData } = req.body;
        // Check if email or username already exists
        const existingUser = employees.find(e => e.email === req.body.email || (req.body.username && e.username === req.body.username));
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // Validate phone number
        if (otherData.phone && !/^\d{10}$/.test(otherData.phone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
        }
        if (otherData.personal_contact?.phone && !/^\d{10}$/.test(otherData.personal_contact.phone)) {
            return res.status(400).json({ message: 'Personal phone number must be exactly 10 digits' });
        }

        const newEmployee = {
            id: employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1,
            ...otherData,
            status: 'Active'
        };

        if (password) {
            newEmployee.password_hash = await bcrypt.hash(password, 10);
        }

        employees.push(newEmployee);
        await writeData(FILE_NAME, employees);

        res.status(201).json({ id: newEmployee.id, message: 'Employee created successfully' });
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const employees = await readData(FILE_NAME);
        const searchId = parseInt(req.params.id);
        console.log(`Updating employee ID: ${searchId}`);

        const index = employees.findIndex(emp => parseInt(emp.id) === searchId);

        if (index === -1) {
            console.warn(`Employee not found for update: ID ${searchId}`);
            return res.status(404).json({ message: 'Employee not found' });
        }

        const { password, ...updateData } = req.body;

        // Ensure we don't accidentally update the ID to a string or wrong value
        delete updateData.id;

        // Validate phone number if it's being updated
        if (updateData.phone && !/^\d{10}$/.test(updateData.phone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
        }
        if (updateData.personal_contact?.phone && !/^\d{10}$/.test(updateData.personal_contact.phone)) {
            return res.status(400).json({ message: 'Personal phone number must be exactly 10 digits' });
        }

        // FIELD-LEVEL SECURITY: If not admin, restrict which fields can be updated
        if (req.user.role !== 'admin') {
            const allowedFields = ['documents', 'personal_contact', 'photo', 'phone', 'location'];
            const restrictedFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));

            if (restrictedFields.length > 0) {
                console.warn(`User ${req.user.id} attempted to update restricted fields: ${restrictedFields.join(', ')}`);
                // Remove restricted fields from updateData
                restrictedFields.forEach(field => delete updateData[field]);
            }
        }

        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        employees[index] = { ...employees[index], ...updateData };
        await writeData(FILE_NAME, employees);

        console.log(`Employee ${searchId} updated successfully`);
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        const employees = await readData(FILE_NAME);
        const index = employees.findIndex(emp => emp.id === parseInt(req.params.id));

        if (index === -1) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        employees[index].status = 'Inactive';
        await writeData(FILE_NAME, employees);

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
