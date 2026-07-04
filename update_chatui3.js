const fs = require('fs');
const content = fs.readFileSync('components/ChatUI.tsx', 'utf8');

let newContent = content.replace(/profile=\{profile\}/g, "profile={profile || { id: 'guest', display_name: 'Guest' }}");

fs.writeFileSync('components/ChatUI.tsx', newContent);
console.log('ChatUI fixed');
