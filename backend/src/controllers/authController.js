const Employee = require('../models/Employee');

const authController = {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await Employee.findByEmail(email);

            if (user && String(user.password) === String(password)) {
                const { password, ...userWithoutPassword } = user;
                res.json({
                    user: userWithoutPassword,
                    token: 'mock-jwt-token', // You'd replace this with real JWT generation
                    role: (user.role === 'HR Manager' || user.role === 'Admin') ? 'Admin' : 'Employee'
                });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Server error during login' });
        }
    },

    async me(req, res) {
        const employees = await Employee.findAll();
        if (employees.length > 0) {
            const { password, ...userWithoutPassword } = employees[0];
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ message: 'No users found' });
        }
    }
};

module.exports = authController;
