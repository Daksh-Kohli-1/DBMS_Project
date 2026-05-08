'use client'

import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export default function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center pointer-events-none">
      <nav
        className="
          pointer-events-auto
          flex items-center justify-between
          gap-4
          w-[92%] max-w-md
          px-3 py-3
          rounded-full
          bg-white/90
          backdrop-blur-md
          border border-gray-200
          shadow-2xl
        "
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + '/')

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`
                flex-1
                flex flex-col items-center justify-center
                gap-1
                py-2
                rounded-2xl
                transition-all duration-200
                ${
                  active
                    ? 'bg-blue-100 text-blue-600 scale-105'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-black'
                }
              `}
            >
              <div className="text-xl">
                {item.icon}
              </div>

              <span className="text-[11px] font-medium">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}