const fs = require('fs');

const components = ['DreamTab.tsx', 'FixedExpensesTab.tsx', 'IncomeTab.tsx', 'SummaryTab.tsx'];

for (const comp of components) {
  let content = fs.readFileSync(`components/${comp}`, 'utf8');
  
  // Update props interface or parameter list to accept onRequireAuth
  if (content.includes('type Props = {') || content.includes('interface Props {')) {
    // Has a type definition
    content = content.replace(/profile: { id: string, display_name: string }/, `profile: { id: string, display_name: string }\n  onRequireAuth?: () => boolean`);
  } else {
    // Inline props
    content = content.replace(/profile: { id: string, display_name: string }/, `profile: { id: string, display_name: string }, onRequireAuth?: () => boolean`);
  }

  // Add the prop to function signature
  content = content.replace(/({ profile,/, `({ profile, onRequireAuth,`);

  // We need to inject the auth guard at the start of all handle* functions
  // A regex to find all "const handle[A-Z][a-zA-Z0-9_]* = async"
  content = content.replace(/(const handle[A-Z][a-zA-Z0-9_]*\s*=\s*(async\s*)?\([^)]*\)\s*=>\s*{)/g, `$1\n    if (onRequireAuth && !onRequireAuth()) return;`);
  
  // For SummaryTab: The user requested "ส่วนหน้าสรุปยอดถ้าเข้ามาเด้งลอินเลยนะไม่ต้องกดอะไน" (If entering SummaryTab, pop up login immediately)
  // We can add a useEffect in SummaryTab
  if (comp === 'SummaryTab.tsx') {
    if (!content.includes('import { useEffect }')) {
      content = content.replace(/import { useState }/, 'import { useState, useEffect }');
    }
    const useEffectStr = `
  useEffect(() => {
    if (onRequireAuth) {
      onRequireAuth();
    }
  }, []);
`;
    // Find the end of state declarations
    content = content.replace(/(const \[.*?\] = useState.*?\n)(?!const \[)/s, `$1${useEffectStr}\n`);
  }

  fs.writeFileSync(`components/${comp}`, content);
}
console.log('Tabs updated');
