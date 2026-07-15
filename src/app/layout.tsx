import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IR Skill Up',
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
      <body className="max-w-lg mx-auto min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
        <main>{children}</main>
      </body>
    </html>
  )
}
