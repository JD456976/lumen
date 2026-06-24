import { useState } from 'react'
import { addVial, updateVial, addProtocol } from '../lib/db'
import { concentration, drawForTarget, round } from '../lib/calc'
import { colorFor } from '../lib/library'
import { fileToCompressedBase64 } from '../lib/image'

const FREQS = [
  { id: 'daily', label: 'Daily' },
  { id: 'eod', label: 'Every other day' },
  { id: 'weekly', label: 'Once weekly' },
  { id: 'as_needed', label: 'As needed' },
]

export default function ScanWizard({ vials = [], onDone }) {
  const [step, setStep] = useState('capture') // capture | reconstitute | frequency | dosing
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [parsed, setParsed] = useState(null) // {name, components:[{name,mg}], vial_ml}
  const [bac, setBac] = useState(3)
  const [frequency, setFrequency] = useState('daily')
  const [weekday, setWeekday] = useState(1)
  const [time, setTime] = useState('08:00')
  const [rec, setRec] = useState(null)
  const [pick, setPick] = useState('normal')

  const primary = parsed?.components?.[0]
  const conc = primary ? concentration(primary.mg, bac) : 0 // mg/mL

  function unitsFor(mcg) {
    if (!primary) return 0
    return round(drawForTarget(parsed.components, bac, primary.name, mcg, 100), 1)
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { base64, media_type } = await fileToCompressedBase64(file)
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: base64, media_type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read the vial')
      const v = data.vial
      setParsed({ name: v.name, components: (v.components || []).map((c) => ({ name: c.name, mg: Number(c.mg) })), vial_ml: v.vial_ml ?? null })
      setStep('reconstitute')
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setBusy(false)
    }
  }

  async function fetchRec() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/dose-rec', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: primary?.name || parsed.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No recommendation')
      setRec(data.rec)
      setStep('dosing')
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const mcg = rec[`${pick}_mcg`]
      const draw = Math.round(unitsFor(mcg)) || 10
      const existing = vials.find((v) => v.persisted && v.name.toLowerCase() === parsed.name.toLowerCase())
      let vialId
      if (existing) {
        await updateVial(existing.id, { vials_on_hand: (existing.vials_on_hand || 1) + 1, default_bac_water_ml: bac, default_draw_units: draw, dose_rec: rec, components: parsed.components })
        vialId = existing.id
      } else {
        const v = await addVial({
          name: parsed.name,
          components: parsed.components,
          vial_ml: parsed.vial_ml,
          default_bac_water_ml: bac,
          default_draw_units: draw,
          vials_on_hand: 1,
          dose_rec: rec,
        })
        vialId = v.id
      }
      await addProtocol({
        vial_id: vialId,
        draw_units: draw,
        bac_water_ml: bac,
        frequency,
        days_of_week: frequency === 'weekly' ? [weekday] : [],
        time_of_day: time,
      })
      onDone()
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setBusy(false)
    }
  }

  // ---- steps ----
  if (step === 'capture') {
    return (
      <div className="form wiz">
        <Stepper i={0} />
        <div className="wiz-icon"><i className="ti ti-camera" aria-hidden="true" /></div>
        <div className="muted sm" style={{ textAlign: 'center' }}>Point your camera at the vial label. I'll read the peptide and strength.</div>
        <label className="primary block mt camera-btn">
          <i className="ti ti-camera" aria-hidden="true" /> {busy ? 'Reading…' : 'Take a photo'}
          <input type="file" accept="image/*" capture="environment" onChange={onFile} hidden disabled={busy} />
        </label>
        <label className="ghost wide mt">
          Choose from library
          <input type="file" accept="image/*" onChange={onFile} hidden disabled={busy} />
        </label>
        {error && <div className="alert">{error}</div>}
      </div>
    )
  }

  if (step === 'reconstitute') {
    return (
      <div className="form wiz">
        <Stepper i={1} />
        <div className="title sm">{parsed.name}</div>
        <label className="lbl">Strength <span className="muted">(edit if the scan missed it)</span></label>
        {parsed.components.map((c, i) => (
          <div className="comp-row" key={i}>
            <span className="dot" style={{ background: colorFor(c.name) }} />
            <span className="flex" style={{ fontSize: 13 }}>{c.name}</span>
            <input
              className="in mg"
              type="number"
              inputMode="decimal"
              value={c.mg ?? ''}
              onChange={(e) =>
                setParsed((p) => ({ ...p, components: p.components.map((x, idx) => (idx === i ? { ...x, mg: e.target.value === '' ? '' : Number(e.target.value) } : x)) }))
              }
            />
            <span className="muted sm">mg</span>
          </div>
        ))}
        <label className="lbl">Reconstitute with</label>
        <div className="dose-in">
          <button onClick={() => setBac((n) => Math.max(0.5, round(n - 0.5, 1)))}><i className="ti ti-minus" aria-hidden="true" /></button>
          <input className="in" value={`${bac} mL`} readOnly style={{ textAlign: 'center' }} />
          <button onClick={() => setBac((n) => round(n + 0.5, 1))}><i className="ti ti-plus" aria-hidden="true" /></button>
        </div>
        <div className="recon mt"><i className="ti ti-droplet" aria-hidden="true" /> {round(conc, 2)} mg/mL · {round(conc, 2)} mg per 100 units (full U-100 syringe)</div>
        <button className="primary block mt" onClick={() => setStep('frequency')}>Next</button>
      </div>
    )
  }

  if (step === 'frequency') {
    return (
      <div className="form wiz">
        <Stepper i={2} />
        <label className="lbl">How often?</label>
        <div className="chip-row">
          {FREQS.map((f) => (
            <button key={f.id} className={`mini ${frequency === f.id ? 'on' : ''}`} onClick={() => setFrequency(f.id)}>{f.label}</button>
          ))}
        </div>
        {frequency === 'weekly' && (
          <>
            <label className="lbl">Day</label>
            <div className="chip-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <button key={i} className={`mini ${weekday === i ? 'on' : ''}`} onClick={() => setWeekday(i)}>{d}</button>
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
        <button className="primary block mt" disabled={busy} onClick={fetchRec}>{busy ? 'Getting recommendations…' : 'Next'}</button>
      </div>
    )
  }

  // dosing
  const opts = [
    { id: 'low', label: 'Low', mcg: rec.low_mcg },
    { id: 'normal', label: 'Normal', mcg: rec.normal_mcg },
    { id: 'high', label: 'High', mcg: rec.high_mcg },
  ]
  return (
    <div className="form wiz">
      <Stepper i={3} />
      <div className="title sm">{rec.peptide}</div>
      <div className="muted xs mb">Tap the dose to log against. mcg + units on your U-100 syringe.</div>
      <div className="dose-opts">
        {opts.map((o) => (
          <button key={o.id} className={`dose-opt ${pick === o.id ? 'on' : ''}`} onClick={() => setPick(o.id)}>
            <div className="do-label">{o.label}</div>
            <div className="do-units">{unitsFor(o.mcg)}u</div>
            <div className="do-mcg">{o.mcg} mcg</div>
          </button>
        ))}
      </div>
      <div className="brief-grid mt">
        <Fact icon="ti-repeat" label="Frequency" value={rec.frequency} />
        <Fact icon="ti-clock-hour-8" label="When" value={rec.timing} />
        <Fact icon="ti-rotate" label="Cycle" value={rec.cycle} />
        <Fact icon="ti-microscope" label="Source" value={rec.source} />
      </div>
      {unitsFor(opts.find((o) => o.id === pick).mcg) > 100 && (
        <div className="alert">
          That dose is {unitsFor(opts.find((o) => o.id === pick).mcg)}u — more than a 100-unit syringe holds.
          Go back and reconstitute with more water (this is often an oral/high-dose compound).
        </div>
      )}
      <div className="muted xs is-note">Typical ranges from research / community practice — not medical advice.</div>
      {error && <div className="alert">{error}</div>}
      <button className="primary block mt" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save & add to inventory'}</button>
    </div>
  )
}

function Stepper({ i }) {
  return (
    <div className="wiz-steps">
      {['Scan', 'Mix', 'Schedule', 'Dose'].map((s, idx) => (
        <span key={s} className={`wiz-dot ${idx <= i ? 'on' : ''}`}>{s}</span>
      ))}
    </div>
  )
}

function Fact({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="fact">
      <div className="fact-label"><i className={`ti ${icon}`} aria-hidden="true" /> {label}</div>
      <div className="fact-value">{value}</div>
    </div>
  )
}
