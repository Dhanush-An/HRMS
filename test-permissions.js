async function testPermissions() {
    try {
        // 1. Login as Employee (Dhanush)
        console.log('Logging in as Employee...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'dhanush.antigraviity@gmail.com', password: 'dhanush123', role: 'employee' })
        });
        const { token, user } = await loginRes.json();
        console.log('Logged in as:', user.name, '(ID:', user.id, ')');

        // 2. Try to update OWN documents (SHOULD SUCCEED)
        console.log('\nTest: Updating OWN documents...');
        const docUpdateRes = await fetch(`http://localhost:5000/api/employees/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                documents: [{ id: 999, name: 'Permission Test', type: 'PDF', size: '1MB', date: 'TODAY' }]
            })
        });
        console.log('Own Update Result:', await docUpdateRes.json());

        // 3. Try to update OWN salary (SHOULD IGNORE/STRIP)
        console.log('\nTest: Updating OWN salary (restricted)...');
        const salaryUpdateRes = await fetch(`http://localhost:5000/api/employees/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ salary: 999999 })
        });
        console.log('Salary Update Result:', await salaryUpdateRes.json());

        // 4. Try to update ANOTHER employee (SHOULD FAIL)
        console.log('\nTest: Updating ANOTHER employee...');
        const otherUpdateRes = await fetch('http://localhost:5000/api/employees/2', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'HACKED' })
        });
        console.log('Other Update Result:', await otherUpdateRes.json());

    } catch (e) {
        console.error('Test error:', e);
    }
}

testPermissions();
