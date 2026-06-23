import { useState } from 'react'
import { addVial, addProtocol } from '../lib/db'
import { frequencyLabel } from '../lib/schedule'
import { colorFor } from '../lib/library'

export default function ProtocolBuilder({ onDone }) {
  const [goal, setGoal] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [adding, setAdding] = useState(false)

  async function build({ image, media_type } = {}) {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/build-protocol', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(image ? { image, media_type } : { goal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'build failed')
      setResult(data)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => build({ image: String(reader.result).split(',')[1], media_type: file.type })
    reader.readAsDataURL(file)
  }

  async function addAll() {
    setAdding(true)
    setError(null)
    try {
      for (const item of result.stack) {
        const vial = await addVial({
          name: item.name,
          components: (item.components || []).map((c) => ({ name: c.name, mg: Number(c.mg) })),
          vial_ml: item.vial_ml ?? null,
          default_bac_water_ml: item.bac_water_ml ?? 2,
          default_draw_units: item.draw_units ?? 20,
          vials_on_hand: 1,
        })
        await addProtocol({
          vial_id: vial.id,
          draw_units: Number(item.draw_units) || 20,
          bac_water_ml: Number(item.bac_water_ml) || 2,
          frequency: item.frequency || 'daily',
          days_of_week: item.days_of_week || [],
          time_of_day: item.time_of_day || '08:00',
          phases: (item.phases || []).map((p) => ({ weeks: Number(p.weeks), draw_units: Number(p.draw_units) })),
          cycle_weeks_on: Number(item.cycle_weeks_on) || 0,
          cycle_weeks_off: Number(item.cycle_weeks_off) || 0,
        })
      }
      onDone()
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="form">
      {!result && (
        <>
          <div className="muted sm mb">Describe a goal (e.g. "recovery + sleep, 8-week cycle") or upload a protocol screenshot.</div>
          <textarea className="ta" rows={3} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="My goal is…" />
          <div className="actions mt">
            <button className="primary block" disabled={busy || !goal.trim()} onClick={() => build()}>
              <i className="ti ti-sparkles" aria-hidden="true" /> {busy ? 'Building…' : 'Build stack'}
            </button>
            <label className="ghost file"><i className="ti ti-camera" aria-hidden="true" /><input type="file" accept="image/*" onChange={onFile} hidden /></label>
          </div>
          {error && <div className="alert">{error}</div>}
        </>
      )}

      {result && (
        <>
          <div className="muted sm mb">{result.summary}</div>
          {result.stack.map((item, i) => (
            <div className="proto-card" key={i}>
              <div className="title sm">{item.name}</div>
              <div className="chips">
                {(item.components || []).map((c) => (
                  <span className="chip" key={c.name}><span className="dot" style={{ background: colorFor(c.name) }} /> {c.name} {c.mg}mg</span>
                ))}
              </div>
              <div className="muted sm" style={{ marginTop: 6 }}>
                {frequencyLabel(item)} · {item.draw_units}u · {item.bac_water_ml}mL bac
                {(item.phases || []).length > 0 && ' · titrating'}
                {item.cycle_weeks_on > 0 && item.cycle_weeks_off > 0 && ` · ${item.cycle_weeks_on}w on/${item.cycle_weeks_off}w off`}
              </div>
              {item.rationale && <div className="muted xs" style={{ marginTop: 4 }}>{item.rationale}</div>}
            </div>
          ))}
          <div className="muted xs is-note">Review before saving — typical-range guidance, not medical advice.</div>
          {error && <div className="alert">{error}</div>}
          <div className="actions mt">
            <button className="primary block" disabled={adding} onClick={addAll}>{adding ? 'Adding…' : `Add ${result.stack.length} to my stack`}</button>
            <button className="ghost wide" onClick={() => setResult(null)}>Back</button>
          </div>
        </>
      )}
    </div>
  )
}
