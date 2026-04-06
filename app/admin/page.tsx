'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import Spinner from '@/components/Spinner'
import { getSummary } from '@/lib/api'

export const ADMIN_NAV = [
  { label: 'Dashboard',  href: '/admin',              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Customers',  href: '/admin/customers',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Policies',   href: '/admin/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { label: 'Claims',     href: '/admin/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'SQL Query',  href: '/admin/query',        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const router   = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (user.role !== 'admin') { router.replace('/user'); return }
    getSummary()
      .then(r => setSummary(r.data))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <Spinner />
    </div>
  )

  const stats = summary ? [
    { label: 'Total Customers',   value: summary.total_customers,  accent: false },
    { label: 'Active Policies',   value: summary.total_policies,   accent: false },
    { label: 'Pending Claims',    value: summary.pending_claims,   accent: summary.pending_claims > 0 },
    { label: 'Total Revenue',     value: `₹${Number(summary.total_revenue).toLocaleString('en-IN')}`, accent: false, wide: true },
  ] : []

  const premiumStats = summary ? [
    { label: 'Total Premiums',  value: summary.total_premiums },
    { label: 'Paid',            value: summary.paid_premiums },
    { label: 'Overdue',         value: summary.overdue_premiums, warn: summary.overdue_premiums > 0 },
  ] : []

  const claimStats = summary ? [
    { label: 'Pending',   value: summary.pending_claims,  color: 'text-clay-600' },
    { label: 'Approved',  value: summary.approved_claims, color: 'text-sage-700' },
    { label: 'Rejected',  value: summary.rejected_claims, color: 'text-stone-500' },
  ] : []

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="Admin Dashboard" subtitle="InsureCore · TIET 2025–26" />

      {/* Main KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className={`card-sm p-4 ${(s as any).wide ? 'col-span-2 sm:col-span-1' : ''}`}>
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-display ${s.accent ? 'text-clay-600' : 'text-stone-800'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Premium breakdown */}
      <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-4">Premium Status</h2>
          <div className="flex gap-6">
            {premiumStats.map(s => (
              <div key={s.label}>
                <p className={`text-2xl font-display ${(s as any).warn ? 'text-clay-600' : 'text-stone-800'}`}>{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {summary && (
            <div className="mt-4 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage-500 rounded-full transition-all"
                style={{ width: `${summary.total_premiums ? (summary.paid_premiums / summary.total_premiums) * 100 : 0}%` }}
              />
            </div>
          )}
          <p className="text-xs text-stone-400 mt-1.5">
            {summary ? Math.round((summary.paid_premiums / Math.max(summary.total_premiums, 1)) * 100) : 0}% collection rate
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-4">Claims Breakdown</h2>
          <div className="flex gap-6">
            {claimStats.map(s => (
              <div key={s.label}>
                <p className={`text-2xl font-display ${s.color}`}>{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
            {summary && (() => {
              const total = summary.pending_claims + summary.approved_claims + summary.rejected_claims || 1
              return <>
                <div className="bg-clay-400 rounded-l-full" style={{ width: `${(summary.pending_claims / total) * 100}%` }} />
                <div className="bg-sage-500" style={{ width: `${(summary.approved_claims / total) * 100}%` }} />
                <div className="bg-stone-400 rounded-r-full" style={{ width: `${(summary.rejected_claims / total) * 100}%` }} />
              </>
            })()}
          </div>
          <div className="flex gap-4 mt-1.5">
            {[['clay-400','Pending'],['sage-500','Approved'],['stone-400','Rejected']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full bg-${c}`} />
                <span className="text-xs text-stone-400">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Manage Customers', href: '/admin/customers', desc: 'Add & view customers' },
          { label: 'Manage Policies',  href: '/admin/policies',  desc: 'Create & assign policies' },
          { label: 'Review Claims',    href: '/admin/claims',    desc: 'Approve or reject' },
          { label: 'Run SQL Query',    href: '/admin/query',     desc: 'Custom database queries' },
        ].map(q => (
          <button key={q.href} onClick={() => router.push(q.href)}
            className="card-sm p-4 text-left hover:bg-stone-100 transition-colors group">
            <p className="text-sm font-medium text-stone-700 group-hover:text-stone-900">{q.label}</p>
            <p className="text-xs text-stone-400 mt-0.5">{q.desc}</p>
          </button>
        ))}
      </div>

      <BottomNav items={ADMIN_NAV} />
    </div>
  )
}
