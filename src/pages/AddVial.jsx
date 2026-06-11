import { useState } from 'react'
import { addVial } from '../lib/db'

export default function AddVial({ onSaved }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState(null)

  async function parse({ image, media_type } = {}) {
    setBusy(true)
    setError(null)
    setDraft(null)
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(image ? { image, media_type } : { text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'parse failed')
      setDraft(data.vial)
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
    reader.onload = () => {
      const dataUrl = String(reader.result)
      const base64 = dataUrl.split(',')[1]
      parse({ image: base64, media_type: file.type })
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    setBusy(true)
    try {
      const v = await addVial({
        name: draft.name,
        note: draft.notes,
        vial_ml: draft.vial_ml,
        components: (draft.components || []).map((c) => ({ name: c.name, mg: Number(c.mg) })),
        default_bac_water_ml: draft.vial_ml ? Math.max(1, Math.round(draft.vial_ml / 2)) : 2,
        default_draw_units: 20,
      })
      onSaved(v)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page pad">
      <div className="title">Add a vial</div>
      <div className="muted sm mb">Paste a product description, or upload a screenshot of the label.</div>

      <textarea
        className="ta"
        rows={5}
        placeholder="e.g. Diamond Glow 70mg — GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="actions mt">
        <button className="primary" disabled={busy || !text.trim()} onClick={() => parse()}>
          {busy ? 'Reading…' : 'Parse text'}
        </button>
        <label className="ghost file">
          <i className="ti ti-camera" aria-hidden="true" />
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
      </div>

      {error && <div className="alert">{error}</div>}

      {draft && (
        <div className="draft">
          <div className="muted xs">EXTRACTED · confidence {draft.confidence || '—'}</div>
          <div className="title sm">{draft.name}</div>
          {draft.vial_ml && <div className="muted sm">{draft.vial_ml} mL vial</div>}
          <div className="breakdown">
            {(draft.components || []).map((c, i) => (
              <div className="row" key={i}>
                <span>{c.name}</span>
                <span className="amt">{c.mg} mg</span>
              </div>
            ))}
          </div>
          {draft.notes && <div className="muted sm">{draft.notes}</div>}
          <div className="actions mt">
            <button className="primary" disabled={busy} onClick={save}>Save vial</button>
            <button className="ghost wide" onClick={() => setDraft(null)}>Discard</button>
          </div>
        </div>
      )}
    </div>
  )
}
