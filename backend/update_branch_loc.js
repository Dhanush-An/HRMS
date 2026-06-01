const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/backend/.env' });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
        await Branch.updateOne(
            { name: /Bangalore/i }, 
            { $set: { latitude: 12.971748775481734, longitude: 77.50804575326372 } }
        );
        console.log("Updated Bangalore branch location");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
