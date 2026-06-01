const mongoose = require('mongoose');

const uri = "mongodb+srv://dhanush-crm:Dhanush12@cluster0.bpwjhip.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB Atlas");
        
        const db = mongoose.connection.db;
        
        // Find employees with name 'Renogopal'
        const employees = await db.collection('employees').find({ name: /Renogopal/i }).toArray();
        console.log("Found dump employees:", employees);
        
        const empIds = employees.map(e => e.employeeId || e.id).filter(Boolean);
        
        if (empIds.length > 0) {
            // Delete leaves for these employees
            const leaveResult = await db.collection('leaves').deleteMany({ employeeId: { $in: empIds } });
            console.log(`Deleted ${leaveResult.deletedCount} dump leaves.`);
            
            // Delete the employees
            const empResult = await db.collection('employees').deleteMany({ name: /Renogopal/i });
            console.log(`Deleted ${empResult.deletedCount} dump employees.`);
        } else {
            console.log("No dump employees found. Deleting all leaves just in case.");
            const leaveResult = await db.collection('leaves').deleteMany({});
            console.log(`Deleted ${leaveResult.deletedCount} leaves.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

run();
