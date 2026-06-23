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

export function daysSinceStart(p, date = new Date()) {
  if (!p.start_date) return 0
  const start = new Date(p.start_date + 'T00:00:00')
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((d - start) / 86400000))
}

// Next scheduled datetime at or after `now`, or null for as-needed.
export function nextDue(p, now = new Date()) {
  if (p.frequency === 'as_needed') return null
  const [h, m] = parseTime(p.time_of_day)
  for (let i = 0; i < 21; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    d.setHours(h, m, 0, 0)
    if (isDueOn(p, d) && d > now) return d
  }
  return null
}

export function isDueToday(p, now = new Date()) {
  return isDueOn(p, now)
}

// Whole weeks elapsed since the protocol's start date.
export function weeksSinceStart(p, date = new Date()) {
  if (!p.start_date) return 0
  const start = new Date(p.start_date + 'T00:00:00')
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((d - start) / (7 * 86400000)))
}

// Is this an "on" week (vs a cycle rest week)?
export function isOnWeek(p, date = new Date()) {
  const on = p.cycle_weeks_on || 0
  const off = p.cycle_weeks_off || 0
  if (on <= 0 || off <= 0) return true
  return weeksSinceStart(p, date) % (on + off) < on
}

// The effective draw for the current titration phase (or flat draw if none).
export function currentDraw(p, date = new Date()) {
  const phases = p.phases || []
  if (!phases.length) return p.draw_units
  const wk = weeksSinceStart(p, date)
  let acc = 0
  for (const ph of phases) {
    acc += ph.weeks || 0
    if (wk < acc) return ph.draw_units
  }
  return phases[phases.length - 1].draw_units // past last phase: hold last dose
}

export function cycleLabel(p) {
  if (!(p.cycle_weeks_on > 0 && p.cycle_weeks_off > 0)) return null
  return `${p.cycle_weeks_on}w on / ${p.cycle_weeks_off}w off`
}

// Was this protocol scheduled on a given calendar date?
export function isDueOn(p, date) {
  if (p.frequency === 'as_needed') return false
  if (p.start_date) {
    const start = new Date(p.start_date + 'T00:00:00')
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    if (d < start) return false
  }
  if (p.frequency === 'eod') return daysSinceStart(p, date) % 2 === 0 && isOnWeek(p, date)
  return activeDays(p).includes(date.getDay()) && isOnWeek(p, date)
}

// Adherence % over the last `days`: taken / scheduled occurrences.
export function adherence(p, logs, days = 30, now = new Date()) {
  if (p.frequency === 'as_needed') return null
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))
  const pStart = p.start_date ? new Date(p.start_date + 'T00:00:00') : start
  const from = pStart > start ? pStart : start

  let scheduled = 0
  for (let d = new Date(from); d <= today; d.setDate(d.getDate() + 1)) {
    if (isDueOn(p, d)) scheduled++
  }
  if (!scheduled) return null
  const fromMs = from.getTime()
  const taken = logs.filter(
    (l) => l.protocol_id === p.id && l.status !== 'skipped' && new Date(l.taken_at).getTime() >= fromMs,
  ).length
  return Math.min(100, Math.round((taken / scheduled) * 100))
}

export function frequencyLabel(p) {
  switch (p.frequency) {
    case 'daily':
      return 'Daily'
    case 'eod':
      return 'Every other day'
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
