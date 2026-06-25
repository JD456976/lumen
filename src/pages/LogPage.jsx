import { useEffect, useState } from 'react'
import { listLogs, listProtocols, deleteLog, incrementDoses } from '../lib/db'
import { fmtAmount } from '../lib/calc'
import Calendar from '../components/Calendar'
import InSystem from '../components/InSystem'
import Sheet from '../components/Sheet'
import LogEdit from '../components/LogEdit'

export default function LogPage({ refreshKey }) {
  const [logs, setLogs] = useState([])
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('history') // history | calendar | levels
  const [editLog, setEditLog] = useState(null)
  const [localBump, setLocalBump] = useState(0)

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
  }, [refreshKey, localBump])

  async function remove(l) {
    await deleteLog(l.id)
    if (l.vial_id && l.status !== 'skipped') await incrementDoses(l.vial_id) // give the dose back
    setLogs((prev) => prev.filter((x) => x.id !== l.id))
  }

  if (loading) return <div className="page pad muted">Loading…</div>

  const shown =
    view === 'calendar' && selected
      ? logs.filter((l) => new Date(l.taken_at).toDateString() === selected.toDateString())
      : logs

  function card(l) {
    return (
      <div className="log-card tappable" key={l.id} onClick={() => setEditLog(l)}>
        <div className="log-top">
          <span className="title sm">{l.vial_name || 'Dose'}</span>
          <button className="icon-btn" aria-label="Delete" onClick={(e) => { e.stopPropagation(); remove(l) }}>
            <i className="ti ti-trash" aria-hidden="true" />
          </button>
        </div>
        <div className="muted sm">
          {new Date(l.taken_at).toLocaleString()}
          {l.draw_units ? ` · ${l.draw_units} u` : ''}
          {l.site && ` · ${l.site}`}
          {l.status === 'skipped' && ' · skipped'}
        </div>
        <div className="chips">
          {(l.breakdown || []).map((b, i) => (
            <span className="chip" key={i}>{b.name} {fmtAmount(b.mcg)}</span>
          ))}
        </div>
        {l.side_effects && <div className="muted sm">Side effects: {l.side_effects}</div>}
        {l.notes && <div className="muted sm">Note: {l.notes}</div>}
      </div>
    )
  }

  const emptyHistory = (
    <div className="empty">
      <i className="ti ti-clipboard-list" aria-hidden="true" />
      <p>No doses logged yet.</p>
      <p className="muted sm">Tap a peptide's “Take” on the Today screen.</p>
    </div>
  )

  return (
    <div className="page pad">
      <div className="title mb">Log</div>

      <div className="seg mb" style={{ margin: '0 0 12px' }}>
        <button className={view === 'history' ? 'on' : ''} onClick={() => setView('history')}>History</button>
        <button className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>Calendar</button>
        <button className={view === 'levels' ? 'on' : ''} onClick={() => setView('levels')}>Levels</button>
      </div>

      {view === 'history' && (logs.length === 0 ? emptyHistory : logs.map(card))}

      {view === 'calendar' && (
        <>
          <Calendar logs={logs} protocols={protocols} selected={selected} onSelect={setSelected} />
          {selected && (
            <div className="muted sm sel-row">
              <span>{selected.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <button className="link-btn" onClick={() => setSelected(null)}>Clear</button>
            </div>
          )}
          {selected
            ? shown.length
              ? shown.map(card)
              : <div className="muted sm">No doses logged this day.</div>
            : <div className="muted sm">Tap a day to see its doses.</div>}
        </>
      )}

      {view === 'levels' && (
        logs.length === 0
          ? <div className="muted sm">Log some doses to see estimated levels in your system.</div>
          : <InSystem logs={logs} />
      )}

      {editLog && (
        <Sheet title="Edit dose" onClose={() => setEditLog(null)}>
          <LogEdit
            log={editLog}
            recentLogs={logs}
            onSaved={() => { setEditLog(null); setLocalBump((n) => n + 1) }}
          />
        </Sheet>
      )}
    </div>
  )
}
