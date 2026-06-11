import { useState } from 'react'
import { addVial, updateVial } from '../lib/db'

const blank = { name: '', mg: '' }

export default function VialForm({ existing, prefill, onDone }) {
  const seed = existing || prefill || {}
  const [name, setName] = useState(seed.name || '')
  const [vialMl, setVialMl] = useState(seed.vial_ml ?? seed.vialMl ?? '')
  const [bac, setBac] = useState(seed.default_bac_water_ml ?? 2)
  const [draw, setDraw] = useState(seed.default_draw_units ?? 20)
  const [components, setComponents] = useState(
    (seed.components && seed.components.length ? seed.components : [{ ...blank }]).map((c) => ({
      name: c.name || '',
      mg: c.mg ?? '',
    })),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function setComp(i, key, val) {
    setComponents((cs) => cs.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)))
  }
  function addComp() {
    setComponents((cs) => [...cs, { ...blank }])
  }
  function removeComp(i) {
    setComponents((cs) => cs.filter((_, idx) => idx !== i))
  }

  async function save() {
    setError(null)
    const cleaned = components
      .filter((c) => c.name.trim() && c.mg !== '')
      .map((c) => ({ name: c.name.trim(), mg: Number(c.mg) }))
    if (!name.trim() || cleaned.length === 0) {
      setError('Add a name and at least one component with mg.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        vial_ml: vialMl === '' ? null : Number(vialMl),
        components: cleaned,
        default_bac_water_ml: Number(bac),
        default_draw_units: Number(draw),
      }
      const saved = existing?.id
        ? await updateVial(existing.id, payload)
        : await addVial(payload)
      onDone(saved)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form">
      <label className="lbl">Name</label>
      <input className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Diamond Glow" />

      <label className="lbl">Components</label>
      {components.map((c, i) => (
        <div className="comp-row" key={i}>
          <input className="in flex" value={c.name} onChange={(e) => setComp(i, 'name', e.target.value)} placeholder="Peptide" />
          <input className="in mg" type="number" inputMode="decimal" value={c.mg} onChange={(e) => setComp(i, 'mg', e.target.value)} placeholder="mg" />
          <button className="icon-btn" aria-label="Remove" onClick={() => removeComp(i)}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button className="ghost wide" onClick={addComp}>
        <i className="ti ti-plus" aria-hidden="true" /> Add component
      </button>

      <div className="two">
        <div>
          <label className="lbl">Vial mL</label>
          <input className="in" type="number" inputMode="decimal" value={vialMl} onChange={(e) => setVialMl(e.target.value)} placeholder="8" />
        </div>
        <div>
          <label className="lbl">Default bac water</label>
          <input className="in" type="number" inputMode="decimal" value={bac} onChange={(e) => setBac(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      <button className="primary block mt" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : existing ? 'Save changes' : 'Add vial'}
      </button>
    </div>
  )
}
