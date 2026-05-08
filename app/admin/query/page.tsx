'use client'
import { useState } from 'react'
import BottomNav from '@/backend/components/BottomNav'
import PageHeader from '@/backend/components/PageHeader'
import Spinner from '@/backend/components/Spinner'
import { runQuery } from '@/lib/api'
import { ADMIN_NAV } from '../page'

const EXAMPLE_QUERIES = [
  { label: 'All customers',         sql: 'SELECT * FROM Customer' },
  { label: 'Customer policy view',  sql: 'SELECT * FROM v_customer_policy_summary' },
  { label: 'Pending claims',        sql: "SELECT * FROM Claim WHERE status = 'pending'" },
  { label: 'Revenue summary',       sql: "SELECT SUM(amount) AS total_revenue, COUNT(*) AS transactions FROM Transaction_ WHERE status='success'" },
  { label: 'Overdue premiums',      sql: "SELECT p.*, c.name FROM Premium p JOIN PolicyHolder ph ON p.policy_id = ph.policy_id JOIN Customer c ON ph.customer_id = c.customer_id WHERE p.status = 'overdue'" },
  { label: 'Claims per policy',     sql: 'SELECT policy_id, COUNT(*) AS total_claims, SUM(claim_amount) AS total_amount FROM Claim GROUP BY policy_id' },
  { label: 'Total claimed fn',      sql: 'SELECT customer_id, name, total_claimed(customer_id) AS claimed FROM Customer' },
  { label: 'Show tables',           sql: 'SHOW TABLES' },
  { label: 'Describe Premium',      sql: 'DESCRIBE Premium' },
]

export default function AdminQuery() {
  const [sql,     setSql]     = useState('')
  const [result,  setResult]  = useState<{ columns: string[]; rows: string[][]; row_count: number } | null>(null)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [time,    setTime]    = useState<number | null>(null)

  const handleRun = async () => {
    if (!sql.trim()) return
    setLoading(true); setError(''); setResult(null)
    const t0 = performance.now()
    try {
      const res = await runQuery(sql)
      setResult(res.data)
      setTime(Math.round(performance.now() - t0))
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Query failed.')
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleRun()
  }

  return (
    <div className="page-wrap fade-up">
      <PageHeader title="SQL Query Console" subtitle="Run custom SELECT queries on the database" />

      {/* Query input */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">SQL Statement</label>
          <span className="text-xs text-stone-400">Ctrl+Enter to run</span>
        </div>
        <textarea
          className="w-full bg-stone-900 text-stone-100 font-mono text-sm rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-stone-600 min-h-[140px] placeholder-stone-600"
          placeholder={"SELECT * FROM Customer;\n\n-- Only SELECT, SHOW, DESCRIBE allowed"}
          value={sql}
          onChange={e => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1 flex-wrap">
            {EXAMPLE_QUERIES.slice(0,4).map(q => (
              <button
                key={q.label}
                onClick={() => setSql(q.sql)}
                className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-2.5 py-1 rounded-lg transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
          <button onClick={handleRun} disabled={loading || !sql.trim()} className="btn-primary flex items-center gap-2">
            {loading ? <Spinner className="w-3 h-3" /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
            {loading ? 'Running…' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* More example queries */}
      <div className="mb-5">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">More examples</p>
        <div className="flex gap-1.5 flex-wrap">
          {EXAMPLE_QUERIES.slice(4).map(q => (
            <button
              key={q.label}
              onClick={() => setSql(q.sql)}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 mb-4 border-clay-200 bg-clay-50">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a6535" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-sm text-clay-700 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card overflow-hidden fade-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700 bg-sage-100 px-2.5 py-1 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Query OK
              </span>
              <span className="text-xs text-stone-500">{result.row_count} row{result.row_count !== 1 ? 's' : ''}</span>
              {time !== null && <span className="text-xs text-stone-400">{time}ms</span>}
            </div>
            <button
              onClick={() => {
                const csv = [result.columns.join(','), ...result.rows.map(r => r.join(','))].join('\n')
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],'text/csv' as any))
                a.download = 'query_result.csv'; a.click()
              }}
              className="btn-ghost text-xs"
            >
              Export CSV
            </button>
          </div>

          {result.rows.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-sm">Query returned no rows.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>{result.columns.map(col => <th key={col}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="max-w-[200px] truncate font-mono text-xs text-stone-600" title={cell}>
                          {cell === 'None' || cell === '' ? <span className="text-stone-300 italic">null</span> : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <BottomNav items={ADMIN_NAV} />
    </div>
  )
}
