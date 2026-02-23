import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee';

dotenv.config();

const DATA_FILE = path.join(__dirname, '../../data/employees.json');
const MONGODB_URI = process.env.MONGODB_URI;

const migrate = async () => {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        console.log('[MIGRATE] Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('[MIGRATE] Connected.');

        if (!fs.existsSync(DATA_FILE)) {
            console.log('[MIGRATE] No local employees.json found. Skipping migration.');
            return;
        }

        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const employees = JSON.parse(data);

        console.log(`[MIGRATE] Found ${employees.length} employees in JSON.`);

        for (const emp of employees) {
            const exists = await Employee.findOne({ id: emp.id });
            if (!exists) {
                console.log(`[MIGRATE] Importing ${emp.name} (${emp.id})...`);
                await Employee.create(emp);
            } else {
                console.log(`[MIGRATE] Employee ${emp.id} already exists. Skipping.`);
            }
        }

        console.log('[MIGRATE] Migration completed successfully.');
        process.exit(0);
    } catch (error: any) {
        console.error('[MIGRATE] ERROR:', error.message);
        process.exit(1);
    }
};

migrate();
