import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log(`[DEBUG] ✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error("[ERROR] ❌ MongoDB connection error detail:");
        console.error(`- Message: ${error.message}`);
        console.error(`- Code: ${error.code}`);
        console.error(`- Syscall: ${error.syscall}`);
        console.error(`- Hostname: ${error.hostname}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.error("💡 TIP: This usually means your IP is not whitelisted in Atlas or a firewall is blocking the connection.");
        }
        
        // Don't exit process immediately, let concurrently handle it or retry
        // process.exit(1); 
    }
};

export default connectDB;