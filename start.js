const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, cwd, name) {
    const proc = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });
    proc.on('error', (err) => console.error(`[${name}] Error:`, err));
    proc.on('exit', (code) => console.log(`[${name}] Exited with code ${code}`));
    return proc;
}

console.log('🚀 Starting HRMS Unified Services...');

const server = runCommand('npm.cmd', ['run', 'dev'], path.join(__dirname, 'backend'), 'Backend');
const client = runCommand('npm.cmd', ['run', 'dev'], path.join(__dirname, 'frontend'), 'Frontend');

process.on('SIGINT', () => {
    server.kill();
    client.kill();
    process.exit();
});
