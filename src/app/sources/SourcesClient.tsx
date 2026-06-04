'use client'
import { useState } from 'react'
import type { Source, Category, FetchType } from '@/types'
import { CATEGORY_LABELS } from '@/types'

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

  const toggleSource = async (id: string, enabled: boolean) => {
    setSources(prev => prev.map(s => (s.id === id ? { ...s, enabled } : s)))
    await fetch(`/api/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
  }

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
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">ソース管理</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm text-white bg-[#2D6A4F] rounded-xl px-4 min-h-[44px] flex items-center"
        >
          ＋ 追加
        </button>
      </div>

      {/* 新規追加フォーム */}
      {showForm && (
        <form onSubmit={addSource} className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">新規ソース追加</h2>

          <input
            type="text"
            placeholder="ソース名"
            value={form.name}
            onChange={e => setForm(d => ({ ...d, name: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F]"
          />
          <input
            type="url"
            placeholder="URL（https://...）"
            value={form.url}
            onChange={e => setForm(d => ({ ...d, url: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F]"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.fetch_type}
              onChange={e => setForm(d => ({ ...d, fetch_type: e.target.value as FetchType }))}
              className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] bg-white"
            >
              <option value="link">LINK</option>
              <option value="rss">RSS</option>
            </select>
            <select
              value={form.category}
              onChange={e => setForm(d => ({ ...d, category: e.target.value as Category }))}
              className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] bg-white"
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
              className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] bg-white"
            >
              {[1, 2, 3, 4].map(t => (
                <option key={t} value={t}>第{t}階層</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_company}
                onChange={e => setForm(d => ({ ...d, is_company: e.target.checked }))}
                className="w-4 h-4 accent-[#2D6A4F]"
              />
              ベンチマーク企業
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 bg-[#2D6A4F] text-white rounded-xl py-3 text-sm disabled:opacity-40"
            >
              {adding ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      )}

      {/* 階層別ソース一覧 */}
      {byTier.map(({ tier, items }) => (
        <div key={tier} className="mb-6">
          <p className="text-xs text-gray-400 font-medium mb-2">{TIER_LABELS[tier]}</p>
          <div className="space-y-2">
            {items.map(source => (
              <div
                key={source.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {CATEGORY_LABELS[source.category]}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {source.fetch_type.toUpperCase()}
                    </span>
                    {source.is_company && (
                      <span className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full">
                        企業
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{source.name}</p>
                  <p className="text-xs text-gray-400 truncate">{source.url}</p>
                </div>

                {/* 有効/無効トグル */}
                <button
                  onClick={() => toggleSource(source.id, !source.enabled)}
                  className={`flex-shrink-0 w-12 h-7 rounded-full transition-colors relative ${
                    source.enabled ? 'bg-[#2D6A4F]' : 'bg-gray-200'
                  }`}
                  aria-label={source.enabled ? '無効にする' : '有効にする'}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      source.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sources.length === 0 && !showForm && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">ソースが登録されていません</p>
          <p className="text-xs mt-1">「＋ 追加」から登録してください</p>
        </div>
      )}
    </div>
  )
}
