'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { login } from '@/lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { setUser } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(username, password)
      const data = res.data
      setUser({
        username: data.username,
        role: data.role,
        customer_id: data.customer_id ?? null,
        token: data.access_token,
      })
      router.push(data.role === 'admin' ? '/admin' : '/user')
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center px-4">
      {/* Header mark */}
      <div className="mb-10 text-center fade-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-800 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5f5f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
          </svg>
        </div>
        <h1 className="font-display text-3xl text-stone-800 tracking-tight">InsureCore</h1>
        <p className="text-stone-500 text-sm mt-1">Insurance Management System · TIET</p>
      </div>

      {/* Login card */}
      <div className="card w-full max-w-sm p-8 fade-up" style={{ animationDelay: '0.08s' }}>
        <h2 className="font-display text-xl text-stone-700 mb-6">Sign in</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Username</label>
            <input
              className="input"
              placeholder="admin / avleen / rishab…"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" className="btn-primary w-full mt-2 flex items-center justify-center gap-2" disabled={loading}>
            {loading && <span className="w-4 h-4 border-2 border-stone-400 border-t-stone-50 rounded-full animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Quick creds hint */}
        <div className="mt-6 pt-5 border-t border-stone-200">
          <p className="text-xs text-stone-400 mb-2 font-medium uppercase tracking-wider">Demo credentials</p>
          <div className="space-y-1.5 text-xs text-stone-500">
            <div className="flex justify-between">
              <span className="font-medium text-stone-600">Admin</span>
              <span>admin / admin123</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-stone-600">Customer</span>
              <span>avleen / user123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
