import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'IR Radar',
  description: 'IRトレンドを隙間時間にインプット',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-white max-w-lg mx-auto min-h-screen pb-20">
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
