import { useMemo, useState } from 'react'
import { SEED_VIALS, colorFor } from './lib/library'
import { doseForDraw, unitsToMl, totalMg, fmtAmount, round } from './lib/calc'
import './App.css'

export default function App() {
  const [vial, setVial] = useState(SEED_VIALS[0])
  const [bacWater, setBacWater] = useState(vial.defaultBacWaterMl)
  const [draw, setDraw] = useState(vial.defaultDrawUnits)

  function pickVial(v) {
    setVial(v)
    setBacWater(v.defaultBacWaterMl)
    setDraw(v.defaultDrawUnits)
  }

  const breakdown = useMemo(
    () => doseForDraw(vial.components, bacWater, draw),
    [vial, bacWater, draw],
  )
  const ml = round(unitsToMl(draw), 2)

  return (
    <div className="app">
      <header className="brand">
        <span className="spark" />
        <span className="wordmark">lumen</span>
      </header>

      <div className="phone">
        <div className="screen">
          <div className="vial-tabs">
            {SEED_VIALS.map((v) => (
              <button
                key={v.id}
                className={`vial-tab ${v.id === vial.id ? 'active' : ''}`}
                onClick={() => pickVial(v)}
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
              {totalMg(vial.components)} mg blend · {vial.vialMl} mL vial
            </div>
          </div>

          <div className="inputs">
            <label className="field">
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
            </label>

            <label className="field">
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
            </label>
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
            <button className="primary">Log dose</button>
            <button className="ghost" aria-label="Research this blend">
              <i className="ti ti-sparkles" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <p className="disclaimer">
        Lumen is a personal dosing calculator and log. It is not medical advice.
      </p>
    </div>
  )
}
