'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-100 flex justify-around items-center h-16 z-50">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 text-xs min-w-[64px] min-h-[44px] justify-center ${
          pathname === '/' ? 'text-[#2D6A4F]' : 'text-gray-400'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6" />
        </svg>
        フィード
      </Link>
      <Link
        href="/sources"
        className={`flex flex-col items-center gap-1 text-xs min-w-[64px] min-h-[44px] justify-center ${
          pathname === '/sources' ? 'text-[#2D6A4F]' : 'text-gray-400'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        ソース
      </Link>
    </nav>
  )
}
