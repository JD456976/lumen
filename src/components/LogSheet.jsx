import { useState } from 'react'
import { fmtAmount } from '../lib/calc'

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
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    await onConfirm({
      ...draft,
      taken_at: new Date(takenAt).toISOString(),
      side_effects: sideEffects.trim() || null,
      notes: notes.trim() || null,
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
      <input className="in" type="datetime-local" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />

      <label className="lbl">Side effects</label>
      <input className="in" value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} placeholder="none / flushing / nausea…" />

      <label className="lbl">Notes</label>
      <textarea className="in" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />

      <div className="actions mt">
        <button className="primary block" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : 'Save to log'}</button>
        <button className="ghost wide" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
