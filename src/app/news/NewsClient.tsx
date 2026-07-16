'use client'
import { useState, useMemo } from 'react'
import type { NewsItem } from './page'
import PageHeader from '@/components/PageHeader'

const CATEGORIES = [
  '決算説明資料', '株主優待', '配当', '自社株買い',
  'プライム移行', '株式分割', '有事対応', 'IR活動', 'その他',
]

export default function NewsClient({ items }: { items: NewsItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!selectedCategory) return items
    return items.filter(i => i.category === selectedCategory)
  }, [items, selectedCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      counts[cat] = items.filter(i => i.category === cat).length
    }
    return counts
  }, [items])

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="ニュース・事例" right={<span className="text-xs text-sub">{items.length}件</span>}>
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-1.5 pb-0.5 w-max">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-colors ${
                selectedCategory === null ? 'bg-primary text-white' : 'bg-line text-sub'
              }`}
            >
              すべて {items.length}
            </button>
            {CATEGORIES.map(cat => (
              categoryCounts[cat] > 0 && (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-colors ${
                    selectedCategory === cat ? 'bg-primary text-white' : 'bg-line text-sub'
                  }`}
                >
                  {cat}
                  <span className={`ml-1 ${selectedCategory === cat ? 'opacity-80' : 'text-accent'}`}>
                    {categoryCounts[cat]}
                  </span>
                </button>
              )
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 px-4 py-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-sub">
            <p className="text-sm">まだ記録がありません</p>
            <p className="text-xs mt-1">ホームの「今日の記録」から追加できます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-line p-4"
                style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
              >
                {item.company_name && (
                  <p className="text-xs text-sub mb-1">
                    {item.company_name}
                    {item.securities_code && `（${item.securities_code}）`}
                  </p>
                )}
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-primary leading-snug hover:text-accent mb-2"
                  >
                    {item.title}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-primary leading-snug mb-2">{item.title}</p>
                )}
                {item.category && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-soft text-accent mb-2">
                    {item.category}
                  </span>
                )}
                {item.learning && (
                  <p className="text-sm text-[#1A2332] leading-relaxed line-clamp-3">{item.learning}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                  <span className="text-xs text-sub">{item.recorded_on}</span>
                  {item.source === 'memo' && (
                    <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">Notion保存済</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
