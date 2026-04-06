'use client'
import { useAuth } from '@/lib/AuthContext'

export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl text-stone-800 leading-tight">{title}</h1>
        {subtitle && <p className="text-stone-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-medium text-stone-600">{user?.username}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-9 h-9 rounded-xl bg-stone-200 hover:bg-stone-300 flex items-center justify-center transition-colors"
          title="Sign out"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
