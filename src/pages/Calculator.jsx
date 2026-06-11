import { useEffect, useMemo, useState } from 'react'
import { colorFor } from '../lib/library'
import { doseForDraw, unitsToMl, totalMg, fmtAmount, round } from '../lib/calc'

export default function Calculator({ vials, onLog }) {
  const [vialId, setVialId] = useState(vials[0]?.id)
  const vial = vials.find((v) => v.id === vialId) || vials[0]

  const [bacWater, setBacWater] = useState(vial?.default_bac_water_ml ?? 2)
  const [draw, setDraw] = useState(vial?.default_draw_units ?? 20)

  useEffect(() => {
    if (!vial) return
    setBacWater(vial.default_bac_water_ml ?? 2)
    setDraw(vial.default_draw_units ?? 20)
  }, [vialId])

  const components = vial?.components ?? []
  const breakdown = useMemo(
    () => doseForDraw(components, bacWater, draw),
    [components, bacWater, draw],
  )
  const ml = round(unitsToMl(draw), 2)

  if (!vial) {
    return (
      <div className="empty">
        <i className="ti ti-flask-2" aria-hidden="true" />
        <p>No vials yet.</p>
        <p className="muted sm">Add one from the Add tab — paste a product page or a screenshot.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="vial-tabs">
        {vials.map((v) => (
          <button
            key={v.id}
            className={`vial-tab ${v.id === vial.id ? 'active' : ''}`}
            onClick={() => setVialId(v.id)}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="head">
        <div className="head-row">
          <span className="muted">Calculator</span>
          <i className="ti ti-flask-2" aria-hidden="true" />
        </div>
        <div className="title">{vial.name}</div>
        <div className="muted sm">
          {totalMg(components)} mg{components.length > 1 ? ' blend' : ''}
          {vial.vial_ml ? ` · ${vial.vial_ml} mL vial` : ''}
        </div>
      </div>

      <div className="inputs">
        <div className="field">
          <span>Bac water</span>
          <div className="stepper">
            <button onClick={() => setBacWater((n) => Math.max(0.5, round(n - 0.5, 1)))}>
              <i className="ti ti-minus" aria-hidden="true" />
            </button>
            <b>{bacWater} mL</b>
            <button onClick={() => setBacWater((n) => round(n + 0.5, 1))}>
              <i className="ti ti-plus" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="field">
          <span>Draw</span>
          <div className="stepper">
            <button onClick={() => setDraw((n) => Math.max(1, n - 1))}>
              <i className="ti ti-minus" aria-hidden="true" />
            </button>
            <b>{draw} u</b>
            <button onClick={() => setDraw((n) => Math.min(100, n + 1))}>
              <i className="ti ti-plus" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <input
        className="slider"
        type="range"
        min="1"
        max="100"
        step="1"
        value={draw}
        onChange={(e) => setDraw(Number(e.target.value))}
      />

      <div className="hero">
        <div className="hero-label">PER DOSE · {ml} mL</div>
        <div className="hero-row">
          <span className="hero-num">{draw}</span>
          <span className="hero-unit">units on a U-100 syringe</span>
        </div>
      </div>

      <div className="breakdown">
        <div className="muted xs">WHAT YOU'RE ACTUALLY GETTING</div>
        {breakdown.map((b) => (
          <div className="row" key={b.name}>
            <span className="dot-name">
              <span className="dot" style={{ background: colorFor(b.name) }} />
              {b.name}
            </span>
            <span className="amt">{fmtAmount(b.mcg)}</span>
          </div>
        ))}
      </div>

      <div className="actions">
        <button
          className="primary"
          onClick={() =>
            onLog({
              vial_id: vial.persisted ? vial.id : null,
              vial_name: vial.name,
              draw_units: draw,
              bac_water_ml: bacWater,
              breakdown: breakdown.map((b) => ({ name: b.name, mcg: round(b.mcg, 0) })),
            })
          }
        >
          Log dose
        </button>
      </div>
    </div>
  )
}
