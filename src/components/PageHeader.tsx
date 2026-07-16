'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CHEVRON = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

interface Props {
  title: string
  /** Link先。'back' を渡すと router.back()、省略または '/' でホームへ */
  back?: string | 'back'
  right?: React.ReactNode
  /** フィルタータブ等、タイトル行の下に追加するコンテンツ */
  children?: React.ReactNode
}

function BackButton({ back }: { back: string | 'back' | undefined }) {
  const router = useRouter()

  const cls =
    'flex items-center justify-center w-8 h-8 -ml-1 flex-shrink-0 text-sub hover:text-primary transition-colors active:opacity-70'

  if (back === 'back') {
    return (
      <button onClick={() => router.back()} className={cls} aria-label="戻る">
        {CHEVRON}
      </button>
    )
  }

  return (
    <Link href={back ?? '/'} className={cls} aria-label="ホームへ戻る">
      {CHEVRON}
    </Link>
  )
}

export default function PageHeader({ title, back, right, children }: Props) {
  return (
    <header className="sticky top-0 bg-white z-10 border-b border-line">
      <div className="h-0.5 bg-primary" />
      <div className="px-4 pt-3 pb-3">
        <div className={`flex items-center gap-2 ${children ? 'mb-2' : ''}`}>
          <BackButton back={back} />
          <h1 className="text-xl font-bold tracking-tight text-primary flex-1 min-w-0 truncate">
            {title}
          </h1>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
        {children}
      </div>
    </header>
  )
}
