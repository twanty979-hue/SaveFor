const fs = require('fs');
const content = fs.readFileSync('components/ChatUI.tsx', 'utf8');

let newContent = content.replace(/profile\.id/g, 'profile?.id');
newContent = newContent.replace(/profile\.display_name/g, 'profile?.display_name');

fs.writeFileSync('components/ChatUI.tsx', newContent);
console.log('ChatUI updated');
