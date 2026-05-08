'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/backend/components/BottomNav'
import PageHeader from '@/backend/components/PageHeader'
import StatusBadge from '@/backend/components/StatusBadge'
import Spinner from '@/backend/components/Spinner'
import {
  getCustomerPolicies, getCustomerPremiums, getCustomerClaims,
  getCustomerTransactions, payPremium, fileClaim, getPolicyTypes
} from '@/lib/api'

const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

export default function UserOverview() {
  const { user } = useAuth()
  const router   = useRouter()
  const [policies,     setPolicies]     = useState<any[]>([])
  const [premiums,     setPremiums]     = useState<any[]>([])
  const [claims,       setClaims]       = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    if (user.role === 'admin') { router.replace('/admin'); return }
    if (!user.customer_id) return
    const id = user.customer_id
    Promise.all([
      getCustomerPolicies(id),
      getCustomerPremiums(id),
      getCustomerClaims(id),
    ]).then(([p, pr, cl]) => {
      setPolicies(p.data)
      setPremiums(pr.data)
      setClaims(cl.data)
    }).finally(() => setLoading(false))
  }, [user])

  const pending   = premiums.filter(p => p.status !== 'paid')
  const claimPend = claims.filter(c => c.status === 'pending').length
  const paidTotal = premiums.filter(p => p.status === 'paid').reduce((s: number, p: any) => s + parseFloat(p.premium_amount), 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <Spinner />
    </div>
  )

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="My Dashboard" subtitle={`Welcome back, ${user?.username}`} />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {[
          { label: 'Active Policies',   value: policies.length },
          { label: 'Pending Premiums',  value: pending.length,    warn: pending.length > 0 },
          { label: 'Open Claims',       value: claimPend },
          { label: 'Total Paid (₹)',    value: `₹${paidTotal.toLocaleString('en-IN')}` },
        ].map(s => (
          <div key={s.label} className="card-sm p-4">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-display ${s.warn ? 'text-clay-600' : 'text-stone-800'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending premiums */}
      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="section-title">Pending Payments</h2>
          <div className="card overflow-hidden">
            {pending.map((p: any, i: number) => (
              <div key={p.premium_id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-stone-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-stone-700">Policy #{p.policy_id}</p>
                  <p className="text-xs text-stone-400">Due {p.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-800">₹{parseFloat(p.premium_amount).toLocaleString('en-IN')}</span>
                  <StatusBadge status={p.status} />
                  <PayBtn premiumId={p.premium_id} onPaid={() => setPremiums(prev => prev.map(x => x.premium_id === p.premium_id ? { ...x, status: 'paid' } : x))} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent claims */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Recent Claims</h2>
          <button onClick={() => router.push('/user/claims')} className="btn-ghost text-xs">View all →</button>
        </div>
        {claims.length === 0 ? (
          <div className="card p-8 text-center text-stone-400 text-sm">No claims filed yet.</div>
        ) : (
          <div className="card overflow-hidden">
            {claims.slice(0, 4).map((c: any, i: number) => (
              <div key={c.claim_id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-stone-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-stone-700">Claim #{c.claim_id}</p>
                  <p className="text-xs text-stone-400 line-clamp-1">{c.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-stone-700">₹{parseFloat(c.claim_amount).toLocaleString('en-IN')}</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav items={NAV} />
    </div>
  )
}

function PayBtn({ premiumId, onPaid }: { premiumId: number; onPaid: () => void }) {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const handle = async () => {
    setLoading(true)
    try { await payPremium(premiumId); setDone(true); onPaid() }
    catch {}
    finally { setLoading(false) }
  }
  if (done) return <span className="badge-green">Paid ✓</span>
  return (
    <button onClick={handle} disabled={loading} className="btn-sage text-xs px-3 py-1.5">
      {loading ? <Spinner className="w-3 h-3" /> : 'Pay'}
    </button>
  )
}
