import { useState } from 'react'
import { searchLibrary, searchStacks } from '../lib/library'
import PeptideInfo from './PeptideInfo'

export default function LibraryBrowser({ onPick }) {
  const [q, setQ] = useState('')
  const [info, setInfo] = useState(null) // { name, seed } | { name, ai:true }
  const [aiBusy, setAiBusy] = useState(false)
  const [error, setError] = useState(null)
  const results = searchLibrary(q)
  const stacks = searchStacks(q)

  function pickSeed(p) {
    onPick({
      name: p.name,
      components: [{ name: p.name, mg: p.typical_vial_mg }],
      default_bac_water_ml: p.typical_bac_ml,
      vial_ml: null,
    })
  }

  function pickStack(s) {
    onPick({
      name: s.name,
      components: s.components.map((c) => ({ ...c })),
      default_bac_water_ml: s.default_bac_water_ml,
      vial_ml: null,
    })
  }

  async function aiAdd(name) {
    setAiBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'lookup failed')
      const p = data.peptide
      onPick({
        name: p.name,
        components: (p.components?.length ? p.components : [{ name: p.name, mg: p.typical_vial_mg }])
          .map((c) => ({ name: c.name, mg: Number(c.mg) })),
        default_bac_water_ml: p.typical_bac_ml ?? 2,
        vial_ml: null,
      })
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setAiBusy(false)
    }
  }

  // Info detail view
  if (info) {
    return (
      <div className="form">
        <button className="link-btn" onClick={() => setInfo(null)}>
          <i className="ti ti-chevron-left" aria-hidden="true" /> Back
        </button>
        <div className="title sm" style={{ marginTop: 6 }}>{info.name}</div>
        <PeptideInfo
          name={info.name}
          seed={info.seed}
          onAdd={
            aiBusy
              ? undefined
              : () => (info.seed ? pickSeed(info.seed) : aiAdd(info.name))
          }
        />
      </div>
    )
  }

  return (
    <div className="form">
      <input
        className="in"
        placeholder="Search peptides…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="lib-list">
        {stacks.length > 0 && <div className="muted xs">STACKS</div>}
        {stacks.map((s) => (
          <button className="lib-item stack" key={s.name} onClick={() => pickStack(s)}>
            <div className="lib-top">
              <span className="title sm">{s.name}</span>
              <span className="lib-persona">{s.components.length} peptides</span>
            </div>
            <div className="muted sm">{s.blurb}</div>
            <div className="chips">{s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
          </button>
        ))}
        {results.length > 0 && <div className="muted xs" style={{ marginTop: 6 }}>PEPTIDES</div>}
        {results.map((p) => (
          <button className="lib-item" key={p.name} onClick={() => setInfo({ name: p.name, seed: p })}>
            <div className="lib-top">
              <span className="title sm">{p.name}</span>
              <span className="lib-persona">{p.persona}</span>
            </div>
            <div className="muted sm">{p.blurb}</div>
            <div className="chips">
              {p.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
            </div>
          </button>
        ))}
      </div>

      {results.length === 0 && stacks.length === 0 && q.trim() && (
        <div className="ai-fallback">
          <div className="muted sm mb">Not in the library.</div>
          <button className="primary block" disabled={aiBusy} onClick={() => setInfo({ name: q.trim() })}>
            <i className="ti ti-sparkles" aria-hidden="true" /> Look up “{q.trim()}”
          </button>
          {error && <div className="alert">{error}</div>}
        </div>
      )}
    </div>
  )
}
