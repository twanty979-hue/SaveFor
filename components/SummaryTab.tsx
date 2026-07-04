'use client'

import { useState, useEffect } from 'react'
import {
  PieChart, Sparkles, Coins, ShoppingBag, Home, Car, Zap, Building,
  Wifi, Smartphone, GraduationCap, Shield, Dumbbell, Tv, Music,
  Coffee, Heart, PiggyBank, ArrowDownRight, Award, Trophy, Compass, Receipt,
  TrendingUp, TrendingDown, Wallet, Calendar, Search, Filter, ArrowUpRight,
  Info, ChevronDown, Check, X, FileText, ChevronLeft, ChevronRight
} from 'lucide-react'

const CATEGORY_MAP: Record<string, React.ElementType> = {
  'ค่าเช่า': Home, 'ผ่อนรถ': Car, 'ค่าไฟ': Zap, 'ค่าน้ำ': Building,
  'ค่าอินเทอร์เน็ต': Wifi, 'ค่ามือถือ': Smartphone, 'ค่าเรียน': GraduationCap,
  'ค่าประกัน': Shield, 'สมาชิกยิม': Dumbbell, 'สมาชิก Netflix': Tv,
  'สมาชิก Spotify': Music, 'ค่าอาหาร': Coffee, 'ค่ารักษา': Heart,
  'ออมเงิน': PiggyBank, 'อื่นๆ': ShoppingBag
}

const CATEGORY_COLORS: Record<string, string> = {
  'ค่าเช่า': 'bg-blue-50 text-blue-600 border border-blue-100/50',
  'ผ่อนรถ': 'bg-purple-50 text-purple-600 border border-purple-100/50',
  'ค่าไฟ': 'bg-yellow-50 text-yellow-600 border border-yellow-100/50',
  'ค่าน้ำ': 'bg-cyan-50 text-cyan-600 border border-cyan-100/50',
  'ค่าอินเทอร์เน็ต': 'bg-indigo-50 text-indigo-600 border border-indigo-100/50',
  'ค่ามือถือ': 'bg-rose-50 text-rose-600 border border-rose-100/50',
  'ค่าเรียน': 'bg-emerald-50 text-emerald-600 border border-emerald-100/50',
  'ค่าประกัน': 'bg-slate-50 text-slate-600 border border-slate-100/50',
  'สมาชิกยิม': 'bg-orange-50 text-orange-600 border border-orange-100/50',
  'สมาชิก Netflix': 'bg-red-50 text-red-600 border border-red-100/50',
  'สมาชิก Spotify': 'bg-green-50 text-green-600 border border-green-100/50',
  'ค่าอาหาร': 'bg-amber-50 text-amber-600 border border-amber-100/50',
  'ค่ารักษา': 'bg-pink-50 text-pink-600 border border-pink-100/50',
  'ออมเงิน': 'bg-teal-50 text-teal-600 border border-teal-100/50',
  'อื่นๆ': 'bg-gray-50 text-gray-600 border border-gray-100/50',
}





export default function SummaryTab({ profile, onRequireAuth,
  transactions,
  categories
}: {
  profile: { id: string },
  onRequireAuth?: () => boolean,
  transactions: any[],
  categories: any[]
}) {
  
  useEffect(() => {
    if (onRequireAuth && profile.id === 'guest') {
      onRequireAuth();
    }
  }, []);

  const [period, setPeriod] = useState<'this_month' | 'last_month' | '30_days' | 'all'>('this_month')
  const [searchQuery, setSearchQuery] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense' | 'savings'>('all')
  const [visibleTxCount, setVisibleTxCount] = useState(5)
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)

  const expenseTxs = transactions.filter(t => t.type === 'expense')

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const formatCellAmount = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`
    return amount.toString()
  }

  const getTxDetails = (dateStr: string) => {
    return expenseTxs.filter(t => new Date(t.transaction_date).toDateString() === dateStr)
  }

  const now = new Date()

  // Filter transactions based on the selected period
  const filteredTxs = transactions.filter(t => {
    const txDate = new Date(t.transaction_date)
    if (period === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      return txDate >= startOfMonth
    }
    if (period === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return txDate >= startOfLastMonth && txDate <= endOfLastMonth
    }
    if (period === '30_days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      return txDate >= thirtyDaysAgo
    }
    return true
  })

  // Calculate totals
  const totalIncome = filteredTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const totalExpenses = filteredTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const totalSavings = filteredTxs
    .filter(t => t.type === 'expense' && t.note?.startsWith('[ออม] หยอดกระปุก:'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const netBalance = totalIncome - totalExpenses
  
  // Calculate budget
  const totalBudget = categories.reduce((sum, c) => sum + Number(c.budget || 0), 0)
  const remainingBudget = totalBudget - totalExpenses
  const percentBudgetSpent = totalBudget > 0 ? Math.min(Math.round((totalExpenses / totalBudget) * 100), 100) : 0

  // Category distribution for expenses
  const categoriesData = categories.map((cat: any) => {
    const catTxs = filteredTxs.filter(t => t.type === 'expense' && t.category_id === cat.id)
    const spent = catTxs.reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      ...cat,
      spent,
      percent: cat.budget > 0 ? Math.round((spent / cat.budget) * 100) : 0
    }
  })

  // Sort and filter active categories
  categoriesData.sort((a, b) => b.spent - a.spent)
  const spentCategories = categoriesData.filter(cat => cat.spent > 0)
  const totalSpentCategories = spentCategories.reduce((sum, c) => sum + c.spent, 0)

  // Monthly labels Thai
  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  const getPeriodLabel = () => {
    if (period === 'this_month') {
      return `รายงานประจำเดือน ${monthNamesThai[now.getMonth()]}`
    }
    if (period === 'last_month') {
      const prevMonth = new Date()
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      return `รายงานประจำเดือน ${monthNamesThai[prevMonth.getMonth()]}`
    }
    if (period === '30_days') {
      return 'รายงานย้อนหลัง 30 วันที่ผ่านมา'
    }
    return 'รายงานประวัติการเงินทั้งหมด'
  }

  // Financial health ratio calculation
  const savingsRatio = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0
  let healthBadgeText = '💪 แนะนำให้ออมเพิ่ม'
  let healthBadgeColor = 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-50'
  if (savingsRatio >= 20) {
    healthBadgeText = '🏆 สุดยอดนักออมระดับเซียน (>20%)'
    healthBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-50'
  } else if (savingsRatio >= 10) {
    healthBadgeText = '🌟 วางแผนการเงินได้ยอดเยี่ยม (10-20%)'
    healthBadgeColor = 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm shadow-blue-50'
  } else if (totalSavings > 0) {
    healthBadgeText = '✨ เริ่มต้นการออมได้ดีเยี่ยม (1-10%)'
    healthBadgeColor = 'bg-teal-50 text-teal-700 border-teal-100 shadow-sm shadow-teal-50'
  }

  // Filtered transactions for the ledger feed
  const searchedTxs = filteredTxs.filter(t => {
    const matchesSearch = searchQuery === '' || 
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.type === 'income' ? 'รายรับ' : 'รายจ่าย').includes(searchQuery)
    
    if (txTypeFilter === 'all') return matchesSearch
    if (txTypeFilter === 'income') return matchesSearch && t.type === 'income'
    if (txTypeFilter === 'expense') {
      return matchesSearch && t.type === 'expense' && !t.note?.startsWith('[ออม] หยอดกระปุก:')
    }
    if (txTypeFilter === 'savings') {
      return matchesSearch && t.type === 'expense' && t.note?.startsWith('[ออม] หยอดกระปุก:')
    }
    return matchesSearch
  })

  const handleTxFilterToggle = (type: 'all' | 'income' | 'expense' | 'savings') => {
    setTxTypeFilter(prev => prev === type ? 'all' : type)
    setVisibleTxCount(5)
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-5 z-10 scrollbar-hide">
      {/* Header with Title and Custom Period Selection */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5 font-sans">
              วิเคราะห์แดชบอร์ด <PieChart className="w-5 h-5 text-emerald-500 fill-emerald-50" />
            </h2>
            <p className="text-[11px] text-gray-500 font-bold font-sans tracking-wide uppercase mt-0.5">{getPeriodLabel()}</p>
          </div>
        </div>

        {/* Period Selector Segment Control */}
        <div className="flex bg-gray-100/90 p-1 rounded-xl w-full border border-gray-200/50">
          {(['this_month', 'last_month', '30_days', 'all'] as const).map((p) => {
            const label = {
              this_month: 'เดือนนี้',
              last_month: 'เดือนที่แล้ว',
              '30_days': '30 วัน',
              all: 'ทั้งหมด'
            }[p]
            return (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p)
                  setVisibleTxCount(5)
                }}
                className={`flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  period === p
                    ? 'bg-white text-emerald-600 shadow-sm border border-gray-100 font-black'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modern 2x2 KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* KPI Income */}
        <button
          onClick={() => handleTxFilterToggle('income')}
          className={`text-left w-full bg-white border rounded-2xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md active:scale-95 cursor-pointer ${
            txTypeFilter === 'income' ? 'border-emerald-500 ring-2 ring-emerald-100/50' : 'border-emerald-100/40'
          }`}
        >
          <div className="absolute right-1 -bottom-2 opacity-[0.06] text-emerald-800 pointer-events-none">
            <TrendingUp className="w-14 h-14" />
          </div>
          <p className="text-[9px] font-bold text-emerald-600 tracking-wider font-sans uppercase">รายรับรวม</p>
          <p className="text-lg font-black text-emerald-600 mt-1 font-sans">฿{totalIncome.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[8px] font-semibold text-gray-400">คลิกเพื่อดูรายละเอียด</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          </div>
        </button>

        {/* KPI Expenses */}
        <button
          onClick={() => handleTxFilterToggle('expense')}
          className={`text-left w-full bg-white border rounded-2xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md active:scale-95 cursor-pointer ${
            txTypeFilter === 'expense' ? 'border-rose-500 ring-2 ring-rose-100/50' : 'border-rose-100/40'
          }`}
        >
          <div className="absolute right-1 -bottom-2 opacity-[0.06] text-rose-800 pointer-events-none">
            <TrendingDown className="w-14 h-14" />
          </div>
          <p className="text-[9px] font-bold text-rose-600 tracking-wider font-sans uppercase">รายจ่ายรวม</p>
          <p className="text-lg font-black text-rose-600 mt-1 font-sans">฿{totalExpenses.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[8px] font-semibold text-gray-400">คลิกเพื่อดูรายละเอียด</span>
            <ArrowDownRight className="w-3 h-3 text-rose-500" />
          </div>
        </button>

        {/* KPI Savings */}
        <button
          onClick={() => handleTxFilterToggle('savings')}
          className={`text-left w-full bg-white border rounded-2xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md active:scale-95 cursor-pointer ${
            txTypeFilter === 'savings' ? 'border-amber-500 ring-2 ring-amber-100/50' : 'border-amber-100/40'
          }`}
        >
          <div className="absolute right-1 -bottom-2 opacity-[0.06] text-amber-800 pointer-events-none">
            <Sparkles className="w-14 h-14" />
          </div>
          <p className="text-[9px] font-bold text-amber-600 tracking-wider font-sans uppercase">เงินออมสะสม</p>
          <p className="text-lg font-black text-amber-500 mt-1 font-sans">฿{totalSavings.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[8px] font-semibold text-gray-400">คลิกเพื่อดูเงินออม</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
        </button>

        {/* KPI Net Balance */}
        <button
          onClick={() => setTxTypeFilter('all')}
          className="text-left w-full bg-white border border-blue-100/40 rounded-2xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md active:scale-95 cursor-pointer"
        >
          <div className="absolute right-1 -bottom-2 opacity-[0.06] text-blue-800 pointer-events-none">
            <Wallet className="w-14 h-14" />
          </div>
          <p className="text-[9px] font-bold text-blue-600 tracking-wider font-sans uppercase">คงเหลือสุทธิ</p>
          <p className={`text-lg font-black mt-1 font-sans ${netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            ฿{netBalance.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[8px] font-semibold text-gray-400">เทียบ รายรับ-รายจ่าย</span>
            <Coins className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </button>
      </div>


      {/* Income vs Expenses Ratio Progress Bar */}
      <div className="bg-white rounded-3xl p-4.5 border border-emerald-50/50 shadow-sm space-y-3">
        {(() => {
          const totalInAndOut = totalIncome + totalExpenses
          const incomePercent = totalInAndOut > 0 ? Math.round((totalIncome / totalInAndOut) * 100) : 0
          const expensePercent = totalInAndOut > 0 ? Math.round((totalExpenses / totalInAndOut) * 100) : 0

          return (
            <>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-600">
                <span className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" /> รายรับ ({incomePercent}%)
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  รายจ่าย ({expensePercent}%) <TrendingDown className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full flex overflow-hidden border border-gray-200/20">
                {totalInAndOut > 0 ? (
                  <>
                    <div style={{ width: `${incomePercent}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
                    <div style={{ width: `${expensePercent}%` }} className="h-full bg-rose-500 transition-all duration-500" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
            </>
          )
        })()}
      </div>

      {/* Calendar Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider px-1 font-sans">
          ปฏิทินรายจ่าย
        </h3>
        <div className="bg-white rounded-3xl p-5 border border-emerald-50/50 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer border-0 bg-transparent">
              <ChevronLeft className="w-5 h-5 text-emerald-600" />
            </button>
            <h3 className="text-sm font-bold text-gray-800 font-sans">
              {calendarViewDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer border-0 bg-transparent">
              <ChevronRight className="w-5 h-5 text-emerald-600" />
            </button>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            <div className="min-w-[280px]">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(calendarViewDate).map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="h-10 sm:h-12" />
                  
                  const dateStr = day.toDateString()
                  const dayTxs = getTxDetails(dateStr)
                  const totalSpent = dayTxs.reduce((sum, t) => sum + Number(t.amount), 0)
                  
                  const isSelected = selectedCalendarDate && selectedCalendarDate.toDateString() === dateStr
                  const isToday = new Date().toDateString() === dateStr
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        if (selectedCalendarDate && selectedCalendarDate.toDateString() === dateStr) {
                          setSelectedCalendarDate(null)
                        } else {
                          setSelectedCalendarDate(day)
                        }
                      }}
                      className={`relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 transition-all cursor-pointer border-0 ${
                        isSelected 
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' 
                          : isToday 
                            ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-500' 
                            : 'hover:bg-gray-50 text-gray-700 bg-transparent'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : ''}`}>
                        {day.getDate()}
                      </span>
                      {totalSpent > 0 && (
                        <span className={`text-[8px] font-extrabold truncate w-full text-center mt-0.5 ${
                          isSelected ? 'text-emerald-50' : 'text-rose-500'
                        }`}>
                          {formatCellAmount(totalSpent)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {selectedCalendarDate && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-800 mb-3 font-sans">
                รายการวันที่ {selectedCalendarDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h4>
              <div className="space-y-2">
                {getTxDetails(selectedCalendarDate.toDateString()).map(tx => {
                  const cat = categories.find(c => c.id === tx.category_id)
                  const IconComp = cat ? (CATEGORY_MAP[cat.name] || CATEGORY_MAP[cat.icon] || ShoppingBag) : ShoppingBag
                  const colorClass = cat ? (CATEGORY_COLORS[cat.name] || CATEGORY_COLORS[cat.icon] || 'bg-gray-50 text-gray-500') : 'bg-gray-50 text-gray-500'

                  return (
                    <div key={tx.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <IconComp className="w-3 h-3" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">{tx.note || cat?.name || 'ไม่มีระบุ'}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-rose-600">-฿{Number(tx.amount).toLocaleString()}</span>
                    </div>
                  )
                })}
                {getTxDetails(selectedCalendarDate.toDateString()).length === 0 && (
                  <p className="text-center text-[10px] text-gray-400 py-2">ไม่มีรายจ่ายในวันที่เลือก</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budgets & Limit Cards */}
      {totalBudget > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider px-1 font-sans">
            การควบคุมงบประมาณ
          </h3>
          <div className="bg-white rounded-3xl p-5 border border-emerald-50/50 shadow-sm space-y-4">
            {/* Overall Budget Progress Ring Details */}
            <div className="flex justify-between items-center pb-3.5 border-b border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 font-sans uppercase">งบประมาณรวมประจำเดือน</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-sans text-gray-900">฿{totalExpenses.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-bold font-sans">/ ฿{totalBudget.toLocaleString()}</span>
                </div>
                <div className="inline-block border px-2 py-0.5 rounded-lg text-[9px] font-extrabold shadow-sm leading-none border-gray-200/50">
                  คงเหลือ: <span className={remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'}>฿{remainingBudget.toLocaleString()}</span>
                </div>
              </div>

              {/* Mini Budget circle visual */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="23" stroke="#f3f4f6" strokeWidth="4.5" fill="transparent" />
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    className="text-emerald-500 transition-all duration-500"
                    strokeWidth="4.5"
                    strokeDasharray={2 * Math.PI * 23}
                    strokeDashoffset={2 * Math.PI * 23 - (percentBudgetSpent / 100) * (2 * Math.PI * 23)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[9px] font-extrabold text-gray-800">{percentBudgetSpent}%</span>
              </div>
            </div>

            {/* Sub category budget bars */}
            <div className="space-y-3.5 pt-1">
              {categoriesData.filter(cat => cat.budget > 0).map(cat => {
                const IconComp = CATEGORY_MAP[cat.name] || CATEGORY_MAP[cat.icon] || ShoppingBag
                const colorClass = CATEGORY_COLORS[cat.name] || CATEGORY_COLORS[cat.icon] || 'bg-gray-50 text-gray-500'
                const isOverBudget = cat.spent > cat.budget

                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-800 truncate font-sans">{cat.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-gray-900 font-sans">฿{cat.spent.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 font-medium font-sans"> / ฿{cat.budget.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-100/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget 
                            ? 'bg-gradient-to-r from-rose-500 to-red-500 shadow-sm shadow-rose-200' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${Math.min(cat.percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Personal Financial Advice / Insights */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider px-1 font-sans flex items-center gap-1.5">
          <span>💡 คำแนะนำการเงินส่วนตัว</span>
        </h3>
        <div className="bg-white rounded-3xl p-4.5 border border-emerald-50/50 shadow-sm space-y-3">
          
          {/* Savings Insight */}
          <div className="flex gap-3 items-start text-[11px] leading-relaxed p-2.5 rounded-2xl bg-emerald-50/40 border border-emerald-100/30">
            <span className="text-base shrink-0">✨</span>
            <div>
              <p className="font-extrabold text-emerald-800">วิเคราะห์การออมเงิน</p>
              <div className="text-gray-600 mt-0.5 font-sans">
                {totalSavings > 0 
                  ? `ช่วงเวลานี้คุณออมเงินเข้ากระปุกความฝันสำเร็จแล้ว ฿${totalSavings.toLocaleString()} ยอดเยี่ยมมากครับ!`
                  : 'คุณยังไม่มีเงินออมสะสมเลยในช่วงเวลานี้ ลองเก็บออมทีละนิดเพื่อสร้างเป้าหมายความฝันกันครับ'}
                <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ml-1 border ${healthBadgeColor}`}>
                  {healthBadgeText}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Safety Warning */}
          {totalBudget > 0 && (
            <div className={`flex gap-3 items-start text-[11px] leading-relaxed p-2.5 rounded-2xl border ${
              percentBudgetSpent >= 80 
                ? 'bg-rose-50/40 border-rose-100/30 text-rose-800' 
                : percentBudgetSpent >= 50 
                  ? 'bg-amber-50/40 border-amber-100/30 text-amber-800'
                  : 'bg-blue-50/40 border-blue-100/30 text-blue-800'
            }`}>
              <span className="text-base shrink-0">
                {percentBudgetSpent >= 80 ? '⚠️' : percentBudgetSpent >= 50 ? '🔔' : '✅'}
              </span>
              <div>
                <p className="font-extrabold">ความปลอดภัยของงบประมาณ</p>
                <p className="text-gray-600 mt-0.5 font-sans">
                  {percentBudgetSpent >= 80 
                    ? `เตือนภัย! คุณใช้จ่ายงบประมาณไปถึง ${percentBudgetSpent}% แล้ว แนะนำให้ชะลอการใช้จ่ายฟุ่มเฟือยในช่วงนี้` 
                    : percentBudgetSpent >= 50
                      ? `คุณใช้จ่ายงบไปแล้ว ${percentBudgetSpent}% อยู่ในเกณฑ์ปานกลาง วางแผนควบคุมรายจ่ายให้ดีนะครับ`
                      : `การเงินปลอดภัย! เพิ่งใช้จ่ายไปเพียง ${percentBudgetSpent}% ของงบประมาณรวม สภาพคล่องสูงมากครับ`}
                </p>
              </div>
            </div>
          )}

          {/* Top Category Spending Insight */}
          {categoriesData.length > 0 && categoriesData[0].spent > 0 && (
            <div className="flex gap-3 items-start text-[11px] leading-relaxed p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-base shrink-0">📊</span>
              <div>
                <p className="font-extrabold text-slate-800">หมวดหมู่รายจ่ายสูงสุด</p>
                <p className="text-gray-600 mt-0.5 font-sans">
                  คุณใช้จ่ายกับหมวดหมู่ <span className="font-bold text-gray-800">"{categoriesData[0].name}"</span> เป็นอันดับหนึ่งรวม ฿{categoriesData[0].spent.toLocaleString()} ลองวิเคราะห์เพิ่มเติมเพื่อดูว่าจุดใดสามารถปรับลดลงได้อีกในรอบบิลหน้า
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Searchable Transaction List / Ledger feed */}
      <div className="space-y-3">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-sans">
            รายการประวัติการเงิน ({searchedTxs.length})
          </h3>
          {txTypeFilter !== 'all' && (
            <button
              onClick={() => setTxTypeFilter('all')}
              className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 border-0 bg-transparent cursor-pointer active:scale-95"
            >
              ล้างตัวกรอง <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Ledger Search box & Filter badges */}
        <div className="bg-white rounded-3xl p-4 border border-emerald-50/50 shadow-sm space-y-3">
          <div className="relative flex items-center bg-gray-50 border border-gray-200/50 rounded-xl px-3 py-2 text-gray-400 focus-within:text-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100/50 transition-all">
            <Search className="w-4 h-4 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleTxCount(5)
              }}
              placeholder="ค้นหาโน้ต เช่น ซื้อของ, ออมเงิน..."
              className="w-full bg-transparent text-xs text-gray-800 border-none outline-none font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 border-0 bg-transparent text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick filter badges */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => handleTxFilterToggle('all')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                txTypeFilter === 'all'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-gray-50 text-gray-500 border-gray-200/50'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => handleTxFilterToggle('income')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                txTypeFilter === 'income'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-emerald-50/40 text-emerald-600 border-emerald-100/40'
              }`}
            >
              รายรับ
            </button>
            <button
              onClick={() => handleTxFilterToggle('expense')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                txTypeFilter === 'expense'
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-rose-50/40 text-rose-600 border-rose-100/40'
              }`}
            >
              รายจ่าย
            </button>
            <button
              onClick={() => handleTxFilterToggle('savings')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                txTypeFilter === 'savings'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-50/40 text-amber-600 border-amber-100/40'
              }`}
            >
              เงินออม
            </button>
          </div>
        </div>

        {/* Transaction entries scroll section */}
        {searchedTxs.length > 0 ? (
          <div className="space-y-2">
            {searchedTxs.slice(0, visibleTxCount).map((tx) => {
              const isDream = tx.type === 'expense' && tx.note?.startsWith('[ออม] หยอดกระปุก:')
              const title = isDream ? tx.note.replace('[ออม] หยอดกระปุก: ', '') : (tx.note || 'ไม่ได้ระบุโน้ต')
              
              let IconComp: React.ElementType = Coins
              let colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100/40'
              
              if (tx.type === 'expense') {
                if (isDream) {
                  IconComp = PiggyBank
                  colorClass = 'bg-amber-50 text-amber-600 border-amber-100/40'
                } else {
                  const cat = categories.find(c => c.id === tx.category_id)
                  IconComp = cat ? (CATEGORY_MAP[cat.name] || CATEGORY_MAP[cat.icon] || ShoppingBag) : ShoppingBag
                  colorClass = cat ? (CATEGORY_COLORS[cat.name] || CATEGORY_COLORS[cat.icon] || 'bg-gray-50 text-gray-500') : 'bg-gray-50 text-gray-500 border-gray-200/50'
                }
              }

              return (
                <div 
                  key={tx.id} 
                  className="flex justify-between items-center py-2.5 px-3.5 bg-white rounded-2xl border border-gray-200/20 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-800 truncate font-sans">{title}</span>
                      <span className="text-[9px] text-gray-400 font-bold mt-0.5 font-sans">
                        {new Date(tx.transaction_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} · {
                          tx.type === 'income' ? 'รายรับ' : isDream ? 'เงินออม' : 'รายจ่าย'
                        }
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold shrink-0 ml-2 font-sans ${
                    tx.type === 'income' ? 'text-emerald-600' : isDream ? 'text-amber-500' : 'text-rose-600'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}฿{Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              )
            })}

            {/* Show More / Show Less buttons */}
            {searchedTxs.length > 5 && (
              <div className="flex justify-center pt-1.5">
                {visibleTxCount < searchedTxs.length ? (
                  <button
                    onClick={() => setVisibleTxCount(prev => Math.min(prev + 5, searchedTxs.length))}
                    className="px-4 py-2 bg-white text-gray-500 text-[10px] font-bold rounded-xl border border-gray-200 shadow-sm hover:text-gray-800 cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    แสดงเพิ่มเติม <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setVisibleTxCount(5)}
                    className="px-4 py-2 bg-white text-gray-500 text-[10px] font-bold rounded-xl border border-gray-200 shadow-sm hover:text-gray-800 cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    ย่อรายการ <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-emerald-50/50 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-medium">ไม่พบรายการเงินตรงกับตัวกรองนี้</p>
          </div>
        )}
      </div>
    </div>
  )
}
