import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async () => {
    if (!MONGODB_URI) {
        console.error('[ERROR] MONGODB_URI is not defined in environment variables.');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[DEBUG] Connected to MongoDB Atlas successfully');
    } catch (error: any) {
        console.error('[ERROR] MongoDB connection failed:', error.message);
        console.error('[TIP] Make sure your IP is whitelisted in MongoDB Atlas and credentials are correct.');
        // Do not exit, keep the server alive so we can see other logs
    }
};
