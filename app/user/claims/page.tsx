'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import Spinner from '@/components/Spinner'
import { getCustomerClaims, fileClaim, getCustomerPolicies } from '@/lib/api'

const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

export default function UserClaims() {
  const { user } = useAuth()
  const [claims,    setClaims]   = useState<any[]>([])
  const [policies,  setPolicies] = useState<any[]>([])
  const [loading,   setLoading]  = useState(true)
  const [showModal, setShowModal]= useState(false)
  const [form, setForm] = useState({ policy_id: '', claim_date: new Date().toISOString().slice(0,10), claim_amount: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.customer_id) return
    Promise.all([getCustomerClaims(user.customer_id), getCustomerPolicies(user.customer_id)])
      .then(([cl, po]) => { setClaims(cl.data); setPolicies(po.data) })
      .finally(() => setLoading(false))
  }, [user])

  const handleSubmit = async () => {
    if (!form.policy_id || !form.claim_amount) { setError('Policy and amount are required.'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fileClaim({ ...form, policy_id: parseInt(form.policy_id), claim_amount: parseFloat(form.claim_amount) })
      setClaims(prev => [res.data, ...prev])
      setShowModal(false)
      setForm({ policy_id: '', claim_date: new Date().toISOString().slice(0,10), claim_amount: '', description: '' })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to file claim.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="page-wrap fade-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-stone-800">Claims</h1>
          <p className="text-stone-500 text-sm mt-0.5">File and track insurance claims</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            File Claim
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : claims.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-stone-400 mb-3">No claims filed yet.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">File your first claim</button>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c: any) => (
            <div key={c.claim_id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-stone-800">Claim #{c.claim_id}</p>
                  <p className="text-xs text-stone-400">Policy #{c.policy_id} · {c.claim_date}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xl font-display text-stone-800 mb-1">₹{parseFloat(c.claim_amount).toLocaleString('en-IN')}</p>
              {c.description && <p className="text-sm text-stone-500 leading-relaxed">{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* File Claim Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-stone-800">File a Claim</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Policy</label>
                <select className="select" value={form.policy_id} onChange={e => setForm({...form, policy_id: e.target.value})}>
                  <option value="">Select policy…</option>
                  {policies.map((p: any) => (
                    <option key={p.policy_id} value={p.policy_id}>#{p.policy_id} — {p.policy_type?.type_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Claim Date</label>
                <input type="date" className="input" value={form.claim_date} onChange={e => setForm({...form, claim_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Amount (₹)</label>
                <input type="number" className="input" placeholder="50000" value={form.claim_amount} onChange={e => setForm({...form, claim_amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="Describe your claim…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <Spinner className="w-3 h-3" />}
                  {submitting ? 'Filing…' : 'Submit Claim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav items={NAV} />
    </div>
  )
}
