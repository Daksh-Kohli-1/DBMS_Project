'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import Spinner from '@/components/Spinner'
import { getCustomerTransactions } from '@/lib/api'

const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

export default function UserTransactions() {
  const { user } = useAuth()
  const [txns,    setTxns]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.customer_id) return
    getCustomerTransactions(user.customer_id)
      .then(r => setTxns(r.data))
      .finally(() => setLoading(false))
  }, [user])

  const total = txns.filter(t => t.status === 'success').reduce((s: number, t: any) => s + parseFloat(t.amount), 0)

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="Transaction History" subtitle="All your payment records" />
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {txns.length > 0 && (
            <div className="card-sm p-4 mb-5 flex items-center justify-between">
              <p className="text-sm text-stone-500">Total paid to date</p>
              <p className="font-display text-2xl text-stone-800">₹{total.toLocaleString('en-IN')}</p>
            </div>
          )}
          {txns.length === 0 ? (
            <div className="card p-12 text-center text-stone-400 text-sm">No transactions yet.</div>
          ) : (
            <div className="card overflow-hidden">
              <table className="tbl">
                <thead><tr>
                  <th>Txn ID</th><th>Premium</th><th>Date</th><th>Amount</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {txns.map((t: any) => (
                    <tr key={t.transaction_id}>
                      <td className="text-stone-500">#{t.transaction_id}</td>
                      <td>#{t.premium_id}</td>
                      <td>{t.transaction_date}</td>
                      <td className="font-medium text-stone-800">₹{parseFloat(t.amount).toLocaleString('en-IN')}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <BottomNav items={NAV} />
    </div>
  )
}
