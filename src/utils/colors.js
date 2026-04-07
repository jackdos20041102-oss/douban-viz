export const GENRE_COLORS = {
  '剧情': '#6366f1', '喜剧': '#f59e0b', '动作': '#ef4444', '爱情': '#ec4899',
  '科幻': '#06b6d4', '动画': '#22c55e', '悬疑': '#8b5cf6', '惊悚': '#f97316',
  '犯罪': '#64748b', '冒险': '#14b8a6', '奇幻': '#a855f7', '战争': '#78716c',
  '音乐': '#d946ef', '传记': '#0ea5e9', '历史': '#92400e', '家庭': '#fb923c',
  '恐怖': '#1e293b', '西部': '#a16207', '武侠': '#dc2626', '古装': '#be123c',
  '歌舞': '#c026d3', '情色': '#e11d48', '纪录片': '#059669', '短片': '#475569',
  '儿童': '#4ade80', '同性': '#f472b6',
}

export function genreColor(g) { return GENRE_COLORS[g] || '#94a3b8' }

export function ratingColor(r) {
  if (r >= 9.5) return '#b45309'
  if (r >= 9.0) return '#d97706'
  if (r >= 8.5) return '#f59e0b'
  return '#fbbf24'
}

export function stars(r) {
  const full = Math.floor(r / 2)
  const half = r % 2 >= 0.5 ? 1 : 0
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half)
}

export const COMPARE_COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']
