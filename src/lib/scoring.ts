const HIGH = ['東証', '開示義務', 'ガバナンス・コード', '英文開示', 'SSBJ', 'ベンチマーク']
const MID = ['決算', '統合報告書', '個人投資家', '生成AI', 'IR', 'note']
const LOW = ['株主', '上場', '開示', '投資']

export function calcRuleScore(title: string): number {
  let score = 0
  for (const kw of HIGH) if (title.includes(kw)) score += 3
  for (const kw of MID) if (title.includes(kw)) score += 2
  for (const kw of LOW) if (title.includes(kw)) score += 1
  return score
}
