const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function debug() {
    const dataPath = path.join(__dirname, 'data', 'employees.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const employees = JSON.parse(data);

    const email = 'dhanush.antigraviity@gmail.com';
    const user = employees.find(e =>
        e.email === email || (e.username && e.username === email)
    );

    if (!user) {
        console.log('User not found in JSON');
        console.log('Available emails:');
        employees.forEach(e => {
            console.log(`- "${e.email}" (Length: ${e.email.length})`);
            if (e.email.includes('dhanush')) {
                console.log('Char codes:');
                for (let i = 0; i < e.email.length; i++) {
                    console.log(`${e.email[i]}: ${e.email.charCodeAt(i)}`);
                }
            }
        });
        return;
    }

    console.log('User found:', user.name);
    console.log('Email:', `"${user.email}"`, 'Length:', user.email.length);
    console.log('Username:', `"${user.username}"`, 'Length:', user.username?.length);

    // Check if the login logic would find it
    const loginEmail = 'dhanush.antigraviity@gmail.com'.toLowerCase();
    const foundByLoginLogic = employees.find(e =>
        e.email.toLowerCase() === loginEmail || (e.username && e.username.toLowerCase() === loginEmail)
    );
    console.log('Found by lowercased logic:', foundByLoginLogic ? 'YES' : 'NO');

    const passwordsToTest = ['12345678'];
    for (const pw of passwordsToTest) {
        const match = await bcrypt.compare(pw, user.password_hash);
        console.log(`Testing password "${pw}": ${match ? 'MATCH' : 'NO MATCH'}`);
    }
}

debug();
