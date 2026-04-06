'use client'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export default function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`nav-item ${active ? 'active' : ''}`}
          >
            {item.icon}
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
