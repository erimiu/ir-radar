'use client'
import { useState, useMemo } from 'react'
import type { CareerCard } from './page'
import PageHeader from '@/components/PageHeader'

type Filter = 'all' | 'experience' | 'goal'

export default function CareerClient({ cards }: { cards: CareerCard[] }) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return cards
    return cards.filter(c => c.type === filter)
  }, [cards, filter])

  const experienceCount = cards.filter(c => c.type === 'experience').length
  const goalCount = cards.filter(c => c.type === 'goal').length
  const achievedCount = cards.filter(c => c.type === 'goal' && c.achieved).length

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="マイキャリア" right={<span className="text-xs text-sub">{cards.length}件</span>}>
        <div className="flex gap-1.5">
          {([
            { key: 'all', label: `すべて ${cards.length}` },
            { key: 'experience', label: `学び・経験 ${experienceCount}` },
            { key: 'goal', label: `目標 ${goalCount}` },
          ] as { key: Filter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filter === f.key ? 'bg-primary text-white' : 'bg-line text-sub'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {goalCount > 0 && (
          <p className="text-xs text-sub mt-1.5">
            目標達成：{achievedCount}/{goalCount}件
          </p>
        )}
      </PageHeader>

      <div className="flex-1 px-4 py-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-sub">
            <p className="text-sm">まだ記録がありません</p>
            <p className="text-xs mt-1">ホームの「今日の記録」から追加できます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(card => (
              <div
                key={card.id}
                className={`bg-white rounded-2xl border p-4 ${
                  card.type === 'goal' && card.achieved ? 'border-accent/40' : 'border-line'
                }`}
                style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                      card.type === 'experience'
                        ? 'bg-soft text-accent'
                        : card.achieved
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'bg-line text-sub'
                    }`}
                  >
                    {card.type === 'experience' ? '学び' : card.achieved ? '達成✓' : '目標'}
                  </span>
                  <p className="text-sm font-medium text-primary leading-snug flex-1">{card.title}</p>
                </div>
                {card.detail && (
                  <p className="text-sm text-[#1A2332] leading-relaxed mt-2 ml-12">{card.detail}</p>
                )}
                <p className="text-xs text-sub mt-3 text-right">{card.recorded_on}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
