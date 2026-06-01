const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Settings.tsx', 'utf8');

// Replace Settings with SubAdminSettings
content = content.replace(/Settings/g, 'SubAdminSettings');

// Remove Save from lucide-react imports
content = content.replace(/Save, /, '');

// Remove HR Section State and Admin Section State
content = content.replace(/\/\/ HR Section State \(NEW\)[\s\S]*?\/\/ Admin Section State[\s\S]*?const \[showAdminPassword, setShowAdminPassword\] = useState\(false\);/, '');

// Remove handleSelectHR, handleHRUpdate, handleAdminUpdate
content = content.replace(/const handleSelectHR = [\s\S]*?const handleAdminUpdate = [\s\S]*?finally \{\s*setAdminLoading\(false\);\s*\}\s*\};/m, '');

// Remove HR Credential Management and Admin Security Section from JSX
content = content.replace(/\{\/\* HR Credential Management[\s\S]*?\{\/\* Admin Security Section[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/m, '</div>\n        </div>\n    );\n};\n\nexport default SubAdminSettings;');

fs.writeFileSync('src/pages/subadmin/SubAdminSettings.tsx', content);
console.log('Fixed SubAdminSettings.tsx');
