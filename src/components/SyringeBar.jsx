// An insulin syringe drawn to `units` on a barrel of `max` units (= 1 mL).
export default function SyringeBar({ units, max = 100 }) {
  const u = Math.max(0, Math.min(max, units))
  const x0 = 30
  const w = 240
  const fill = (u / max) * w
  const step = max / 10
  const ticks = Array.from({ length: 11 }, (_, i) => Math.round(i * step))

  return (
    <svg viewBox="0 0 320 96" width="100%" role="img" aria-label={`Syringe drawn to ${u} units`}>
      <rect x={x0} y="32" width={w} height="28" rx="6" fill="#15151a" stroke="#2c2c33" strokeWidth="1" />
      <rect x={x0} y="32" width={fill} height="28" rx="6" fill="#f5c66b" opacity="0.9" />
      {fill > 2 && <rect x={x0 + fill - 2} y="28" width="3" height="36" rx="1.5" fill="#d9774f" />}
      {ticks.map((t, i) => {
        const x = x0 + (i / 10) * w
        const major = i % 2 === 0
        return (
          <g key={i}>
            <line x1={x} y1="32" x2={x} y2={major ? 24 : 28} stroke="#6a6a72" strokeWidth="1" />
            {major && <text x={x} y="18" textAnchor="middle" fontSize="10" fill="#8a8a93">{t}</text>}
          </g>
        )
      })}
      <line x1={x0 + w} y1="46" x2="312" y2="46" stroke="#6a6a72" strokeWidth="2" />
      <rect x={x0 - 4} y="28" width="4" height="36" rx="2" fill="#2c2c33" />
      <text x={x0 + w / 2} y="82" textAnchor="middle" fontSize="13" fill="#f5c66b" fontWeight="500">
        draw to {u} units
      </text>
    </svg>
  )
}
