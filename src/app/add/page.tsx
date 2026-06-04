'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Source } from '@/types'

function AddForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [sourceId, setSourceId] = useState(searchParams.get('sourceId') ?? '')
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/sources')
      .then(r => r.json())
      .then((data: Source[]) => setSources(data.filter(s => s.enabled)))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, source_id: sourceId || null }),
      })
      const item = await res.json()
      router.push(`/memo/${item.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold">記事を追加</h1>
      </div>

      <p className="text-sm text-gray-500 mb-5">
        公式サイトで読んだ記事のタイトルとURLを入力してください。
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            記事タイトル <span className="text-[#E63946]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F]"
            placeholder="例：東証、英文開示の義務化を2026年から適用"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL <span className="text-[#E63946]">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F]"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ソース
            <span className="text-xs text-gray-400 font-normal ml-2">任意</span>
          </label>
          <select
            value={sourceId}
            onChange={e => setSourceId(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] bg-white text-gray-700"
          >
            <option value="">選択してください</option>
            {sources.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !title || !url}
          className="w-full bg-[#2D6A4F] text-white rounded-2xl py-4 text-sm font-medium disabled:opacity-40 mt-2"
        >
          {loading ? '追加中...' : 'メモを書く →'}
        </button>
      </form>
    </div>
  )
}

export default function AddPage() {
  return (
    <Suspense>
      <AddForm />
    </Suspense>
  )
}
