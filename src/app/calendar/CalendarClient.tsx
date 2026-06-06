'use client'
import { useState, useMemo } from 'react'

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日']

interface Props {
  checkCounts: Record<string, number>
  todayJST: string
}

function calcStreak(checkCounts: Record<string, number>, todayJST: string): number {
  const start = new Date(todayJST)
  if (!checkCounts[todayJST]) {
    start.setDate(start.getDate() - 1)
  }
  let count = 0
  const d = new Date(start)
  while (checkCounts[d.toISOString().slice(0, 10)]) {
    count++
    d.setDate(d.getDate() - 1)
  }
  return count
}

function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  let dow = firstDay.getDay()
  dow = dow === 0 ? 6 : dow - 1 // Monday = 0

  const cells: (number | null)[] = Array(dow).fill(null)
  for (let d = 1; d <= lastDate; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarClient({ checkCounts, todayJST }: Props) {
  const today = new Date(todayJST)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth])

  const monthTotal = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    return Object.entries(checkCounts)
      .filter(([d]) => d.startsWith(prefix))
      .reduce((sum, [, n]) => sum + n, 0)
  }, [checkCounts, viewYear, viewMonth])

  const todayTotal = checkCounts[todayJST] ?? 0
  const streak = useMemo(() => calcStreak(checkCounts, todayJST), [checkCounts, todayJST])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3">
          <h1 className="text-xl font-bold tracking-tight text-primary">カレンダー</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* 統計カード */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="bg-surface rounded-2xl border border-line p-3 text-center"
            style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
          >
            <p className="text-2xl font-bold text-primary">{todayTotal}</p>
            <p className="text-[10px] text-sub mt-0.5">今日</p>
          </div>
          <div
            className="bg-surface rounded-2xl border border-line p-3 text-center"
            style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
          >
            <p className="text-2xl font-bold text-primary">{monthTotal}</p>
            <p className="text-[10px] text-sub mt-0.5">今月</p>
          </div>
          <div
            className="bg-surface rounded-2xl border border-line p-3 text-center"
            style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
          >
            <p className="text-2xl font-bold text-accent">{streak}</p>
            <p className="text-[10px] text-sub mt-0.5">連続日数</p>
          </div>
        </div>

        {/* カレンダー */}
        <div
          className="bg-surface rounded-2xl border border-line overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(27,58,91,0.06)' }}
        >
          {/* 月ナビゲーション */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center text-sub hover:text-primary text-lg"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-primary">
              {viewYear}年{viewMonth + 1}月
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center text-sub hover:text-primary text-lg"
            >
              ›
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={`text-center text-[10px] py-1.5 font-medium ${
                  i === 5 ? 'text-blue-400' : i === 6 ? 'text-red-400' : 'text-sub'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 日付セル */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e-${i}`} className="h-14 border-b border-r border-line last:border-r-0" />
              }

              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const count = checkCounts[dateStr] ?? 0
              const isToday = dateStr === todayJST
              const hasChecks = count > 0
              const isWeekend = i % 7 === 5 || i % 7 === 6

              return (
                <div
                  key={dateStr}
                  className={`h-14 flex flex-col items-center justify-center border-b border-r border-line last:border-r-0 ${
                    hasChecks ? 'bg-soft' : ''
                  }`}
                >
                  <span
                    className={`text-xs leading-none flex items-center justify-center ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-primary text-white font-bold'
                        : hasChecks
                        ? 'text-primary font-semibold'
                        : isWeekend
                        ? 'text-sub'
                        : 'text-[#1A2332]'
                    }`}
                  >
                    {day}
                  </span>
                  {hasChecks && (
                    <span className="text-[11px] font-bold text-accent mt-1 leading-none">
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-soft border border-accent/30" />
            <span className="text-[10px] text-sub">チェックあり</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[6px] text-white font-bold">今</span>
            </div>
            <span className="text-[10px] text-sub">今日</span>
          </div>
        </div>
      </div>
    </div>
  )
}
