import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
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