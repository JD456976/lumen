// Tiny area sparkline for a [{t, v}] series.
export default function Sparkline({ points, color = '#f5c66b', w = 300, h = 56 }) {
  if (!points || points.length < 2) return null
  const max = Math.max(...points.map((p) => p.v), 1)
  const x = (i) => (i / (points.length - 1)) * w
  const y = (v) => h - (v / max) * (h - 4) - 2
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
  const area = `${line} L${w} ${h} L0 ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={area} fill={color} opacity="0.14" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
