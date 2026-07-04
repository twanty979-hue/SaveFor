'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  User, Calendar, BarChart3, Mic, Send, 
  MessageCircle, ClipboardList, Star, PieChart, 
  AlertCircle, MoreHorizontal, Sparkles, Receipt, ShoppingBag, X, ChevronDown, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import DreamTab from './DreamTab'
import FixedExpensesTab from './FixedExpensesTab'
import IncomeTab from './IncomeTab'
import SummaryTab from './SummaryTab'
import FloatingBackground from './FloatingBackground'

type Message = {
  id: string
  type: 'user' | 'bot_expense' | 'bot_warning' | 'bot_text'
  text?: string
  transactionIds?: string[]
  parentMessageId?: string
  isCancelled?: boolean
  isEdited?: boolean
  expenseData?: {
    id: string | null
    name: string
    price: number
    category: string
    status: string
    budget: number
    spent: number
    isCancelled?: boolean
  }
}

const initialMessages: Message[] = [
  {
    id: 'welcome',
    type: 'bot_text',
    text: 'สวัสดีครับ 👋 พิมพ์รายการได้เลย เช่น "กาแฟ 50" หรือหลายรายการ เช่น "ข้าว 50 น้ำ 20" ครับ'
  }
]
//asd
import LoginModal from './LoginModal'

export default function ChatUI({ profile }: { profile: { id: string, display_name: string } | null }) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'chat' | 'plan' | 'income' | 'dream' | 'summary'>('chat')
  const [prevTab, setPrevTab] = useState<'chat' | 'plan' | 'income' | 'dream' | 'summary'>('chat')
  const [tabTransition, setTabTransition] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(!profile)

  const requireAuth = () => {
    if (!profile) {
      setShowLoginModal(true)
      return false
    }
    return true
  }

  const TAB_ORDER: Record<string, number> = { chat: 0, plan: 1, income: 2, dream: 3, summary: 4 }

  const switchTab = (tab: 'chat' | 'plan' | 'income' | 'dream' | 'summary') => {
    if (tab === activeTab) return
    setPrevTab(activeTab)
    setTabTransition(true)
    setTimeout(() => {
      setActiveTab(tab)
      setTabTransition(false)
    }, 200)
  }
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Central lifted financial states
  const [dreams, setDreams] = useState<any[]>([])
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([])
  const [incomeSources, setIncomeSources] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [globalLoading, setGlobalLoading] = useState(true)

  const fetchAllData = async () => {
    setGlobalLoading(true)
    try {
      const [
        { data: dreamsData },
        { data: fixedData },
        { data: incomeData },
        { data: categoriesData },
        { data: txsData }
      ] = await Promise.all([
        supabase.from('dreams').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }),
        supabase.from('fixed_expenses').select('*').eq('user_id', profile?.id).order('due_day', { ascending: true }),
        supabase.from('income_sources').select('*').eq('user_id', profile?.id).order('receive_day', { ascending: true }),
        supabase.from('categories').select('*').eq('user_id', profile?.id),
        supabase.from('transactions').select('*').eq('user_id', profile?.id).order('transaction_date', { ascending: false })
      ])

      if (dreamsData) setDreams(dreamsData)
      if (fixedData) setFixedExpenses(fixedData)
      if (incomeData) setIncomeSources(incomeData)
      if (categoriesData) setCategories(categoriesData)
      if (txsData) setTransactions(txsData)
    } catch (err) {
      console.error('Error fetching initial data:', err)
    } finally {
      setGlobalLoading(false)
    }
  }

  const refreshDreamsAndTransactions = async () => {
    if (!profile) return;
    const [
      { data: dreamsData },
      { data: txsData }
    ] = await Promise.all([
      supabase.from('dreams').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', profile?.id).order('transaction_date', { ascending: false })
    ])
    if (dreamsData) setDreams(dreamsData)
    if (txsData) setTransactions(txsData)
  }

  const refreshFixedExpenses = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', profile?.id)
      .order('due_day', { ascending: true })
    if (data) setFixedExpenses(data)
  }

  const refreshIncomeSources = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', profile?.id)
      .order('receive_day', { ascending: true })
    if (data) setIncomeSources(data)
  }

  const refreshTransactions = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile?.id)
      .order('transaction_date', { ascending: false })
    if (data) setTransactions(data)
  }

  const toggleDreamStarLocally = (id: string, starred: boolean) => {
    setDreams(prev => prev.map(d => d.id === id ? { ...d, is_starred: starred } : d))
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthlyTotal = transactions
    .filter(t => t.type === 'expense' && new Date(t.transaction_date) >= startOfMonth)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const dailyTotal = transactions
    .filter(t => t.type === 'expense' && new Date(t.transaction_date) >= startOfToday)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Message options menu states
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    const handleWindowClick = () => {
      setActiveMenuMessageId(null)
    }
    window.addEventListener('click', handleWindowClick)
    return () => {
      window.removeEventListener('click', handleWindowClick)
    }
  }, [])

  // Daily spending report modal states
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [dailyTxList, setDailyTxList] = useState<any[]>([])
  const [fixedExpensesList, setFixedExpensesList] = useState<any[]>([])
  const [loadingDaily, setLoadingDaily] = useState(false)
  
  // Monthly calendar states
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)

  const handleOpenCalendar = async () => {
    setShowCalendarModal(true)
    setLoadingDaily(true)
    setSelectedCalendarDate(null)
    setCalendarViewDate(new Date())
    
    setDailyTxList(transactions)
    setFixedExpensesList(fixedExpenses)
    setLoadingDaily(false)
  }

  const handleCancelExpense = async (messageId: string, transactionId: string | null) => {
    if (!requireAuth()) return;
    if (!transactionId) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)

    if (error) {
      alert('เกิดข้อผิดพลาดในการยกเลิกรายการ: ' + error.message)
      return
    }

    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === messageId && msg.expenseData) {
          return {
            ...msg,
            expenseData: {
              ...msg.expenseData,
              status: 'ยกเลิกแล้ว',
              isCancelled: true
            }
          }
        }
        return msg
      })
    )

    await refreshTransactions()
  }

  const handleCancelUserMessage = async (messageId: string) => {
    if (!requireAuth()) return;
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return

    // 1. If it has transactionIds, delete them from Supabase
    if (msg.transactionIds && msg.transactionIds.length > 0) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', msg.transactionIds)

      if (error) {
        alert('เกิดข้อผิดพลาดในการยกเลิกรายการ: ' + error.message)
        return
      }
    }

    // 2. Update message state: set isCancelled: true, clear text
    // Also, update corresponding bot replies
    setMessages(prev => 
      prev.map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            isCancelled: true,
            text: ''
          }
        }
        if (m.parentMessageId === messageId) {
          if (m.type === 'bot_expense' && m.expenseData) {
            return {
              ...m,
              expenseData: {
                ...m.expenseData,
                status: 'ยกเลิกแล้ว',
                isCancelled: true
              }
            }
          }
        }
        return m
      })
    )

    await refreshTransactions()
  }

  const handleEditUserMessage = async (messageId: string, newText: string) => {
    if (!requireAuth()) return;
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return

    // 1. Delete old transactions
    if (msg.transactionIds && msg.transactionIds.length > 0) {
      await supabase
        .from('transactions')
        .delete()
        .in('id', msg.transactionIds)
    }

    // 2. Parse new text
    const matches = Array.from(
      newText.matchAll(/([a-zA-Z\u0e00-\u0e7f.-]*[a-zA-Z\u0e00-\u0e7f.-][a-zA-Z0-9_\u0e00-\u0e7f.-]*?)\s*[\/:-]?\s*(\d+(?:\.\d+)?)\s*(?:บาท|b|B)?(?=\s|$|[\n,])/gi)
    )

    let newTransactionIds: string[] = []
    let botReplies: Message[] = []

    if (matches.length > 0) {
      // Fetch user categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', profile?.id)

      const itemsToInsert = matches.map(match => {
        const name = match[1].trim()
        const price = parseFloat(match[2])
        const matchedCat = categories?.find(c => 
          name.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(name.toLowerCase())
        )
        return {
          user_id: profile?.id,
          type: 'expense',
          amount: price,
          note: name,
          category_id: matchedCat ? matchedCat.id : null,
          matchedCat
        }
      })

      // Insert new transactions
      const { data, error } = await supabase
        .from('transactions')
        .insert(
          itemsToInsert.map(item => ({
            user_id: item.user_id,
            type: item.type,
            amount: item.amount,
            note: item.note,
            category_id: item.category_id
          }))
        )
        .select()

      if (!error && data) {
        newTransactionIds = data.map(row => row.id)
        itemsToInsert.forEach((item, index) => {
          const insertedRow = data[index]
          botReplies.push({
            id: (Date.now() + index * 10 + 3).toString(),
            type: 'bot_expense',
            parentMessageId: messageId,
            expenseData: {
              id: insertedRow ? insertedRow.id : null,
              name: item.note,
              price: item.amount,
              category: item.matchedCat ? item.matchedCat.name : 'ทั่วไป',
              status: 'บันทึกแล้ว',
              budget: 0,
              spent: item.amount
            }
          })
        })
      } else {
        botReplies.push({
          id: (Date.now() + 3).toString(),
          type: 'bot_text',
          parentMessageId: messageId,
          text: 'เกิดข้อผิดพลาดในการแก้ไขรายการครับ กรุณาลองใหม่อีกครั้ง'
        })
      }
    } else {
      botReplies.push({
        id: (Date.now() + 3).toString(),
        type: 'bot_text',
        parentMessageId: messageId,
        text: 'กรุณาระบุชื่อและจำนวนเงิน เช่น "ขนม 50 น้ำ 59 ข้าว 30"'
      })
    }

    // 3. Update messages state
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId)
      if (idx === -1) return prev

      // Remove all old replies associated with this message
      const cleanPrev = prev.filter(m => m.parentMessageId !== messageId)

      // Find the new index of the edited user message in the cleaned list
      const newIdx = cleanPrev.findIndex(m => m.id === messageId)

      // Update the user message in the list
      const updatedUserMsg = { ...cleanPrev[newIdx], text: newText, isEdited: true, transactionIds: newTransactionIds }
      const result = [...cleanPrev]
      if (newIdx !== -1) { result[newIdx] = updatedUserMsg }
      const botInsertIdx = newIdx !== -1 ? newIdx + 1 : result.length
      result.splice(botInsertIdx, 0, ...botReplies)
      return result
    })
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!requireAuth()) return;
    const text = inputText.trim()
    if (!text) return

    const userMessageId = Date.now().toString()
    
    let botReplies: Message[] = []
    let insertedIds: string[] = []

    // ---- Income detection ----
    // Keywords for detecting an income entry
    const incomeKeywords = /^(รายรับ|income|เงินเดือน|โบนัส|ได้เงิน|รับเงิน|โอนเข้า|ฝากเงิน|ขายของ|กำไร|เบี้ยเลี้ยง|ค่าจ้าง|ค่าตอบแทน)/i
    const isIncome = incomeKeywords.test(text.trim())

    if (isIncome) {
      // Extract amount from income message, e.g. "รายรับ  25000" -> note="", amount=25000
      const incomeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:บาท|b|B)?/i)
      
      if (incomeMatch) {
        const amount = parseFloat(incomeMatch[1])
        // Extract note: strip keyword prefix + amount
        const cleanNote = text
          .replace(incomeKeywords, '')
          .replace(/\d+(?:\.\d+)?\s*(?:บาท|b|B)?/i, '')
          .trim() || 'รายรับ'

        const { data, error } = await supabase
          .from('transactions')
          .insert([{
            user_id: profile?.id,
            type: 'income',
            amount,
            note: cleanNote,
            category_id: null
          }])
          .select()

        if (!error && data && data.length > 0) {
          insertedIds = data.map(row => row.id)
          botReplies.push({
            id: (Date.now() + 1).toString(),
            type: 'bot_expense',
            parentMessageId: userMessageId,
            expenseData: {
              id: data[0].id,
              name: cleanNote,
              price: amount,
              category: 'รายรับ',
              status: 'บันทึกรายรับแล้ว',
              budget: 0,
              spent: 0
            }
          })
          await refreshTransactions()
        } else {
          botReplies.push({
            id: (Date.now() + 1).toString(),
            type: 'bot_text',
            parentMessageId: userMessageId,
            text: 'เกิดข้อผิดพลาดในการบันทึกรายรับครับ'
          })
        }
      } else {
        botReplies.push({
          id: (Date.now() + 1).toString(),
          type: 'bot_text',
          parentMessageId: userMessageId,
          text: 'กรุณาระบุจำนวนเงินรายรับด้วยครับ เช่น "รายรับ 25000" หรือ "เงินเดือน 25000"'
        })
      }
    } else {
    // ---- Expense parsing (existing logic) ----
    // Parse multiple items: matches all "[Item Name] [Price]" occurrences
    // Requires at least one non-digit in the name, and allows / : - separators
    const matches = Array.from(
      text.matchAll(/([a-zA-Z\u0e00-\u0e7f.-]*[a-zA-Z\u0e00-\u0e7f.-][a-zA-Z0-9_\u0e00-\u0e7f.-]*?)\s*[\/:-]?\s*(\d+(?:\.\d+)?)\s*(?:บาท|b|B)?(?=\s|$|[\n,])/gi)
    )
    
    if (matches.length > 0) {
      // 1. Use lifted categories state

      const itemsToInsert = matches.map(match => {
        const name = match[1].trim()
        const price = parseFloat(match[2])
        
        // Find category match
        const matchedCat = categories?.find(c => 
          name.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(name.toLowerCase())
        )

        return {
          user_id: profile?.id,
          type: 'expense',
          amount: price,
          note: name,
          category_id: matchedCat ? matchedCat.id : null,
          matchedCat
        }
      })
      
      // Bulk insert transactions
      const { data, error } = await supabase
        .from('transactions')
        .insert(
          itemsToInsert.map(item => ({
            user_id: item.user_id,
            type: item.type,
            amount: item.amount,
            note: item.note,
            category_id: item.category_id
          }))
        )
        .select()

      if (error) {
        console.error('Error inserting transactions:', error)
        botReplies.push({
          id: (Date.now() + 1).toString(),
          type: 'bot_text',
          parentMessageId: userMessageId,
          text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลครับ'
        })
      } else {
        if (data) {
          insertedIds = data.map(row => row.id)
        }
        // Output a bot_expense card for each parsed item
        itemsToInsert.forEach((item, index) => {
          const insertedRow = data ? data[index] : null
          botReplies.push({
            id: (Date.now() + index * 10 + 2).toString(),
            type: 'bot_expense',
            parentMessageId: userMessageId,
            expenseData: {
              id: insertedRow ? insertedRow.id : null,
              name: item.note,
              price: item.amount,
              category: item.matchedCat ? item.matchedCat.name : 'ทั่วไป',
              status: 'บันทึกแล้ว',
              budget: 0,
              spent: item.amount
            }
          })
        })
        
        // Update monthly sum
        await refreshTransactions()
      }
    } else {
      botReplies.push({
        id: (Date.now() + 1).toString(),
        type: 'bot_text',
        parentMessageId: userMessageId,
        text: 'กรุณาระบุชื่อและจำนวนเงิน เช่น "ขนม 50 น้ำ 59 ข้าว 30"\nหรือพิมพ์ "รายรับ 25000" เพื่อบันทึกรายรับครับ'
      })
    }
    } // end expense block

    // User message
    const newUserMsg: Message = { 
      id: userMessageId, 
      type: 'user', 
      text,
      transactionIds: insertedIds
    }

    setMessages(prev => [...prev, newUserMsg, ...botReplies])
    setInputText('')
  }

  if (globalLoading) {
    return (
      <div className="bg-[#F0F5F2] h-[100dvh] font-sans flex justify-center items-center">
        <div className="w-full max-w-md bg-[#F6FCF8] h-full shadow-2xl flex flex-col justify-center items-center relative overflow-hidden">
          <FloatingBackground />
          <div className="z-10 flex flex-col items-center gap-4 text-emerald-600">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-md"></div>
            <p className="text-sm font-bold animate-pulse text-emerald-800">กำลังโหลดข้อมูลของคุณ...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F0F5F2] h-[100dvh] font-sans flex justify-center">
      <div className="w-full max-w-md bg-[#F6FCF8] h-full shadow-2xl relative flex flex-col overflow-hidden">
        
        <FloatingBackground />
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md px-5 py-3 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-full">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">{profile ? profile?.display_name : 'ผู้เยี่ยมชม (Guest)'}</h1>
              <div className="flex gap-2 text-[10px] text-gray-500 font-medium mt-0.5">
                <span>วันนี้: <span className="text-amber-600 font-bold">฿{dailyTotal.toLocaleString()}</span></span>
                <span className="text-gray-300">|</span>
                <span>เดือนนี้: <span className="text-rose-500 font-bold">฿{monthlyTotal.toLocaleString()}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            {activeTab !== 'summary' && (
              <button 
                onClick={handleOpenCalendar}
                className="hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Tab Content Wrapper with slide transition */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{
            opacity: tabTransition ? 0 : 1,
            transform: tabTransition ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.18s ease, transform 0.18s ease'
          }}
        >
        {activeTab === 'chat' && (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-36 scrollbar-hide z-10 font-sans">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* User Message */}
                  {msg.type === 'user' && (
                    <div className="relative group flex items-center gap-2 max-w-[85%]">
                      {msg.isCancelled ? (
                        <div className="border border-gray-200 bg-gray-50/50 text-gray-400 px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm text-sm italic font-medium">
                           <span className="text-[10px] text-gray-300 font-bold ml-1">(ยกเลิกแล้ว)</span>
                        </div>
                      ) : editingMessageId === msg.id ? (
                        <div className="bg-white border border-emerald-100 p-2 rounded-2xl shadow-md w-full max-w-[280px]">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full text-sm text-gray-800 border-0 focus:ring-0 resize-none p-1 bg-gray-50 rounded-lg outline-none font-sans"
                            rows={2}
                          />
                          <div className="flex justify-end gap-1.5 mt-2">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-3 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-gray-100 rounded-md border-0 cursor-pointer active:scale-95 transition-transform"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={() => {
                                handleEditUserMessage(msg.id, editingText)
                                setEditingMessageId(null)
                              }}
                              className="px-3 py-1 text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-md border-0 cursor-pointer active:scale-95 transition-transform"
                            >
                              บันทึก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Actions Trigger (More Menu) */}
                          <div className="relative shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id)
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer border-0 bg-transparent active:scale-95 transition-transform flex items-center justify-center"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {activeMenuMessageId === msg.id && (
                              <div className="absolute right-0 bottom-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-32 z-50 animate-in fade-in slide-in-from-bottom-2 duration-100">
                                <button
                                  onClick={() => {
                                    setEditingMessageId(msg.id)
                                    setEditingText(msg.text || '')
                                    setActiveMenuMessageId(null)
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 border-0 bg-transparent cursor-pointer flex items-center gap-1.5"
                                >
                                  แก้ไขข้อความ
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('ต้องการยกเลิกข้อความนี้ใช่ไหม? รายการที่บันทึกจากข้อความนี้จะถูกลบด้วย')) {
                                      handleCancelUserMessage(msg.id)
                                    }
                                    setActiveMenuMessageId(null)
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-0 bg-transparent cursor-pointer flex items-center gap-1.5"
                                >
                                  ยกเลิกข้อความ
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Bubble */}
                          <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md text-sm font-medium relative">
                            {msg.text}
                            {msg.isEdited && (
                              <span className="block text-[8px] text-emerald-200 mt-1 text-right font-medium">
                                (มีการแก้ไข)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

              {/* Bot Text Message */}
              {msg.type === 'bot_text' && (
                <div className="bg-white border border-gray-100 text-gray-700 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[80%] text-sm">
                  {msg.text}
                </div>
              )}

              {/* Bot Expense Card */}
              {msg.type === 'bot_expense' && msg.expenseData && (() => {
                const expenseData = msg.expenseData!
                const isCancelled = expenseData.isCancelled
                const hasBudget = expenseData.budget > 0 && !isCancelled
                
                const headerBg = isCancelled 
                  ? 'bg-gray-100 border-gray-250' 
                  : hasBudget 
                    ? 'bg-rose-50 border-rose-100/50' 
                    : 'bg-emerald-50 border-emerald-100/50'
                    
                const statusColor = isCancelled 
                  ? 'text-gray-500' 
                  : hasBudget 
                    ? 'text-rose-500' 
                    : 'text-emerald-600'
                    
                const dotColor = isCancelled 
                  ? 'bg-gray-300' 
                  : hasBudget 
                    ? 'bg-rose-400' 
                    : 'bg-emerald-400'
                
                return (
                  <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm w-[90%] sm:w-[280px] overflow-hidden rounded-tl-sm mt-1 animate-in zoom-in-95 duration-150 ${isCancelled ? 'opacity-65' : ''}`}>
                    <div className={`px-4 py-3 flex justify-between items-center border-b ${headerBg}`}>
                      <div className={`text-[10px] font-bold ${statusColor} bg-white px-2 py-0.5 rounded-md shadow-sm border border-gray-100/30`}>
                        {isCancelled ? 'ยกเลิกแล้ว' : expenseData.status}
                      </div>
                      
                      {!isCancelled ? (
                        <button 
                          onClick={() => handleCancelExpense(msg.id, expenseData.id)}
                          className="text-[10px] font-bold text-gray-400 hover:text-rose-500 cursor-pointer border-0 bg-transparent flex items-center gap-0.5 active:scale-95 transition-transform"
                        >
                          ยกเลิกรายจ่าย
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 italic">
                          (ยกเลิกแล้ว)
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0">
                          <h3 className={`font-bold text-gray-800 text-sm truncate leading-tight ${isCancelled ? 'line-through text-gray-400' : ''}`}>{expenseData.name}</h3>
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotColor}`}></span>
                            {expenseData.category}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-bold text-base ${isCancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            ฿{expenseData.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {hasBudget && (
                        <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-50">
                          <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                            <span>ใช้ไปแล้ว ฿{expenseData.spent.toLocaleString()}</span>
                            <span>งบ ฿{expenseData.budget.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-rose-500 h-1.5 rounded-full" 
                              style={{ width: '100%' }}
                            ></div>
                          </div>
                          <div className="text-right text-[9px] text-rose-500 font-bold">0% คงเหลือ</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Bot Warning Message */}
              {msg.type === 'bot_warning' && (
                <div className="bg-white border border-orange-100/60 p-3 rounded-xl shadow-sm mt-2 max-w-[85%] flex gap-3 items-start rounded-tl-sm">
                  <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              )}
              
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-[72px] left-0 right-0 bg-white/80 backdrop-blur-md border-t border-emerald-50 px-4 py-3 z-20">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-emerald-50/50 p-1.5 rounded-full border border-emerald-100 focus-within:ring-2 focus-within:ring-emerald-200 transition-all shadow-inner"
          >
            <button type="button" className="p-2 text-gray-400 hover:text-emerald-500 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="พิมพ์รายการของคุณ เช่น ซื้อกาแฟ 50 บาท"
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 text-gray-800 placeholder:text-gray-400 outline-none"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="bg-emerald-500 p-2.5 rounded-full text-white shadow-md shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50 disabled:shadow-none transition-all mr-0.5"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
          </>
        )}

        {activeTab === 'dream' && (
          <DreamTab 
            profile={profile || { id: 'guest', display_name: 'Guest' }} 
            dreams={dreams} 
            transactions={transactions} 
            refreshDreamsAndTransactions={refreshDreamsAndTransactions}
            toggleDreamStarLocally={toggleDreamStarLocally}
          />
        )}

        {activeTab === 'plan' && (
          <FixedExpensesTab 
            profile={profile || { id: 'guest', display_name: 'Guest' }} 
            fixedExpenses={fixedExpenses}
            transactions={transactions}
            categories={categories}
            refreshFixedExpenses={refreshFixedExpenses}
            refreshTransactions={refreshTransactions}
          />
        )}

        {activeTab === 'income' && (
          <IncomeTab
            profile={profile || { id: 'guest', display_name: 'Guest' }}
            incomeSources={incomeSources}
            transactions={transactions}
            refreshIncomeSources={refreshIncomeSources}
            refreshTransactions={refreshTransactions}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTab 
            profile={profile || { id: 'guest', display_name: 'Guest' }}
            transactions={transactions}
            categories={categories}
          />
        )}
        </div> {/* End tab content wrapper */}

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-emerald-50 px-2 py-2 flex justify-between items-center z-30 pb-5 pt-2.5">
          <button onClick={() => switchTab('chat')} className={`flex flex-col items-center gap-0.5 transition-all duration-200 px-2 py-0.5 rounded-xl ${activeTab === 'chat' ? 'text-emerald-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
            <MessageCircle className={`w-5 h-5 transition-all duration-200 ${activeTab === 'chat' ? 'fill-emerald-50' : ''}`} />
            <span className={`text-[9px] transition-all duration-200 ${activeTab === 'chat' ? 'font-bold' : 'font-medium'}`}>แชต</span>
          </button>
          <button onClick={() => switchTab('plan')} className={`flex flex-col items-center gap-0.5 transition-all duration-200 px-2 py-0.5 rounded-xl ${activeTab === 'plan' ? 'text-rose-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
            <ClipboardList className={`w-5 h-5 transition-all duration-200 ${activeTab === 'plan' ? 'fill-rose-50' : ''}`} />
            <span className={`text-[9px] transition-all duration-200 ${activeTab === 'plan' ? 'font-bold' : 'font-medium'}`}>รายจ่าย</span>
          </button>
          <button onClick={() => switchTab('income')} className={`flex flex-col items-center gap-0.5 transition-all duration-200 px-2 py-0.5 rounded-xl ${activeTab === 'income' ? 'text-emerald-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
            <TrendingUp className={`w-5 h-5 transition-all duration-200 ${activeTab === 'income' ? 'fill-emerald-50' : ''}`} />
            <span className={`text-[9px] transition-all duration-200 ${activeTab === 'income' ? 'font-bold' : 'font-medium'}`}>รายรับ</span>
          </button>
          <button onClick={() => switchTab('dream')} className={`flex flex-col items-center gap-0.5 transition-all duration-200 px-2 py-0.5 rounded-xl ${activeTab === 'dream' ? 'text-amber-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
            <Star className={`w-5 h-5 transition-all duration-200 ${activeTab === 'dream' ? 'fill-amber-50' : ''}`} />
            <span className={`text-[9px] transition-all duration-200 ${activeTab === 'dream' ? 'font-bold' : 'font-medium'}`}>ความฝัน</span>
          </button>
          <button onClick={() => switchTab('summary')} className={`flex flex-col items-center gap-0.5 transition-all duration-200 px-2 py-0.5 rounded-xl ${activeTab === 'summary' ? 'text-blue-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
            <BarChart3 className={`w-5 h-5 transition-all duration-200 ${activeTab === 'summary' ? 'fill-blue-50' : ''}`} />
            <span className={`text-[9px] transition-all duration-200 ${activeTab === 'summary' ? 'font-bold' : 'font-medium'}`}>สรุปยอด</span>
          </button>
        </nav>

      {/* Daily Expenses Modal */}
      {showCalendarModal && (() => {
        // Filter only expense transactions
        const expenseTxs = dailyTxList.filter(t => t.type === 'expense')

        // Generate calendar grid cells for displayed month
        const year = calendarViewDate.getFullYear()
        const month = calendarViewDate.getMonth() // 0-indexed
        
        const firstDay = new Date(year, month, 1)
        let firstDayOfWeek = firstDay.getDay()
        // Adjust so Monday is 0, Sunday is 6
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
        
        const totalDays = new Date(year, month + 1, 0).getDate()
        const prevMonthTotalDays = new Date(year, month, 0).getDate()
        
        const cells = []
        
        // Prev month filler cells
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
          const d = new Date(year, month - 1, prevMonthTotalDays - i)
          cells.push({
            dateObj: d,
            isCurrentMonth: false,
            dayNum: d.getDate(),
            matchKey: d.toDateString()
          })
        }
        
        // Current month cells
        for (let i = 1; i <= totalDays; i++) {
          const d = new Date(year, month, i)
          cells.push({
            dateObj: d,
            isCurrentMonth: true,
            dayNum: i,
            matchKey: d.toDateString()
          })
        }
        
        // Next month filler cells to make complete grid rows
        const remaining = cells.length % 7
        if (remaining > 0) {
          const nextFiller = 7 - remaining
          for (let i = 1; i <= nextFiller; i++) {
            const d = new Date(year, month + 1, i)
            cells.push({
              dateObj: d,
              isCurrentMonth: false,
              dayNum: i,
              matchKey: d.toDateString()
            })
          }
        }

        const grandTotal = expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0)

        // Month Names Thai
        const monthNamesThai = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ]
        const thaiMonthName = monthNamesThai[month];
        const thaiYear = year + 543

        const prevMonth = () => {
          setCalendarViewDate(prev => {
            const d = new Date(prev)
            d.setMonth(d.getMonth() - 1)
            return d
          })
        }

        const nextMonth = () => {
          setCalendarViewDate(prev => {
            const d = new Date(prev)
            d.setMonth(d.getMonth() + 1)
            return d
          })
        }

        // Match transactions for viewed month (when selectedCalendarDate is null) or selected day
        const viewedYear = calendarViewDate.getFullYear()
        const viewedMonth = calendarViewDate.getMonth()

        const displayTxs = selectedCalendarDate 
          ? expenseTxs.filter(t => new Date(t.transaction_date).toDateString() === selectedCalendarDate.toDateString())
          : expenseTxs.filter(t => {
              const d = new Date(t.transaction_date)
              return d.getFullYear() === viewedYear && d.getMonth() === viewedMonth
            })

        const displayTotal = displayTxs.reduce((sum, t) => sum + Number(t.amount), 0)

        const getTxDetails = (tx: any) => {
          if (tx.note?.startsWith('[ออม] หยอดกระปุก:')) {
            return {
              label: 'เงินออม',
              title: tx.note.replace('[ออม] หยอดกระปุก: ', ''),
              badgeClass: 'bg-amber-50 text-amber-600 border border-amber-100',
              icon: <Sparkles className="w-4 h-4 text-amber-500 fill-amber-100" />
            }
          }
          
          const isFixedExpense = fixedExpensesList.some(f => f.name === tx.note)
          if (isFixedExpense) {
            return {
              label: 'รายจ่ายประจำ',
              title: tx.note,
              badgeClass: 'bg-rose-50 text-rose-600 border border-rose-100',
              icon: <Receipt className="w-4 h-4 text-rose-500 fill-rose-50" />
            }
          }
          
          return {
            label: 'ทั่วไป',
            title: tx.note || 'ค่าใช้จ่ายทั่วไป',
            badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
            icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />
          }
        }

        const formatCellAmount = (amount: number) => {
          if (amount <= 0) return ''
          if (amount >= 100000) {
            return `${(amount / 1000).toFixed(0)}k`
          }
          if (amount >= 10000) {
            return `${(amount / 1000).toFixed(1)}k`.replace('.0k', 'k')
          }
          return `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        }

        return (
          <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">ปฏิทินรายจ่าย</h3>
                    <p className="text-xs text-gray-400 font-medium font-sans">ดูรายจ่ายแยกตามวัน</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCalendarModal(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-250 active:scale-95 border-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-5 scrollbar-hide">
                {loadingDaily ? (
                  <div className="text-center py-10 text-sm text-gray-400 font-medium">
                    กำลังโหลดข้อมูล...
                  </div>
                ) : (
                  <>
                    {/* Calendar Month Switcher */}
                    <div className="flex justify-between items-center px-1 mb-2">
                      <h4 className="font-bold text-gray-800 text-base">{thaiMonthName} {thaiYear}</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={prevMonth}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 active:scale-90 border-0 transition-transform cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={nextMonth}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 active:scale-90 border-0 transition-transform cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid Container */}
                    <div className="bg-[#F6FCF8]/60 border border-emerald-50/50 rounded-3xl p-3 shadow-inner">
                      {/* Weekday Titles */}
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => (
                          <span key={day} className="text-[10px] font-black text-emerald-800 opacity-60 uppercase">{day}</span>
                        ))}
                      </div>

                      {/* Day Cells Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {cells.map(cell => {
                          const isSelected = selectedCalendarDate && selectedCalendarDate.toDateString() === cell.matchKey
                          const isToday = new Date().toDateString() === cell.matchKey
                          const cellTxs = expenseTxs.filter(t => new Date(t.transaction_date).toDateString() === cell.matchKey)
                          const cellTotal = cellTxs.reduce((sum, t) => sum + Number(t.amount), 0)

                          return (
                            <button
                              key={cell.matchKey}
                              onClick={() => {
                                if (selectedCalendarDate && selectedCalendarDate.toDateString() === cell.matchKey) {
                                  setSelectedCalendarDate(null)
                                } else {
                                  setSelectedCalendarDate(cell.dateObj)
                                }
                              }}
                              className={`aspect-square flex flex-col items-center justify-between py-1.5 rounded-2xl transition-all cursor-pointer border-0 select-none relative ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-95 font-bold z-10'
                                  : isToday
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                                    : cell.isCurrentMonth
                                      ? 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-100/50'
                                      : 'bg-white/40 text-gray-300 border border-transparent'
                              }`}
                            >
                              <span className="text-[11px] leading-tight font-sans font-semibold">{cell.dayNum}</span>
                              <span className={`text-[7px] leading-none tracking-tighter ${
                                isSelected
                                  ? 'text-emerald-100 font-black'
                                  : cellTotal > 0
                                    ? 'text-rose-500 font-extrabold'
                                    : 'text-transparent'
                              }`} style={{ fontSize: '7px' }}>
                                {cellTotal > 0 ? formatCellAmount(cellTotal) : '.'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Selected Day Details Section */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline border-b border-gray-150 pb-1.5 px-1">
                        <h4 className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md font-sans flex items-center gap-2">
                          <span>{selectedCalendarDate
                            ? `รายการวันที่ ${selectedCalendarDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}`
                            : `รายการเดือน${thaiMonthName} ${thaiYear}`}</span>
                          {selectedCalendarDate && (
                            <button 
                              onClick={() => setSelectedCalendarDate(null)}
                              className="text-[9px] font-bold text-emerald-600 hover:text-emerald-750 bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer border-0 active:scale-95 transition-transform"
                            >
                              ดูทั้งเดือน
                            </button>
                          )}
                        </h4>
                        <span className="text-xs font-black text-rose-600 font-sans">
                          รวม ฿{displayTotal.toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {displayTxs.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic py-4 text-center font-sans">
                            {selectedCalendarDate ? 'ไม่มีรายจ่ายในวันที่เลือก' : 'ไม่มีรายจ่ายในเดือนนี้'}
                          </p>
                        ) : (
                          displayTxs.map(tx => {
                            const details = getTxDetails(tx)
                            const txTime = new Date(tx.transaction_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                            
                            return (
                              <div key={tx.id} className="flex justify-between items-center py-2.5 px-3 bg-gray-50 hover:bg-gray-100/70 rounded-xl transition-all border border-gray-100/30">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                                    {details.icon}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-gray-800 truncate leading-tight font-sans">{details.title}</span>
                                    <span className="text-[9px] text-gray-400 font-medium mt-0.5 flex items-center gap-1.5 font-sans">
                                      {txTime} น. ·
                                      <span className={`px-1 rounded-md text-[8px] font-bold ${details.badgeClass}`}>
                                        {details.label}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs font-black text-gray-900 ml-2 shrink-0 font-sans">
                                  ฿{Number(tx.amount).toLocaleString()}
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex justify-between items-center">
                <div className="text-xs text-gray-500 font-medium font-sans">
                  รายจ่ายรวมทุกวัน: <span className="font-black text-rose-600">฿{grandTotal.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setShowCalendarModal(false)}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 active:scale-95 border-0 cursor-pointer font-sans"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        )
      })()}
      </div>
    </div>
  )
}
