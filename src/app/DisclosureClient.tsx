'use client'
import { useState, useMemo } from 'react'
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
  initialReadUrls: string[]
}

function getDateLabel(dateStr: string): string {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (dateStr === todayStr) return '今日'
  if (dateStr === yesterdayStr) return '昨日'
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}

function groupByDate(items: TdnetItem[]): { date: string; items: TdnetItem[] }[] {
  const map = new Map<string, TdnetItem[]>()
  for (const item of items) {
    const date = item.pubdate.slice(0, 10)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(item)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

function formatTime(pubdate: string) {
  try {
    const d = new Date(pubdate.replace(' ', 'T'))
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return pubdate.slice(11, 16)
  }
}

export default function DisclosureClient({ initialDisclosures, initialReadUrls }: Props) {
  const [disclosures] = useState<TdnetItem[]>(initialDisclosures ?? [])
  const [fetchFailed] = useState(initialDisclosures === null)
  const [openStockId, setOpenStockId] = useState<string | null>(null)
  const [stockForm, setStockForm] = useState<StockFormState>(defaultForm())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [readUrls, setReadUrls] = useState<Set<string>>(new Set(initialReadUrls))
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')

  const unreadCount = useMemo(
    () => disclosures.filter(d => !readUrls.has(d.document_url)).length,
    [disclosures, readUrls]
  )

  const readCount = useMemo(
    () => disclosures.filter(d => readUrls.has(d.document_url)).length,
    [disclosures, readUrls]
  )

  const dateGroups = useMemo(() => {
    const filtered = activeTab === 'unread'
      ? disclosures.filter(d => !readUrls.has(d.document_url))
      : disclosures.filter(d => readUrls.has(d.document_url))
    return groupByDate(filtered)
  }, [disclosures, readUrls, activeTab])

  const toggleRead = async (item: TdnetItem) => {
    const wasRead = readUrls.has(item.document_url)
    const newIsRead = !wasRead

    setReadUrls(prev => {
      const next = new Set(prev)
      newIsRead ? next.add(item.document_url) : next.delete(item.document_url)
      return next
    })

    try {
      await fetch('/api/tdnet-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.document_url,
          title: item.title,
          pubdate: item.pubdate,
          is_read: newIsRead,
        }),
      })
    } catch {
      setReadUrls(prev => {
        const next = new Set(prev)
        wasRead ? next.add(item.document_url) : next.delete(item.document_url)
        return next
      })
    }
  }

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold tracking-tight text-primary">IR Radar</h1>
            <span className="text-xs text-sub">直近5日間</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 text-xs py-1.5 rounded-full transition-colors ${
                activeTab === 'unread' ? 'bg-primary text-white' : 'bg-line text-sub'
              }`}
            >
              未確認 {unreadCount}
            </button>
            <button
              onClick={() => setActiveTab('read')}
              className={`flex-1 text-xs py-1.5 rounded-full transition-colors ${
                activeTab === 'read' ? 'bg-primary text-white' : 'bg-line text-sub'
              }`}
            >
              確認済み {readCount}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-3">
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
          <div className="space-y-5">
            {dateGroups.map(({ date, items }) => (
              <div key={date}>
                <p className="text-xs font-semibold text-sub mb-2 pb-1 border-b border-line">
                  {getDateLabel(date)}
                  <span className="font-normal ml-2">{items.length}件</span>
                </p>
                <div className="space-y-2">
                  {items.map(item => {
                    const isRead = readUrls.has(item.document_url)
                    const isStocked = savedIds.has(item.id)
                    return (
                      <div
                        key={item.id}
                        className={`bg-surface rounded-2xl border border-line p-4 transition-opacity ${
                          isRead && !isStocked ? 'opacity-50' : ''
                        }`}
                        style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
                      >
                        <div className="flex items-start gap-3">
                          {/* 確認済みチェックボックス */}
                          <button
                            onClick={() => toggleRead(item)}
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isRead
                                ? 'bg-accent border-accent'
                                : 'border-line bg-white'
                            }`}
                            aria-label={isRead ? '未確認に戻す' : '確認済みにする'}
                          >
                            {isRead && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          {/* コンテンツ */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <a
                                href={`https://kabutan.jp/stock/?code=${item.company_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-accent underline underline-offset-2"
                                onClick={e => e.stopPropagation()}
                              >
                                {item.company_name}
                              </a>
                              <span className="text-xs text-sub">{item.company_code}</span>
                              {item.markets_string && (
                                <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                                  {item.markets_string}
                                </span>
                              )}
                              {isStocked && (
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
                            <p className="text-xs text-sub mt-1">{formatTime(item.pubdate)}</p>
                          </div>

                          {/* ストックボタン */}
                          <button
                            onClick={() => openStock(item.id)}
                            className="flex-shrink-0 text-xs text-accent border border-accent rounded-xl px-3 min-w-[60px] h-[36px] flex items-center justify-center hover:bg-soft transition-colors"
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
                    )
                  })}
                </div>
              </div>
            ))}

            {dateGroups.length === 0 && (
              <div className="text-center py-20 text-sub">
                <p className="text-sm">
                  {activeTab === 'unread' ? '未確認の開示はありません' : 'まだ確認済みの開示がありません'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
