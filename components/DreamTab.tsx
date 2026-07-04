'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/cropImage'
import { 
  Plus, Target, Coins, Image as ImageIcon, X, Trash2, Edit2, Star,
  Home, Car, Smartphone, Laptop, Plane, 
  GraduationCap, Heart, Baby, Gamepad2, Camera, 
  Watch, Guitar, Shirt, Briefcase, ShoppingBag, 
  Bike, Tent, Gem, Rocket, Gift, ShoppingCart, 
  PawPrint, Music, Trophy, Coffee, Sparkles, AlertTriangle, History
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  Home, Car, Smartphone, Laptop, Plane, 
  GraduationCap, Heart, Baby, Gamepad2, Camera, 
  Watch, Guitar, Shirt, Briefcase, ShoppingBag, 
  Bike, Tent, Gem, Rocket, Gift, ShoppingCart, 
  PawPrint, Music, Trophy, Coffee
}

const PRESET_ICONS = Object.keys(ICON_MAP)

export default function DreamTab({
  profile,
  dreams,
  transactions,
  refreshDreamsAndTransactions,
  toggleDreamStarLocally
}: {
  profile: { id: string, display_name: string },
  dreams: any[],
  transactions: any[],
  refreshDreamsAndTransactions: () => Promise<void>,
  toggleDreamStarLocally: (id: string, starred: boolean) => void
}) {
  const supabase = createClient()
  
  // Modal States
  const [dreamModal, setDreamModal] = useState<'add' | 'edit' | null>(null)
  const [currentEditId, setCurrentEditId] = useState<string | null>(null)
  const [newDream, setNewDream] = useState({ title: '', target: '', initial: '', monthly: '' })
  const [selectedIcon, setSelectedIcon] = useState('Home')

  const [addMoneyModal, setAddMoneyModal] = useState<any>(null)
  const [moneyAmount, setMoneyAmount] = useState('')
  const currentEditIdRef = useRef<string | null>(null)

  // Deposit history states
  const [historyModal, setHistoryModal] = useState<any | null>(null)
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // Cropper State
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      setImageSrc(imageDataUrl)
      e.target.value = ''
    }
  }

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleUploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsUploading(true)
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (!croppedImage) throw new Error('Crop failed')
      
      const formData = new FormData()
      formData.append('file', croppedImage)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setSelectedIcon(data.url)
        setImageSrc(null)
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'))
      }
    } catch (e) {
      console.error(e)
      alert('Upload failed')
    }
    setIsUploading(false)
  }

  const mappedDreams = dreams.map((d: any) => {
    const matches = transactions.filter((t: any) => t.note === `[ออม] หยอดกระปุก: ${d.title}`) || []
    return {
      ...d,
      rounds: matches.length,
      savings: matches
    }
  })

  const handleSaveDream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDream.title || !newDream.target) return

    const payload = {
      title: newDream.title,
      target_amount: parseFloat(newDream.target),
      current_amount: newDream.initial ? parseFloat(newDream.initial) : 0,
      monthly_saving_target: newDream.monthly ? parseFloat(newDream.monthly) : 0,
      icon: selectedIcon
    }

    let error;
    if (dreamModal === 'add') {
      const { data: insertedData, error: insertError } = await supabase
        .from('dreams')
        .insert([{ ...payload, user_id: profile.id }])
        .select()
      
      error = insertError

      // Log transaction for initial amount if greater than 0
      if (!insertError && payload.current_amount > 0) {
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', profile.id)
        const saveCategory = categories?.find(c => c.name === 'ออมเงิน' || c.name === 'ออม')

        await supabase.from('transactions').insert([
          {
            user_id: profile.id,
            type: 'expense',
            amount: payload.current_amount,
            note: `[ออม] หยอดกระปุก: ${payload.title}`,
            category_id: saveCategory ? saveCategory.id : null,
            transaction_date: new Date().toISOString()
          }
        ])
      }
    } else {
      const editId = currentEditIdRef.current
      if (!editId) { console.error('No edit ID found'); return }

      // Get old title to rename transactions
      const { data: oldDream } = await supabase
        .from('dreams')
        .select('title')
        .eq('id', editId)
        .single()

      const res = await supabase.from('dreams').update(payload).eq('id', editId)
      error = res.error

      if (!error && oldDream && oldDream.title !== payload.title) {
        // Update all related transactions
        await supabase
          .from('transactions')
          .update({ note: `[ออม] หยอดกระปุก: ${payload.title}` })
          .eq('user_id', profile.id)
          .eq('note', `[ออม] หยอดกระปุก: ${oldDream.title}`)
      }
    }

    if (error) {
      console.error('Supabase error:', error)
      alert('เกิดข้อผิดพลาด: ' + error.message)
      return
    }
      setNewDream({ title: '', target: '', initial: '', monthly: '' })
      setSelectedIcon('Home')
      setDreamModal(null)
      currentEditIdRef.current = null
      await refreshDreamsAndTransactions()
  }

  const openEditModal = (dream: any) => {
    setNewDream({
      title: dream.title,
      target: String(dream.target_amount),
      initial: String(dream.current_amount),
      monthly: String(dream.monthly_saving_target || '')
    })
    setSelectedIcon(dream.icon || 'Home')
    currentEditIdRef.current = dream.id
    setDreamModal('edit')
  }

  const handleDeleteDream = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ลบเป้าหมาย',
      message: 'คุณแน่ใจหรือไม่ที่จะลบเป้าหมายนี้? ข้อมูลเป้าหมายจะถูกลบและไม่สามารถกู้คืนได้',
      onConfirm: async () => {
        const { error } = await supabase.from('dreams').delete().eq('id', id)
        if (!error) await refreshDreamsAndTransactions()
      }
    })
  }

  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    // Optimistic update
    toggleDreamStarLocally(id, !currentStarred)

    const { error } = await supabase
      .from('dreams')
      .update({ is_starred: !currentStarred })
      .eq('id', id)

    if (error) {
      // Revert if error
      toggleDreamStarLocally(id, currentStarred)
      alert('เกิดข้อผิดพลาดในการตั้งเป้าหมายสำคัญ: ' + error.message)
    }
  }

  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(moneyAmount)
    if (!amount || isNaN(amount) || amount <= 0) return

    const newAmount = Number(addMoneyModal.current_amount) + amount
    
    // 1. Update dream amount
    const { error: dreamError } = await supabase
      .from('dreams')
      .update({ current_amount: newAmount })
      .eq('id', addMoneyModal.id)

    if (dreamError) {
      alert('เกิดข้อผิดพลาด: ' + dreamError.message)
      return
    }

    // 2. Fetch categories to check if "ออมเงิน" exists
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', profile.id)
    
    const saveCategory = categories?.find(c => c.name === 'ออมเงิน' || c.name === 'ออม')

    // 3. Log transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: profile.id,
          type: 'expense',
          amount: amount,
          note: `[ออม] หยอดกระปุก: ${addMoneyModal.title}`,
          category_id: saveCategory ? saveCategory.id : null,
          transaction_date: new Date().toISOString()
        }
      ])

    if (txError) {
      console.error('Error logging saving transaction:', txError)
    }

    setAddMoneyModal(null)
    setMoneyAmount('')
    await refreshDreamsAndTransactions()
  }

  return (
    <div className="p-5 pb-24 h-full overflow-y-auto relative scrollbar-hide">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            กระปุกความฝัน <Sparkles className="w-5 h-5 text-amber-500 fill-amber-100 animate-pulse" />
          </h2>
          <p className="text-sm text-gray-500 font-medium">เก็บเงินทีละนิด พิชิตเป้าหมาย</p>
        </div>
        <button 
          onClick={() => {
            setNewDream({ title: '', target: '', initial: '', monthly: '' })
            setSelectedIcon('Home')
            setDreamModal('add')
          }}
          className="bg-rose-500 text-white p-2 rounded-full shadow-md hover:bg-rose-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {mappedDreams.length === 0 ? (
        <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-gray-300">
          <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">ยังไม่มีเป้าหมายเลย<br/>มากำหนดความฝันกันเถอะ!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mappedDreams.map(dream => {
            const percent = Math.min(100, Math.round((Number(dream.current_amount) / Number(dream.target_amount)) * 100))
            const isCompleted = percent >= 100
            const isStarred = !!dream.is_starred

            const cardStyle = isStarred 
              ? "bg-gradient-to-br from-[#FFFDF5] via-[#FEF3C7] to-[#FDE68A]/60 border-amber-450 shadow-lg shadow-amber-200/40 border-2"
              : "bg-white border border-emerald-50"

            return (
              <div key={dream.id} className={`p-4 rounded-2xl shadow-sm border relative overflow-hidden group transition-all duration-300 ${cardStyle}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-center w-full">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl shadow-sm shrink-0 ${isStarred ? 'bg-amber-100/90 border border-amber-300/40' : (isCompleted ? 'bg-amber-100' : 'bg-emerald-50')}`}>
                      {dream.icon?.startsWith('http') ? (
                        <img src={dream.icon} alt="dream icon" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        (() => {
                          const IconComp = ICON_MAP[dream.icon] || Target
                          return <IconComp className={`w-6 h-6 ${isStarred ? 'text-amber-600' : (isCompleted ? 'text-amber-500' : 'text-emerald-600')}`} />
                        })()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-bold leading-tight ${isStarred ? 'text-amber-950 font-black text-base' : 'text-gray-800'}`}>{dream.title}</h3>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleToggleStar(dream.id, !!dream.is_starred)} 
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent ${isStarred ? 'text-amber-500 hover:bg-amber-200/40' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                          >
                            <Star className={`w-3.5 h-3.5 ${dream.is_starred ? 'text-amber-500 fill-amber-400' : 'text-gray-400'}`} />
                          </button>
                          <button onClick={() => openEditModal(dream)} className={`p-1.5 rounded-lg transition-colors border-0 bg-transparent ${isStarred ? 'text-amber-800 hover:bg-amber-200/40' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteDream(dream.id)} className={`p-1.5 rounded-lg transition-colors border-0 bg-transparent ${isStarred ? 'text-rose-700 hover:bg-rose-100/40' : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-xs mt-0.5 font-medium flex items-center justify-between ${isStarred ? 'text-amber-900/80' : 'text-gray-500'}`}>
                        <span>{percent}% สำเร็จแล้ว</span>
                        <button 
                          type="button"
                          onClick={() => setHistoryModal(dream)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer border-0 ${
                            isStarred
                              ? (dream.rounds > 0 
                                  ? 'text-amber-900 bg-amber-200/70 hover:bg-amber-200 border border-amber-300/40' 
                                  : 'text-amber-800/70 bg-amber-100/50 hover:bg-amber-100 border border-amber-200/20')
                              : (dream.rounds > 0 
                                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100')
                          }`}
                        >
                          <History className="w-3.5 h-3.5" /> หยอดแล้ว {dream.rounds || 0} ครั้ง
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className={`w-full rounded-full h-3 overflow-hidden ${isStarred ? 'bg-amber-100/60 border border-amber-200/30' : 'bg-gray-100'}`}>
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${isStarred ? (isCompleted ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 'bg-gradient-to-r from-amber-400 to-yellow-500') : (isCompleted ? 'bg-amber-400' : 'bg-blue-500')}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className={`flex justify-between text-xs font-medium px-1 ${isStarred ? 'text-amber-900' : 'text-gray-500'}`}>
                    <span>เก็บได้ ฿{Number(dream.current_amount).toLocaleString()}</span>
                    <span>เป้าหมาย ฿{Number(dream.target_amount).toLocaleString()}</span>
                  </div>
                  {Number(dream.monthly_saving_target) > 0 && !isCompleted && (
                    <div className={`text-xs font-semibold px-2.5 py-1.5 mt-2 rounded-lg flex items-center justify-between ${isStarred ? 'bg-amber-500/10 text-amber-950 border border-amber-500/20' : 'bg-emerald-50 text-emerald-700'}`}>
                      <span>เป้าหมาย: เก็บเดือนละ ฿{Number(dream.monthly_saving_target).toLocaleString()}</span>
                      <span className={`font-bold ${isStarred ? 'text-amber-800' : 'text-emerald-500'}`}>
                        (อีก {Math.ceil((Number(dream.target_amount) - Number(dream.current_amount)) / Number(dream.monthly_saving_target))} เดือน)
                      </span>
                    </div>
                  )}
                </div>
                
                {!isCompleted && (
                  <button 
                    onClick={() => setAddMoneyModal(dream)}
                    className={`w-full mt-3 flex items-center justify-center gap-1.5 text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all active:scale-95 border-0 cursor-pointer ${
                      isStarred 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-md shadow-amber-250 text-amber-950 font-black' 
                        : 'bg-white text-emerald-600 hover:bg-emerald-50/50 border border-emerald-200 hover:border-emerald-300 font-extrabold shadow-sm'
                    }`}
                  >
                    <Coins className="w-4 h-4" /> หยอดกระปุก
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dream Form Modal (Add/Edit) */}
      {dreamModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {dreamModal === 'add' ? 'สร้างเป้าหมายใหม่' : 'แก้ไขเป้าหมาย'}
              </h3>
              <button onClick={() => setDreamModal(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto scrollbar-hide">
              <form onSubmit={handleSaveDream}>
                {/* Icon Picker */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">เลือกไอคอนเป้าหมาย</label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                    <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center w-full aspect-square rounded-2xl transition-all overflow-hidden ${selectedIcon.startsWith('http') ? 'border-2 border-emerald-400 scale-95 shadow-md' : 'bg-gray-50 border border-dashed border-gray-300 hover:bg-gray-100'}`}
                    >
                      {selectedIcon.startsWith('http') ? (
                        <img src={selectedIcon} alt="Uploaded" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-[10px] text-gray-400 font-bold">อัปโหลด</span>
                        </>
                      )}
                    </button>
                    {PRESET_ICONS.map(iconKey => {
                      const IconComponent = ICON_MAP[iconKey]
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setSelectedIcon(iconKey)}
                          className={`flex flex-col items-center justify-center w-full aspect-square rounded-2xl transition-all ${selectedIcon === iconKey ? 'bg-emerald-100 border-2 border-emerald-500 scale-95 shadow-md' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}
                        >
                          <IconComponent className={`w-7 h-7 ${selectedIcon === iconKey ? 'text-emerald-600' : 'text-gray-500'}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">ชื่อเป้าหมาย</label>
                    <input
                      type="text"
                      placeholder="เช่น ซื้อ iPhone 16"
                      value={newDream.title}
                      onChange={e => setNewDream({...newDream, title: e.target.value})}
                      className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">ราคาเป้าหมาย (บาท)</label>
                    <input
                      type="number"
                      placeholder="เช่น 40000"
                      value={newDream.target}
                      onChange={e => setNewDream({...newDream, target: e.target.value})}
                      className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>
                  {dreamModal === 'add' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">เงินตั้งต้นที่มีอยู่แล้ว (บาท)</label>
                      <input
                        type="number"
                        placeholder="ถ้าเริ่มจากศูนย์ให้เว้นว่างไว้"
                        value={newDream.initial}
                        onChange={e => setNewDream({...newDream, initial: e.target.value})}
                        className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">เป้าหมายที่ต้องเก็บต่อเดือน (บาท)</label>
                    <input
                      type="number"
                      placeholder="เพื่อใช้คำนวณเวลา (ไม่บังคับ)"
                      value={newDream.monthly}
                      onChange={e => setNewDream({...newDream, monthly: e.target.value})}
                      className="w-full text-base border-gray-200 rounded-2xl py-3 px-4 bg-gray-50 border focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl text-base font-bold shadow-xl active:scale-95 transition-transform">
                    {dreamModal === 'add' ? 'สร้างเป้าหมาย' : 'บันทึกการแก้ไข'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {addMoneyModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coins className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl">หยอดกระปุก</h3>
              <p className="text-gray-500 text-sm mt-1">เป้าหมาย: <span className="font-bold text-emerald-600">{addMoneyModal.title}</span></p>
            </div>

            <form onSubmit={handleAddMoneySubmit}>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">฿</span>
                <input
                  type="number"
                  placeholder="0"
                  value={moneyAmount}
                  onChange={e => setMoneyAmount(e.target.value)}
                  className="w-full text-4xl text-center font-bold border-2 border-emerald-100 rounded-2xl py-4 px-10 bg-emerald-50/50 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => { setAddMoneyModal(null); setMoneyAmount(''); }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform">
                  ยืนยัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-md flex flex-col h-full max-h-[80vh] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="relative flex-1">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-6 bg-white space-y-4 pb-8">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">ซูมภาพ</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleUploadCroppedImage}
                  disabled={isUploading}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
                >
                  {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันรูปภาพ'}
                </button>
                <button 
                  onClick={() => setImageSrc(null)}
                  disabled={isUploading}
                  className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold active:scale-95 transition-transform"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Savings History Modal */}
      {historyModal && (() => {
        const dreamTx = transactions.filter(t => t.note === `[ออม] หยอดกระปุก: ${historyModal.title}`)
        
        // Group by Month/Year
        const groups: Record<string, { monthYear: string, txs: any[], total: number }> = {}
        dreamTx.forEach(tx => {
          const date = new Date(tx.transaction_date)
          const monthYear = date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
          if (!groups[monthYear]) {
            groups[monthYear] = { monthYear, txs: [], total: 0 }
          }
          groups[monthYear].txs.push(tx)
          groups[monthYear].total += Number(tx.amount)
        })
        const groupedList = Object.values(groups)

        return (
          <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end sm:justify-center items-center animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl relative max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">ประวัติการออม</h3>
                    <p className="text-xs text-gray-400 font-medium">เป้าหมาย: {historyModal.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setHistoryModal(null)} 
                  className="p-2 bg-gray-150 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95 border-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-6 scrollbar-hide">
                {groupedList.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                      <History className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      ยังไม่มีประวัติการหยอดกระปุกสำหรับเป้าหมายนี้<br/>
                      <span className="text-xs text-gray-400 font-normal">
                        (ยอดเงินปัจจุบันอาจมาจากเงินตั้งต้นที่คุณกรอกไว้ตอนเริ่มสร้าง)
                      </span>
                    </p>
                  </div>
                ) : (
                  groupedList.map(group => (
                    <div key={group.monthYear} className="space-y-2">
                      <div className="flex justify-between items-baseline border-b border-emerald-50 pb-1.5 px-1 shrink-0">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50/50 px-2 py-0.5 rounded-md">{group.monthYear}</span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          หยอด {group.txs.length} ครั้ง · รวม ฿{group.total.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {group.txs.map(tx => {
                          const txDate = new Date(tx.transaction_date)
                          const timeStr = txDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                          const dateStr = txDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                          
                          return (
                            <div key={tx.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 hover:bg-gray-100/70 rounded-xl transition-all">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-800">หยอดกระปุก</span>
                                <span className="text-[9px] text-gray-400 font-medium mt-0.5">{dateStr} · {timeStr} น.</span>
                              </div>
                              <span className="text-xs font-bold text-emerald-600">+฿{Number(tx.amount).toLocaleString()}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex justify-between items-center">
                <div className="text-xs text-gray-500 font-medium">
                  ออมได้ทั้งหมด: <span className="font-bold text-emerald-600">฿{Number(historyModal.current_amount).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setHistoryModal(null)}
                  className="bg-gray-900 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-gray-850 active:scale-95 border-0 cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        )
      })()}

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
