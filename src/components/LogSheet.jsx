import { useEffect, useState } from 'react'
import { fmtAmount } from '../lib/calc'
import { listLogs } from '../lib/db'
import BodyMap from './BodyMap'

// Local datetime string for <input type="datetime-local">
function nowLocal() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function LogSheet({ draft, onConfirm, onClose }) {
  const [takenAt, setTakenAt] = useState(nowLocal())
  const [sideEffects, setSideEffects] = useState('')
  const [notes, setNotes] = useState('')
  const [site, setSite] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listLogs().then(setRecentLogs).catch(() => setRecentLogs([]))
  }, [])

  async function confirm(status = 'taken') {
    setBusy(true)
    await onConfirm({
      ...draft,
      taken_at: new Date(takenAt).toISOString(),
      side_effects: sideEffects.trim() || null,
      notes: notes.trim() || null,
      site,
      status,
    })
    setBusy(false)
  }

  return (
    <div className="form">
      <div className="muted xs">{draft.vial_name} · {draft.draw_units} u</div>
      <div className="chips mb">
        {(draft.breakdown || []).map((b, i) => (
          <span className="chip" key={i}>{b.name} {fmtAmount(b.mcg)}</span>
        ))}
      </div>

      <label className="lbl">When</label>
      <div className="dose-in">
        <input className="in" type="datetime-local" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
        <button className="mini" onClick={() => setTakenAt(nowLocal())}>Now</button>
      </div>

      <label className="lbl">Injection site</label>
      <BodyMap logs={recentLogs} value={site} onChange={setSite} />

      <label className="lbl">Side effects</label>
      <input className="in" value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} placeholder="none / flushing / nausea…" />

      <label className="lbl">Notes</label>
      <textarea className="in" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />

      <div className="actions mt">
        <button className="primary block" disabled={busy} onClick={() => confirm('taken')}>{busy ? 'Saving…' : 'Save to log'}</button>
        <button className="skip-btn" disabled={busy} onClick={() => confirm('skipped')}>Skip</button>
      </div>
    </div>
  )
}
