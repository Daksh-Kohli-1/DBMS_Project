'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    router.replace(user.role === 'admin' ? '/admin' : '/user')
  }, [user])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="w-6 h-6 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
    </div>
  )
}
