import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error('[ERROR] MONGO_URI is not defined in .env');
    process.exit(1);
}

console.log(`[DEBUG] Attempting to connect to MongoDB...`);
const maskedURI = mongoURI.replace(/:([^@]+)@/, ':******@');
console.log(`[DEBUG] Connection String (masked): ${maskedURI}`);

mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
})
.then(() => {
    console.log('[DEBUG] ✅ MongoDB Connected Successfully!');
    process.exit(0);
})
.catch((err) => {
    console.error('[ERROR] ❌ MongoDB Connection Failed:');
    console.dir(err, { depth: null });
    process.exit(1);
});
