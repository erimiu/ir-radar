'use client'
import type { ConnectionCard } from './page'
import PageHeader from '@/components/PageHeader'

export default function ConnectionsClient({ connections }: { connections: ConnectionCard[] }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="つながり" right={<span className="text-xs text-sub">{connections.length}人</span>} />

      <div className="flex-1 px-4 py-3">
        {connections.length === 0 ? (
          <div className="text-center py-20 text-sub">
            <p className="text-sm">まだ記録がありません</p>
            <p className="text-xs mt-1">ホームの「今日の記録」から追加できます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(c => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-line p-4"
                style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                    style={{ backgroundColor: '#1B3A5B' }}
                  >
                    {c.title.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{c.title}</p>
                    {c.affiliation && (
                      <p className="text-xs text-sub mt-0.5">{c.affiliation}</p>
                    )}
                  </div>
                  <span className="text-xs text-sub flex-shrink-0">{c.recorded_on}</span>
                </div>

                <div className="mt-3 pl-13">
                  <p className="text-xs text-sub mb-0.5">何に詳しい・魅力</p>
                  <p className="text-sm text-primary leading-relaxed">{c.expertise}</p>
                </div>

                {(c.where_met || c.contact || c.memo) && (
                  <div className="mt-3 pt-3 border-t border-line space-y-1.5">
                    {c.where_met && (
                      <p className="text-xs text-sub">出会い：{c.where_met}</p>
                    )}
                    {c.contact && (
                      <p className="text-xs text-sub">連絡先：{c.contact}</p>
                    )}
                    {c.memo && (
                      <p className="text-xs text-[#1A2332] leading-relaxed">{c.memo}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
