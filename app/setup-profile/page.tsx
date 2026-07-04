'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User, Save, Sparkles } from 'lucide-react'
import FloatingBackground from '@/components/FloatingBackground'


export default function SetupProfilePage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return

    setLoading(true)
    setError(null)
    
    // Get current logged-in user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่")
      setLoading(false)
      return
    }

    // Insert into profiles table
    const { error: insertError } = await supabase.from('profiles').insert([
      { 
        id: user.id, 
        display_name: displayName, 
        tier: 'free' 
      }
    ])

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F5F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <FloatingBackground />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-xl shadow-emerald-900/5 rounded-3xl border border-emerald-100 sm:px-10 relative">
          
          <div className="mb-8 text-center mt-2">
            <h2 className="text-2xl font-bold text-emerald-950 tracking-tight flex items-center justify-center gap-1.5">
              ตั้งค่าโปรไฟล์ <Sparkles className="h-6 w-6 text-amber-500 fill-amber-100 animate-pulse" />
            </h2>
            <p className="text-sm font-medium text-emerald-600/80 mt-2">
              บอกให้เรารู้หน่อยว่าควรเรียกคุณว่าอะไรดี?
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSaveProfile}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อแสดงผลของคุณ</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-200 rounded-xl py-3 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all border"
                  placeholder="เช่น มหาเศรษฐีท่านหนึ่ง, แม่นางทอง, ลูกพี่ใหญ่"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading || !displayName.trim()}
                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                เริ่มเก็บเงินเลย!
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
