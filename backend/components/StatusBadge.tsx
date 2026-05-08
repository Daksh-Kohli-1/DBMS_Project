export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:     'badge-green',
    approved: 'badge-green',
    success:  'badge-green',
    pending:  'badge-yellow',
    overdue:  'badge-red',
    rejected: 'badge-red',
    failed:   'badge-red',
  }
  return <span className={map[status] ?? 'badge-gray'}>{status}</span>
}
