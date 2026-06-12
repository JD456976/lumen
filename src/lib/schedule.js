// Scheduling helpers for protocols. Local-time based.

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseTime(t) {
  const [h, m] = (t || '08:00').split(':').map(Number)
  return [h || 0, m || 0]
}

function activeDays(p) {
  if (p.frequency === 'daily') return [0, 1, 2, 3, 4, 5, 6]
  return p.days_of_week || []
}

// Next scheduled datetime at or after `now`, or null for as-needed.
export function nextDue(p, now = new Date()) {
  if (p.frequency === 'as_needed') return null
  const days = activeDays(p)
  if (!days.length) return null
  const [h, m] = parseTime(p.time_of_day)
  for (let i = 0; i < 14; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    d.setHours(h, m, 0, 0)
    if (days.includes(d.getDay()) && d > now) return d
  }
  return null
}

export function isDueToday(p, now = new Date()) {
  if (p.frequency === 'as_needed') return false
  return activeDays(p).includes(now.getDay())
}

export function frequencyLabel(p) {
  switch (p.frequency) {
    case 'daily':
      return 'Daily'
    case 'as_needed':
      return 'As needed'
    case 'weekly':
    case 'custom': {
      const d = (p.days_of_week || []).slice().sort((a, b) => a - b)
      if (d.length === 7) return 'Daily'
      return d.map((x) => DOW[x]).join(', ') || '—'
    }
    default:
      return p.frequency
  }
}

export function fmtNext(d) {
  if (!d) return 'As needed'
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  if (isTomorrow) return `Tomorrow, ${time}`
  return `${DOW[d.getDay()]}, ${time}`
}
