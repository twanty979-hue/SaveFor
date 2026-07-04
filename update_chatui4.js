const fs = require('fs');
const content = fs.readFileSync('components/ChatUI.tsx', 'utf8');

let newContent = content;

const addGuard = (funcName) => {
  newContent = newContent.replace(
    `const ${funcName} = async`,
    `const ${funcName} = async`
  );
  // Actually, let's use regex to reliably insert after the opening brace
  const regex = new RegExp(`(const ${funcName} = async[^{]*{)`);
  newContent = newContent.replace(regex, `$1\n    if (!requireAuth()) return;`);
}

addGuard('handleCancelExpense');
addGuard('handleCancelUserMessage');
addGuard('handleEditUserMessage');

fs.writeFileSync('components/ChatUI.tsx', newContent);
console.log('Added guards to handlers');
