const bcrypt = require('bcryptjs');
const { readData, writeData } = require('../src/utils/storage');

async function seedDatabase() {
    try {
        console.log('🌱 Starting JSON database seeding...');

        // Initial Employees data (including the Sarah Johnson one from the old seed)
        const initialEmployees = [
            {
                id: 1,
                name: 'Sarah Johnson',
                email: 'sarah.j@company.com',
                phone: '+1 (555) 123-4567',
                role: 'Senior Software Engineer',
                department: 'Engineering',
                reporting_to: null,
                joining_date: '2022-01-15',
                employee_id: 'EMP001',
                location: 'New York, NY',
                salary: 120000,
                avatar: 'SJ',
                status: 'Active',
                password_hash: await bcrypt.hash('sarah123', 10)
            },
            {
                id: 2,
                name: 'Michael Chen',
                email: 'michael.c@company.com',
                phone: '+1 (555) 234-5678',
                role: 'Product Manager',
                department: 'Product',
                reporting_to: 1,
                joining_date: '2022-03-20',
                employee_id: 'EMP002',
                location: 'San Francisco, CA',
                salary: 110000,
                avatar: 'MC',
                status: 'Active',
                password_hash: await bcrypt.hash('michael123', 10)
            }
        ];

        // Seeding employees if needed (preserving existing or replacing)
        // For now, let's just make sure we HAVE the base data
        await writeData('employees.json', initialEmployees);
        console.log('✅ Employees seeded');

        // Initial Attendance
        const today = new Date().toISOString().split('T')[0];
        const attendance = [
            { id: 1, employee_id: 1, date: today, check_in: '09:00:00', check_out: '18:00:00', status: 'Present' }
        ];
        await writeData('attendance.json', attendance);
        console.log('✅ Attendance seeded');

        // Initial Leaves
        const leaves = [
            { id: 1, employee_id: 2, leave_type: 'Sick Leave', start_date: '2026-02-12', end_date: '2026-02-13', days: 2, reason: 'Medical', status: 'Pending', applied_on: '2026-02-10' }
        ];
        await writeData('leaves.json', leaves);
        console.log('✅ Leaves seeded');

        console.log('🎉 JSON Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();
