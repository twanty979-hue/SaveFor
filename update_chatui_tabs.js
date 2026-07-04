const fs = require('fs');
let content = fs.readFileSync('components/ChatUI.tsx', 'utf8');

// Replace tab rendering to include onRequireAuth={requireAuth}
content = content.replace(/refreshDreamsAndTransactions={refreshDreamsAndTransactions}/, 'refreshDreamsAndTransactions={refreshDreamsAndTransactions}\n            onRequireAuth={requireAuth}');

content = content.replace(/refreshFixedExpenses={refreshFixedExpenses}/, 'refreshFixedExpenses={refreshFixedExpenses}\n            onRequireAuth={requireAuth}');

content = content.replace(/refreshIncomeSources={refreshIncomeSources}/, 'refreshIncomeSources={refreshIncomeSources}\n            onRequireAuth={requireAuth}');

content = content.replace(/profile={profile \|\| { id: 'guest', display_name: 'Guest' }} \/>/, "profile={profile || { id: 'guest', display_name: 'Guest' }}\n            onRequireAuth={requireAuth} />");

fs.writeFileSync('components/ChatUI.tsx', content);
console.log('ChatUI tabs updated');
