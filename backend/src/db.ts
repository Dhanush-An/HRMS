import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('[ERROR] MONGODB_URI is not defined in environment variables.');
        console.log('[DEBUG] Current Working Directory:', process.cwd());
        console.log('[DEBUG] Environment keys available:', Object.keys(process.env).filter(k => !k.startsWith('npm_')));
        return;
    }

    try {
        console.log('[DEBUG] Attempting to connect to MongoDB (URI length: ' + MONGODB_URI.length + ')...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of default 30s
        });
        console.log('[DEBUG] ✅ Connected to MongoDB Atlas successfully');
    } catch (error: any) {
        console.error('[ERROR] ❌ MongoDB connection failed:', error.message);
        console.error('\n' + '='.repeat(50));
        console.error('ACTION REQUIRED: IP WHITELISTING ERROR');
        console.error('1. Go to MongoDB Atlas -> Network Access');
        console.error('2. Click "Add IP Address"');
        console.error('3. Select "Allow Access from Anywhere" (for Render deployment)');
        console.error('4. Save and try again.');
        console.error('='.repeat(50) + '\n');
    }
};
