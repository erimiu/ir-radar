'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Item, Source, CategoryTab } from '@/types'
import { CATEGORY_LABELS, CATEGORY_LIST } from '@/types'
import ImportanceBadge from '@/components/ImportanceBadge'

interface Props {
  items: Item[]
  linkSources: Source[]
}

export default function FeedClient({ items, linkSources }: Props) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score')
  const [localItems, setLocalItems] = useState(items)

  const filteredItems = localItems
    .filter(item => activeTab === 'all' || item.sources?.category === activeTab)
    .sort((a, b) =>
      sortBy === 'score'
        ? b.rule_score - a.rule_score
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  const filteredSources = linkSources.filter(
    s => activeTab === 'all' || s.category === activeTab
  )

  const markRead = async (id: string) => {
    setLocalItems(prev => prev.map(i => (i.id === id ? { ...i, is_read: true } : i)))
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-white z-10 border-b border-gray-100">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[#1A1A1A]">IR Radar</h1>
            <button
              onClick={() => setSortBy(s => (s === 'score' ? 'date' : 'score'))}
              className="text-xs text-[#2D6A4F] border border-[#2D6A4F] rounded-full px-3 py-1.5 min-h-[36px]"
            >
              {sortBy === 'score' ? '重要度順' : '新着順'}
            </button>
          </div>
          {/* カテゴリタブ */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_LIST.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-full min-h-[36px] flex items-center transition-colors ${
                  activeTab === cat
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-3 space-y-3">
        {/* 記事カード（RSS収集後に表示される） */}
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-opacity ${
              item.is_read ? 'opacity-40' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs text-gray-400">{item.sources?.name}</span>
                  <ImportanceBadge score={item.rule_score} />
                  {item.is_saved && (
                    <span className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full">
                      Notion保存済
                    </span>
                  )}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markRead(item.id)}
                  className="block text-sm font-medium text-[#1A1A1A] leading-snug hover:text-[#2D6A4F]"
                >
                  {item.title}
                </a>
                {item.published_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.published_at).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
              <Link
                href={`/memo/${item.id}`}
                className="flex-shrink-0 text-xs text-[#2D6A4F] border border-[#2D6A4F] rounded-xl px-3 min-w-[52px] h-[44px] flex items-center justify-center"
              >
                メモ
              </Link>
            </div>
          </div>
        ))}

        {/* LINKソース（公式サイトポータル） */}
        {filteredSources.length > 0 && (
          <>
            {filteredItems.length > 0 && (
              <p className="text-xs text-gray-400 pt-2 font-medium">公式サイト</p>
            )}
            {filteredSources.map(source => (
              <div
                key={source.id}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          source.tier === 1
                            ? 'bg-[#E63946]/10 text-[#E63946]'
                            : source.tier === 2
                            ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        Tier {source.tier}
                      </span>
                      <span className="text-xs text-gray-400">
                        {CATEGORY_LABELS[source.category]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{source.name}</p>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs text-white bg-[#2D6A4F] rounded-xl px-4 h-[44px] flex items-center"
                  >
                    開く
                  </a>
                </div>
              </div>
            ))}
          </>
        )}

        {filteredItems.length === 0 && filteredSources.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">まだ記事がありません</p>
            <p className="text-xs mt-1">「＋」から記事を手動追加できます</p>
          </div>
        )}
      </div>

      {/* 記事追加 FAB */}
      <Link
        href="/add"
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#2D6A4F] text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-40"
        aria-label="記事を追加"
      >
        ＋
      </Link>
    </div>
  )
}
