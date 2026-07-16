'use client'
import { useState } from 'react'
import type { Source, Category, FetchType } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import PageHeader from '@/components/PageHeader'

const TIER_LABELS: Record<number, string> = {
  1: '第1階層：業務直結・必須ウォッチ',
  2: '第2階層：IRトレンド・スキルアップ',
  3: '第3階層：投資リサーチ・市場動向',
  4: '第4階層：海外IR事例',
}

const CATEGORIES: Category[] = ['disclosure', 'regulation', 'market', 'ir_trend', 'investment', 'overseas']

interface FormState {
  name: string
  url: string
  fetch_type: FetchType
  category: Category
  tier: number
  is_company: boolean
}

interface Props {
  initialSources: Source[]
}

export default function SourcesClient({ initialSources }: Props) {
  const [sources, setSources] = useState(initialSources)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', url: '', fetch_type: 'link', category: 'ir_trend', tier: 2, is_company: false,
  })
  const [adding, setAdding] = useState(false)

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const newSource = await res.json()
      setSources(prev =>
        [...prev, newSource].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
      )
      setShowForm(false)
      setForm({ name: '', url: '', fetch_type: 'link', category: 'ir_trend', tier: 2, is_company: false })
    } finally {
      setAdding(false)
    }
  }

  const byTier = ([1, 2, 3, 4] as const)
    .map(tier => ({ tier, items: sources.filter(s => s.tier === tier) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="ソース"
        right={
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-sm text-white bg-accent rounded-xl px-4 min-h-[36px] flex items-center hover:bg-primary transition-colors"
          >
            ＋ 追加
          </button>
        }
      />

      <div className="flex-1 px-4 py-4">

      {showForm && (
        <form onSubmit={addSource} className="bg-surface rounded-2xl p-4 mb-6 space-y-3 border border-line">
          <h2 className="text-sm font-semibold text-[#1A2332]">新規ソース追加</h2>

          <input
            type="text"
            placeholder="ソース名"
            value={form.name}
            onChange={e => setForm(d => ({ ...d, name: e.target.value }))}
            required
            className="w-full border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-white"
          />
          <input
            type="url"
            placeholder="URL（https://...）"
            value={form.url}
            onChange={e => setForm(d => ({ ...d, url: e.target.value }))}
            required
            className="w-full border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-white"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.fetch_type}
              onChange={e => setForm(d => ({ ...d, fetch_type: e.target.value as FetchType }))}
              className="border border-line rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-accent bg-white"
            >
              <option value="link">LINK</option>
              <option value="rss">RSS</option>
            </select>
            <select
              value={form.category}
              onChange={e => setForm(d => ({ ...d, category: e.target.value as Category }))}
              className="border border-line rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-accent bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <select
              value={form.tier}
              onChange={e => setForm(d => ({ ...d, tier: Number(e.target.value) }))}
              className="border border-line rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-accent bg-white"
            >
              {[1, 2, 3, 4].map(t => (
                <option key={t} value={t}>第{t}階層</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-sub cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_company}
                onChange={e => setForm(d => ({ ...d, is_company: e.target.checked }))}
                className="w-4 h-4 accent-accent"
              />
              ベンチマーク企業
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-line text-sub rounded-xl py-3 text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 bg-accent text-white rounded-xl py-3 text-sm disabled:opacity-40"
            >
              {adding ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      )}

      {byTier.map(({ tier, items }) => (
        <div key={tier} className="mb-6">
          <p className="text-xs text-sub font-medium mb-3">{TIER_LABELS[tier]}</p>
          <div className="space-y-2">
            {items.map(source => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-surface border border-line rounded-2xl p-4 hover:border-accent transition-colors"
                style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                    Tier {tier}
                  </span>
                  <span className="text-xs text-sub">
                    {CATEGORY_LABELS[source.category]}
                  </span>
                  {source.is_company && (
                    <span className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                      企業
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary mb-1">{source.name}</p>
                {source.purpose && (
                  <p className="text-xs text-sub leading-relaxed">{source.purpose}</p>
                )}
                {source.when_to_check && (
                  <p className="text-xs text-accent mt-0.5 leading-relaxed">{source.when_to_check}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}

      {sources.length === 0 && !showForm && (
        <div className="text-center py-20 text-sub">
          <p className="text-sm">ソースが登録されていません</p>
          <p className="text-xs mt-1">「＋ 追加」から登録してください</p>
        </div>
      )}

      </div>
    </div>
  )
}
