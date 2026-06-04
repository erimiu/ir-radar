'use client'
import Link from 'next/link'

interface MemoWithItem {
  id: string
  item_id: string
  note: string | null
  category_tags: string[] | null
  importance: string | null
  synced_to_notion: boolean
  notion_page_url: string | null
  created_at: string
  items: {
    title: string
    url: string
    sources: { name: string; category: string } | null
  } | null
}

const IMPORTANCE_STYLE: Record<string, string> = {
  高: 'bg-[#E63946] text-white',
  中: 'bg-orange-400 text-white',
  低: 'bg-gray-300 text-gray-700',
}

interface Props {
  memos: MemoWithItem[]
}

export default function MemosClient({ memos }: Props) {
  if (memos.length === 0) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold mb-6">メモ</h1>
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">Notionに保存したメモがありません</p>
          <p className="text-xs mt-1">フィードから記事を追加してNotionに保存すると表示されます</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-4">メモ</h1>
      <p className="text-xs text-gray-400 mb-4">Notion保存済み · {memos.length}件</p>

      <div className="space-y-3">
        {memos.map(memo => (
          <div key={memo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            {/* ソース名 */}
            {memo.items?.sources?.name && (
              <p className="text-xs text-gray-400 mb-1">{memo.items.sources.name}</p>
            )}

            {/* 記事タイトル */}
            <a
              href={memo.items?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium text-[#1A1A1A] leading-snug hover:text-[#2D6A4F] mb-2"
            >
              {memo.items?.title}
            </a>

            {/* カテゴリ・重要度 */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {memo.importance && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  IMPORTANCE_STYLE[memo.importance] ?? 'bg-gray-200 text-gray-600'
                }`}>
                  {memo.importance}
                </span>
              )}
              {memo.category_tags?.map(tag => (
                <span key={tag} className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            {/* メモ本文 */}
            {memo.note && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{memo.note}</p>
            )}

            {/* フッター */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">
                {new Date(memo.created_at).toLocaleDateString('ja-JP')}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full">
                  ✓ Notion保存済
                </span>
                {memo.notion_page_url && (
                  <a
                    href={memo.notion_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2D6A4F] underline"
                  >
                    Notionで開く
                  </a>
                )}
                <Link
                  href={`/memo/${memo.item_id}`}
                  className="text-xs text-gray-400 underline"
                >
                  編集
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
