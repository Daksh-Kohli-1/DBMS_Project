'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/backend/components/BottomNav'
import PageHeader from '@/backend/components/PageHeader'
import Spinner from '@/backend/components/Spinner'
import { getCustomers, createCustomer, deleteCustomer } from '@/lib/api'
import { ADMIN_NAV } from '../page'

export default function AdminCustomers() {
  const { user } = useAuth()
  const [customers,  setCustomers]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState({ name: '', phone: '', email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    getCustomers().then(r => setCustomers(r.data)).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.name || !form.email) { setError('Name and email required.'); return }
    setSubmitting(true); setError('')
    try {
      const res = await createCustomer(form)
      setCustomers(prev => [...prev, res.data])
      setShowModal(false)
      setForm({ name: '', phone: '', email: '' })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create customer.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer? This will also remove their policy associations.')) return
    try {
      await deleteCustomer(id)
      setCustomers(prev => prev.filter(c => c.customer_id !== id))
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Delete failed.')
    }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="Customers" subtitle={`${customers.length} registered`} />

      <div className="flex gap-3 mb-5">
        <input className="input flex-1" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setShowModal(true)} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Customer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-stone-400 text-sm">No customers found.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead><tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.customer_id}>
                  <td className="text-stone-400 text-xs">#{c.customer_id}</td>
                  <td className="font-medium text-stone-800">{c.name}</td>
                  <td className="text-stone-500">{c.email}</td>
                  <td className="text-stone-500">{c.phone || '—'}</td>
                  <td>
                    <button onClick={() => handleDelete(c.customer_id)} className="btn-ghost text-xs text-clay-600 hover:bg-clay-50 px-2 py-1">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-stone-800">Add Customer</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Avleen Kaur' },
                { label: 'Email',     key: 'email', type: 'email', placeholder: 'avleen@example.com' },
                { label: 'Phone',     key: 'phone', type: 'tel',   placeholder: '9876543210' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">{f.label}</label>
                  <input type={f.type} className="input" placeholder={f.placeholder}
                    value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                </div>
              ))}
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <Spinner className="w-3 h-3" />}
                  {submitting ? 'Creating…' : 'Create'}
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
