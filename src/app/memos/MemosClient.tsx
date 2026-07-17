'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'

interface MemoWithItem {
  id: string
  item_id: string
  note: string | null
  category_tags: string[] | null
  importance: string | null
  synced_to_notion: boolean
  notion_page_url: string | null
  created_at: string
  company_name: string | null
  securities_code: string | null
  items: {
    title: string
    url: string
    sources: { name: string; category: string } | null
  } | null
}

const CATEGORY_FILTERS = [
  '決算説明資料', '株主優待', '配当', '自社株買い',
  'プライム移行', '株式分割', '有事対応', 'IR活動', 'AI活用', 'その他',
]

const IMPORTANCE_STYLE: Record<string, string> = {
  高: 'bg-danger text-white',
  中: 'bg-orange-400 text-white',
  低: 'bg-line text-sub',
}

interface Props {
  memos: MemoWithItem[]
}

export default function MemosClient({ memos }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredMemos = useMemo(() => {
    if (!selectedCategory) return memos
    return memos.filter(m => m.category_tags?.includes(selectedCategory))
  }, [memos, selectedCategory])

  // 各カテゴリの件数（フィルター選択に関係なく全体から算出）
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORY_FILTERS) {
      counts[cat] = memos.filter(m => m.category_tags?.includes(cat)).length
    }
    return counts
  }, [memos])

  if (memos.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title="ストック" />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-sub">
          <p className="text-sm">ストックがまだありません</p>
          <p className="text-xs mt-1">開示画面から「ストック」ボタンで保存すると表示されます</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="ストック" right={<span className="text-xs text-sub">{memos.length}件</span>}>
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-1.5 pb-0.5 w-max">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-colors ${
                selectedCategory === null ? 'bg-primary text-white' : 'bg-line text-sub'
              }`}
            >
              すべて {memos.length}
            </button>
            {CATEGORY_FILTERS.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-colors ${
                  selectedCategory === cat ? 'bg-primary text-white' : 'bg-line text-sub'
                }`}
              >
                {cat}
                {categoryCounts[cat] > 0 && (
                  <span className={`ml-1 ${selectedCategory === cat ? 'opacity-80' : 'text-accent'}`}>
                    {categoryCounts[cat]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="flex-1 px-4 py-3">
        {filteredMemos.length === 0 ? (
          <div className="text-center py-20 text-sub">
            <p className="text-sm">「{selectedCategory}」のストックはまだありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemos.map(memo => {
              const sourceName =
                memo.items?.sources?.name ??
                (memo.company_name
                  ? `${memo.company_name}${memo.securities_code ? `（${memo.securities_code}）` : ''}`
                  : null)

              return (
                <div
                  key={memo.id}
                  className="bg-surface rounded-2xl border border-line p-4"
                  style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
                >
                  {sourceName && (
                    <p className="text-xs text-sub mb-1">{sourceName}</p>
                  )}

                  <a
                    href={memo.items?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-[#1A2332] leading-snug hover:text-accent mb-2"
                  >
                    {memo.items?.title}
                  </a>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {memo.importance && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        IMPORTANCE_STYLE[memo.importance] ?? 'bg-line text-sub'
                      }`}>
                        {memo.importance}
                      </span>
                    )}
                    {memo.category_tags?.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedCategory(tag === selectedCategory ? null : tag)}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                          tag === selectedCategory
                            ? 'bg-accent text-white'
                            : 'bg-soft text-accent hover:bg-accent/20'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {memo.note && (
                    <p className="text-sm text-[#1A2332] leading-relaxed line-clamp-3">{memo.note}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                    <span className="text-xs text-sub">
                      {new Date(memo.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                        Notion保存済
                      </span>
                      {memo.notion_page_url && (
                        <a
                          href={memo.notion_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent underline"
                        >
                          Notionで開く
                        </a>
                      )}
                      <Link
                        href={`/memo/${memo.item_id}`}
                        className="text-xs text-sub underline"
                      >
                        編集
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
