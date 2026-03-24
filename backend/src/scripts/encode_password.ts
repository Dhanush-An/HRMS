import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- MongoDB Password Encoder ---');
console.log('This script will help you encode special characters in your MongoDB password.');

rl.question('Enter your MongoDB password: ', (password) => {
  const encoded = encodeURIComponent(password);
  console.log('\n--- Result ---');
  console.log('Original Password:', password);
  console.log('Encoded Password: ', encoded);
  console.log('\nFollow these steps to update your .env file:');
  console.log('1. Copy the Encoded Password.');
  console.log('2. Replace the password part in your MONGODB_URI.');
  console.log('   Example: mongodb+srv://username:<PASSWORD>@cluster.mongodb.net/database');
  console.log('3. Save the .env file and restart your server.');
  rl.close();
});
