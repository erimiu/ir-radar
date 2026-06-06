'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/',
    label: '開示',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    href: '/calendar',
    label: 'カレンダー',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    href: '/memos',
    label: 'ストック',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    ),
  },
  {
    href: '/sources',
    label: 'ソース',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-line flex justify-around items-center h-16 z-50">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 text-[10px] min-w-0 flex-1 min-h-[44px] justify-center ${
              active ? 'text-primary' : 'text-sub'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {icon}
            </svg>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
