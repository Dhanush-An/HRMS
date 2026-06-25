const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("MONGO_URI not found!");
    process.exit(1);
}

// Define schemas to access models dynamically
const BranchSchema = new mongoose.Schema({
    branchId: String,
    branchCode: String,
    name: String,
    city: String
}, { strict: false });

const EmployeeSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    role: String,
    joiningDate: String,
    branchId: String,
    branchName: String,
    username: String
}, { strict: false });

const Branch = mongoose.model('Branch', BranchSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("Connected to database.");

        const branches = await Branch.find({});
        console.log(`Loaded ${branches.length} branches.`);

        const employees = await Employee.find({});
        console.log(`Loaded ${employees.length} employees.`);

        for (const employee of employees) {
            const oldId = employee.employeeId;
            if (!oldId) {
                console.log(`Skipping employee ${employee.name} (no employeeId)`);
                continue;
            }

            // Extract counter
            // e.g. "EMP001" or "FIC/BLR/2026/EMP009" -> 9
            const match = oldId.match(/(\d+)$/);
            if (!match) {
                console.log(`Skipping employee ${employee.name} (invalid ID format: ${oldId})`);
                continue;
            }
            const counter = parseInt(match[1]);

            // Branch Prefix
            let branchPrefix = 'BLR';
            const branch = branches.find(b => b.branchId === employee.branchId);
            if (branch && branch.branchCode) {
                branchPrefix = branch.branchCode.replace(/[0-9]/g, '').toUpperCase();
            } else if (employee.branchName) {
                if (employee.branchName.toLowerCase().includes('chennai')) {
                    branchPrefix = 'CHE';
                } else if (employee.branchName.toLowerCase().includes('bangalore')) {
                    branchPrefix = 'BLR';
                }
            }

            // Year
            let year = 2026;
            if (employee.joiningDate) {
                const parsedYear = parseInt(employee.joiningDate.split('-')[0]);
                if (!isNaN(parsedYear)) {
                    year = parsedYear;
                }
            }

            // Role Prefix (trim to handle trailing spaces like "HR ")
            const trimmedRole = employee.role ? employee.role.trim().toLowerCase() : '';
            const rolePrefix = (trimmedRole === 'hr') ? 'HR' : 'EMP';

            // New ID
            const newId = `FIC/${branchPrefix}/${year}/${rolePrefix}${String(counter).padStart(3, '0')}`;
            
            if (oldId === newId) {
                console.log(`Skipping employee ${employee.name} (already has correct ID: ${oldId})`);
                continue;
            }

            console.log(`Migrating: ${employee.name} | ${oldId} -> ${newId}`);

            // 1. Update Employee document
            const updateFields = { employeeId: newId };
            if (employee.username === oldId) {
                updateFields.username = newId;
            }
            await Employee.updateOne({ _id: employee._id }, { $set: updateFields });

            // 2. Cascade updates across all other collections dynamically using connection.db
            const db = mongoose.connection.db;

            // List of tables to update
            const simpleTables = [
                { name: 'attendances', field: 'employeeId' },
                { name: 'leaves', field: 'employeeId' },
                { name: 'performances', field: 'employeeId' },
                { name: 'tasks', field: 'employeeId' },
                { name: 'resignations', field: 'employeeId' },
                { name: 'queries', field: 'employeeId' },
                { name: 'expenses', field: 'employeeId' },
                { name: 'documents', field: 'employeeId' },
                { name: 'permissions', field: 'employeeId' }
            ];

            for (const table of simpleTables) {
                const coll = db.collection(table.name);
                const count = await coll.countDocuments({ [table.field]: oldId });
                if (count > 0) {
                    const result = await coll.updateMany({ [table.field]: oldId }, { $set: { [table.field]: newId } });
                    console.log(`  Updated ${result.modifiedCount} records in ${table.name}`);
                }
            }

            // Update Payroll records array
            const payrollColl = db.collection('payrolls');
            const payrollCount = await payrollColl.countDocuments({ 'records.employeeId': oldId });
            if (payrollCount > 0) {
                const result = await payrollColl.updateMany(
                    { 'records.employeeId': oldId },
                    { $set: { 'records.$.employeeId': newId } }
                );
                console.log(`  Updated ${result.modifiedCount} records in payrolls`);
            }
        }

        console.log("Migration complete successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

run();
