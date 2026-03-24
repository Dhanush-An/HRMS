import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Utility script to verify the database connection and state.
 * This script is used for debugging connectivity issues and inspecting
 * the current state of the Employee and Admin collections.
 */
async function checkDatabaseState() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('FATAL: MONGODB_URI is not defined in the environment variables.');
        process.exit(1);
    }

    try {
        console.log('--- Database Verification Script ---');
        console.log(`Connecting to: ${mongoUri.split('@')[1] || 'URL'}`);
        // Line 26: Fixed "Argument of type 'string | undefined' is not assignable"
        await mongoose.connect(mongoUri!); 

        console.log('SUCCESS: Connected to MongoDB.');

        const db = mongoose.connection.db;
        if (!db) throw new Error('Database connection not established');

        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name).join(', '));

        console.log('-----------------------------------');
    } catch (err: any) {
        console.error('ERROR: Failed to connect or query database:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Connection closed.');
        process.exit(0);
    }
}

// Execute the check
checkDatabaseState();
