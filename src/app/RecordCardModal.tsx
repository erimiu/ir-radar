'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  '決算説明資料', '株主優待', '配当', '自社株買い',
  'プライム移行', '株式分割', '有事対応', 'IR活動', 'AI活用', 'その他',
]

type CardType = 'news_case' | 'connection' | 'company' | 'career'

interface Company {
  code: string
  name: string
  market: string | null
}

interface Prefill {
  title?: string
  company?: { code: string; name: string } | null
  url?: string
  category?: string
}

interface Props {
  onClose: () => void
  onSaved: () => void
  initialType?: CardType
  prefill?: Prefill
}

// 会社名検索コンポーネント
function CompanySearch({
  value,
  onChange,
}: {
  value: { code: string; name: string } | null
  onChange: (c: { code: string; name: string } | null) => void
}) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<Company[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = (q: string) => {
    setQuery(q)
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`)
      const data: Company[] = await res.json()
      setResults(data)
      setOpen(true)
    }, 300)
  }

  const select = (c: Company) => {
    onChange({ code: c.code, name: c.name })
    setQuery(`${c.name}（${c.code}）`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { search(e.target.value); if (!e.target.value) onChange(null) }}
        placeholder="会社名・証券コードで検索"
        className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-line rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => select(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-soft"
            >
              {c.name}
              <span className="text-xs text-sub ml-1">({c.code})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ニュース・事例フォーム
function NewsCaseForm({ onClose, onSaved, prefill }: Props) {
  const [title, setTitle] = useState(prefill?.title ?? '')
  const [learning, setLearning] = useState('')
  const [company, setCompany] = useState<{ code: string; name: string } | null>(prefill?.company ?? null)
  const [category, setCategory] = useState(prefill?.category ?? '')
  const [url, setUrl] = useState(prefill?.url ?? '')
  const [syncNotion, setSyncNotion] = useState(false)
  const [loading, setLoading] = useState(false)

  const canSubmit = title.trim() && learning.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await fetch('/api/record-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_type: 'news_case',
          title: title.trim(),
          body: {
            learning: learning.trim(),
            company_name: company?.name ?? null,
            securities_code: company?.code ?? null,
            category: category || null,
            url: url.trim() || null,
            sync_notion: syncNotion,
          },
        }),
      })
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-sub block mb-1">タイトル <span className="text-danger">*</span></label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="何の事例・ニュースか一言"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">学び・気づき <span className="text-danger">*</span></label>
        <textarea
          value={learning}
          onChange={e => setLearning(e.target.value)}
          placeholder="何が参考になったか、自分の言葉で"
          rows={3}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">関連会社（任意）</label>
        <CompanySearch value={company} onChange={setCompany} />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">カテゴリ（任意）</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">選択しない</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">URL（任意）</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={syncNotion}
          onChange={e => setSyncNotion(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-xs text-sub">Notionにも保存する</span>
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-line text-sm text-sub"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ backgroundColor: '#1B3A5B' }}
        >
          {loading ? '保存中...' : '記録する'}
        </button>
      </div>
    </div>
  )
}

// つながりフォーム
function ConnectionForm({ onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [whereMet, setWhereMet] = useState('')
  const [expertise, setExpertise] = useState('')
  const [contact, setContact] = useState('')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = name.trim() && expertise.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await fetch('/api/record-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_type: 'connection',
          title: name.trim(),
          body: {
            affiliation: affiliation.trim() || null,
            where_met: whereMet.trim() || null,
            expertise: expertise.trim(),
            contact: contact.trim() || null,
            memo: memo.trim() || null,
          },
        }),
      })
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-sub block mb-1">名前（ニックネーム可） <span className="text-danger">*</span></label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="その人の呼び名"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">何に詳しい・何が魅力 <span className="text-danger">*</span></label>
        <textarea
          value={expertise}
          onChange={e => setExpertise(e.target.value)}
          placeholder="この人から学べること"
          rows={2}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">所属・肩書（任意）</label>
        <input
          type="text"
          value={affiliation}
          onChange={e => setAffiliation(e.target.value)}
          placeholder="会社名・役割など"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">どこで出会った（任意）</label>
        <input
          type="text"
          value={whereMet}
          onChange={e => setWhereMet(e.target.value)}
          placeholder="セミナー・X・紹介など"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">連絡手段・リンク（任意）</label>
        <input
          type="text"
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="XのURL、メール等"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">メモ（任意）</label>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="自由記述"
          rows={2}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-line text-sm text-sub">
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ backgroundColor: '#1B3A5B' }}
        >
          {loading ? '保存中...' : '記録する'}
        </button>
      </div>
    </div>
  )
}

// 会社フォーム（検索→遷移）
function CompanyFormStep({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [company, setCompany] = useState<{ code: string; name: string } | null>(null)

  const handleGo = () => {
    if (!company) return
    onClose()
    router.push(`/company/${company.code}`)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-sub leading-relaxed">
        会社を検索して、その企業ページで「AI一次理解」や自分メモの追記ができます。
      </p>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">会社名・証券コード</label>
        <CompanySearch value={company} onChange={setCompany} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-line text-sm text-sub">
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleGo}
          disabled={!company}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ backgroundColor: '#1B3A5B' }}
        >
          企業ページへ
        </button>
      </div>
    </div>
  )
}

// キャリアフォーム
function CareerForm({ onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'experience' | 'goal'>('experience')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = title.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await fetch('/api/record-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_type: 'career',
          title: title.trim(),
          body: {
            type,
            detail: detail.trim() || null,
            achieved: false,
          },
        }),
      })
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-sub block mb-1">タイトル <span className="text-danger">*</span></label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="今日の学び・経験・やりたいことを一言"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">種類 <span className="text-danger">*</span></label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('experience')}
            className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${
              type === 'experience'
                ? 'border-primary text-primary font-medium bg-soft'
                : 'border-line text-sub'
            }`}
          >
            今日の学び・経験
          </button>
          <button
            type="button"
            onClick={() => setType('goal')}
            className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${
              type === 'goal'
                ? 'border-primary text-primary font-medium bg-soft'
                : 'border-line text-sub'
            }`}
          >
            やりたいこと・目標
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-sub block mb-1">詳細（任意）</label>
        <textarea
          value={detail}
          onChange={e => setDetail(e.target.value)}
          placeholder={type === 'experience' ? '何を経験した・調べた' : '何を目指す・何を実現したい'}
          rows={3}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-line text-sm text-sub">
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ backgroundColor: '#1B3A5B' }}
        >
          {loading ? '保存中...' : '記録する'}
        </button>
      </div>
    </div>
  )
}

const TYPE_OPTIONS: { type: CardType; label: string; sub: string; emoji: string }[] = [
  { type: 'news_case', label: 'ニュース・事例', sub: '気になった情報・学んだこと', emoji: '📰' },
  { type: 'connection', label: 'つながり', sub: '出会った人・参考にしている人', emoji: '🤝' },
  { type: 'company', label: '会社', sub: '調べた会社・ベンチマーク企業', emoji: '🏢' },
  { type: 'career', label: 'キャリア', sub: '経験メモ・やりたいこと', emoji: '✨' },
]

export default function RecordCardModal({ onClose, onSaved, initialType, prefill }: Props) {
  const [selected, setSelected] = useState<CardType | null>(initialType ?? null)
  const [saved, setSaved] = useState(false)

  // 背面スクロールを止める
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSaved = () => {
    setSaved(true)
    setTimeout(() => {
      onSaved()
    }, 1500)
  }

  const LABELS: Record<CardType, string> = {
    news_case: 'ニュース・事例',
    connection: 'つながり',
    company: '会社',
    career: 'キャリア',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* シート本体：固定高さで内部スクロール */}
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg mx-auto flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 固定ヘッダー（ハンドル＋タイトル行） */}
        <div className="flex-shrink-0 px-5 pt-4 pb-1">
          <div className="w-10 h-1 bg-line rounded-full mx-auto mb-4" />
          {!saved && selected !== null && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => initialType ? onClose() : setSelected(null)}
                className="text-sub text-sm min-w-[44px] min-h-[44px] flex items-center"
              >
                ← 戻る
              </button>
              <h2
                className="text-base font-semibold text-primary"
                style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
              >
                {LABELS[selected]}
              </h2>
            </div>
          )}
        </div>

        {/* スクロール可能なコンテンツ */}
        <div className="flex-1 overflow-y-auto px-5 pb-10">
        {saved ? (
          /* 保存完了 */
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎉</p>
            <p
              className="text-lg font-medium text-primary"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              今日も1枚記録できました
            </p>
            <p className="text-xs text-sub mt-2">資産が積み上がっています</p>
          </div>
        ) : selected === null ? (
          /* タイプ選択 */
          <>
            <h2
              className="text-base font-semibold text-primary mb-1"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              今日の記録
            </h2>
            <p className="text-xs text-sub mb-4">何を記録しますか？</p>
            <div className="space-y-2.5">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => setSelected(opt.type)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-line text-left active:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#F8FAFC' }}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-primary">{opt.label}</p>
                    <p className="text-xs text-sub">{opt.sub}</p>
                  </div>
                  <svg className="w-4 h-4 text-sub ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* 各フォーム（タイトルは固定ヘッダーに移動済み） */
          <>
            {selected === 'news_case' && <NewsCaseForm onClose={onClose} onSaved={handleSaved} prefill={prefill} />}
            {selected === 'connection' && <ConnectionForm onClose={onClose} onSaved={handleSaved} />}
            {selected === 'company' && <CompanyFormStep onClose={onClose} />}
            {selected === 'career' && <CareerForm onClose={onClose} onSaved={handleSaved} />}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
