'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/backend/components/BottomNav'
import PageHeader from '@/backend/components/PageHeader'
import Spinner from '@/backend/components/Spinner'
import { getCustomerPremiums, payPremium } from '@/lib/api'

const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:    'bg-emerald-100 text-emerald-800 border border-emerald-200',
    pending: 'bg-amber-100  text-amber-800  border border-amber-200',
    overdue: 'bg-red-100    text-red-800    border border-red-200',
  }
  const cls = styles[status] ?? 'bg-stone-100 text-stone-600 border border-stone-200'
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${cls}`}>
      {status === 'overdue' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      )}
      {status === 'paid' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function UserPremiums() {
  const { user } = useAuth()
  const [premiums, setPremiums] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [paying,   setPaying]   = useState<number | null>(null)

  function load() {
    if (!user?.customer_id) return
    setLoading(true)
    getCustomerPremiums(user.customer_id)
      .then(r => setPremiums(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user])

  const handlePay = async (id: number) => {
    setPaying(id)
    try {
      await payPremium(id)
      load()
    } catch {}
    finally { setPaying(null) }
  }

  const overdue = premiums.filter(p => p.status === 'overdue')
  const pending = premiums.filter(p => p.status === 'pending')
  const paid    = premiums.filter(p => p.status === 'paid')
  const unpaid  = [...overdue, ...pending]

  const totalPaid = paid.reduce((s: number, p: any) => s + parseFloat(p.premium_amount), 0)
  const totalDue  = unpaid.reduce((s: number, p: any) => s + parseFloat(p.premium_amount), 0)

  return (
    <div className="page-wrap fade-up pb-28">
      <PageHeader title="Premiums" subtitle="Track and pay your insurance premiums" />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : premiums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-16 text-center">
          <p className="text-lg font-medium text-stone-500">No premiums found</p>
          <p className="text-sm text-stone-400 mt-1">Buy a policy to generate your premium schedule.</p>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`rounded-2xl border p-5 ${overdue.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
              <p className="text-sm font-medium text-stone-500 mb-2">Amount Due</p>
              <p className={`text-3xl font-bold ${overdue.length > 0 ? 'text-red-600' : 'text-stone-900'}`}>
                ₹{totalDue.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-stone-400 mt-1">
                {unpaid.length} instalment{unpaid.length !== 1 ? 's' : ''}
                {overdue.length > 0 && <span className="text-red-500 font-medium"> · {overdue.length} overdue</span>}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm font-medium text-stone-500 mb-2">Total Paid</p>
              <p className="text-3xl font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
              <p className="text-sm text-stone-400 mt-1">{paid.length} instalment{paid.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* ── Overdue Alert ──────────────────────────────────────────── */}
          {overdue.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 mb-6">
              <svg className="mt-0.5 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="text-base font-semibold text-red-700">Action Required</p>
                <p className="text-sm text-red-600 mt-0.5">
                  You have {overdue.length} overdue premium{overdue.length !== 1 ? 's' : ''}.
                  Pay immediately to keep your coverage active.
                </p>
              </div>
            </div>
          )}

          {/* ── Unpaid Table ───────────────────────────────────────────── */}
          {unpaid.length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-semibold text-stone-700 mb-3">Due / Overdue ({unpaid.length})</h2>
              <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Premium #</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Policy</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Due Date</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-stone-600">Amount</th>
                      <th className="text-center px-5 py-3.5 font-semibold text-stone-600">Status</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-stone-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {unpaid.map((p: any) => (
                      <tr key={p.premium_id} className={p.status === 'overdue' ? 'bg-red-50/60' : 'hover:bg-stone-50'}>
                        <td className="px-5 py-4 text-stone-500 font-mono">#{p.premium_id}</td>
                        <td className="px-5 py-4 text-stone-700 font-medium">#{p.policy_id}</td>
                        <td className="px-5 py-4 text-stone-600">{p.date}</td>
                        <td className="px-5 py-4 text-right font-semibold text-stone-800">
                          ₹{parseFloat(p.premium_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill status={p.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handlePay(p.premium_id)}
                            disabled={paying === p.premium_id}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
                              p.status === 'overdue'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-stone-900 hover:bg-stone-800 text-white'
                            }`}
                          >
                            {paying === p.premium_id ? (
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                                Pay Now
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Paid History Table ─────────────────────────────────────── */}
          <section>
            <h2 className="text-base font-semibold text-stone-700 mb-3">Payment History ({paid.length})</h2>
            {paid.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-10 text-center text-stone-400 text-sm">
                No payments made yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Premium #</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Policy</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-stone-600">Due Date</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-stone-600">Amount</th>
                      <th className="text-center px-5 py-3.5 font-semibold text-stone-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paid.map((p: any) => (
                      <tr key={p.premium_id} className="hover:bg-stone-50">
                        <td className="px-5 py-4 text-stone-500 font-mono">#{p.premium_id}</td>
                        <td className="px-5 py-4 text-stone-700 font-medium">#{p.policy_id}</td>
                        <td className="px-5 py-4 text-stone-600">{p.date}</td>
                        <td className="px-5 py-4 text-right font-semibold text-stone-800">
                          ₹{parseFloat(p.premium_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill status="paid" />
                        </td>
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