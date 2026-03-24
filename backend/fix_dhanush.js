const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fix() {
  try {
    if (!process.env.MONGODB_URI) throw new Error("No MONGODB_URI");
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const user = await db.collection('employees').findOne({ email: /dhanush/i });
    if (user) {
      console.log('SUCCESS_FOUND_USER:', user.email);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Dhanush12@', salt);
      await db.collection('employees').updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
      console.log('SUCCESS_UPDATED_PASSWORD');
    } else {
      console.log('ERROR_USER_NOT_FOUND');
    }
  } catch (err) {
    console.error('ERROR_SCRIPT:', err.message);
  } finally {
    process.exit(0);
  }
}
fix();
