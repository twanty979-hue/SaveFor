const fs = require('fs');

const components = ['DreamTab.tsx', 'FixedExpensesTab.tsx', 'IncomeTab.tsx'];

for (const comp of components) {
  let content = fs.readFileSync(`components/${comp}`, 'utf8');
  
  if (content.includes('type Props = {') || content.includes('interface Props {')) {
    content = content.replace(/profile: { id: string, display_name: string }/, `profile: { id: string, display_name: string }\n  onRequireAuth?: () => boolean`);
  } else {
    content = content.replace(/profile: { id: string, display_name: string }/, `profile: { id: string, display_name: string }, onRequireAuth?: () => boolean`);
  }

  content = content.replace(/\(\{ profile,/, `({ profile, onRequireAuth,`);

  // Instead of complicated regex, let's just replace the specific handle methods manually
  const handlers = ['handleAddDream', 'handleDeleteDream', 'toggleDreamStar', 'handleAddExpense', 'handleDeleteExpense', 'handleUpdateExpense', 'handleAddIncome', 'handleDeleteIncome', 'handleUpdateIncome', 'handleAddTransaction', 'handleDeleteTransaction'];
  
  for (const handler of handlers) {
    if (content.includes(`const ${handler} = async`)) {
      const regex = new RegExp(`(const ${handler} = async[^)]*\\)\\s*=>\\s*{)`);
      content = content.replace(regex, `$1\n    if (onRequireAuth && !onRequireAuth()) return;`);
    }
  }

  fs.writeFileSync(`components/${comp}`, content);
}
console.log('Tabs updated fixed 3');
