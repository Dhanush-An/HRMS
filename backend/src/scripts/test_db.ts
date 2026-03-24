import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error('[ERROR] MONGODB_URI is not defined in .env');
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
    console.error(`- Message: ${err.message}`);
    console.error(`- Error Code: ${err.code}`);
    
    if (err.message.includes('Authentication failed')) {
        console.error('💡 TIP: Check your database username and password in .env');
    } else if (err.code === 'ECONNREFUSED' || err.message.includes('ETIMEDOUT')) {
        console.error('💡 TIP: This usually means your IP is not whitelisted in MongoDB Atlas or a firewall is blocking the connection.');
    }
    process.exit(1);
});
