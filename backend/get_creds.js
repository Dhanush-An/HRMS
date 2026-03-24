const mongoose = require('mongoose');
require('dotenv').config();

async function getCreds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        console.log('--- ADMIN CREDENTIALS ---');
        const admins = await db.collection('admins').find({}).toArray();
        if (admins.length > 0) {
            admins.forEach(a => console.log(`Email/Username: ${a.email} or ${a.username || a.email}`));
        } else {
            // Check appadmins just in case
            const appadmins = await db.collection('appadmins').find({}).toArray();
            appadmins.forEach(a => console.log(`Email/Username: ${a.email} or ${a.username || a.email}`));
        }

        console.log('\n--- HR CREDENTIALS ---');
        const hrs = await db.collection('employees').find({ role: 'hr' }).limit(3).toArray();
        hrs.forEach(h => console.log(`Email: ${h.email} | Username: ${h.username}`));

        console.log('\n--- EMPLOYEE CREDENTIALS ---');
        const emps = await db.collection('employees').find({ role: { $ne: 'hr' } }).limit(3).toArray();
        emps.forEach(e => console.log(`Email: ${e.email} | Username: ${e.username} | Role: ${e.role}`));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

getCreds();
