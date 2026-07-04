const fs = require('fs');
const content = fs.readFileSync('components/ChatUI.tsx', 'utf8');

// 1. Update Props
let newContent = content.replace(
  `export default function ChatUI({ profile }: { profile: { id: string, display_name: string } }) {`,
  `import LoginModal from './LoginModal'\n\nexport default function ChatUI({ profile }: { profile: { id: string, display_name: string } | null }) {`
);

// 2. Add requireAuth and login modal state
const stateInjectionPoint = "const [tabTransition, setTabTransition] = useState(false)";
newContent = newContent.replace(
  stateInjectionPoint,
  `${stateInjectionPoint}\n  const [showLoginModal, setShowLoginModal] = useState(!profile)\n\n  const requireAuth = () => {\n    if (!profile) {\n      setShowLoginModal(true)\n      return false\n    }\n    return true\n  }`
);

// 3. Update data fetching functions
newContent = newContent.replace(
  `const fetchAllData = async () => {\n    setGlobalLoading(true)`,
  `const fetchAllData = async () => {\n    if (!profile) {\n      setGlobalLoading(false)\n      return\n    }\n    setGlobalLoading(true)`
);

newContent = newContent.replace(
  `const refreshDreamsAndTransactions = async () => {`,
  `const refreshDreamsAndTransactions = async () => {\n    if (!profile) return;`
);

newContent = newContent.replace(
  `const refreshFixedExpenses = async () => {`,
  `const refreshFixedExpenses = async () => {\n    if (!profile) return;`
);

newContent = newContent.replace(
  `const refreshIncomeSources = async () => {`,
  `const refreshIncomeSources = async () => {\n    if (!profile) return;`
);

newContent = newContent.replace(
  `const refreshTransactions = async () => {`,
  `const refreshTransactions = async () => {\n    if (!profile) return;`
);

// 4. Update message sending
newContent = newContent.replace(
  `const handleSendMessage = async () => {\n    if (!inputText.trim()) return`,
  `const handleSendMessage = async () => {\n    if (!requireAuth()) return;\n    if (!inputText.trim()) return`
);

// 5. Update input focus
newContent = newContent.replace(
  `<input\n              type="text"`,
  `<input\n              onClick={(e) => { if(!requireAuth()) { e.preventDefault(); e.target.blur(); } }}\n              type="text"`
);

// 6. Update profile display in header
newContent = newContent.replace(
  `<h1 className="text-sm font-bold text-gray-800">{profile.display_name}</h1>`,
  `<h1 className="text-sm font-bold text-gray-800">{profile ? profile.display_name : 'ผู้เยี่ยมชม (Guest)'}</h1>`
);

// 7. Inject LoginModal component rendering at the end of the return statement
newContent = newContent.replace(
  `    </div>\n  )\n}`,
  `      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />\n    </div>\n  )\n}`
);

fs.writeFileSync('components/ChatUI.tsx', newContent);
console.log('ChatUI updated');
