'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import RecordCardModal from './RecordCardModal'
import type { HomeStats } from './page'

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
    sub: '週次・月次AIフィードバック',
    img: '/photos/feedback.jpg',
  },
  {
    href: '/career',
    title: 'マイキャリア',
    sub: '学び・経験とやりたいことリスト',
    img: '/photos/career.jpg',
  },
]

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

  const displayStarSlots = Math.max(stats.starCount + 3, 5)

  const handleSaved = () => {
    setModalOpen(false)
    router.refresh()
  }

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
          わたしが出会ったものを預けるアプリ
        </p>
      </header>

      {/* 数字サマリー 2×2 */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold text-primary leading-none mb-1.5"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              {stats.newsCaseCount}
            </p>
            <p className="text-[10px] text-sub">ニュース・事例</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold text-primary leading-none mb-1.5"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              {stats.connectionCount}
            </p>
            <p className="text-[10px] text-sub">つながり</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold text-primary leading-none mb-1.5"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              {stats.companyCount}
            </p>
            <p className="text-[10px] text-sub">知っている会社</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '0.5px solid #E3E8EF' }}>
            <p
              className="text-[1.75rem] font-semibold text-primary leading-none mb-1.5"
              style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
            >
              {stats.careerCount}
            </p>
            <p className="text-[10px] text-sub">キャリア</p>
          </div>
        </div>
      </div>

      {/* スター表示 */}
      <div className="px-4 mb-4">
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
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-sub leading-relaxed whitespace-nowrap">
                連続{stats.streak}日<br />あと{stats.nextStarIn}件で次のスター
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 今日の記録ボタン（主役） */}
      <div className="px-4 mb-5">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full rounded-2xl px-5 py-5 text-left active:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1B3A5B' }}
        >
          <p
            className="text-lg font-semibold text-white leading-snug"
            style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
          >
            今日の記録
          </p>
          <p className="text-sm text-white/70 mt-1">
            {stats.todayCount === 0
              ? '今日の気づきを残そう'
              : `今日は${stats.todayCount}枚記録済み`}
          </p>
        </button>
      </div>

      {/* メニューカード5つ（フォトカード） */}
      <div className="px-4 space-y-3">
        {MENU_CARDS.map(card => (
          <Link key={card.href} href={card.href} className="block active:opacity-90 transition-opacity">
            <div
              className="relative h-[140px] rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 1px 4px rgba(27,58,91,0.10)' }}
            >
              <Image
                src={card.img}
                alt={card.title}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
              />
              {/* 右側から白グラデーション（文字を読みやすく） */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(255,255,255,0) 25%, rgba(255,255,255,0.82) 55%, rgba(255,255,255,0.97) 70%)',
                }}
              />
              {/* テキスト：右寄せ */}
              <div className="absolute inset-0 flex flex-col justify-center items-end pr-5">
                <p
                  className="text-base font-semibold text-primary leading-snug text-right"
                  style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
                >
                  {card.title}
                </p>
                <p className="text-[11px] text-sub mt-0.5 text-right leading-snug max-w-[160px]">
                  {card.sub}
                </p>
              </div>
            </div>
          </Link>
        ))}
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
