// 20-zone injection-site map (front + back) with rotation coloring.
// safe (green) · used recently (amber) · used today (red).
import { useState } from 'react'

export const SITES_FRONT = [
  { id: 'L Delt', cx: 62, cy: 94 },
  { id: 'R Delt', cx: 158, cy: 94 },
  { id: 'L Arm', cx: 47, cy: 132 },
  { id: 'R Arm', cx: 173, cy: 132 },
  { id: 'Abd UL', cx: 95, cy: 160 },
  { id: 'Abd UM', cx: 110, cy: 158 },
  { id: 'Abd UR', cx: 125, cy: 160 },
  { id: 'Abd LL', cx: 95, cy: 182 },
  { id: 'Abd LM', cx: 110, cy: 183 },
  { id: 'Abd LR', cx: 125, cy: 182 },
  { id: 'L Flank', cx: 78, cy: 172 },
  { id: 'R Flank', cx: 142, cy: 172 },
  { id: 'L Thigh Up', cx: 91, cy: 248 },
  { id: 'R Thigh Up', cx: 129, cy: 248 },
  { id: 'L Thigh Lo', cx: 91, cy: 296 },
  { id: 'R Thigh Lo', cx: 129, cy: 296 },
]

export const SITES_BACK = [
  { id: 'L Tricep', cx: 47, cy: 132 },
  { id: 'R Tricep', cx: 173, cy: 132 },
  { id: 'Low Back L', cx: 96, cy: 176 },
  { id: 'Low Back R', cx: 124, cy: 176 },
  { id: 'L Glute', cx: 93, cy: 210 },
  { id: 'R Glute', cx: 127, cy: 210 },
  { id: 'L Ham Up', cx: 91, cy: 258 },
  { id: 'R Ham Up', cx: 129, cy: 258 },
  { id: 'L Ham Lo', cx: 91, cy: 300 },
  { id: 'R Ham Lo', cx: 129, cy: 300 },
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
