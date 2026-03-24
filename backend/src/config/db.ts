import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || '';
    
    if (!mongoURI) {
      console.error("\n[CRITICAL ERROR] ❌ MONGO_URI is not defined in environment variables.");
      console.error("💡 DEPLOYMENT TIP: Since .env files are not pushed to Git, you MUST manually add the MONGO_URI to your hosting platform's Environment Variables settings (e.g., in Vercel, Render, or Heroku dashboard).\n");
      process.exit(1);
    }

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