const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
        await Branch.updateOne(
            { name: /Bangalore/i }, 
            { 
                $set: { 
                    latitude: 12.97025, 
                    longitude: 77.50675,
                    address: '1st Floor, #962, above SBI Bank, near Deepa Complex, Papreddy Palya, 2nd Stage, Nagarbhavi',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    pincode: '560072'
                } 
            }
        );
        console.log("Updated Bangalore branch location");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
