import { useEffect, useState } from 'react'
import { listLogs, listProtocols, deleteLog } from '../lib/db'
import { fmtAmount } from '../lib/calc'
import Calendar from '../components/Calendar'
import InSystem from '../components/InSystem'

export default function LogPage({ refreshKey }) {
  const [logs, setLogs] = useState([])
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let on = true
    Promise.all([listLogs(), listProtocols().catch(() => [])])
      .then(([l, p]) => {
        if (!on) return
        setLogs(l)
        setProtocols(p)
      })
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

  const shown = selected
    ? logs.filter((l) => new Date(l.taken_at).toDateString() === selected.toDateString())
    : logs

  return (
    <div className="page pad">
      <div className="title mb">Log</div>

      <InSystem logs={logs} />

      <Calendar logs={logs} protocols={protocols} selected={selected} onSelect={setSelected} />

      {selected && (
        <div className="muted sm sel-row">
          <span>{selected.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          <button className="link-btn" onClick={() => setSelected(null)}>Show all</button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="empty">
          <i className="ti ti-clipboard-list" aria-hidden="true" />
          <p>{selected ? 'No doses logged this day.' : 'No doses logged yet.'}</p>
          {!selected && <p className="muted sm">Tap “Log dose” on the calculator or a protocol.</p>}
        </div>
      ) : (
        shown.map((l) => (
          <div className="log-card" key={l.id}>
            <div className="log-top">
              <span className="title sm">{l.vial_name || 'Dose'}</span>
              <button className="icon-btn" aria-label="Delete" onClick={() => remove(l.id)}>
                <i className="ti ti-trash" aria-hidden="true" />
              </button>
            </div>
            <div className="muted sm">
              {new Date(l.taken_at).toLocaleString()} · {l.draw_units} u
              {l.site && ` · ${l.site}`}
              {l.status === 'skipped' && ' · skipped'}
            </div>
            <div className="chips">
              {(l.breakdown || []).map((b, i) => (
                <span className="chip" key={i}>{b.name} {fmtAmount(b.mcg)}</span>
              ))}
            </div>
            {l.side_effects && <div className="muted sm">Side effects: {l.side_effects}</div>}
          </div>
        ))
      )}
    </div>
  )
}
