import { useState } from 'react'
import { updateLog } from '../lib/db'
import BodyMap from './BodyMap'

function toLocal(iso) {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function LogEdit({ log, recentLogs = [], onSaved }) {
  const [takenAt, setTakenAt] = useState(toLocal(log.taken_at))
  const [site, setSite] = useState(log.site || null)
  const [sideEffects, setSideEffects] = useState(log.side_effects || '')
  const [notes, setNotes] = useState(log.notes || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await updateLog(log.id, {
        taken_at: new Date(takenAt).toISOString(),
        site,
        side_effects: sideEffects.trim() || null,
        notes: notes.trim() || null,
      })
      onSaved()
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form">
      <div className="muted xs mb">{log.vial_name}{log.draw_units ? ` · ${log.draw_units} u` : ''}</div>

      <label className="lbl">When</label>
      <input className="in" type="datetime-local" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />

      <label className="lbl">Injection site</label>
      <BodyMap logs={recentLogs.filter((l) => l.id !== log.id)} value={site} onChange={setSite} />

      <label className="lbl">Side effects</label>
      <input className="in" value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} placeholder="none / flushing…" />

      <label className="lbl">Note</label>
      <input className="in" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />

      {error && <div className="alert">{error}</div>}
      <button className="primary block mt" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
    </div>
  )
}
