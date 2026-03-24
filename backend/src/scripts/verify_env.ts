import dotenv from 'dotenv';
import path from 'path';

// Load .env from the root of the backend directory
const envPath = path.resolve(__dirname, '../../.env');
console.log(`[DEBUG] Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error(`[ERROR] Failed to load .env: ${result.error.message}`);
} else {
    console.log(`[DEBUG] .env loaded successfully.`);
}

console.log('--- Environment Variables ---');
console.log(`PORT: ${process.env.PORT}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '******' : 'NOT DEFINED'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'DEFINED' : 'NOT DEFINED'}`);
if (process.env.MONGODB_URI) {
    // Mask password for safety
    const maskedURI = process.env.MONGODB_URI.replace(/:([^@]+)@/, ':******@');
    console.log(`MONGODB_URI (masked): ${maskedURI}`);
}
