/**
 * Format timestamp into concise relative time matching DSH style ("刚刚", "5分钟", "16小时", "昨天", "3天前").
 */
export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp || typeof timestamp !== 'number') return ''
  const diff = Date.now() - timestamp
  if (diff < 0) return '刚刚'

  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'

  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟`

  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}小时`

  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  if (days < 30) return `${days}天前`

  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
