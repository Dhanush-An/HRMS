import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || '';
    const maskedURI = mongoURI.replace(/:([^@]+)@/, ':******@');
    console.log(`[DEBUG] 🔌 Connecting to MongoDB: ${maskedURI}`);
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error: any) {
    console.error("[ERROR] ❌ MongoDB connection error detail:");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Syscall:", error.syscall);
    console.error("- Hostname:", error.hostname);
    process.exit(1);
  }
};

export default connectDB;