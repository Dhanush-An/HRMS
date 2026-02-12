const mapToBackend = (data) => {
    const mapped = { ...data };
    if (data.reportingTo !== undefined) mapped.reporting_to = data.reportingTo;
    if (data.joiningDate !== undefined) mapped.joining_date = data.joiningDate;
    if (data.employeeId !== undefined) mapped.employee_id = data.employeeId;
    delete mapped.reportingTo;
    delete mapped.joiningDate;
    delete mapped.employeeId;
    return mapped;
};

const mapToFrontend = (data) => ({
    ...data,
    joiningDate: data.joining_date,
    employeeId: data.employee_id,
    reportingTo: data.reporting_to
});

async function runTest() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@hrms.com', password: 'admin123', role: 'admin' })
        });
        const { token } = await loginRes.json();

        // 1. Get employee as frontend would
        const getRes = await fetch('http://localhost:5000/api/employees/1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rawEmp = await getRes.json();
        const frontendEmp = mapToFrontend(rawEmp);
        console.log('Frontend Employee Object:', frontendEmp);

        // 2. Simulate edit
        frontendEmp.name = 'Dhanush Tamilarasan UPDATED AGAIN';
        frontendEmp.location = 'Chennai';

        // 3. Send back as frontend would
        const mappedData = mapToBackend(frontendEmp);
        console.log('Mapped Data to send:', mappedData);

        const updateRes = await fetch('http://localhost:5000/api/employees/1', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mappedData)
        });
        const updateResult = await updateRes.json();
        console.log('Update Result:', updateResult);

        // 4. Verify
        const verifyRes = await fetch('http://localhost:5000/api/employees/1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const finalEmp = await verifyRes.json();
        console.log('Final Name:', finalEmp.name);
        console.log('Final Location:', finalEmp.location);

    } catch (e) {
        console.error('Test error:', e);
    }
}

runTest();
