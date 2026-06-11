import { useEffect, useState } from 'react'
import { listLogs, deleteLog } from '../lib/db'
import { fmtAmount } from '../lib/calc'

export default function LogPage({ refreshKey }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    listLogs()
      .then((d) => on && setLogs(d))
      .catch(() => on && setLogs([]))
      .finally(() => on && setLoading(false))
    return () => {
      on = false
    }
  }, [refreshKey])

  async function remove(id) {
    await deleteLog(id)
    setLogs((l) => l.filter((x) => x.id !== id))
  }

  if (loading) return <div className="page pad muted">Loading…</div>

  if (logs.length === 0) {
    return (
      <div className="empty">
        <i className="ti ti-clipboard-list" aria-hidden="true" />
        <p>No doses logged yet.</p>
        <p className="muted sm">Tap “Log dose” on the calculator to record one.</p>
      </div>
    )
  }

  return (
    <div className="page pad">
      <div className="title mb">Log</div>
      {logs.map((l) => (
        <div className="log-card" key={l.id}>
          <div className="log-top">
            <span className="title sm">{l.vial_name || 'Dose'}</span>
            <button className="icon-btn" aria-label="Delete" onClick={() => remove(l.id)}>
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          </div>
          <div className="muted sm">
            {new Date(l.taken_at).toLocaleString()} · {l.draw_units} u
          </div>
          <div className="chips">
            {(l.breakdown || []).map((b, i) => (
              <span className="chip" key={i}>{b.name} {fmtAmount(b.mcg)}</span>
            ))}
          </div>
          {l.side_effects && <div className="muted sm">Side effects: {l.side_effects}</div>}
        </div>
      ))}
    </div>
  )
}
