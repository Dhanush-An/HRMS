const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Settings.tsx', 'utf8');

// Replace Settings with SubAdminSettings
content = content.replace(/Settings/g, 'SubAdminSettings');

// Remove Save from lucide-react imports
content = content.replace(/Save, /, '');

// Remove HR Section State and Admin Section State
content = content.replace(/\/\/ HR Section State \(NEW\)[\s\S]*?\/\/ Admin Section State[\s\S]*?const \[showAdminPassword, setShowAdminPassword\] = useState\(false\);/, '');

// Remove handleSelectHR
content = content.replace(/const handleSelectHR = [\s\S]*?    \};\n/m, '');

// Remove handleHRUpdate
content = content.replace(/const handleHRUpdate = [\s\S]*?    \};\n/m, '');

// Remove handleAdminUpdate
content = content.replace(/const handleAdminUpdate = [\s\S]*?    \};\n/m, '');

// Remove HR Credential Management and Admin Security Section from JSX
content = content.replace(/\{\/\* HR Credential Management \(NEW SECTION\) \*\/\}(.|\n)*$/m, '        </div>\n    );\n};\n\nexport default SubAdminSettings;\n');

fs.writeFileSync('src/pages/subadmin/SubAdminSettings.tsx', content);
console.log('Fixed SubAdminSettings.tsx correctly');
