'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import Spinner from '@/components/Spinner'
import { getCustomerPremiums, payPremium } from '@/lib/api'

const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

export default function UserPremiums() {
  const { user } = useAuth()
  const [premiums, setPremiums] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [paying,   setPaying]   = useState<number | null>(null)

  useEffect(() => {
    if (!user?.customer_id) return
    getCustomerPremiums(user.customer_id)
      .then(r => setPremiums(r.data))
      .finally(() => setLoading(false))
  }, [user])

  const handlePay = async (id: number) => {
    setPaying(id)
    try {
      await payPremium(id)
      setPremiums(prev => prev.map(p => p.premium_id === id ? { ...p, status: 'paid' } : p))
    } catch {}
    finally { setPaying(null) }
  }

  const pending = premiums.filter(p => p.status !== 'paid')
  const paid    = premiums.filter(p => p.status === 'paid')

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="Premiums" subtitle="Track and pay your insurance premiums" />
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-6">
              <h2 className="section-title">Due / Overdue</h2>
              <div className="card overflow-hidden">
                <table className="tbl">
                  <thead><tr>
                    <th>Premium ID</th><th>Policy</th><th>Due Date</th><th>Amount</th><th>Status</th><th></th>
                  </tr></thead>
                  <tbody>
                    {pending.map((p: any) => (
                      <tr key={p.premium_id}>
                        <td className="text-stone-500">#{p.premium_id}</td>
                        <td>#{p.policy_id}</td>
                        <td>{p.date}</td>
                        <td className="font-medium">₹{parseFloat(p.premium_amount).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td>
                          <button
                            onClick={() => handlePay(p.premium_id)}
                            disabled={paying === p.premium_id}
                            className="btn-sage text-xs px-3 py-1.5"
                          >
                            {paying === p.premium_id ? <Spinner className="w-3 h-3" /> : 'Pay Now'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section>
            <h2 className="section-title">Payment History</h2>
            {paid.length === 0 ? (
              <div className="card p-8 text-center text-stone-400 text-sm">No payments made yet.</div>
            ) : (
              <div className="card overflow-hidden">
                <table className="tbl">
                  <thead><tr>
                    <th>Premium ID</th><th>Policy</th><th>Date</th><th>Amount</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {paid.map((p: any) => (
                      <tr key={p.premium_id}>
                        <td className="text-stone-500">#{p.premium_id}</td>
                        <td>#{p.policy_id}</td>
                        <td>{p.date}</td>
                        <td className="font-medium">₹{parseFloat(p.premium_amount).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      <BottomNav items={NAV} />
    </div>
  )
}
