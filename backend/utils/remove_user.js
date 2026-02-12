const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/employees.json');

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const employees = JSON.parse(data);

    const initialLength = employees.length;
    const filteredEmployees = employees.filter(emp => emp.email !== 'dhanush.antigraviity@gmail.com');
    const finalLength = filteredEmployees.length;

    fs.writeFileSync(filePath, JSON.stringify(filteredEmployees, null, 2));

    console.log(`Removed ${initialLength - finalLength} user(s).`);
} catch (error) {
    console.error('Error:', error);
}
