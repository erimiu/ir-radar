'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CompanyInfo, CompanyNotes, CompanyMemo } from './page'

const IMPORTANCE_STYLE: Record<string, string> = {
  高: 'bg-red-100 text-red-700',
  中: 'bg-orange-100 text-orange-700',
  低: 'bg-gray-100 text-gray-600',
}

interface AiData {
  business_model: string
  revenue_pillars: string
  scale_feel: string
  ir_notes: string
  ir_site_url: string
  confidence: 'high' | 'medium' | 'low'
  caveat: string
}

function tryParseAiData(summary: string | null | undefined): AiData | null {
  if (!summary) return null
  try {
    return JSON.parse(summary) as AiData
  } catch {
    return null
  }
}

interface Props {
  company: CompanyInfo
  initialNotes: CompanyNotes | null
  initialMemos: CompanyMemo[]
}

export default function CompanyClient({ company, initialNotes, initialMemos }: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState<CompanyNotes | null>(initialNotes)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [irUrlInput, setIrUrlInput] = useState(initialNotes?.ir_site_url ?? '')
  const [irUrlEditing, setIrUrlEditing] = useState(false)
  const [irUrlSaving, setIrUrlSaving] = useState(false)

  const [memoInput, setMemoInput] = useState(initialNotes?.my_memo ?? '')
  const [memoSaving, setMemoSaving] = useState(false)
  const [memoSaved, setMemoSaved] = useState(false)

  const aiData = useMemo(() => tryParseAiData(notes?.ai_summary), [notes?.ai_summary])

  const aiSuggestedUrl =
    aiData?.ir_site_url && aiData.ir_site_url !== '不明' ? aiData.ir_site_url : null
  const showAiUrlSuggestion = !!aiSuggestedUrl && !notes?.ir_site_url

  const generateAiSummary = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch(`/api/company/${company.code}/ai-summary`, { method: 'POST' })
      const data = await res.json()
      if (data.error === 'parse_failed') {
        setAiError('生成に失敗しました。もう一度お試しください。')
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'generation failed')
      if (data.already_exists) return
      setNotes(prev => ({
        ...(prev ?? { code: company.code, ir_site_url: null, my_memo: null, updated_at: null }),
        ai_summary: JSON.stringify(data.parsed),
        ai_generated_at: data.generated_at,
      }))
    } catch (e) {
      setAiError(e instanceof Error ? e.message : '生成に失敗しました')
    } finally {
      setAiLoading(false)
    }
  }

  const saveIrUrl = async (url: string) => {
    setIrUrlSaving(true)
    try {
      const res = await fetch(`/api/company/${company.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ir_site_url: url }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNotes(prev => ({
        ...(prev ?? { code: company.code, ai_summary: null, ai_generated_at: null, my_memo: null, updated_at: null }),
        ...data,
      }))
      setIrUrlInput(url)
      setIrUrlEditing(false)
    } catch {
      alert('保存に失敗しました')
    } finally {
      setIrUrlSaving(false)
    }
  }

  const saveMemo = async () => {
    setMemoSaving(true)
    try {
      const res = await fetch(`/api/company/${company.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ my_memo: memoInput }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNotes(prev => ({
        ...(prev ?? { code: company.code, ai_summary: null, ai_generated_at: null, ir_site_url: null, updated_at: null }),
        ...data,
      }))
      setMemoSaved(true)
      setTimeout(() => setMemoSaved(false), 2000)
    } catch {
      alert('保存に失敗しました')
    } finally {
      setMemoSaving(false)
    }
  }

  const currentIrUrl = notes?.ir_site_url ?? ''

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ backgroundColor: '#EEF3F8' }}>
      {/* ヘッダー */}
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 -ml-1 text-sub hover:text-primary transition-colors active:opacity-70" aria-label="戻る">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-primary truncate">{company.name}</h1>
            <p className="text-xs text-sub">{company.code}{company.market ? `・${company.market}` : ''}</p>
          </div>
          {currentIrUrl && (
            <a
              href={currentIrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs bg-accent text-white px-3 py-1.5 rounded-xl"
            >
              公式IR
            </a>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* b. 確実リンク */}
        <div className="bg-white rounded-2xl p-4 border border-line" style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}>
          <p className="text-xs font-semibold text-sub mb-3">リンク</p>
          <div className="flex flex-col gap-2">
            <a
              href={`https://kabutan.jp/stock/?code=${company.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <span className="text-xs bg-soft px-2 py-0.5 rounded-full font-medium">株探</span>
              kabutan.jp
            </a>
            <a
              href={`https://irbank.net/${company.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <span className="text-xs bg-soft px-2 py-0.5 rounded-full font-medium">IRバンク</span>
              irbank.net
            </a>
            {currentIrUrl && (
              <a
                href={currentIrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">公式IR</span>
                <span className="truncate">{currentIrUrl}</span>
              </a>
            )}
          </div>
        </div>

        {/* c. AIの一次理解カード */}
        <div className="bg-white rounded-2xl p-4 border border-line" style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-sub">AIの一次理解</p>
            {notes?.ai_generated_at && (
              <span className="text-[10px] text-sub">
                {new Date(notes.ai_generated_at).toLocaleDateString('ja-JP')}生成
              </span>
            )}
          </div>

          {notes?.ai_summary ? (
            aiData ? (
              <div className="space-y-3">
                {/* confidence low 警告 */}
                {aiData.confidence === 'low' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <p className="text-xs text-amber-700 font-medium">
                      AIの知識が限定的な企業です。IRバンク・公式サイトでの確認を推奨
                    </p>
                  </div>
                )}

                {/* 各項目 */}
                <AiField label="ビジネスモデル" value={aiData.business_model} />
                <AiField label="収益の柱" value={aiData.revenue_pillars} />
                <AiField label="規模感" value={aiData.scale_feel} />
                <AiField label="IR注目点" value={aiData.ir_notes} />

                {/* AI提案IRサイトURL */}
                {showAiUrlSuggestion && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-blue-600 font-medium mb-1">AI提案（要確認）</p>
                    <p className="text-xs text-blue-800 break-all mb-2">{aiSuggestedUrl}</p>
                    <button
                      onClick={() => saveIrUrl(aiSuggestedUrl!)}
                      disabled={irUrlSaving}
                      className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
                    >
                      {irUrlSaving ? '保存中...' : 'このURLを公式IRとして確定'}
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-sub border-t border-line pt-2 mt-1">
                  {aiData.caveat}　情報は生成時点のものです。
                </p>
              </div>
            ) : (
              /* 旧フォーマット（プレーンテキスト）の後方互換表示 */
              <div>
                <p className="text-sm text-[#1A2332] leading-relaxed whitespace-pre-wrap">{notes.ai_summary}</p>
                <p className="text-[10px] text-sub mt-3">情報は生成時点のものです。最新情報は公式サイトでご確認ください。</p>
              </div>
            )
          ) : (
            <div className="text-center py-4">
              {aiError && <p className="text-xs text-red-500 mb-3">{aiError}</p>}
              <button
                onClick={generateAiSummary}
                disabled={aiLoading}
                className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-accent transition-colors"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    生成中...
                  </span>
                ) : (
                  'この会社を知る'
                )}
              </button>
              <p className="text-[10px] text-sub mt-2">Claude AIが一次情報をまとめます（1回のみ）</p>
            </div>
          )}
        </div>

        {/* d. 公式IRサイトURL欄 */}
        <div className="bg-white rounded-2xl p-4 border border-line" style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-sub">公式IRサイト（確定済み）</p>
            {!irUrlEditing && (
              <button
                onClick={() => { setIrUrlInput(currentIrUrl); setIrUrlEditing(true) }}
                className="text-xs text-accent"
              >
                {currentIrUrl ? '編集' : '登録'}
              </button>
            )}
          </div>

          {irUrlEditing ? (
            <div className="space-y-2">
              <input
                type="url"
                value={irUrlInput}
                onChange={e => setIrUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveIrUrl(irUrlInput)}
                  disabled={irUrlSaving}
                  className="flex-1 bg-accent text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50"
                >
                  {irUrlSaving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setIrUrlEditing(false)}
                  className="flex-1 bg-line text-sub rounded-xl py-2 text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : currentIrUrl ? (
            <a
              href={currentIrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent underline break-all"
            >
              {currentIrUrl}
            </a>
          ) : (
            <p className="text-sm text-sub">未登録</p>
          )}
        </div>

        {/* e. 自分のメモ欄 */}
        <div className="bg-white rounded-2xl p-4 border border-line" style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-sub">自分のメモ</p>
            {memoSaved && <span className="text-xs text-accent">保存しました</span>}
          </div>
          <textarea
            value={memoInput}
            onChange={e => setMemoInput(e.target.value)}
            rows={4}
            className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            placeholder="この会社についての観察・気づきを自由に..."
          />
          <button
            onClick={saveMemo}
            disabled={memoSaving}
            className="mt-2 w-full bg-line text-sub rounded-xl py-2 text-sm hover:bg-accent/10 hover:text-accent transition-colors disabled:opacity-50"
          >
            {memoSaving ? '保存中...' : 'メモを保存'}
          </button>
        </div>

        {/* f. 学びカード一覧 */}
        {initialMemos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-sub mb-3 px-1">
              この会社の学びカード
              <span className="font-normal ml-2">{initialMemos.length}件</span>
            </p>
            <div className="space-y-2">
              {initialMemos.map(memo => (
                <div
                  key={memo.id}
                  className="bg-white rounded-2xl border border-line p-4"
                  style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
                >
                  <a
                    href={memo.items?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-[#1A2332] leading-snug hover:text-accent mb-2"
                  >
                    {memo.items?.title}
                  </a>
                  {memo.note && (
                    <p className="text-sm text-[#1A2332] leading-relaxed mb-2">{memo.note}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {memo.importance && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${IMPORTANCE_STYLE[memo.importance] ?? 'bg-gray-100 text-gray-600'}`}>
                        {memo.importance}
                      </span>
                    )}
                    {memo.category_tags?.map(tag => (
                      <span key={tag} className="text-xs bg-soft text-accent px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-sub ml-auto">
                      {new Date(memo.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AiField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-sub mb-0.5">{label}</p>
      <p className="text-sm text-[#1A2332] leading-relaxed">{value}</p>
    </div>
  )
}
