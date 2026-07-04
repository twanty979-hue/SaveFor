import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ChatUI from '@/components/ChatUI'

export default async function Home() {
  const supabase = await createClient()

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect('/login')
  }

  // Check if user has set up a profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, redirect to setup-profile page
  if (error || !profile) {
    redirect('/setup-profile')
  }

  // If profile exists, render the main Chat UI and pass profile data
  return <ChatUI profile={profile} />
}
