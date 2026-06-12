'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { BenchmarkCompany } from './page'

interface Company {
  code: string
  name: string
  market: string | null
}

interface Props {
  initialCompanies: BenchmarkCompany[]
}

export default function SettingsClient({ initialCompanies }: Props) {
  const [companies, setCompanies] = useState<BenchmarkCompany[]>(initialCompanies)

  // 検索
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Company[]>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // 手入力
  const [manualCode, setManualCode] = useState('')
  const [manualName, setManualName] = useState('')
  const [adding, setAdding] = useState(false)

  // 2文字以上で検索（300msデバウンス）
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
        setShowSuggestions(true)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const registeredCodes = new Set(companies.map(c => c.securities_code))

  const selectCompany = async (company: Company) => {
    if (registeredCodes.has(company.code)) return
    setShowSuggestions(false)
    setSearchQuery('')
    setSuggestions([])
    setRegistering(company.code)
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ securities_code: company.code, company_name: company.name }),
      })
      const data = await res.json()
      if (!data.error) {
        setCompanies(prev =>
          [...prev, data as BenchmarkCompany].sort((a, b) =>
            a.securities_code.localeCompare(b.securities_code)
          )
        )
      } else {
        alert(data.error)
      }
    } finally {
      setRegistering(null)
    }
  }

  const addManual = async () => {
    if (!manualCode.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securities_code: manualCode.trim(),
          company_name: manualName.trim(),
        }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setCompanies(prev =>
        [...prev, data as BenchmarkCompany].sort((a, b) =>
          a.securities_code.localeCompare(b.securities_code)
        )
      )
      setManualCode('')
      setManualName('')
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
          <Link href="/" className="text-sub hover:text-primary" aria-label="戻る">
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
            登録した企業の開示は、開示一覧でアクセントカラーの枠で強調表示されます。
          </p>

          {/* 会社名検索 */}
          <div
            className="bg-surface rounded-2xl border border-line p-4 mb-3"
            style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
          >
            <p className="text-xs font-medium text-sub mb-2">会社名で検索</p>
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="例：トヨタ、ソニー..."
                  className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent bg-white pr-8"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* サジェストドロップダウン */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-line rounded-2xl shadow-lg overflow-hidden">
                  {suggestions.map(company => {
                    const alreadyRegistered = registeredCodes.has(company.code)
                    const isRegistering = registering === company.code
                    return (
                      <button
                        key={company.code}
                        onClick={() => selectCompany(company)}
                        disabled={alreadyRegistered || isRegistering}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-line last:border-b-0 transition-colors ${
                          alreadyRegistered
                            ? 'opacity-40 cursor-not-allowed bg-white'
                            : 'hover:bg-soft active:bg-soft'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-primary block truncate">
                            {company.name}
                          </span>
                          {company.market && (
                            <span className="text-[10px] text-sub">{company.market}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="text-xs font-bold text-accent">{company.code}</span>
                          {alreadyRegistered && (
                            <span className="text-[10px] text-sub">登録済</span>
                          )}
                          {isRegistering && (
                            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {showSuggestions && !searching && suggestions.length === 0 && searchQuery.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-line rounded-2xl shadow-lg px-4 py-3">
                  <p className="text-xs text-sub">「{searchQuery}」に一致する企業が見つかりません</p>
                </div>
              )}
            </div>
          </div>

          {/* 手入力（折りたたみ） */}
          <ManualInput
            code={manualCode}
            name={manualName}
            adding={adding}
            onCodeChange={setManualCode}
            onNameChange={setManualName}
            onAdd={addManual}
          />

          {/* 登録済み企業リスト */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-sub mb-2">
              登録済み企業 {companies.length > 0 ? `（${companies.length}件）` : ''}
            </p>
            {companies.map(c => (
              <div
                key={c.id}
                className="bg-surface rounded-2xl border border-line px-4 py-3 flex items-center justify-between"
                style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-accent flex-shrink-0">{c.securities_code}</span>
                  {c.company_name && (
                    <span className="text-sm text-primary truncate">{c.company_name}</span>
                  )}
                </div>
                <button
                  onClick={() => removeCompany(c.id)}
                  className="text-xs text-danger border border-danger/30 rounded-lg px-2.5 py-1 hover:bg-danger/5 transition-colors flex-shrink-0 ml-3"
                >
                  削除
                </button>
              </div>
            ))}
            {companies.length === 0 && (
              <p className="text-xs text-sub text-center py-6">まだ登録されていません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 手入力セクション（折りたたみ式）
function ManualInput({
  code, name, adding, onCodeChange, onNameChange, onAdd,
}: {
  code: string
  name: string
  adding: boolean
  onCodeChange: (v: string) => void
  onNameChange: (v: string) => void
  onAdd: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-medium text-sub">コードで手入力</span>
        <svg
          className={`w-4 h-4 text-sub transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={e => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="証券コード（例: 7203）"
              inputMode="numeric"
              className="w-28 border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent bg-white"
            />
            <input
              type="text"
              value={name}
              onChange={e => onNameChange(e.target.value)}
              placeholder="会社名（任意）"
              className="flex-1 border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent bg-white"
            />
          </div>
          <button
            onClick={onAdd}
            disabled={adding || code.trim().length < 1}
            className="w-full bg-accent text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-primary transition-colors"
          >
            {adding ? '追加中...' : '追加する'}
          </button>
        </div>
      )}
    </div>
  )
}
