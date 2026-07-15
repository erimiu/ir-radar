'use client'
import Link from 'next/link'
import type { CompanyNoteItem } from './page'

export default function CompanyNotesClient({ items }: { items: CompanyNoteItem[] }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-primary">会社情報</h1>
            <span className="text-xs text-sub">{items.length}社</span>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-3">
        {items.length === 0 ? (
          <div className="text-center py-20 text-sub">
            <p className="text-sm">まだ記録がありません</p>
            <p className="text-xs mt-1">ホームの「今日の記録 → 会社」から追加できます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <Link
                key={item.code}
                href={`/company/${item.code}`}
                className="block active:opacity-80 transition-opacity"
              >
                <div
                  className="bg-white rounded-2xl border border-line p-4"
                  style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-primary">{item.name}</p>
                      <p className="text-xs text-sub mt-0.5">
                        {item.code}
                        {item.market && ` · ${item.market}`}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-sub flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {(item.ai_summary || item.my_memo) && (
                    <p className="text-xs text-sub mt-2 line-clamp-2 leading-relaxed">
                      {item.my_memo ?? item.ai_summary}
                    </p>
                  )}
                  {item.updated_at && (
                    <p className="text-xs text-sub/60 mt-2">
                      更新：{item.updated_at.slice(0, 10)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
