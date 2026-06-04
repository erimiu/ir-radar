'use client'
import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Item, Memo } from '@/types'

const PREDEFINED_CATEGORIES = ['IRトレンド', '開示', '規制', '市場', '投資', '海外']
const IMPORTANCE_OPTIONS = ['高', '中', '低']

interface Props {
  item: Item
  existingMemo: Memo | null
}

export default function MemoClient({ item, existingMemo }: Props) {
  const router = useRouter()
  const [note, setNote] = useState(existingMemo?.note ?? '')
  const [categories, setCategories] = useState<string[]>(existingMemo?.category_tags ?? [])
  const [customInput, setCustomInput] = useState('')
  const [importance, setImportance] = useState<string>(existingMemo?.importance ?? '中')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [notionSaving, setNotionSaving] = useState(false)
  const [notionSaved, setNotionSaved] = useState(existingMemo?.synced_to_notion ?? false)
  const [notionUrl, setNotionUrl] = useState(existingMemo?.notion_page_url ?? '')

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const addCustomTag = () => {
    const tag = customInput.trim()
    if (tag && !categories.includes(tag)) {
      setCategories(prev => [...prev, tag])
    }
    setCustomInput('')
  }

  const handleCustomKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  const removeCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat))
  }

  const saveMemo = async () => {
    setSaving(true)
    try {
      await fetch(`/api/memos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, category_tags: categories, importance }),
      })
      setSavedMsg('保存しました')
      setTimeout(() => setSavedMsg(''), 2000)
    } finally {
      setSaving(false)
    }
  }

  const saveToNotion = async () => {
    setNotionSaving(true)
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          title: item.title,
          url: item.url,
          categories,
          importance,
          note: note ?? '',
          source_name: item.sources?.name ?? '',
        }),
      })
      const data = await res.json()
      if (data.url) {
        setNotionUrl(data.url)
        setNotionSaved(true)
      } else if (data.error) {
        alert(`Notion保存エラー: ${data.error}`)
      }
    } finally {
      setNotionSaving(false)
    }
  }

  return (
    <div className="px-4 py-6">
      {/* 戻るボタン */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold">メモ</h1>
      </div>

      {/* 記事情報 */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-6">
        <p className="text-xs text-gray-400 mb-1">{item.sources?.name ?? '手動追加'}</p>
        <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{item.title}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#2D6A4F] mt-1 block truncate"
        >
          {item.url}
        </a>
      </div>

      <div className="space-y-5">
        {/* メモ欄 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={5}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] resize-none"
            placeholder="気づいたこと・要点・自社への示唆など..."
          />
        </div>

        {/* カテゴリ（マルチセレクト） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ
            <span className="text-xs text-gray-400 font-normal ml-2">複数選択可</span>
          </label>

          {/* 定義済みカテゴリ */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PREDEFINED_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`text-xs px-3 py-2 rounded-full min-h-[36px] transition-colors ${
                  categories.includes(cat)
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* フリー入力（その他） */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder="その他（Enterで追加）"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#2D6A4F]"
            />
            <button
              type="button"
              onClick={addCustomTag}
              disabled={!customInput.trim()}
              className="text-sm text-white bg-[#2D6A4F] rounded-xl px-4 min-h-[44px] disabled:opacity-40"
            >
              追加
            </button>
          </div>

          {/* 選択済みタグ（定義済み以外のカスタムタグ） */}
          {categories.filter(c => !PREDEFINED_CATEGORIES.includes(c)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {categories
                .filter(c => !PREDEFINED_CATEGORIES.includes(c))
                .map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-3 py-1.5 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeCategory(tag)}
                      className="leading-none hover:text-[#E63946]"
                      aria-label={`${tag}を削除`}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* 重要度（セレクト） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">重要度</label>
          <div className="flex gap-3">
            {IMPORTANCE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setImportance(opt)}
                className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  importance === opt
                    ? opt === '高'
                      ? 'bg-[#E63946] text-white'
                      : opt === '中'
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-400 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* メモ保存ボタン */}
        <button
          onClick={saveMemo}
          disabled={saving}
          className="w-full border border-[#2D6A4F] text-[#2D6A4F] rounded-2xl py-4 text-sm font-medium disabled:opacity-40"
        >
          {saving ? '保存中...' : savedMsg || 'メモを保存'}
        </button>

        {/* Notion保存 */}
        {notionSaved ? (
          <div className="bg-[#2D6A4F]/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-[#2D6A4F] font-medium">✓ Notionに保存済み</p>
            {notionUrl && (
              <a
                href={notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#2D6A4F] underline mt-1 block"
              >
                Notionで開く
              </a>
            )}
          </div>
        ) : (
          <button
            onClick={saveToNotion}
            disabled={notionSaving}
            className="w-full bg-[#2D6A4F] text-white rounded-2xl py-4 text-sm font-medium disabled:opacity-40"
          >
            {notionSaving ? 'Notionに保存中...' : 'Notionに保存'}
          </button>
        )}
      </div>
    </div>
  )
}
