const mongoose = require('mongoose');

const uri1 = "mongodb+srv://dhanush-crm:Dhanush12@cluster0.bpwjhip.mongodb.net/?appName=Cluster0";
const uri2 = "mongodb+srv://dhanushantigraviity_db_user:Dhanush123@cluster0.bpwjhip.mongodb.net/?appName=Cluster0";

async function test(uri, label) {
    console.log(`--- Testing ${label} ---`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ ${label}: SUCCESS!`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(`❌ ${label}: FAILED`);
        console.error(`- Error: ${err.message}`);
        console.error(`- Reason: ${err.reason ? JSON.stringify(err.reason) : 'Unknown'}`);
    }
}

async function run() {
    await test(uri1, "Original Creds (Dhanush12)");
    await test(uri2, "Example Creds (Dhanush123)");
    await test("mongodb+srv://dhanush-crm:Dhanush12%40@cluster0.bpwjhip.mongodb.net/?appName=Cluster0", "Dhanush12@ Creds");
    process.exit(0);
}

run();
