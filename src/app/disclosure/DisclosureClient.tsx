'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { TdnetItem, ThemedItem } from './page'

const PREDEFINED_CATEGORIES = [
  '決算説明資料', '株主優待', '配当', '自社株買い',
  'プライム移行', '株式分割', '有事対応', 'IR活動', 'その他',
]
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
  initialReadUrls: string[]
  initialSavedLaterUrls: string[]
  initialTab?: 'briefing' | 'later'
}

function formatTime(pubdate: string) {
  try {
    const d = new Date(pubdate.replace(' ', 'T'))
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return pubdate.slice(11, 16)
  }
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

export default function DisclosureClient({
  initialReadUrls,
  initialSavedLaterUrls,
  initialTab = 'briefing',
}: Props) {
  // ブリーフィング state
  const [benchmark, setBenchmark] = useState<TdnetItem[]>([])
  const [themed, setThemed] = useState<ThemedItem[]>([])
  const [briefingLoading, setBriefingLoading] = useState(true)
  const [briefingFailed, setBriefingFailed] = useState(false)

  // あとで読む state（タブ切替時にレイジーロード）
  const [allDisclosures, setAllDisclosures] = useState<TdnetItem[]>([])
  const [laterLoading, setLaterLoading] = useState(false)
  const [laterFailed, setLaterFailed] = useState(false)
  const [laterLoaded, setLaterLoaded] = useState(false)

  // 共通 state
  const [openStockId, setOpenStockId] = useState<string | null>(null)
  const [stockForm, setStockForm] = useState<StockFormState>(defaultForm())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [readUrls, setReadUrls] = useState<Set<string>>(new Set(initialReadUrls))
  const [savedLaterUrls, setSavedLaterUrls] = useState<Set<string>>(new Set(initialSavedLaterUrls))
  const [savedLaterErrorIds, setSavedLaterErrorIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'briefing' | 'later'>(initialTab)

  const loadBriefing = useCallback(async () => {
    setBriefingLoading(true)
    setBriefingFailed(false)
    try {
      const res = await fetch('/api/briefing')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setBenchmark(data.benchmark ?? [])
      setThemed(data.themed ?? [])
    } catch {
      setBriefingFailed(true)
    } finally {
      setBriefingLoading(false)
    }
  }, [])

  useEffect(() => { loadBriefing() }, [loadBriefing])

  const loadAllDisclosures = async () => {
    setLaterLoading(true)
    setLaterFailed(false)
    try {
      const res = await fetch('/api/items/saved-later')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { id: string; url: string; title: string; published_at: string }[] = await res.json()
      const items: TdnetItem[] = data.map(d => ({
        id: d.id,
        pubdate: d.published_at ?? '',
        company_code: '',
        company_name: '',
        title: d.title ?? '',
        document_url: d.url,
        markets_string: '',
      }))
      setAllDisclosures(items)
      setLaterLoaded(true)
    } catch {
      setLaterFailed(true)
    } finally {
      setLaterLoading(false)
    }
  }

  const handleTabSwitch = (tab: 'briefing' | 'later') => {
    setActiveTab(tab)
    if (tab === 'later' && !laterLoaded) loadAllDisclosures()
  }

  // ブリーフィング完了チェック（全件が既読またはあとで読む済み）
  const isComplete = useMemo(() => {
    const allItems = [...benchmark, ...themed]
    if (allItems.length === 0) return false
    const seen = new Set<string>()
    for (const item of allItems) seen.add(item.document_url)
    return Array.from(seen).every(
      url => readUrls.has(url) || savedLaterUrls.has(url)
    )
  }, [benchmark, themed, readUrls, savedLaterUrls])

  // あとで読む件数・リスト（DBから直接取得済みなのでフィルタ不要）
  const laterCount = savedLaterUrls.size
  const laterDateGroups = useMemo(() => groupByDate(allDisclosures), [allDisclosures])

  const toggleRead = async (item: TdnetItem) => {
    const wasRead = readUrls.has(item.document_url)
    const newIsRead = !wasRead
    setReadUrls(prev => {
      const next = new Set(prev)
      newIsRead ? next.add(item.document_url) : next.delete(item.document_url)
      return next
    })
    try {
      const res = await fetch('/api/tdnet-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.document_url,
          title: item.title,
          pubdate: item.pubdate,
          is_read: newIsRead,
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
    } catch {
      setReadUrls(prev => {
        const next = new Set(prev)
        wasRead ? next.add(item.document_url) : next.delete(item.document_url)
        return next
      })
    }
  }

  const toggleSavedLater = async (item: TdnetItem) => {
    const wasSaved = savedLaterUrls.has(item.document_url)
    const newSavedLater = !wasSaved
    setSavedLaterUrls(prev => {
      const next = new Set(prev)
      newSavedLater ? next.add(item.document_url) : next.delete(item.document_url)
      return next
    })
    try {
      const res = await fetch('/api/tdnet-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.document_url,
          title: item.title,
          pubdate: item.pubdate,
          saved_for_later: newSavedLater,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      // 解除時はリストからリアルタイムで除去
      if (!newSavedLater) {
        setAllDisclosures(prev => prev.filter(d => d.document_url !== item.document_url))
      }
    } catch (e) {
      setSavedLaterUrls(prev => {
        const next = new Set(prev)
        wasSaved ? next.add(item.document_url) : next.delete(item.document_url)
        return next
      })
      setSavedLaterErrorIds(prev => new Set(prev).add(item.id))
      setTimeout(() => {
        setSavedLaterErrorIds(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }, 3000)
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('saved_for_later') || msg.includes('column')) {
        alert(`「あとで読む」の保存に失敗しました。\n\nSupabaseで以下のSQLを実行してください：\nALTER TABLE items ADD COLUMN saved_for_later BOOLEAN NOT NULL DEFAULT FALSE;`)
      }
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

  const renderCard = (item: TdnetItem, opts: { categoryTags?: string[]; isBenchmarkStyle?: boolean } = {}) => {
    const { categoryTags, isBenchmarkStyle = false } = opts
    const code4 = item.company_code.slice(0, 4)
    const isRead = readUrls.has(item.document_url)
    const isSavedLater = savedLaterUrls.has(item.document_url)
    const isStocked = savedIds.has(item.id)
    const hasSavedLaterError = savedLaterErrorIds.has(item.id)

    return (
      <div
        key={item.id}
        className={`bg-surface rounded-2xl p-4 transition-opacity ${
          isBenchmarkStyle ? 'border-2 border-accent' : 'border border-line'
        } ${isRead && !isStocked && !isSavedLater ? 'opacity-50' : ''}`}
        style={{
          boxShadow: isBenchmarkStyle
            ? '0 1px 6px rgba(46,111,183,0.18)'
            : '0 1px 3px rgba(27,58,91,0.06)',
        }}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleRead(item)}
            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isRead ? 'bg-accent border-accent' : 'border-line bg-white'
            }`}
            aria-label={isRead ? '未処理に戻す' : '既読にする'}
          >
            {isRead && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link
                href={`/company/${code4}`}
                className="text-xs font-semibold text-accent underline underline-offset-2"
                onClick={e => e.stopPropagation()}
              >
                {item.company_name}
              </Link>
              <span className="text-xs text-sub">{code4}</span>
              {item.markets_string && (
                <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                  {item.markets_string}
                </span>
              )}
              {isStocked && (
                <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">ストック済</span>
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
            {categoryTags && categoryTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {categoryTags.map(cat => (
                  <span
                    key={cat}
                    className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
            <button
              onClick={() => toggleSavedLater(item)}
              className={`text-xs border rounded-xl px-2.5 h-7 flex items-center gap-1 transition-colors ${
                hasSavedLaterError
                  ? 'bg-danger/10 border-danger text-danger'
                  : isSavedLater
                  ? 'bg-accent border-accent text-white'
                  : 'border-line text-sub hover:border-accent hover:text-accent bg-white'
              }`}
              aria-label={isSavedLater ? 'あとで読むを解除' : 'あとで読む'}
            >
              {hasSavedLaterError ? (
                <span className="text-[10px]">保存失敗</span>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
                    fill={isSavedLater ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <span>あとで</span>
                </>
              )}
            </button>
            <button
              onClick={() => openStock(item.id)}
              className="text-xs text-accent border border-accent rounded-xl px-2.5 h-7 flex items-center justify-center hover:bg-soft transition-colors"
            >
              ストック
            </button>
          </div>
        </div>

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
                          stockForm.categories.includes(cat) ? 'bg-accent text-white' : 'bg-line text-sub'
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
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center justify-center w-8 h-8 -ml-1 flex-shrink-0 text-sub hover:text-primary transition-colors active:opacity-70" aria-label="ホームへ戻る">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold tracking-tight text-primary">今日のブリーフィング</h1>
            </div>
            <Link href="/settings" className="text-sub hover:text-primary" aria-label="設定">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleTabSwitch('briefing')}
              className={`flex-1 text-xs py-1.5 rounded-full transition-colors ${
                activeTab === 'briefing' ? 'bg-primary text-white' : 'bg-line text-sub'
              }`}
            >
              ブリーフィング
            </button>
            <button
              onClick={() => handleTabSwitch('later')}
              className={`flex-1 text-xs py-1.5 rounded-full transition-colors ${
                activeTab === 'later' ? 'bg-primary text-white' : 'bg-line text-sub'
              }`}
            >
              あとで読む{laterCount > 0 ? ` ${laterCount}` : ''}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-3">
        {activeTab === 'briefing' ? (
          briefingLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-sub">ブリーフィングを取得中...</p>
            </div>
          ) : briefingFailed ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <p className="text-sm text-sub">ブリーフィングの取得に失敗しました</p>
              <button
                onClick={loadBriefing}
                className="text-sm text-white bg-accent px-4 py-2 rounded-xl hover:bg-primary transition-colors"
              >
                再試行
              </button>
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
            <div className="space-y-7">
              {/* Section A: ベンチマーク企業の開示 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-5 rounded-full bg-accent flex-shrink-0" />
                  <h2 className="text-sm font-semibold text-primary">ベンチマーク企業の開示</h2>
                  <span className="text-xs text-sub ml-auto">直近5日 {benchmark.length}件</span>
                </div>
                {benchmark.length === 0 ? (
                  <p className="text-sm text-sub text-center py-4 bg-white rounded-2xl border border-line">
                    今日はベンチマーク企業の開示はありません
                  </p>
                ) : (
                  <div className="space-y-2">
                    {benchmark.map(item => renderCard(item, { isBenchmarkStyle: true }))}
                  </div>
                )}
              </div>

              {/* Section B: テーマ合致の開示 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-5 rounded-full bg-amber-400 flex-shrink-0" />
                  <h2 className="text-sm font-semibold text-primary">テーマ合致の開示</h2>
                  <span className="text-xs text-sub ml-auto">直近2日 {themed.length}件</span>
                </div>
                {themed.length === 0 ? (
                  <p className="text-sm text-sub text-center py-4 bg-white rounded-2xl border border-line">
                    今日・昨日はテーマに合致する開示がありません
                  </p>
                ) : (
                  <div className="space-y-2">
                    {themed.map(item => renderCard(item, { categoryTags: item.categories }))}
                  </div>
                )}
              </div>

              {/* 完了インジケーター */}
              {isComplete && (
                <div className="text-center py-6 border-t border-line">
                  <p className="text-sm font-medium text-accent">今日のブリーフィング完了</p>
                  <p className="text-xs text-sub mt-1">お疲れさまでした</p>
                </div>
              )}
            </div>
          )
        ) : (
          // あとで読む タブ
          laterLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-sub">取得中...</p>
            </div>
          ) : laterFailed ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <p className="text-sm text-sub">取得に失敗しました</p>
              <button
                onClick={() => { setLaterLoaded(false); loadAllDisclosures() }}
                className="text-sm text-white bg-accent px-4 py-2 rounded-xl hover:bg-primary transition-colors"
              >
                再試行
              </button>
            </div>
          ) : laterDateGroups.length === 0 ? (
            <div className="text-center py-20 text-sub">
              <p className="text-sm">あとで読む開示がありません</p>
            </div>
          ) : (
            <div className="space-y-5">
              {laterDateGroups.map(({ date, items }) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-sub mb-2 pb-1 border-b border-line">
                    {getDateLabel(date)}
                    <span className="font-normal ml-2">{items.length}件</span>
                  </p>
                  <div className="space-y-2">
                    {items.map(item => renderCard(item))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
