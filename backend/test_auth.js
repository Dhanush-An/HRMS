const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const credentials = [
    { u: "dhanush-crm", p: "Dhanush12" },
    { u: "dhanush-crm", p: "Dhanush12@" },
    { u: "dhanush-crm", p: "Dhanush123" },
    { u: "dhanushantigraviity_db_user", p: "Dhanush12" },
    { u: "dhanushantigraviity_db_user", p: "Dhanush123" }
];
const cluster = "cluster0.bpwjhip.mongodb.net";

async function test(u, p) {
    const encodedPw = encodeURIComponent(p);
    const uri = `mongodb+srv://${u}:${encodedPw}@${cluster}/?appName=Cluster0`;
    console.log(`--- Testing: User=${u}, Pass=${p} ---`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        const admin = mongoose.connection.useDb('admin').db;
        const dbs = await admin.listDatabases();
        console.log(`✅ SUCCESS: ${u}:${p} worked! (Found ${dbs.databases.length} databases)`);
        await mongoose.disconnect();
        return true;
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        return false;
    }
}

async function run() {
    for (const cred of credentials) {
        const success = await test(cred.u, cred.p);
        if (success) {
            console.log(`\n🎉 Found it! Correct URI: mongodb+srv://${cred.u}:${encodeURIComponent(cred.p)}@${cluster}/?appName=Cluster0`);
            process.exit(0);
        }
    }
    console.log("\n❌ None of the tested credential sets worked.");
    process.exit(1);
}

run();
