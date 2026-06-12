// A U-100 insulin syringe drawn to `units`. Amber fill, tick marks at 10s.
export default function SyringeBar({ units }) {
  const u = Math.max(0, Math.min(100, units))
  const x0 = 30
  const w = 240
  const fill = (u / 100) * w
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

  return (
    <svg viewBox="0 0 320 96" width="100%" role="img" aria-label={`Syringe drawn to ${u} units`}>
      {/* barrel */}
      <rect x={x0} y="32" width={w} height="28" rx="6" fill="#15151a" stroke="#2c2c33" strokeWidth="1" />
      {/* fill */}
      <rect x={x0} y="32" width={fill} height="28" rx="6" fill="#f5c66b" opacity="0.9" />
      {/* plunger edge */}
      {fill > 2 && <rect x={x0 + fill - 2} y="28" width="3" height="36" rx="1.5" fill="#d9774f" />}
      {/* ticks */}
      {ticks.map((t) => {
        const x = x0 + (t / 100) * w
        const major = t % 20 === 0
        return (
          <g key={t}>
            <line x1={x} y1="32" x2={x} y2={major ? 24 : 28} stroke="#6a6a72" strokeWidth="1" />
            {major && (
              <text x={x} y="18" textAnchor="middle" fontSize="10" fill="#8a8a93">{t}</text>
            )}
          </g>
        )
      })}
      {/* needle */}
      <line x1={x0 + w} y1="46" x2="312" y2="46" stroke="#6a6a72" strokeWidth="2" />
      {/* flange */}
      <rect x={x0 - 4} y="28" width="4" height="36" rx="2" fill="#2c2c33" />
      {/* label */}
      <text x={x0 + w / 2} y="82" textAnchor="middle" fontSize="13" fill="#f5c66b" fontWeight="500">
        draw to {u} units
      </text>
    </svg>
  )
}
