import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const db = mongoose.connection.db;
        if (!db) throw new Error('DB not found');
        const users = await db.collection('employees').find({ email: /dhanush/i }).toArray();
        console.log(JSON.stringify(users, null, 2));
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
verifyUser();
