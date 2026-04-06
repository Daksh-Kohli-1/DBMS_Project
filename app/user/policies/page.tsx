'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import Spinner from '@/components/Spinner'
import { getCustomerPolicies } from '@/lib/api'
import { useRouter } from 'next/navigation'

const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

export default function UserPolicies() {
  const { user } = useAuth()
  const router   = useRouter()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user?.customer_id) return
    getCustomerPolicies(user.customer_id)
      .then(r => setPolicies(r.data))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="My Policies" subtitle="All active and expired policies" />
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : policies.length === 0 ? (
        <div className="card p-12 text-center text-stone-400">No policies found.</div>
      ) : (
        <div className="space-y-3">
          {policies.map((p: any) => {
            const now   = new Date()
            const end   = new Date(p.end_date)
            const active = end >= now
            return (
              <div key={p.policy_id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-stone-800">{p.policy_type?.type_name ?? 'Policy'}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Policy #{p.policy_id}</p>
                  </div>
                  <span className={active ? 'badge-green' : 'badge-gray'}>{active ? 'Active' : 'Expired'}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Coverage</p>
                    <p className="font-medium text-stone-700">₹{parseFloat(p.policy_type?.coverage_amount ?? 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Valid Until</p>
                    <p className="font-medium text-stone-700">{p.end_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Start Date</p>
                    <p className="text-stone-600">{p.start_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Duration</p>
                    <p className="text-stone-600">{p.policy_type?.time_period} months</p>
                  </div>
                </div>
                {p.policy_type?.rules && (
                  <p className="text-xs text-stone-400 mt-3 pt-3 border-t border-stone-100 leading-relaxed">{p.policy_type.rules}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
      <BottomNav items={NAV} />
    </div>
  )
}
