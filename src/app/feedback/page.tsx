export const dynamic = 'force-dynamic'

export default function FeedbackPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-white z-10 border-b border-line">
        <div className="h-0.5 bg-primary" />
        <div className="px-4 pt-3 pb-3">
          <h1 className="text-xl font-bold tracking-tight text-primary">振り返りレポート</h1>
        </div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-4xl mb-4">🔮</p>
        <p
          className="text-lg font-semibold text-primary mb-2"
          style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif" }}
        >
          準備中
        </p>
        <p className="text-sm text-sub leading-relaxed">
          週次・月次のAIフィードバック機能は<br />
          第2・第3段階で実装予定です。<br />
          <br />
          まずは記録を積み上げていきましょう。
        </p>
      </div>
    </div>
  )
}
