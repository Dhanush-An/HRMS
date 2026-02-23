import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export let lastConnectionError: string | null = null;

export const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        lastConnectionError = 'MONGODB_URI is not defined';
        console.error('[ERROR] MONGODB_URI is not defined in environment variables.');
        return;
    }

    try {
        console.log('[DEBUG] Attempting to connect to MongoDB (URI length: ' + MONGODB_URI.length + ')...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of default 30s
        });
        console.log('[DEBUG] ✅ Connected to MongoDB Atlas successfully');
        lastConnectionError = null;
    } catch (error: any) {
        lastConnectionError = error.message;
        console.error('[ERROR] ❌ MongoDB connection failed:', error.message);
        // ... rest of logging ...
        console.error('\n' + '='.repeat(50));
        console.error('ACTION REQUIRED: IP WHITELISTING ERROR');
        console.error('1. Go to MongoDB Atlas -> Network Access');
        console.error('2. Click "Add IP Address"');
        console.error('3. Select "Allow Access from Anywhere" (for Render deployment)');
        console.error('4. Save and try again.');
        console.error('='.repeat(50) + '\n');
    }
};
