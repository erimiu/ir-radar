'use client'
import { useState } from 'react'
import type { TdnetItem } from './page'

const PREDEFINED_CATEGORIES = ['IRトレンド', '開示', '規制', '市場', '投資', '海外']
const IMPORTANCE_OPTIONS = ['高', '中', '低']

interface StockFormState {
  note: string
  categories: string[]
  importance: string
  saving: boolean
  savedUrl: string | null
}

const defaultForm = (): StockFormState => ({
  note: '',
  categories: [],
  importance: '中',
  saving: false,
  savedUrl: null,
})

interface Props {
  initialDisclosures: TdnetItem[] | null
}

function formatPubdate(pubdate: string) {
  try {
    const d = new Date(pubdate.replace(' ', 'T'))
    return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return pubdate.slice(0, 16)
  }
}

export default function DisclosureClient({ initialDisclosures }: Props) {
  const [disclosures, setDisclosures] = useState<TdnetItem[]>(initialDisclosures ?? [])
  const [fetchFailed] = useState(initialDisclosures === null)
  const [openStockId, setOpenStockId] = useState<string | null>(null)
  const [stockForm, setStockForm] = useState<StockFormState>(defaultForm())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loadingMore, setLoadingMore] = useState(false)
  const [limit, setLimit] = useState(30)

  const openStock = (id: string) => {
    if (openStockId === id) {
      setOpenStockId(null)
    } else {
      setOpenStockId(id)
      setStockForm(defaultForm())
    }
  }

  const toggleCategory = (cat: string) => {
    setStockForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
  }

  const saveStock = async (item: TdnetItem) => {
    setStockForm(f => ({ ...f, saving: true }))
    try {
      const res = await fetch('/api/tdnet-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          document_url: item.document_url,
          company_name: item.company_name,
          securities_code: item.company_code,
          pubdate: item.pubdate,
          note: stockForm.note,
          category_tags: stockForm.categories,
          importance: stockForm.importance,
        }),
      })
      const data = await res.json()
      if (data.notionUrl) {
        setStockForm(f => ({ ...f, savedUrl: data.notionUrl, saving: false }))
        setSavedIds(prev => new Set(prev).add(item.id))
      } else {
        alert(data.error ?? '保存に失敗しました')
        setStockForm(f => ({ ...f, saving: false }))
      }
    } catch {
      alert('保存に失敗しました')
      setStockForm(f => ({ ...f, saving: false }))
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    const newLimit = limit + 30
    try {
      const res = await fetch(`/api/tdnet?limit=${newLimit}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const items: TdnetItem[] = data.items.map(
        (i: { Tdnet: { id: string; pubdate: string; company_code: string; company_name: string; title: string; document_url: string; markets_string: string } }) => ({
          id: i.Tdnet.id,
          pubdate: i.Tdnet.pubdate,
          company_code: i.Tdnet.company_code,
          company_name: i.Tdnet.company_name,
          title: i.Tdnet.title,
          document_url: i.Tdnet.document_url,
          markets_string: i.Tdnet.markets_string,
        })
      )
      setDisclosures(items)
      setLimit(newLimit)
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-primary">IR Radar</h1>
            {!fetchFailed && (
              <span className="text-xs text-sub">{disclosures.length}件</span>
            )}
          </div>
          <p className="text-xs text-sub mt-0.5">TDnet 適時開示 · 最新順</p>
        </div>
      </header>

      <div className="flex-1 px-4 py-3 space-y-3">
        {fetchFailed ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <p className="text-sm text-sub">適時開示を取得できませんでした</p>
            <a
              href="https://www.release.tdnet.info/inbs/I_main_00.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent underline"
            >
              TDnet公式を開く
            </a>
          </div>
        ) : (
          <>
            {disclosures.map(item => (
              <div
                key={item.id}
                className={`bg-surface rounded-2xl border border-line p-4 transition-opacity ${
                  savedIds.has(item.id) ? 'opacity-60' : ''
                }`}
                style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
              >
                {/* カード本体 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-accent">{item.company_name}</span>
                      <span className="text-xs text-sub">{item.company_code}</span>
                      {item.markets_string && (
                        <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                          {item.markets_string}
                        </span>
                      )}
                      {savedIds.has(item.id) && (
                        <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                          ストック済
                        </span>
                      )}
                    </div>
                    <a
                      href={item.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-medium text-[#1A2332] leading-snug hover:text-accent"
                    >
                      {item.title}
                    </a>
                    <p className="text-xs text-sub mt-1">{formatPubdate(item.pubdate)}</p>
                  </div>
                  <button
                    onClick={() => openStock(item.id)}
                    className="flex-shrink-0 text-xs text-accent border border-accent rounded-xl px-3 min-w-[72px] h-[40px] flex items-center justify-center hover:bg-soft transition-colors"
                  >
                    ストック
                  </button>
                </div>

                {/* インラインストックフォーム */}
                {openStockId === item.id && (
                  <div className="mt-4 pt-4 border-t border-line space-y-4">
                    {stockForm.savedUrl ? (
                      <div className="bg-soft rounded-xl p-3 text-center">
                        <p className="text-sm text-accent font-medium">Notionに保存しました</p>
                        <a
                          href={stockForm.savedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent underline mt-1 block"
                        >
                          Notionで開く
                        </a>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-sub mb-1.5">
                            メモ・自社への示唆
                          </label>
                          <textarea
                            value={stockForm.note}
                            onChange={e => setStockForm(f => ({ ...f, note: e.target.value }))}
                            rows={3}
                            className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none bg-white"
                            placeholder="気づいたこと・要点・自社への示唆など..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-sub mb-1.5">カテゴリ</label>
                          <div className="flex flex-wrap gap-2">
                            {PREDEFINED_CATEGORIES.map(cat => (
                              <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                                  stockForm.categories.includes(cat)
                                    ? 'bg-accent text-white'
                                    : 'bg-line text-sub'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-sub mb-1.5">重要度</label>
                          <div className="flex gap-2">
                            {IMPORTANCE_OPTIONS.map(opt => (
                              <button
                                key={opt}
                                onClick={() => setStockForm(f => ({ ...f, importance: opt }))}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                                  stockForm.importance === opt
                                    ? opt === '高'
                                      ? 'bg-danger text-white'
                                      : opt === '中'
                                      ? 'bg-orange-400 text-white'
                                      : 'bg-sub text-white'
                                    : 'bg-line text-sub'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => saveStock(item)}
                          disabled={stockForm.saving}
                          className="w-full bg-accent text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40 hover:bg-primary transition-colors"
                        >
                          {stockForm.saving ? 'Notionに保存中...' : 'Notionに保存'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-4 text-sm text-accent font-medium disabled:opacity-40"
            >
              {loadingMore ? '読み込み中...' : 'もっと見る'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
