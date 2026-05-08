export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin ${className}`} />
  )
}
