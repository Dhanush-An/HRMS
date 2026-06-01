require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms_db').then(async () => {
    const Branch = mongoose.model('Branch', new mongoose.Schema({ name: String, latitude: Number, longitude: Number }, { strict: false }));
    
    // Update Bangalore
    await Branch.updateOne({ name: /Bangalore/i }, { $set: { latitude: 12.971748775481734, longitude: 77.50804575326372 } });
    
    // Update Palacode
    await Branch.updateOne({ name: /Palacode/i }, { $set: { latitude: 12.299359170545028, longitude: 78.0733771109474 } });

    console.log("Branch locations updated successfully!");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
