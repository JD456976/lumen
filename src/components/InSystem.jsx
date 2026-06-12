import { peptidesInLogs, levelAt, series, halfLifeFor } from '../lib/pk'
import { fmtAmount } from '../lib/calc'
import { colorFor } from '../lib/library'
import Sparkline from './Sparkline'

export default function InSystem({ logs }) {
  const now = Date.now()
  const names = peptidesInLogs(logs)
    .map((name) => ({ name, level: levelAt(logs, name, now) }))
    .filter((p) => p.level > 0.5)
    .sort((a, b) => b.level - a.level)

  if (!names.length) return null

  return (
    <div className="insystem">
      <div className="muted xs mb">IN YOUR SYSTEM NOW · estimated</div>
      {names.map((p) => (
        <div className="is-row" key={p.name}>
          <div className="is-head">
            <span className="dot-name">
              <span className="dot" style={{ background: colorFor(p.name) }} />
              {p.name}
            </span>
            <span className="is-level">{fmtAmount(p.level)}</span>
          </div>
          <Sparkline points={series(logs, p.name)} color={colorFor(p.name)} />
          <div className="muted xs">t½ ≈ {halfLifeFor(p.name)}h · last 14 days</div>
        </div>
      ))}
      <div className="muted xs is-note">Estimates from typical half-lives — not a measurement.</div>
    </div>
  )
}
