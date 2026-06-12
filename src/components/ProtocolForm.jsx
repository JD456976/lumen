import { useState } from 'react'
import { addProtocol } from '../lib/db'
import { DOW } from '../lib/schedule'

const FREQS = [
  { id: 'daily', label: 'Daily' },
  { id: 'custom', label: 'Specific days' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'as_needed', label: 'As needed' },
]

export default function ProtocolForm({ vials, onDone }) {
  const usable = vials.filter((v) => v.persisted)
  const [vialId, setVialId] = useState(usable[0]?.id || '')
  const vial = usable.find((v) => v.id === vialId)
  const [draw, setDraw] = useState(vial?.default_draw_units ?? 20)
  const [bac, setBac] = useState(vial?.default_bac_water_ml ?? 2)
  const [frequency, setFrequency] = useState('daily')
  const [days, setDays] = useState([1]) // Mon default
  const [time, setTime] = useState('08:00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function pickVial(id) {
    setVialId(id)
    const v = usable.find((x) => x.id === id)
    if (v) {
      setDraw(v.default_draw_units ?? 20)
      setBac(v.default_bac_water_ml ?? 2)
    }
  }
  function toggleDay(d) {
    setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]))
  }

  async function save() {
    setError(null)
    if (!vialId) {
      setError('Add a vial first, then schedule it.')
      return
    }
    setBusy(true)
    try {
      await addProtocol({
        vial_id: vialId,
        draw_units: Number(draw),
        bac_water_ml: Number(bac),
        frequency,
        days_of_week: frequency === 'daily' || frequency === 'as_needed' ? [] : days,
        time_of_day: time,
      })
      onDone()
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  if (!usable.length) {
    return <div className="muted sm">You need a saved vial first. Add one in the Vials tab.</div>
  }

  const showDays = frequency === 'custom' || frequency === 'weekly'

  return (
    <div className="form">
      <label className="lbl">Vial</label>
      <select className="in" value={vialId} onChange={(e) => pickVial(e.target.value)}>
        {usable.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>

      <div className="two">
        <div>
          <label className="lbl">Draw (units)</label>
          <input className="in" type="number" inputMode="decimal" value={draw} onChange={(e) => setDraw(e.target.value)} />
        </div>
        <div>
          <label className="lbl">Bac water (mL)</label>
          <input className="in" type="number" inputMode="decimal" value={bac} onChange={(e) => setBac(e.target.value)} />
        </div>
      </div>

      <label className="lbl">Frequency</label>
      <div className="chip-row">
        {FREQS.map((f) => (
          <button key={f.id} className={`mini ${frequency === f.id ? 'on' : ''}`} onClick={() => setFrequency(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {showDays && (
        <>
          <label className="lbl">Days</label>
          <div className="chip-row">
            {DOW.map((d, i) => (
              <button key={i} className={`mini ${days.includes(i) ? 'on' : ''}`} onClick={() => toggleDay(i)}>
                {d}
              </button>
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
      <button className="primary block mt" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : 'Create protocol'}
      </button>
    </div>
  )
}
