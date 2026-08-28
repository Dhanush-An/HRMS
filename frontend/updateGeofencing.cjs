const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'EmployeeDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove BRANCH_LOCATIONS constant
content = content.replace(/const BRANCH_LOCATIONS = \{[\s\S]*?\};\n\n/, '');

// 2. Change state to store branch objects
content = content.replace(/const \[branches, setBranches\] = useState<string\[\]>\(\[\]\);/, 'const [branches, setBranches] = useState<any[]>([]);');

// 3. Update fetchBranches to store objects
content = content.replace(
    /setBranches\(names\);/,
    `setBranches(data);`
);

// 4. Update the logic around distance calculation in proceedToFaceCapture
const oldDistanceLogic = `        // Geofencing Check
        if (loginOptions.workMode === 'Work from Office' && loginLocation.latitude) {
            const branchLoc = (BRANCH_LOCATIONS as any)[loginOptions.workLocation];
            if (branchLoc) {
                const distance = calculateDistance(
                    loginLocation.latitude,
                    loginLocation.longitude,
                    branchLoc.lat,
                    branchLoc.lng
                );

                console.log(\`[GEOFENCE] Distance to \${loginOptions.workLocation} branch: \${distance.toFixed(2)}m\`);

                if (distance > 10) {
                    alert(\`Access Denied: You are \${distance.toFixed(0)}m away. You must be within 10m of the office to check-in.\`);
                    setIsSubmitting(false);
                    return;
                }
            }
        }`;

const newDistanceLogic = `        // Geofencing Check
        if (loginOptions.workMode === 'Work from Office' && loginLocation.latitude) {
            const selectedBranch = branches.find(b => b.name === loginOptions.workLocation);
            if (selectedBranch && selectedBranch.latitude && selectedBranch.longitude) {
                const distance = calculateDistance(
                    loginLocation.latitude,
                    loginLocation.longitude,
                    selectedBranch.latitude,
                    selectedBranch.longitude
                );

                console.log(\`[GEOFENCE] Distance to \${loginOptions.workLocation} branch: \${distance.toFixed(2)}m\`);

                if (distance > 10) {
                    alert(\`Access Denied: You are \${distance.toFixed(0)}m away. You must be within 10m of the office location to check-in.\`);
                    setIsSubmitting(false);
                    return;
                }
            } else if (selectedBranch) {
                console.log(\`[GEOFENCE] No coordinates defined for branch \${loginOptions.workLocation}, skipping distance check.\`);
            }
        }`;

content = content.replace(oldDistanceLogic, newDistanceLogic);

// 5. Check if branches is mapped as a string anywhere else
// e.g., branches.map(b => ( <option>{b}</option> ))
// I'll replace {branches.map((branch) =>} with {branches.map((branch: any) =>} and {branch} with {branch.name}
content = content.replace(/\{branches\.map\(\(b\) => \(/g, '{branches.map((b: any) => (');
content = content.replace(/\{b\}/g, '{b.name || b}');
content = content.replace(/key=\{b\}/g, 'key={b.name || b}');
content = content.replace(/value=\{b\}/g, 'value={b.name || b}');
content = content.replace(/\{branches\.map\(\(branch, i\) => \(/g, '{branches.map((branch: any, i) => (');
content = content.replace(/\{branch\}/g, '{branch.name || branch}');
content = content.replace(/key=\{i\}/g, 'key={i}');
content = content.replace(/value=\{branch\}/g, 'value={branch.name || branch}');

fs.writeFileSync(filePath, content);
console.log('EmployeeDashboard.tsx updated successfully.');
