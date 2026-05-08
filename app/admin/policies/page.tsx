'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/backend/components/BottomNav'
import PageHeader from '@/backend/components/PageHeader'
import StatusBadge from '@/backend/components/StatusBadge'
import Spinner from '@/backend/components/Spinner'
import { getPolicies, getPolicyTypes, getCustomers, createPolicy, deletePolicy, getAllPremiums } from '@/lib/api'
import { ADMIN_NAV } from '../page'

export default function AdminPolicies() {
  const [policies,     setPolicies]     = useState<any[]>([])
  const [policyTypes,  setPolicyTypes]  = useState<any[]>([])
  const [customers,    setCustomers]    = useState<any[]>([])
  const [premiums,     setPremiums]     = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [form, setForm] = useState({ policy_type_id: '', customer_id: '', start_date: '', end_date: '' })

  useEffect(() => {
    Promise.all([getPolicies(), getPolicyTypes(), getCustomers(), getAllPremiums()])
      .then(([p, pt, c, pr]) => {
        setPolicies(p.data); setPolicyTypes(pt.data); setCustomers(c.data); setPremiums(pr.data)
      }).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.policy_type_id || !form.customer_id || !form.start_date || !form.end_date) {
      setError('All fields are required.'); return
    }
    setSubmitting(true); setError('')
    try {
      const res = await createPolicy({
        policy_type_id: parseInt(form.policy_type_id),
        customer_id:    parseInt(form.customer_id),
        start_date:     form.start_date,
        end_date:       form.end_date,
      })
      const pt = policyTypes.find(t => t.policy_type_id === parseInt(form.policy_type_id))
      setPolicies(prev => [...prev, { ...res.data, policy_type: pt }])
      setShowModal(false)
      setForm({ policy_type_id: '', customer_id: '', start_date: '', end_date: '' })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this policy and all its premiums/claims?')) return
    try { await deletePolicy(id); setPolicies(prev => prev.filter(p => p.policy_id !== id)) }
    catch (e: any) { alert(e.response?.data?.detail || 'Delete failed.') }
  }

  const filtered = policies.filter(p =>
    String(p.policy_id).includes(search) ||
    (p.policy_type?.type_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const premiumCountFor = (pid: number) => premiums.filter((p: any) => p.policy_id === pid).length
  const paidCountFor    = (pid: number) => premiums.filter((p: any) => p.policy_id === pid && p.status === 'paid').length

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="Policies" subtitle={`${policies.length} total policies`} />

      <div className="flex gap-3 mb-5">
        <input className="input flex-1" placeholder="Search by ID or type…" value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowModal(true)} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Policy
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr>
              <th>ID</th><th>Type</th><th>Coverage</th><th>Start</th><th>End</th><th>Premiums</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map((p: any) => {
                const active = new Date(p.end_date) >= new Date()
                const total  = premiumCountFor(p.policy_id)
                const paid   = paidCountFor(p.policy_id)
                return (
                  <tr key={p.policy_id}>
                    <td className="text-stone-400 text-xs">#{p.policy_id}</td>
                    <td className="font-medium text-stone-800">{p.policy_type?.type_name || '—'}</td>
                    <td>₹{parseFloat(p.policy_type?.coverage_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-stone-500">{p.start_date}</td>
                    <td className="text-stone-500">{p.end_date}</td>
                    <td className="text-stone-500">{paid}/{total} paid</td>
                    <td><span className={active ? 'badge-green' : 'badge-gray'}>{active ? 'Active' : 'Expired'}</span></td>
                    <td>
                      <button onClick={() => handleDelete(p.policy_id)} className="btn-ghost text-xs text-clay-600 hover:bg-clay-50 px-2 py-1">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-stone-800">Create Policy</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Policy Type</label>
                <select className="select" value={form.policy_type_id} onChange={e => setForm({...form, policy_type_id: e.target.value})}>
                  <option value="">Select type…</option>
                  {policyTypes.map((pt: any) => (
                    <option key={pt.policy_type_id} value={pt.policy_type_id}>
                      {pt.type_name} — ₹{parseFloat(pt.coverage_amount).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Assign to Customer</label>
                <select className="select" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
                  <option value="">Select customer…</option>
                  {customers.map((c: any) => (
                    <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Start Date</label>
                  <input type="date" className="input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">End Date</label>
                  <input type="date" className="input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <Spinner className="w-3 h-3" />}
                  {submitting ? 'Creating…' : 'Create Policy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav items={ADMIN_NAV} />
    </div>
  )
}
