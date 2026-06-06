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
  company_name: string | null
  securities_code: string | null
  items: {
    title: string
    url: string
    sources: { name: string; category: string } | null
  } | null
}

const IMPORTANCE_STYLE: Record<string, string> = {
  高: 'bg-danger text-white',
  中: 'bg-orange-400 text-white',
  低: 'bg-line text-sub',
}

interface Props {
  memos: MemoWithItem[]
}

export default function MemosClient({ memos }: Props) {
  if (memos.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="h-0.5 bg-primary -mx-4 -mt-6 mb-6" />
        <h1 className="text-xl font-bold tracking-tight text-primary mb-6">ストック</h1>
        <div className="text-center py-20 text-sub">
          <p className="text-sm">ストックがまだありません</p>
          <p className="text-xs mt-1">開示画面から「ストック」ボタンで保存すると表示されます</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="h-0.5 bg-primary -mx-4 -mt-6 mb-6" />
      <h1 className="text-xl font-bold tracking-tight text-primary mb-1">ストック</h1>
      <p className="text-xs text-sub mb-4">Notion保存済み · {memos.length}件</p>

      <div className="space-y-3">
        {memos.map(memo => {
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
                  <span key={tag} className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
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
    </div>
  )
}
