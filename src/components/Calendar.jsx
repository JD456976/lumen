import { useMemo, useState } from 'react'
import { isDueOn } from '../lib/schedule'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function sameDay(a, b) {
  return a.toDateString() === b.toDateString()
}

// status: 'completed' | 'skipped' | 'missed' | 'upcoming' | null
function dayStatus(date, logsByDay, protocols, today) {
  const key = date.toDateString()
  const logs = logsByDay[key]
  if (logs?.length) {
    return logs.some((l) => l.status !== 'skipped') ? 'completed' : 'skipped'
  }
  const due = protocols.some((p) => isDueOn(p, date))
  if (!due) return null
  date.setHours(0, 0, 0, 0)
  return date < today ? 'missed' : 'upcoming'
}

export default function Calendar({ logs, protocols, selected, onSelect }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const logsByDay = useMemo(() => {
    const map = {}
    for (const l of logs) {
      const k = new Date(l.taken_at).toDateString()
      ;(map[k] ||= []).push(l)
    }
    return map
  }, [logs])

  const first = new Date(cursor.y, cursor.m, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.y, cursor.m, d))

  function shift(delta) {
    setCursor((c) => {
      const m = c.m + delta
      return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
    })
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="icon-btn" aria-label="Previous month" onClick={() => shift(-1)}>
          <i className="ti ti-chevron-left" aria-hidden="true" />
        </button>
        <span className="title sm">{MONTHS[cursor.m]} {cursor.y}</span>
        <button className="icon-btn" aria-label="Next month" onClick={() => shift(1)}>
          <i className="ti ti-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div className="cal-grid dow">
        {DOW.map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />
          const status = dayStatus(new Date(date), logsByDay, protocols, today)
          const isToday = sameDay(date, new Date())
          const isSel = selected && sameDay(date, selected)
          return (
            <button
              key={i}
              className={`cal-cell ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''}`}
              onClick={() => onSelect(isSel ? null : date)}
            >
              <span>{date.getDate()}</span>
              {status && <span className={`cal-dot ${status}`} />}
            </button>
          )
        })}
      </div>

      <div className="cal-legend">
        <span><span className="cal-dot completed" /> Done</span>
        <span><span className="cal-dot skipped" /> Skipped</span>
        <span><span className="cal-dot missed" /> Missed</span>
        <span><span className="cal-dot upcoming" /> Upcoming</span>
      </div>
    </div>
  )
}
