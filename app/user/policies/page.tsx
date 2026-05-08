'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/backend/components/BottomNav'
import PageHeader from '@/backend/components/PageHeader'
import Spinner from '@/backend/components/Spinner'
import { getCustomerPolicies, getPolicyTypes, buyPolicy } from '@/lib/api'
import { useRouter } from 'next/navigation'

const NAV = [
  { label: 'Overview', href: '/user', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Policies',  href: '/user/policies',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
  { label: 'Premiums',  href: '/user/premiums',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { label: 'Claims',    href: '/user/claims',       icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { label: 'History',   href: '/user/transactions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface PolicyType {
  policy_type_id: number
  type_name: string
  coverage_amount: string | number
  time_period: number
  rules?: string
}

// ─── Buy Policy Modal ─────────────────────────────────────────────────────────
function BuyPolicyModal({
  types,
  onClose,
  onSuccess,
}: {
  types: PolicyType[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [selected, setSelected]   = useState<PolicyType | null>(null)
  const [step, setStep]           = useState<'pick' | 'confirm'>('pick')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  // Safety: if types haven't loaded yet, show a spinner inside the modal
  if (!types || types.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl p-12 flex justify-center">
          <svg className="animate-spin text-stone-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      </div>
    )
  }

  async function handleBuy() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await buyPolicy(selected.policy_type_id)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1400)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const today    = new Date()
  const endDate  = selected
    ? new Date(today.getFullYear(), today.getMonth() + Number(selected.time_period), today.getDate())
        .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet — pb-20 clears the bottom nav bar */}
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl animate-slide-up overflow-hidden pb-20">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-stone-800">
              {step === 'pick' ? 'Choose a Policy' : 'Confirm Purchase'}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {step === 'pick' ? 'Select the plan that suits you' : 'Review and confirm your policy'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">

          {success ? (
            // ── Success state ──────────────────────────────────────────────
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p className="font-semibold text-stone-800">Policy Purchased!</p>
              <p className="text-sm text-stone-400 text-center">Your new policy is now active.</p>
            </div>

          ) : step === 'pick' ? (
            // ── Step 1: pick a type ────────────────────────────────────────
            <div className="space-y-3">
              {types.map((t) => (
                <button
                  key={t.policy_type_id}
                  onClick={() => setSelected(t)}
                  className={[
                    'w-full text-left rounded-xl border p-4 transition-all',
                    selected?.policy_type_id === t.policy_type_id
                      ? 'border-stone-800 bg-stone-50 ring-1 ring-stone-800'
                      : 'border-stone-200 hover:border-stone-300',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-stone-800 text-sm">{t.type_name}</p>
                    <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                      {t.time_period}mo
                    </span>
                  </div>
                  <p className="text-lg font-bold text-stone-900 mt-1">
                    ₹{parseFloat(String(t.coverage_amount)).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-stone-400 ml-1">coverage</span>
                  </p>
                  {t.rules && (
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed line-clamp-2">{t.rules}</p>
                  )}
                </button>
              ))}
            </div>

          ) : (
            // ── Step 2: confirm ────────────────────────────────────────────
            <div className="space-y-4">
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-3">
                <Row label="Plan"      value={selected!.type_name} />
                <Row label="Coverage"  value={`₹${parseFloat(String(selected!.coverage_amount)).toLocaleString('en-IN')}`} />
                <Row label="Duration"  value={`${selected!.time_period} months`} />
                <Row label="Start"     value={today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
                <Row label="Valid until" value={endDate} highlight />
              </div>
              {selected?.rules && (
                <p className="text-xs text-stone-400 leading-relaxed">{selected.rules}</p>
              )}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-5 py-4 border-t border-stone-100 flex gap-3">
            {step === 'confirm' && (
              <button
                onClick={() => { setStep('pick'); setError(null) }}
                className="flex-1 rounded-xl border border-stone-200 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              disabled={!selected || loading}
              onClick={step === 'pick' ? () => setStep('confirm') : handleBuy}
              className="flex-1 rounded-xl bg-stone-900 text-white py-3 text-sm font-medium disabled:opacity-40 hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : step === 'pick' ? 'Continue' : 'Confirm & Buy'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.28s cubic-bezier(0.32,0.72,0,1) both; }
      `}</style>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-stone-400">{label}</span>
      <span className={highlight ? 'font-semibold text-stone-900' : 'text-stone-700'}>{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UserPolicies() {
  const { user } = useAuth()
  const router   = useRouter()

  const [policies,    setPolicies]    = useState<any[]>([])
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)

  function loadPolicies() {
    if (!user?.customer_id) return
    setLoading(true)
    getCustomerPolicies(user.customer_id)
      .then(r => setPolicies(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPolicies()
    // Pre-fetch policy types so the modal opens instantly
    getPolicyTypes().then(r => setPolicyTypes(r.data))
  }, [user])

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="My Policies" subtitle="All active and expired policies" />

      {/* ── Buy Policy CTA ─────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 text-white py-3.5 text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Buy a New Policy
        </button>
      </div>

      {/* ── Policy list ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : policies.length === 0 ? (
        <div className="card p-12 text-center text-stone-400">No policies found.</div>
      ) : (
        <div className="space-y-3">
          {policies.map((p: any) => {
            const now    = new Date()
            const end    = new Date(p.end_date)
            const active = end >= now
            return (
              <div key={p.policy_id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-stone-800">{p.policy_type?.type_name ?? 'Policy'}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Policy #{p.policy_id}</p>
                  </div>
                  <span className={active ? 'badge-green' : 'badge-gray'}>
                    {active ? 'Active' : 'Expired'}
                  </span>
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
                  <p className="text-xs text-stone-400 mt-3 pt-3 border-t border-stone-100 leading-relaxed">
                    {p.policy_type.rules}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Buy Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <BuyPolicyModal
          types={policyTypes}
          onClose={() => setShowModal(false)}
          onSuccess={loadPolicies}
        />
      )}

      <BottomNav items={NAV} />
    </div>
  )
}