// 20-zone injection-site map (front + back) with rotation coloring.
// safe (green) · used recently (amber) · used today (red).
import { useState } from 'react'

export const SITES_FRONT = [
  { id: 'L Delt', cx: 64, cy: 96 },
  { id: 'R Delt', cx: 156, cy: 96 },
  { id: 'L Arm', cx: 50, cy: 132 },
  { id: 'R Arm', cx: 170, cy: 132 },
  { id: 'Abd UL', cx: 93, cy: 168 },
  { id: 'Abd UM', cx: 110, cy: 165 },
  { id: 'Abd UR', cx: 127, cy: 168 },
  { id: 'Abd LL', cx: 93, cy: 194 },
  { id: 'Abd LM', cx: 110, cy: 196 },
  { id: 'Abd LR', cx: 127, cy: 194 },
  { id: 'L Thigh', cx: 92, cy: 280 },
  { id: 'R Thigh', cx: 128, cy: 280 },
]

export const SITES_BACK = [
  { id: 'L Tricep', cx: 50, cy: 132 },
  { id: 'R Tricep', cx: 170, cy: 132 },
  { id: 'Low Back L', cx: 96, cy: 190 },
  { id: 'Low Back R', cx: 124, cy: 190 },
  { id: 'L Glute', cx: 94, cy: 225 },
  { id: 'R Glute', cx: 126, cy: 225 },
  { id: 'L Ham', cx: 92, cy: 285 },
  { id: 'R Ham', cx: 128, cy: 285 },
]

function statusFor(id, logs, now) {
  let last = 0
  for (const l of logs) {
    if (l.site === id) {
      const t = new Date(l.taken_at).getTime()
      if (t > last) last = t
    }
  }
  if (!last) return 'safe'
  const days = (now - last) / 86400000
  if (days < 1) return 'today'
  if (days < 4) return 'recent'
  return 'safe'
}

const FILL = { safe: '#1f3a32', recent: '#3a2f17', today: '#3a1a1a' }
const RING = { safe: '#5dcaa5', recent: '#e0a36a', today: '#d9534f' }

export default function BodyMap({ logs = [], value, onChange }) {
  const [view, setView] = useState('front')
  const now = Date.now()
  const sites = view === 'front' ? SITES_FRONT : SITES_BACK

  return (
    <div className="bodymap">
      <div className="seg" style={{ margin: '0 0 8px' }}>
        <button className={view === 'front' ? 'on' : ''} onClick={() => setView('front')}>Front</button>
        <button className={view === 'back' ? 'on' : ''} onClick={() => setView('back')}>Back</button>
      </div>

      <svg viewBox="0 0 220 360" width="100%" role="img" aria-label="Injection site map">
        <g fill="#16161c" stroke="#2c2c33" strokeWidth="1">
          <circle cx="110" cy="34" r="20" />
          <rect x="78" y="56" width="64" height="14" rx="7" />
          <path d="M70 72 Q110 64 150 72 L160 200 Q110 214 60 200 Z" />
          <rect x="40" y="78" width="18" height="80" rx="9" />
          <rect x="162" y="78" width="18" height="80" rx="9" />
          <rect x="76" y="206" width="26" height="120" rx="13" />
          <rect x="118" y="206" width="26" height="120" rx="13" />
        </g>
        {sites.map((s) => {
          const st = statusFor(s.id, logs, now)
          const sel = value === s.id
          return (
            <circle
              key={s.id}
              cx={s.cx}
              cy={s.cy}
              r={sel ? 11 : 9}
              fill={FILL[st]}
              stroke={sel ? '#f5c66b' : RING[st]}
              strokeWidth={sel ? 2.5 : 1.5}
              style={{ cursor: 'pointer' }}
              onClick={() => onChange(s.id)}
            />
          )
        })}
      </svg>

      <div className="bm-legend">
        <span><span className="cal-dot" style={{ background: RING.safe }} /> Safe</span>
        <span><span className="cal-dot" style={{ background: RING.recent }} /> Recent</span>
        <span><span className="cal-dot" style={{ background: RING.today }} /> Today</span>
      </div>
      <div className="bm-selected muted sm">{value ? `Site: ${value}` : 'Tap a site (optional)'}</div>
    </div>
  )
}
