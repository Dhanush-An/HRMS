const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

async function run() {
  try {
    const uri = 'mongodb://dhanush-crm:dhanush123@cluster0-shard-00-00.bpwjhip.mongodb.net:27017,cluster0-shard-00-01.bpwjhip.mongodb.net:27017,cluster0-shard-00-02.bpwjhip.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-2y4607-shard-0&authSource=admin&retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    
    const user = await db.collection('employees').findOne({ email: /dhanush/i });
    if (user) {
      console.log('FOUND USER:', user.email);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Dhanush12@', salt);
      await db.collection('employees').updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
      console.log('PASSWORD UPDATED SUCCESSFULLY TO Dhanush12@');
    } else {
      console.log('USER NOT FOUND');
    }
    await client.close();
  } catch(e) {
    console.log('ERROR:', e.message);
  }
}
run();
