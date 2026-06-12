import { useEffect, useMemo, useState } from 'react'
import { colorFor } from '../lib/library'
import {
  doseForDraw, drawForTarget, unitsToMl, totalMg, dosesPerVial,
  concentration, fmtAmount, round,
} from '../lib/calc'
import SyringeBar from '../components/SyringeBar'

export default function Calculator({ vials, onLog, onActiveVial }) {
  const [vialId, setVialId] = useState(vials[0]?.id)
  const vial = vials.find((v) => v.id === vialId) || vials[0]

  useEffect(() => {
    if (vial && onActiveVial) onActiveVial(vial)
  }, [vialId, vial, onActiveVial])

  const [bacWater, setBacWater] = useState(vial?.default_bac_water_ml ?? 2)
  const [draw, setDraw] = useState(vial?.default_draw_units ?? 20)
  const [mode, setMode] = useState('units') // 'units' | 'dose'
  const [targetName, setTargetName] = useState(vial?.components?.[0]?.name || '')
  const [targetMcg, setTargetMcg] = useState('')

  useEffect(() => {
    if (!vial) return
    setBacWater(vial.default_bac_water_ml ?? 2)
    setDraw(vial.default_draw_units ?? 20)
    setTargetName(vial.components?.[0]?.name || '')
    setTargetMcg('')
  }, [vialId])

  const components = vial?.components ?? []
  const breakdown = useMemo(
    () => doseForDraw(components, bacWater, draw),
    [components, bacWater, draw],
  )
  const ml = round(unitsToMl(draw), 2)
  const doses = Math.floor(dosesPerVial(bacWater, draw))

  function applyTargetDose() {
    const mcg = Number(targetMcg)
    if (!mcg || !targetName) return
    const u = drawForTarget(components, bacWater, targetName, mcg)
    setDraw(Math.max(1, Math.min(100, round(u, 0))))
  }

  if (!vial) {
    return (
      <div className="empty">
        <i className="ti ti-flask-2" aria-hidden="true" />
        <p>No vials yet.</p>
        <p className="muted sm">Add one from the Vials tab — paste a product page or a screenshot.</p>
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

      {/* visual syringe */}
      <div className="syringe-wrap"><SyringeBar units={draw} /></div>

      {/* mode toggle */}
      <div className="seg">
        <button className={mode === 'units' ? 'on' : ''} onClick={() => setMode('units')}>By units</button>
        <button className={mode === 'dose' ? 'on' : ''} onClick={() => setMode('dose')}>By dose</button>
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

        {mode === 'units' ? (
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
        ) : (
          <div className="field">
            <span>Target {components.length > 1 ? targetName : ''}</span>
            <div className="dose-in">
              <input
                type="number"
                inputMode="decimal"
                placeholder="mcg"
                value={targetMcg}
                onChange={(e) => setTargetMcg(e.target.value)}
                onBlur={applyTargetDose}
                onKeyDown={(e) => e.key === 'Enter' && applyTargetDose()}
              />
              <button onClick={applyTargetDose}><i className="ti ti-arrow-right" aria-hidden="true" /></button>
            </div>
          </div>
        )}
      </div>

      {mode === 'dose' && components.length > 1 && (
        <div className="target-pick">
          {components.map((c) => (
            <button
              key={c.name}
              className={`mini ${c.name === targetName ? 'on' : ''}`}
              onClick={() => setTargetName(c.name)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <input
        className="slider"
        type="range"
        min="1"
        max="100"
        step="1"
        value={draw}
        onChange={(e) => { setMode('units'); setDraw(Number(e.target.value)) }}
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

      {/* derived stats */}
      <div className="stat-grid">
        <div className="stat">
          <div className="muted xs">CONCENTRATION</div>
          <div className="stat-val">{round(concentration(totalMg(components), bacWater), 2)} <small>mg/mL</small></div>
        </div>
        <div className="stat">
          <div className="muted xs">DOSES / VIAL</div>
          <div className="stat-val">{doses || '—'}</div>
        </div>
      </div>

      <div className="recon">
        <i className="ti ti-droplet" aria-hidden="true" />
        Add {bacWater} mL bacteriostatic water to the {totalMg(components)} mg vial.
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
