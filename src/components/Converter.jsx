import { useState } from 'react'

function fmt(n) {
  if (n === '' || n == null || isNaN(n)) return ''
  const v = Number(n)
  return Math.abs(v) >= 1 ? String(Math.round(v * 1000) / 1000) : String(Math.round(v * 100000) / 100000)
}

// Two linked fields: right = left * factor.
function Pair({ leftLabel, rightLabel, factor }) {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  return (
    <div className="conv-row">
      <div className="conv-field">
        <input className="in" type="number" inputMode="decimal" value={left}
          onChange={(e) => { setLeft(e.target.value); setRight(e.target.value === '' ? '' : fmt(Number(e.target.value) * factor)) }} />
        <span className="conv-unit">{leftLabel}</span>
      </div>
      <i className="ti ti-arrows-exchange conv-eq" aria-hidden="true" />
      <div className="conv-field">
        <input className="in" type="number" inputMode="decimal" value={right}
          onChange={(e) => { setRight(e.target.value); setLeft(e.target.value === '' ? '' : fmt(Number(e.target.value) / factor)) }} />
        <span className="conv-unit">{rightLabel}</span>
      </div>
    </div>
  )
}

export default function Converter() {
  const [iu, setIu] = useState('')
  const [mg, setMg] = useState('')
  const [perMg, setPerMg] = useState(3) // IU per mg (HGH ≈ 3)

  function recalc(nextIu, nextMg, nextPer) {
    const p = Number(nextPer) || 0
    if (nextIu !== undefined) { setIu(nextIu); setMg(nextIu === '' || !p ? '' : fmt(Number(nextIu) / p)) }
    else if (nextMg !== undefined) { setMg(nextMg); setIu(nextMg === '' || !p ? '' : fmt(Number(nextMg) * p)) }
  }

  return (
    <div className="pad converter">
      <div className="conv-block">
        <div className="muted xs mb">MASS</div>
        <Pair leftLabel="mcg" rightLabel="mg" factor={0.001} />
      </div>

      <div className="conv-block">
        <div className="muted xs mb">SYRINGE · U-100 (100 units = 1 mL)</div>
        <Pair leftLabel="units" rightLabel="mL" factor={0.01} />
      </div>

      <div className="conv-block">
        <div className="muted xs mb">IU ↔ MG <span className="muted">· substance-specific</span></div>
        <div className="conv-row">
          <div className="conv-field">
            <input className="in" type="number" inputMode="decimal" value={iu} onChange={(e) => recalc(e.target.value, undefined, perMg)} />
            <span className="conv-unit">IU</span>
          </div>
          <i className="ti ti-arrows-exchange conv-eq" aria-hidden="true" />
          <div className="conv-field">
            <input className="in" type="number" inputMode="decimal" value={mg} onChange={(e) => recalc(undefined, e.target.value, perMg)} />
            <span className="conv-unit">mg</span>
          </div>
        </div>
        <div className="conv-factor">
          <span className="muted sm">IU per mg</span>
          <input className="in" type="number" inputMode="decimal" value={perMg}
            onChange={(e) => { setPerMg(e.target.value); const p = Number(e.target.value) || 0; setMg(iu === '' || !p ? '' : fmt(Number(iu) / p)) }} style={{ width: 80 }} />
          <button className="mini" onClick={() => { setPerMg(3); setMg(iu === '' ? '' : fmt(Number(iu) / 3)) }}>HGH ≈ 3</button>
        </div>
        <div className="muted xs is-note">IU↔mg depends on the specific peptide's potency — set "IU per mg" from your label.</div>
      </div>
    </div>
  )
}
