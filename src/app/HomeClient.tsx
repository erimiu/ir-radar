'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import RecordCardModal from './RecordCardModal'
import type { HomeStats } from './page'

const SERIF = "'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif"

const MENU_CARDS = [
  {
    href: '/news',
    title: 'ニュース・事例',
    sub: '気になった情報・学んだことの一覧',
    img: '/photos/news.jpg',
  },
  {
    href: '/connections',
    title: 'つながり',
    sub: 'IR担当者・参考にしている人の一覧',
    img: '/photos/friends.jpg',
  },
  {
    href: '/company-notes',
    title: '会社情報',
    sub: 'ベンチマーク企業・調べた会社',
    img: '/photos/company.jpg',
  },
  {
    href: '/feedback',
    title: '振り返りレポート',
    sub: '週次・月次AIフィードバック＆カレンダー',
    img: '/photos/feedback.jpg',
  },
  {
    href: '/career',
    title: 'マイキャリア',
    sub: '学び・経験とやりたいことリスト',
    img: '/photos/career.jpg',
  },
]

const STATS = [
  { key: 'newsCaseCount', label: 'ニュース' },
  { key: 'connectionCount', label: 'つながり' },
  { key: 'companyCount', label: '会社' },
  { key: 'careerCount', label: 'キャリア' },
] as const

export default function HomeClient({ stats }: { stats: HomeStats }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [showStarCelebration, setShowStarCelebration] = useState(false)

  useEffect(() => {
    const key = 'ir_skillup_stars_v2'
    const stored = localStorage.getItem(key)
    const prev = stored !== null ? parseInt(stored) : null
    localStorage.setItem(key, String(stats.starCount))
    if (prev !== null && stats.starCount > prev) {
      setShowStarCelebration(true)
      const t = setTimeout(() => setShowStarCelebration(false), 4000)
      return () => clearTimeout(t)
    }
  }, [stats.starCount])

  const displayStarSlots = Math.max(stats.starCount + 2, 4)

  const handleSaved = () => {
    setModalOpen(false)
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: '#F0F4F8' }}>
      {/* ヘッダー */}
      <header className="pt-8 pb-4 text-center px-6">
        <h1
          className="text-[1.75rem] text-primary tracking-[0.04em]"
          style={{ fontFamily: SERIF }}
        >
          IR Skill Up
        </h1>
        <p className="text-[11px] text-sub mt-1 tracking-[0.08em]">
          わたしが出会ったものを預けるアプリ
        </p>
      </header>

      {/* コンパクト数字サマリー */}
      <div className="px-4 mb-2">
        <div
          className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between"
          style={{ border: '0.5px solid #E3E8EF' }}
        >
          {STATS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center">
              <span
                className="text-[1.15rem] font-semibold text-primary leading-none"
                style={{ fontFamily: SERIF }}
              >
                {stats[key]}
              </span>
              <span className="text-[9px] text-sub mt-0.5 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* スター・連続日数コンパクト帯 */}
      <div className="px-4 mb-4">
        <div
          className="bg-white rounded-xl px-3 py-2 flex items-center gap-2"
          style={{ border: '0.5px solid #E3E8EF' }}
        >
          {showStarCelebration && (
            <span className="text-accent text-[10px] font-medium flex-shrink-0">
              ★ 新しいスターを獲得！
            </span>
          )}
          <div className="flex gap-0.5 flex-shrink-0">
            {Array.from({ length: displayStarSlots }).map((_, i) => (
              <span
                key={i}
                className={`text-sm leading-none ${
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
          <span className="text-[10px] text-sub ml-auto whitespace-nowrap">
            連続{stats.streak}日 · あと{stats.nextStarIn}件でスター
          </span>
        </div>
      </div>

      {/* 今日の記録ボタン（主役） */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full rounded-2xl px-5 py-4 text-left active:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1B3A5B' }}
        >
          <p
            className="text-base font-semibold text-white leading-snug"
            style={{ fontFamily: SERIF }}
          >
            今日の記録
          </p>
          <p className="text-xs text-white/70 mt-0.5">
            {stats.todayCount === 0
              ? '今日の気づきを残そう'
              : `今日は${stats.todayCount}枚記録済み`}
          </p>
        </button>
      </div>

      {/* メニューカード5つ（My Coach風フォトカード） */}
      <div className="px-4 space-y-2.5">
        {MENU_CARDS.map(card => (
          <Link key={card.href} href={card.href} className="block active:opacity-90 transition-opacity">
            <div
              className="relative h-[112px] rounded-2xl overflow-hidden bg-white"
              style={{ boxShadow: '0 1px 4px rgba(27,58,91,0.08)' }}
            >
              {/* 左半分：写真 + 右へのグラデーション */}
              <div className="absolute inset-y-0 left-0 w-[48%]">
                <Image
                  src={card.img}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                {/* 写真の右端から白へフェード */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, transparent 40%, rgba(255,255,255,0.7) 75%, white 100%)',
                  }}
                />
              </div>
              {/* 右半分：白地にテキスト左揃え */}
              <div className="absolute inset-y-0 right-0 w-[58%] flex flex-col justify-center pl-2 pr-5">
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: '#1B3A5B', fontFamily: SERIF }}
                >
                  {card.title}
                </p>
                <p className="text-[11px] text-sub mt-0.5 leading-snug">{card.sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ソース・ブリーフィングへの控えめリンク */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-center gap-4">
        <Link href="/sources" className="text-[11px] text-sub underline underline-offset-2">
          情報ソース
        </Link>
        <span className="text-sub text-[11px]">·</span>
        <Link href="/disclosure" className="text-[11px] text-sub underline underline-offset-2">
          ブリーフィング
        </Link>
      </div>

      {/* モーダル */}
      {modalOpen && (
        <RecordCardModal
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
