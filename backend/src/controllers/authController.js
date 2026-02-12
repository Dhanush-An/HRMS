const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../utils/storage');

// Login
exports.login = async (req, res) => {
    try {
        let { email, password, role } = req.body;
        if (email) email = email.toLowerCase();
        if (role) role = role.toLowerCase();

        // Admin login
        if (role === 'admin') {
            if ((email === 'admin@hrms.com' || email === 'admin') && password === 'admin123') {
                const token = jwt.sign(
                    { id: 0, email, role: 'admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                return res.json({ token, role: 'admin', user: { email, name: 'Admin' } });
            }
        }

        const employees = await readData('employees.json');

        // Find user by email or username first
        const user = employees.find(e =>
            e.email === email || (e.username && e.username === email)
        );

        console.log(`Login Request: ${email}, Role: ${role}`);

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`User Found: ${user.email}, Role: ${user.role}, Hash: ${user.password_hash ? 'Yes' : 'No'}`);

        // Validate Role Access
        if (role) {
            const isUserAdmin = user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'hr manager';

            if (role === 'admin') {
                if (!isUserAdmin) {
                    console.log('Admin login denied for non-admin');
                    return res.status(401).json({ message: 'Access denied: Admins only' });
                }
            } else if (role === 'employee') {
                // Allow any role to login as employee
            }
        }

        const isValidPassword = user.password_hash && await bcrypt.compare(password, user.password_hash);
        console.log(`Password Valid: ${isValidPassword}`);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'employee' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            role: user.role || 'employee',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'employee',
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Register
exports.register = async (req, res) => {
    try {
        let { name, email, password, role } = req.body;
        if (email) email = email.toLowerCase();
        // Default to Employee if not specified, otherwise use provided role (ensure it's either Admin or Employee)
        const userRole = role && ['admin', 'employee'].includes(role.toLowerCase()) ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Employee';

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const employees = await readData('employees.json');

        // Check if user already exists
        // Check if user already exists in employees
        const existingUser = employees.find(e => e.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if user already exists in pending registrations
        const pendingRegistrations = await readData('pending_registrations.json');
        const existingPending = pendingRegistrations.find(e => e.email === email);
        if (existingPending) {
            return res.status(400).json({ message: 'Registration request already pending' });
        }

        // Create new pending user
        const hashedPassword = await bcrypt.hash(password, 10);

        // Helper to get next ID
        const getNextId = (list1, list2) => {
            const max1 = list1.length > 0 ? Math.max(...list1.map(e => e.id)) : 0;
            const max2 = list2.length > 0 ? Math.max(...list2.map(e => e.id)) : 0;
            return Math.max(max1, max2) + 1;
        }

        const newId = getNextId(employees, pendingRegistrations);
        const newEmployeeId = `EMP${String(newId).padStart(3, '0')}`;

        const newUser = {
            id: newId,
            name,
            email,
            phone: '', // Default empty
            role: userRole,
            department: 'Unassigned',
            reporting_to: null,
            joining_date: new Date().toISOString().split('T')[0],
            employee_id: newEmployeeId,
            location: '',
            salary: 0,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            status: 'Pending',
            password_hash: hashedPassword,
            password_plain: password // Storing plain password TEMPORARILY as requested by user for admin verification
        };

        pendingRegistrations.push(newUser);
        await writeData('pending_registrations.json', pendingRegistrations);

        res.status(200).json({
            message: 'Registration successful. Please wait for admin approval.',
            status: 'Pending'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.json({ email: 'admin@hrms.com', name: 'Admin', role: 'admin' });
        }

        const employees = await readData('employees.json');
        const user = employees.find(e => e.id === req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get pending registrations
exports.getPendingRegistrations = async (req, res) => {
    try {
        const pendingRegistrations = await readData('pending_registrations.json');
        res.json(pendingRegistrations);
    } catch (error) {
        console.error('Get pending registrations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve registration
exports.approveRegistration = async (req, res) => {
    try {
        const { id } = req.body;
        const pendingRegistrations = await readData('pending_registrations.json');
        const employees = await readData('employees.json');

        const index = pendingRegistrations.findIndex(e => e.id === id);
        if (index === -1) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        const newUser = pendingRegistrations[index];

        // Remove temporary plain password before moving to main DB
        // User requested to see password in dashboard, so it was stored. 
        // Ideally we should remove it, but if they want to see it later we might keep it? 
        // Standard practice: REMOVE IT. But request said "see all of the employee password in admin dashboard".
        // To support that requirement, we explicitly KEEP 'password_plain' property or similar, 
        // BUT security-wise this is terrible. 
        // I will keep it as 'password_plain' to fulfill the requirement, but mark status as Active.

        newUser.status = 'Active';
        // Ensure ID uniqueness again just in case
        const maxId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) : 0;
        if (newUser.id <= maxId) {
            newUser.id = maxId + 1;
        }

        employees.push(newUser);
        pendingRegistrations.splice(index, 1);

        await writeData('employees.json', employees);
        await writeData('pending_registrations.json', pendingRegistrations);

        res.json({ message: 'Registration approved successfully', user: newUser });

    } catch (error) {
        console.error('Approve registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reject registration
exports.rejectRegistration = async (req, res) => {
    try {
        const { id } = req.body;
        const pendingRegistrations = await readData('pending_registrations.json');

        const index = pendingRegistrations.findIndex(e => e.id === id);
        if (index === -1) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        pendingRegistrations.splice(index, 1);
        await writeData('pending_registrations.json', pendingRegistrations);

        res.json({ message: 'Registration rejected successfully' });

    } catch (error) {
        console.error('Reject registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
