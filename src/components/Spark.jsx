// Lumen mark — a radiant light source. Amber core, coral falloff (Anthropic warm).
export default function Spark({ size = 24 }) {
  const id = 'lumen-core'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor="#fbe6b8" />
          <stop offset="45%" stopColor="#f5c66b" />
          <stop offset="100%" stopColor="#d9774f" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="#f5c66b" opacity="0.16" />
      <circle cx="50" cy="50" r="30" fill="#f5c66b" opacity="0.22" />
      <g fill="#f5c66b" opacity="0.9">
        <rect x="48.5" y="4" width="3" height="13" rx="1.5" />
        <rect x="48.5" y="83" width="3" height="13" rx="1.5" />
        <rect x="4" y="48.5" width="13" height="3" rx="1.5" />
        <rect x="83" y="48.5" width="13" height="3" rx="1.5" />
        <rect x="17" y="18" width="3" height="10" rx="1.5" transform="rotate(-45 18.5 23)" />
        <rect x="80" y="18" width="3" height="10" rx="1.5" transform="rotate(45 81.5 23)" />
        <rect x="17" y="72" width="3" height="10" rx="1.5" transform="rotate(45 18.5 77)" />
        <rect x="80" y="72" width="3" height="10" rx="1.5" transform="rotate(-45 81.5 77)" />
      </g>
      <circle cx="50" cy="50" r="20" fill={`url(#${id})`} />
    </svg>
  )
}
