'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/backend/components/BottomNav'
import PageHeader from '@/backend/components/PageHeader'
import Spinner from '@/backend/components/Spinner'
import { getCustomerTransactions } from '@/lib/api'


const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    failed:  'bg-red-100    text-red-800    border border-red-200',
    pending: 'bg-amber-100  text-amber-800  border border-amber-200',
  }
  const cls = styles[status] ?? 'bg-stone-100 text-stone-600 border border-stone-200'
  return (
    <span className={`inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

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

  const successful = txns.filter(t => t.status === 'success')
  const total      = successful.reduce((s: number, t: any) => s + parseFloat(t.amount), 0)

  return (
    <div className="page-wrap fade-up pb-28">
      <PageHeader title="Transaction History" subtitle="All your payment records" />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : txns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-16 text-center">
          <p className="text-lg font-medium text-stone-500">No transactions yet</p>
          <p className="text-sm text-stone-400 mt-1">Pay a premium to see records here.</p>
        </div>
      ) : (
        <>
          {/* ── Summary strip ──────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm font-medium text-stone-500 mb-2">Total Paid</p>
              <p className="text-3xl font-bold text-stone-900">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm font-medium text-stone-500 mb-2">Successful</p>
              <p className="text-3xl font-bold text-emerald-600">{successful.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm font-medium text-stone-500 mb-2">Total Txns</p>
              <p className="text-3xl font-bold text-stone-900">{txns.length}</p>
            </div>
          </div>

          {/* ── Table ──────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Txn #</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Premium</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-stone-600">Amount</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-stone-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {txns.map((t: any) => (
                  <tr key={t.transaction_id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          t.status === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {t.status === 'success' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          )}
                        </div>
                        <span className="font-mono text-stone-500">#{t.transaction_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-700 font-medium">#{t.premium_id}</td>
                    <td className="px-5 py-4 text-stone-600">{t.transaction_date}</td>
                    <td className="px-5 py-4 text-right font-bold text-stone-900">
                      ₹{parseFloat(t.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusPill status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <BottomNav items={NAV} />
    </div>
  )
}