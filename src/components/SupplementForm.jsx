import { useState } from 'react'
import { addSupplement } from '../lib/db'
import { DOW } from '../lib/schedule'

const FREQS = [
  { id: 'daily', label: 'Daily' },
  { id: 'custom', label: 'Specific days' },
  { id: 'as_needed', label: 'As needed' },
]

export default function SupplementForm({ onDone }) {
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [days, setDays] = useState([1])
  const [time, setTime] = useState('08:00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function toggleDay(d) {
    setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]))
  }

  async function save() {
    if (!name.trim()) {
      setError('Give it a name.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addSupplement({
        name: name.trim(),
        dose: dose.trim() || null,
        frequency,
        days_of_week: frequency === 'custom' ? days : [],
        time_of_day: time,
      })
      onDone()
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form">
      <label className="lbl">Name</label>
      <input className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vitamin D3, Magnesium…" />

      <label className="lbl">Dose <span className="muted">(free text)</span></label>
      <input className="in" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="5000 IU, 2 capsules…" />

      <label className="lbl">Frequency</label>
      <div className="chip-row">
        {FREQS.map((f) => (
          <button key={f.id} className={`mini ${frequency === f.id ? 'on' : ''}`} onClick={() => setFrequency(f.id)}>{f.label}</button>
        ))}
      </div>

      {frequency === 'custom' && (
        <>
          <label className="lbl">Days</label>
          <div className="chip-row">
            {DOW.map((d, i) => (
              <button key={i} className={`mini ${days.includes(i) ? 'on' : ''}`} onClick={() => toggleDay(i)}>{d}</button>
            ))}
          </div>
        </>
      )}

      {frequency !== 'as_needed' && (
        <>
          <label className="lbl">Time</label>
          <input className="in" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </>
      )}

      {error && <div className="alert">{error}</div>}
      <button className="primary block mt" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Add supplement'}</button>
    </div>
  )
}
