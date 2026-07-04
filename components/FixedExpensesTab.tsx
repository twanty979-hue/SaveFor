'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Plus, X, Trash2, Edit2, Receipt, Wifi, Home, Car, Zap,
  Smartphone, GraduationCap, Heart, Tv, ShoppingBag, Coffee,
  Dumbbell, Music, Shield, Building, PiggyBank, CheckCircle2, Clock, Coins, AlertTriangle
} from 'lucide-react'

const CATEGORY_MAP: Record<string, React.ElementType> = {
  'ค่าเช่า': Home, 'ผ่อนรถ': Car, 'ค่าไฟ': Zap, 'ค่าน้ำ': Building,
  'ค่าอินเทอร์เน็ต': Wifi, 'ค่ามือถือ': Smartphone, 'ค่าเรียน': GraduationCap,
  'ค่าประกัน': Shield, 'สมาชิกยิม': Dumbbell, 'สมาชิก Netflix': Tv,
  'สมาชิก Spotify': Music, 'ค่าอาหาร': Coffee, 'ค่ารักษา': Heart,
  'ออมเงิน': PiggyBank, 'อื่นๆ': ShoppingBag
}

const CATEGORY_COLORS: Record<string, string> = {
  'ค่าเช่า': 'bg-blue-100 text-blue-600',
  'ผ่อนรถ': 'bg-purple-100 text-purple-600',
  'ค่าไฟ': 'bg-yellow-100 text-yellow-600',
  'ค่าน้ำ': 'bg-cyan-100 text-cyan-600',
  'ค่าอินเทอร์เน็ต': 'bg-indigo-100 text-indigo-600',
  'ค่ามือถือ': 'bg-rose-100 text-rose-600',
  'ค่าเรียน': 'bg-emerald-100 text-emerald-600',
  'ค่าประกัน': 'bg-slate-100 text-slate-600',
  'สมาชิกยิม': 'bg-orange-100 text-orange-600',
  'สมาชิก Netflix': 'bg-red-100 text-red-600',
  'สมาชิก Spotify': 'bg-green-100 text-green-600',
  'ค่าอาหาร': 'bg-amber-100 text-amber-600',
  'ค่ารักษา': 'bg-pink-100 text-pink-600',
  'ออมเงิน': 'bg-teal-100 text-teal-600',
  'อื่นๆ': 'bg-gray-100 text-gray-600',
}

const CATEGORIES = Object.keys(CATEGORY_MAP)

export default function FixedExpensesTab({ profile, onRequireAuth,
  fixedExpenses,
  transactions,
  categories,
  refreshFixedExpenses,
  refreshTransactions
}: {
  profile: { id: string, display_name: string }, onRequireAuth?: () => boolean,
  fixedExpenses: any[],
  transactions: any[],
  categories: any[],
  refreshFixedExpenses: () => Promise<void>,
  refreshTransactions: () => Promise<void>
}) {
  const supabase = createClient()
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', amount: '', category: 'ค่าเช่า', due_day: '' })

  const [payModal, setPayModal] = useState<any | null>(null)
  const [actualAmount, setActualAmount] = useState<string>('')

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const currentMonthTxs = transactions.filter(t => new Date(t.transaction_date) >= startOfMonth)

  const expenses = fixedExpenses.map((exp: any) => {
    const matchTx = currentMonthTxs.find(
      (t: any) => t.note === exp.name && t.type === 'expense'
    )
    return {
      ...exp,
      isPaid: !!matchTx,
      paidAmount: matchTx ? Number(matchTx.amount) : 0,
      transactionId: matchTx ? matchTx.id : null
    }
  })

  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payModal || !actualAmount) return

    const amountNum = parseFloat(actualAmount)
    if (isNaN(amountNum) || amountNum <= 0) return

    // Find matching category
    const categoryName = payModal.category || 'อื่นๆ'
    const matchedCategory = categories.find(c => c.name === categoryName)
    
    const { error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: profile.id,
          type: 'expense',
          amount: amountNum,
          note: payModal.name,
          category_id: matchedCategory ? matchedCategory.id : null,
          transaction_date: new Date().toISOString()
        }
      ])

    if (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกการจ่ายเงิน: ' + error.message)
    } else {
      setPayModal(null)
      setActualAmount('')
      await refreshTransactions(); await refreshFixedExpenses();
    }
  }

  const handleMarkAsUnpaid = async (expense: any) => {
    if (!expense.transactionId) return
    
    setConfirmDialog({
      isOpen: true,
      title: 'ยกเลิกจ่ายเงิน',
      message: `คุณต้องการยกเลิกการจ่ายเงินสำหรับ "${expense.name}" และลบออกจากประวัติรายจ่ายใช่หรือไม่?`,
      onConfirm: async () => {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', expense.transactionId)

        if (error) {
          alert('เกิดข้อผิดพลาดในการยกเลิกการจ่ายเงิน: ' + error.message)
        } else {
          await refreshTransactions(); await refreshFixedExpenses();
        }
      }
    })
  }

  const totalPaid = expenses
    .filter(e => e.isPaid)
    .reduce((sum, e) => sum + Number(e.paidAmount), 0)

  const totalUnpaid = expenses
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalExpected = totalPaid + totalUnpaid

  const percentPaid = totalExpected > 0 
    ? Math.round((totalPaid / totalExpected) * 100) 
    : 0

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.amount) return

    const payload = {
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      due_day: form.due_day ? parseInt(form.due_day) : null,
    }

    let error;
    if (modal === 'add') {
      const res = await supabase.from('fixed_expenses').insert([{ ...payload, user_id: profile.id }])
      error = res.error
    } else {
      const res = await supabase.from('fixed_expenses').update(payload).eq('id', editId)
      error = res.error
    }

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
      return
    }

    setModal(null)
    setEditId(null)
    setForm({ name: '', amount: '', category: 'ค่าเช่า', due_day: '' })
    await refreshTransactions(); await refreshFixedExpenses();
  }

  const openEdit = (expense: any) => {
    setForm({
      name: expense.name,
      amount: String(expense.amount),
      category: expense.category || 'อื่นๆ',
      due_day: expense.due_day ? String(expense.due_day) : ''
    })
    setEditId(expense.id)
    setModal('edit')
  }

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ลบรายจ่ายประจำ',
      message: 'ลบรายจ่ายนี้ออกจากรายการประจำใช่ไหม?',
      onConfirm: async () => {
        await supabase.from('fixed_expenses').delete().eq('id', id)
        await refreshTransactions(); await refreshFixedExpenses();
      }
    })
  }

  return (
    <div className="p-5 pb-24 h-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            รายจ่ายประจำ <Receipt className="w-5 h-5 text-rose-500 fill-rose-50 animate-pulse" />
          </h2>
          <p className="text-sm text-gray-500 font-medium">ค่าใช้จ่ายที่ต้องจ่ายทุกเดือน</p>
        </div>
        <button
          onClick={() => {
            setForm({ name: '', amount: '', category: 'ค่าเช่า', due_day: '' })
            setEditId(null)
            setModal('add')
          }}
          className="bg-rose-500 text-white p-2 rounded-full shadow-md hover:bg-rose-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-white rounded-3xl p-5 mb-5 text-gray-800 shadow-md shadow-emerald-100/20 border-2 border-emerald-500 relative overflow-hidden">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">รายจ่ายประจำเดือนนี้</p>
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-3xl font-black tracking-tight text-gray-900">
            ฿{totalPaid.toLocaleString()} <span className="text-sm font-normal text-gray-400">/ ฿{totalExpected.toLocaleString()}</span>
          </p>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            {percentPaid}% จ่ายแล้ว
          </span>
        </div>
        <div className="w-full bg-emerald-50/60 border border-emerald-100/30 rounded-full h-2.5 mb-3 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${percentPaid}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] text-gray-500 font-medium">
          <span>จ่ายแล้ว {expenses.filter(e => e.isPaid).length} รายการ</span>
          <span>ค้างจ่ายอีก <span className="text-rose-600 font-bold">฿{totalUnpaid.toLocaleString()}</span> ({expenses.filter(e => !e.isPaid).length} รายการ)</span>
        </div>
      </div>

      {/* List */}
      {expenses.length === 0 ? (
        <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-gray-300">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">ยังไม่มีรายจ่ายประจำ<br/>กดปุ่ม + เพื่อเพิ่มได้เลย!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map(expense => {
            const CategoryIcon = CATEGORY_MAP[expense.category] || ShoppingBag
            const colorClass = CATEGORY_COLORS[expense.category] || 'bg-gray-100 text-gray-600'
            return (
              <div key={expense.id} className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 flex flex-col gap-3 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-1.5">
                          {expense.name}
                          {expense.isPaid ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" /> จ่ายแล้ว
                            </span>
                          ) : (() => {
                            const todayDay = new Date().getDate()
                            const isOverdue = expense.due_day && todayDay > expense.due_day
                            
                            return isOverdue ? (
                              <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 border border-rose-100 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-500" /> เกินกำหนด
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 border border-gray-200">
                                <Clock className="w-3 h-3" /> ยังไม่จ่าย
                              </span>
                            )
                          })()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {expense.category}
                          {expense.due_day && <> · ครบวันที่ <span className="font-bold text-gray-600">{expense.due_day}</span></>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-base leading-none">
                          ฿{Number(expense.isPaid ? expense.paidAmount : expense.amount).toLocaleString()}
                        </p>
                        {expense.isPaid && Number(expense.paidAmount) !== Number(expense.amount) && (
                          <span className="text-[9px] text-gray-400 line-through">
                            (ปกติ ฿{Number(expense.amount).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider & Actions */}
                <div className="border-t border-gray-50 pt-2 flex justify-between items-center">
                  <div>
                    {expense.isPaid ? (
                      <button 
                        onClick={() => handleMarkAsUnpaid(expense)}
                        className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> ยกเลิกจ่ายเงิน
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setPayModal(expense);
                          setActualAmount(String(expense.amount));
                        }}
                        className="text-xs font-extrabold text-emerald-600 bg-white hover:bg-emerald-50/50 border border-emerald-200 hover:border-emerald-300 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <Coins className="w-3.5 h-3.5" /> บันทึกจ่ายเงิน
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(expense)} className="p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl">บันทึกจ่ายรายจ่ายประจำ</h3>
              <p className="text-gray-500 text-sm mt-1">รายการ: <span className="font-bold text-emerald-600">{payModal.name}</span></p>
            </div>

            <form onSubmit={handleMarkAsPaid}>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">฿</span>
                <input
                  type="number"
                  placeholder="0"
                  value={actualAmount}
                  onChange={e => setActualAmount(e.target.value)}
                  className="w-full text-4xl text-center font-bold border-2 border-emerald-100 rounded-2xl py-4 px-10 bg-emerald-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  required
                  autoFocus
                />
                <p className="text-center text-xs text-emerald-100/90 mt-2">ยอดจ่ายจริงอาจแตกต่างกันไปในแต่ละเดือน</p>
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => { setPayModal(null); setActualAmount(''); }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform">
                  ยืนยันจ่ายเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {modal === 'add' ? 'เพิ่มรายจ่ายประจำ' : 'แก้ไขรายจ่าย'}
              </h3>
              <button onClick={() => setModal(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto scrollbar-hide">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">ชื่อรายจ่าย</label>
                  <input
                    type="text"
                    placeholder="เช่น ค่าเช่าห้อง"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">หมวดหมู่</label>
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1 scrollbar-hide">
                    {CATEGORIES.map(cat => {
                      const CatIcon = CATEGORY_MAP[cat]
                      const isSelected = form.category === cat
                      const color = CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm({ ...form, category: cat })}
                          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border text-xs font-bold transition-all gap-1.5 ${isSelected ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-700 scale-95 shadow-md' : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                          <CatIcon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : ''}`} />
                          <span className="text-center leading-tight" style={{fontSize: '9px'}}>{cat}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">จำนวนเงิน (บาท)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">ครบวันที่</label>
                    <input
                      type="number"
                      placeholder="5"
                      min={1}
                      max={31}
                      value={form.due_day}
                      onChange={e => setForm({ ...form, due_day: e.target.value })}
                      className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl text-base font-bold shadow-xl active:scale-95 transition-transform">
                    {modal === 'add' ? 'เพิ่มรายจ่ายประจำ' : 'บันทึกการแก้ไข'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-250 text-gray-700 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all cursor-pointer border-0"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm()
                  setConfirmDialog(null)
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all cursor-pointer border-0"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
