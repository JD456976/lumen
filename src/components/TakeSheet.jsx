import { useEffect, useState } from 'react'
import { listLogs, updateVial } from '../lib/db'
import { doseForDraw, drawForTarget, fmtAmount, round } from '../lib/calc'
import BodyMap from './BodyMap'

export default function TakeSheet({ vial, onConfirm, onClose }) {
  const [rec, setRec] = useState(vial.dose_rec || null)
  const [loadingRec, setLoadingRec] = useState(!vial.dose_rec)
  const [pick, setPick] = useState('normal')
  const [customUnits, setCustomUnits] = useState('')
  const [site, setSite] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [busy, setBusy] = useState(false)

  const bac = vial.default_bac_water_ml || 2
  const primary = vial.components?.[0]

  useEffect(() => {
    listLogs().then(setRecentLogs).catch(() => setRecentLogs([]))
  }, [])

  // Lazily fetch + cache the recommendation for vials that don't have one yet.
  useEffect(() => {
    if (rec || !primary) return
    let on = true
    fetch('/api/dose-rec', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: primary.name }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!on || !d.rec) return
        setRec(d.rec)
        updateVial(vial.id, { dose_rec: d.rec }).catch(() => {})
      })
      .catch(() => {})
      .finally(() => on && setLoadingRec(false))
    return () => { on = false }
  }, [])

  function unitsFor(mcg) {
    if (!primary || !mcg) return 0
    return round(drawForTarget(vial.components, bac, primary.name, mcg, 100), 1)
  }
  // mcg of the primary delivered by a given unit draw (for the custom readout)
  function mcgForUnits(units) {
    const d = doseForDraw(vial.components, bac, Number(units) || 0)
    return Math.round(d[0]?.mcg || 0)
  }

  const opts = rec
    ? [
        { id: 'low', label: 'Low', mcg: rec.low_mcg },
        { id: 'normal', label: 'Normal', mcg: rec.normal_mcg },
        { id: 'high', label: 'High', mcg: rec.high_mcg },
      ]
    : []

  async function confirm() {
    setBusy(true)
    let draw
    if (pick === 'custom') draw = Math.round(Number(customUnits) || 0)
    else {
      const chosen = opts.find((o) => o.id === pick)
      draw = chosen ? Math.round(unitsFor(chosen.mcg)) : vial.default_draw_units || 10
    }
    const breakdown = doseForDraw(vial.components, bac, draw).map((b) => ({ name: b.name, mcg: round(b.mcg, 0) }))
    await onConfirm({
      vial_id: vial.id,
      vial_name: vial.name,
      draw_units: draw,
      bac_water_ml: bac,
      breakdown,
      site,
      status: 'taken',
      taken_at: new Date().toISOString(),
    })
    setBusy(false)
  }

  return (
    <div className="form">
      {loadingRec && <div className="muted sm mb">Loading recommended doses…</div>}

      {opts.length > 0 && (
        <>
          <div className="muted xs mb">PICK A DOSE · units on your U-100 syringe</div>
          <div className="dose-opts mb">
            {opts.map((o) => (
              <button key={o.id} className={`dose-opt ${pick === o.id ? 'on' : ''}`} onClick={() => setPick(o.id)}>
                <div className="do-label">{o.label}</div>
                <div className="do-units">{unitsFor(o.mcg)}u</div>
                <div className="do-mcg">{o.mcg} mcg</div>
              </button>
            ))}
          </div>
          {pick !== 'custom' && unitsFor(opts.find((o) => o.id === pick)?.mcg) === 0 && (
            <div className="alert">Can't compute units — this vial's strength (mg) is missing. Close and tap the ✎ to set it.</div>
          )}
        </>
      )}

      <div className="custom-dose">
        <button className={`mini ${pick === 'custom' ? 'on' : ''}`} onClick={() => setPick('custom')}>
          <i className="ti ti-adjustments-alt" aria-hidden="true" /> Custom
        </button>
        {pick === 'custom' && (
          <div className="custom-in">
            <input className="in" type="number" inputMode="decimal" value={customUnits} onChange={(e) => setCustomUnits(e.target.value)} placeholder="units" style={{ width: 88 }} />
            <span className="muted sm">units{customUnits ? ` ≈ ${mcgForUnits(customUnits)} mcg` : ''}</span>
          </div>
        )}
      </div>

      <label className="lbl">Injection site</label>
      <BodyMap logs={recentLogs} value={site} onChange={setSite} />

      <button className="primary block mt" disabled={busy || (pick === 'custom' && !customUnits)} onClick={confirm}>
        {busy ? 'Logging…' : 'Confirm taken'}
      </button>
    </div>
  )
}
