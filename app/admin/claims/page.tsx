'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import Spinner from '@/components/Spinner'
import { getAllClaims, updateClaim, deleteClaim } from '@/lib/api'
import { ADMIN_NAV } from '../page'

type Tab = 'pending' | 'approved' | 'rejected' | 'all'

export default function AdminClaims() {
  const [claims,   setClaims]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>('pending')
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    getAllClaims().then(r => setClaims(r.data)).finally(() => setLoading(false))
  }, [])

  const handleStatus = async (id: number, status: string) => {
    setUpdating(id)
    try {
      const res = await updateClaim(id, status)
      setClaims(prev => prev.map(c => c.claim_id === id ? res.data : c))
    } catch {}
    finally { setUpdating(null) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this claim permanently?')) return
    try { await deleteClaim(id); setClaims(prev => prev.filter(c => c.claim_id !== id)) }
    catch (e: any) { alert(e.response?.data?.detail || 'Delete failed.') }
  }

  const tabs: Tab[] = ['pending', 'approved', 'rejected', 'all']
  const counts = {
    pending:  claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
    all:      claims.length,
  }
  const filtered = tab === 'all' ? claims : claims.filter(c => c.status === tab)

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="Claims Management" subtitle="Review and action insurance claims" />

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-200 p-1 rounded-xl mb-5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-w-fit px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap
              ${tab === t ? 'bg-stone-50 text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {t} <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
              t === 'pending' && counts.pending > 0 ? 'bg-clay-200 text-clay-700' : 'bg-stone-300 text-stone-600'
            }`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-stone-400 text-sm">No {tab} claims.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => (
            <div key={c.claim_id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-stone-800">Claim #{c.claim_id}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-stone-400">Policy #{c.policy_id} · Filed {c.claim_date}</p>
                </div>
                <p className="font-display text-xl text-stone-800">₹{parseFloat(c.claim_amount).toLocaleString('en-IN')}</p>
              </div>

              {c.description && (
                <p className="text-sm text-stone-500 leading-relaxed mb-3 pb-3 border-b border-stone-100">
                  {c.description}
                </p>
              )}

              <div className="flex items-center gap-2">
                {c.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatus(c.claim_id, 'approved')}
                      disabled={updating === c.claim_id}
                      className="btn-sage text-xs px-4 py-1.5 flex items-center gap-1.5"
                    >
                      {updating === c.claim_id ? <Spinner className="w-3 h-3" /> : '✓'} Approve
                    </button>
                    <button
                      onClick={() => handleStatus(c.claim_id, 'rejected')}
                      disabled={updating === c.claim_id}
                      className="btn-danger text-xs px-4 py-1.5"
                    >
                      ✕ Reject
                    </button>
                  </>
                )}
                {c.status !== 'pending' && (
                  <button
                    onClick={() => handleStatus(c.claim_id, 'pending')}
                    disabled={updating === c.claim_id}
                    className="btn-secondary text-xs"
                  >
                    Reset to Pending
                  </button>
                )}
                <button onClick={() => handleDelete(c.claim_id)} className="btn-ghost text-xs text-clay-600 ml-auto">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav items={ADMIN_NAV} />
    </div>
  )
}
