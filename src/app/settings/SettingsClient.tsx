'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { BenchmarkCompany } from './page'

interface Props {
  initialCompanies: BenchmarkCompany[]
}

export default function SettingsClient({ initialCompanies }: Props) {
  const [companies, setCompanies] = useState<BenchmarkCompany[]>(initialCompanies)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  const addCompany = async () => {
    if (!code.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ securities_code: code.trim(), company_name: name.trim() }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setCompanies(prev =>
        [...prev, data as BenchmarkCompany].sort((a, b) =>
          a.securities_code.localeCompare(b.securities_code)
        )
      )
      setCode('')
      setName('')
    } finally {
      setAdding(false)
    }
  }

  const removeCompany = async (id: string) => {
    const res = await fetch(`/api/benchmark/${id}`, { method: 'DELETE' })
    if (res.ok) setCompanies(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
          <Link href="/" className="text-sub hover:text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-primary">設定</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-primary mb-1">ベンチマーク企業</h2>
          <p className="text-xs text-sub mb-4">
            登録した証券コードの開示は、開示一覧でアクセントカラーの枠で強調表示されます。
          </p>

          {/* 追加フォーム */}
          <div
            className="bg-surface rounded-2xl border border-line p-4 space-y-3 mb-4"
            style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="証券コード（例: 7203）"
                inputMode="numeric"
                className="w-28 border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent bg-white"
              />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="会社名（任意）"
                className="flex-1 border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent bg-white"
              />
            </div>
            <button
              onClick={addCompany}
              disabled={adding || code.trim().length < 1}
              className="w-full bg-accent text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-primary transition-colors"
            >
              {adding ? '追加中...' : '追加する'}
            </button>
          </div>

          {/* 企業リスト */}
          <div className="space-y-2">
            {companies.map(c => (
              <div
                key={c.id}
                className="bg-surface rounded-2xl border border-line px-4 py-3 flex items-center justify-between"
                style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-accent">{c.securities_code}</span>
                  {c.company_name && (
                    <span className="text-sm text-primary">{c.company_name}</span>
                  )}
                </div>
                <button
                  onClick={() => removeCompany(c.id)}
                  className="text-xs text-danger border border-danger/30 rounded-lg px-2.5 py-1 hover:bg-danger/5 transition-colors"
                >
                  削除
                </button>
              </div>
            ))}
            {companies.length === 0 && (
              <p className="text-xs text-sub text-center py-6">
                まだ登録されていません
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
