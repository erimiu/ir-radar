interface Props {
  score: number
}

export default function ImportanceBadge({ score }: Props) {
  if (score === 0) return null
  const color =
    score >= 6
      ? 'bg-[#E63946] text-white'
      : score >= 3
      ? 'bg-orange-400 text-white'
      : 'bg-gray-200 text-gray-600'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      ★{score}
    </span>
  )
}
