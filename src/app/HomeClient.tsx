'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { HomeStats } from './page'

export default function HomeClient({ stats }: { stats: HomeStats }) {
  const [briefingCounts, setBriefingCounts] = useState<{ benchmark: number; themed: number } | null>(null)
  const [showStarCelebration, setShowStarCelebration] = useState(false)

  useEffect(() => {
    const key = 'ir_skillup_stars'
    const stored = localStorage.getItem(key)
    const prev = stored !== null ? parseInt(stored) : null
    localStorage.setItem(key, String(stats.starCount))
    if (prev !== null && stats.starCount > prev) {
      setShowStarCelebration(true)
      const t = setTimeout(() => setShowStarCelebration(false), 4000)
      return () => clearTimeout(t)
    }
  }, [stats.starCount])

  useEffect(() => {
    fetch('/api/briefing')
      .then(r => r.json())
      .then(data => {
        setBriefingCounts({
          benchmark: data.benchmark?.length ?? 0,
          themed: data.themed?.length ?? 0,
        })
      })
      .catch(() => {})
  }, [])

  const displayStarSlots = Math.max(stats.starCount + 3, 5)

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#EEF3F8' }}>
      {/* ヘッダー */}
      <header className="pt-10 pb-6 text-center px-6">
        <h1
          className="text-[2rem] text-primary tracking-[0.04em]"
          style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif" }}
        >
          IR Skill Up
        </h1>
        <p className="text-xs text-sub mt-2 tracking-[0.1em]">
          日々の情報収集が、わたしの武器になる
        </p>
      </header>

      {/* 達成サマリー（2×2グリッド） */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold text-primary leading-none mb-1.5"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              {stats.memoCount}
            </p>
            <p className="text-[10px] text-sub">学びカード</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold text-primary leading-none mb-1.5"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              {stats.knownCompanyCount}
            </p>
            <p className="text-[10px] text-sub">知っている会社</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold text-primary leading-none mb-1.5"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              {stats.streak}
            </p>
            <p className="text-[10px] text-sub">連続日数</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold leading-none mb-1.5"
              style={{
                color: '#2E6FB7',
                fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
              }}
            >
              {stats.starCount}
            </p>
            <p className="text-[10px] text-sub">スター</p>
          </div>
        </div>
      </div>

      {/* スター表示 */}
      <div className="px-4 mb-5">
        <div className="bg-white rounded-xl px-4 py-3" style={{ border: '0.5px solid #E3E8EF' }}>
          {showStarCelebration && (
            <p className="text-center text-accent text-xs mb-2 font-medium">
              ★ 新しいスターを獲得しました！おめでとうございます
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5 flex-1 flex-wrap">
              {Array.from({ length: displayStarSlots }).map((_, i) => (
                <span
                  key={i}
                  className={`text-lg leading-none transition-colors ${
                    i < stats.starCount
                      ? showStarCelebration && i === stats.starCount - 1
                        ? 'text-accent animate-bounce'
                        : 'text-accent'
                      : 'text-gray-200'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-[10px] text-sub text-right flex-shrink-0 leading-relaxed whitespace-nowrap">
              あと{stats.nextStarIn}件で<br />次のスター
            </p>
          </div>
        </div>
      </div>

      {/* メニューカード */}
      <div className="px-4 space-y-2.5">
        {/* 今日のブリーフィング */}
        <Link href="/disclosure" className="block active:opacity-90 transition-opacity">
          <div
            className="h-[90px] rounded-2xl flex items-center px-5 gap-4"
            style={{ background: 'linear-gradient(135deg, #1B3A5B 0%, #2E6FB7 100%)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white leading-snug">今日のブリーフィング</p>
              <p className="text-xs text-white/70 mt-0.5">
                {briefingCounts !== null
                  ? `ベンチマーク ${briefingCounts.benchmark}件・テーマ ${briefingCounts.themed}件`
                  : '取得中...'}
              </p>
            </div>
            <svg className="w-7 h-7 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
        </Link>

        {/* あとで読む */}
        <Link href="/disclosure?tab=later" className="block active:opacity-90 transition-opacity">
          <div
            className="h-[90px] rounded-2xl flex items-center px-5 gap-4"
            style={{ backgroundColor: '#E6F1FB', border: '0.5px solid #C8DDEE' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-[#0C447C] leading-snug">あとで読む</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(12,68,124,0.6)' }}>
                じっくり読みたい {stats.savedLaterCount}件
              </p>
            </div>
            <svg className="w-7 h-7 flex-shrink-0" style={{ color: 'rgba(12,68,124,0.55)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        </Link>

        {/* 学びの蓄積 */}
        <Link href="/memos" className="block active:opacity-90 transition-opacity">
          <div
            className="h-[90px] rounded-2xl flex items-center px-5 gap-4 bg-white"
            style={{ border: '0.5px solid #E3E8EF' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-primary leading-snug">学びの蓄積</p>
              <p className="text-xs text-sub mt-0.5">事例集・知識マップ・振り返り</p>
            </div>
            <svg className="w-7 h-7 text-sub flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </Link>

        {/* 情報ソース */}
        <Link href="/sources" className="block active:opacity-90 transition-opacity">
          <div
            className="h-[90px] rounded-2xl flex items-center px-5 gap-4 bg-white"
            style={{ border: '0.5px solid #E3E8EF' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-primary leading-snug">情報ソース</p>
              <p className="text-xs text-sub mt-0.5">目的別ガイド付きリンク集</p>
            </div>
            <svg className="w-7 h-7 text-sub flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  )
}
