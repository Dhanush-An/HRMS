async function testUpdate() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@hrms.com',
                password: 'admin123',
                role: 'admin'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful');

        const updateRes = await fetch('http://localhost:5000/api/employees/1', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Dhanush Tamilarasan UPDATED',
                role: 'Full stack developer',
                department: 'Developer'
            })
        });
        const updateData = await updateRes.json();
        console.log('Update result:', updateData);

        const verifyRes = await fetch('http://localhost:5000/api/employees', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const employees = await verifyRes.data || await verifyRes.json();
        const emp = employees.find(e => e.id === 1);
        console.log('Verified name:', emp.name);
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testUpdate();
