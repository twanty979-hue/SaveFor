'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Plus, X, Trash2, Edit2, Wallet,
  Briefcase, Building2, TrendingUp, Smartphone, Star,
  ShoppingCart, Coffee, Coins, Gift, Zap,
  CheckCircle2, Clock, AlertTriangle, ChevronRight, Banknote
} from 'lucide-react'

const INCOME_CATEGORY_MAP: Record<string, React.ElementType> = {
  'เงินเดือน': Briefcase,
  'Freelance': Smartphone,
  'ธุรกิจ': Building2,
  'ลงทุน': TrendingUp,
  'ขายของ': ShoppingCart,
  'โบนัส': Star,
  'ค่าเช่า': Building2,
  'ค่าคอมมิชชัน': Coins,
  'ค่าตอบแทน': Gift,
  'รายได้เสริม': Zap,
  'อื่นๆ': Wallet,
}

const INCOME_CATEGORY_COLORS: Record<string, string> = {
  'เงินเดือน': 'bg-emerald-100 text-emerald-600',
  'Freelance': 'bg-blue-100 text-blue-600',
  'ธุรกิจ': 'bg-purple-100 text-purple-600',
  'ลงทุน': 'bg-teal-100 text-teal-600',
  'ขายของ': 'bg-orange-100 text-orange-600',
  'โบนัส': 'bg-yellow-100 text-yellow-600',
  'ค่าเช่า': 'bg-indigo-100 text-indigo-600',
  'ค่าคอมมิชชัน': 'bg-pink-100 text-pink-600',
  'ค่าตอบแทน': 'bg-rose-100 text-rose-600',
  'รายได้เสริม': 'bg-cyan-100 text-cyan-600',
  'อื่นๆ': 'bg-gray-100 text-gray-600',
}

const INCOME_CATEGORIES = Object.keys(INCOME_CATEGORY_MAP)

const RECEIVE_DAY_OPTIONS = [
  { label: 'ทุกวันที่ 1', value: 1 },
  { label: 'ทุกวันที่ 5', value: 5 },
  { label: 'ทุกวันที่ 15', value: 15 },
  { label: 'ทุกวันที่ 25', value: 25 },
  { label: 'ทุกวันที่ 28', value: 28 },
  { label: 'สิ้นเดือน', value: 31 },
]

export default function IncomeTab({ profile, onRequireAuth,
  incomeSources,
  transactions,
  refreshIncomeSources,
  refreshTransactions
}: {
  profile: { id: string, display_name: string }, onRequireAuth?: () => boolean,
  incomeSources: any[],
  transactions: any[],
  refreshIncomeSources: () => Promise<void>,
  refreshTransactions: () => Promise<void>
}) {
  const supabase = createClient()
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: 'เงินเดือน',
    receive_day: ''
  })

  const [receiveModal, setReceiveModal] = useState<any | null>(null)
  const [actualAmount, setActualAmount] = useState<string>('')

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // Calculate income transactions this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const currentMonthTxs = transactions.filter(t => new Date(t.transaction_date) >= startOfMonth)

  const sources = incomeSources.map((src: any) => {
    const matchTx = currentMonthTxs.find(
      (t: any) => t.note === src.name && t.type === 'income'
    )
    return {
      ...src,
      isReceived: !!matchTx,
      receivedAmount: matchTx ? Number(matchTx.amount) : 0,
      transactionId: matchTx ? matchTx.id : null
    }
  })

  const totalReceived = sources
    .filter(s => s.isReceived)
    .reduce((sum, s) => sum + Number(s.receivedAmount), 0)

  const totalExpected = sources
    .reduce((sum, s) => sum + Number(s.amount), 0)

  const totalPending = sources
    .filter(s => !s.isReceived)
    .reduce((sum, s) => sum + Number(s.amount), 0)

  const percentReceived = totalExpected > 0
    ? Math.round((totalReceived / totalExpected) * 100)
    : 0

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.amount) return

    const payload = {
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      receive_day: form.receive_day ? parseInt(form.receive_day) : null,
    }

    let error;
    if (modal === 'add') {
      const res = await supabase.from('income_sources').insert([{ ...payload, user_id: profile.id }])
      error = res.error
    } else {
      const res = await supabase.from('income_sources').update(payload).eq('id', editId)
      error = res.error
    }

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
      return
    }

    setModal(null)
    setEditId(null)
    setForm({ name: '', amount: '', category: 'เงินเดือน', receive_day: '' })
    await refreshIncomeSources()
  }

  const openEdit = (src: any) => {
    setForm({
      name: src.name,
      amount: String(src.amount),
      category: src.category || 'อื่นๆ',
      receive_day: src.receive_day ? String(src.receive_day) : ''
    })
    setEditId(src.id)
    setModal('edit')
  }

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ลบรายรับประจำ',
      message: 'ลบรายรับนี้ออกจากรายการประจำใช่ไหม?',
      onConfirm: async () => {
        await supabase.from('income_sources').delete().eq('id', id)
        await refreshIncomeSources()
      }
    })
  }

  const handleMarkAsReceived = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiveModal || !actualAmount) return

    const amountNum = parseFloat(actualAmount)
    if (isNaN(amountNum) || amountNum <= 0) return

    const { error } = await supabase
      .from('transactions')
      .insert([{
        user_id: profile.id,
        type: 'income',
        amount: amountNum,
        note: receiveModal.name,
        transaction_date: new Date().toISOString()
      }])

    if (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกรายรับ: ' + error.message)
    } else {
      setReceiveModal(null)
      setActualAmount('')
      await refreshTransactions()
    }
  }

  const handleMarkAsUnreceived = async (src: any) => {
    if (!src.transactionId) return

    setConfirmDialog({
      isOpen: true,
      title: 'ยกเลิกรับเงิน',
      message: `คุณต้องการยกเลิกการรับเงินสำหรับ "${src.name}" และลบออกจากประวัติรายรับใช่หรือไม่?`,
      onConfirm: async () => {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', src.transactionId)

        if (error) {
          alert('เกิดข้อผิดพลาด: ' + error.message)
        } else {
          await refreshTransactions()
        }
      }
    })
  }

  return (
    <div className="p-5 pb-24 h-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            รายรับประจำ <Banknote className="w-5 h-5 text-emerald-500 fill-emerald-50 animate-pulse" />
          </h2>
          <p className="text-sm text-gray-500 font-medium">รายได้ที่คาดว่าจะได้รับในแต่ละเดือน</p>
        </div>
        <button
          onClick={() => {
            setForm({ name: '', amount: '', category: 'เงินเดือน', receive_day: '' })
            setEditId(null)
            setModal('add')
          }}
          className="bg-emerald-500 text-white p-2 rounded-full shadow-md hover:bg-emerald-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-white rounded-3xl p-5 mb-5 text-gray-800 shadow-md shadow-emerald-100/20 border-2 border-emerald-500 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">รายรับประจำเดือนนี้</p>
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-3xl font-black tracking-tight text-gray-900">
            ฿{totalReceived.toLocaleString()} <span className="text-sm font-normal text-gray-400">/ ฿{totalExpected.toLocaleString()}</span>
          </p>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            {percentReceived}% รับแล้ว
          </span>
        </div>
        <div className="w-full bg-emerald-50/60 border border-emerald-100/30 rounded-full h-2.5 mb-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentReceived}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-500 font-medium">
          <span>รับแล้ว {sources.filter(s => s.isReceived).length} รายการ</span>
          <span>รอรับอีก <span className="text-emerald-600 font-bold">฿{totalPending.toLocaleString()}</span> ({sources.filter(s => !s.isReceived).length} รายการ)</span>
        </div>
      </div>

      {/* Income List */}
      {sources.length === 0 ? (
        <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-gray-300">
          <Banknote className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">ยังไม่มีรายรับประจำ<br />กดปุ่ม + เพื่อเพิ่มได้เลย!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((src: any) => {
            const CatIcon = INCOME_CATEGORY_MAP[src.category] || Wallet
            const colorClass = INCOME_CATEGORY_COLORS[src.category] || 'bg-gray-100 text-gray-600'

            return (
              <div
                key={src.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                  src.isReceived
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-gray-100 hover:border-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900 truncate">{src.name}</p>
                        {src.isReceived && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${colorClass}`}>
                          {src.category}
                        </span>
                        {src.receive_day && (
                          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            วันที่ {src.receive_day}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">
                        ฿{Number(src.amount).toLocaleString()}
                      </p>
                      {src.isReceived && src.receivedAmount !== src.amount && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          รับจริง ฿{src.receivedAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <div>
                    {src.isReceived ? (
                      <button
                        onClick={() => handleMarkAsUnreceived(src)}
                        className="text-xs font-bold text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <AlertTriangle className="w-3 h-3" /> ยกเลิกรับเงิน
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setReceiveModal(src)
                          setActualAmount(String(src.amount))
                        }}
                        className="text-xs font-extrabold text-emerald-600 bg-white hover:bg-emerald-50/50 border border-emerald-200 hover:border-emerald-300 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <Coins className="w-3.5 h-3.5" /> บันทึกรับเงิน
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button onClick={() => openEdit(src)} className="p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(src.id)} className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Receive Money Modal */}
      {receiveModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Banknote className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl">บันทึกรับรายรับ</h3>
              <p className="text-gray-500 text-sm mt-1">รายการ: <span className="font-bold text-emerald-600">{receiveModal.name}</span></p>
            </div>

            <form onSubmit={handleMarkAsReceived}>
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
                <p className="text-center text-xs text-gray-400 mt-2">ยอดรับจริงอาจแตกต่างจากที่ตั้งไว้</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setReceiveModal(null); setActualAmount('') }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform">
                  ยืนยันรับเงิน
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
                {modal === 'add' ? 'เพิ่มรายรับประจำ' : 'แก้ไขรายรับ'}
              </h3>
              <button onClick={() => setModal(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto scrollbar-hide">
              <form onSubmit={handleSave} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">ชื่อรายรับ</label>
                  <input
                    type="text"
                    placeholder="เช่น เงินเดือน, Freelance Web"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">ประเภทรายรับ</label>
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1 scrollbar-hide">
                    {INCOME_CATEGORIES.map(cat => {
                      const CatIcon = INCOME_CATEGORY_MAP[cat]
                      const isSelected = form.category === cat
                      const color = INCOME_CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm({ ...form, category: cat })}
                          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border text-xs font-bold transition-all gap-1.5 ${isSelected ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-700 scale-95 shadow-md' : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                          <CatIcon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : ''}`} />
                          <span className="text-center leading-tight" style={{ fontSize: '9px' }}>{cat}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount + Receive Day */}
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
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">รับวันที่</label>
                    <input
                      type="number"
                      placeholder="25"
                      min={1}
                      max={31}
                      value={form.receive_day}
                      onChange={e => setForm({ ...form, receive_day: e.target.value })}
                      className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all mt-2"
                >
                  {modal === 'add' ? '+ เพิ่มรายรับประจำ' : 'บันทึกการแก้ไข'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center px-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h4 className="text-base font-bold text-gray-900 text-center mb-2">{confirmDialog.title}</h4>
            <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold active:scale-95 transition-transform"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  await confirmDialog.onConfirm()
                  setConfirmDialog(null)
                }}
                className="flex-1 bg-rose-500 text-white py-3 rounded-2xl font-bold active:scale-95 transition-transform"
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
