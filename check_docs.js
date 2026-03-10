const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkDocs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const docs = await mongoose.connection.db.collection('documents').find({}).toArray();
        console.log('--- DOCUMENTS ---');
        console.log(JSON.stringify(docs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDocs();
