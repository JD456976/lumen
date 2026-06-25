import { useEffect, useMemo, useState } from 'react'
import { colorFor } from '../lib/library'
import {
  doseForDraw, drawForTarget, unitsToMl, totalMg, dosesPerVial,
  concentration, fmtAmount, round, SYRINGES,
} from '../lib/calc'
import SyringeBar from '../components/SyringeBar'
import Sheet from '../components/Sheet'
import PeptideInfo from '../components/PeptideInfo'
import Converter from '../components/Converter'

export default function Calculator({ vials, onLog, onActiveVial }) {
  const [tool, setTool] = useState('dose') // 'dose' | 'recon'
  const [infoName, setInfoName] = useState(null)
  const [vialId, setVialId] = useState(vials[0]?.id)
  const vial = vials.find((v) => v.id === vialId) || vials[0]

  const [syringe, setSyringe] = useState(SYRINGES[0])
  const upm = syringe.unitsPerMl

  const [bacWater, setBacWater] = useState(vial?.default_bac_water_ml ?? 2)
  const [draw, setDraw] = useState(vial?.default_draw_units ?? 20)
  const [mode, setMode] = useState('units')
  const [targetName, setTargetName] = useState(vial?.components?.[0]?.name || '')
  const [target, setTarget] = useState('')
  const [doseUnit, setDoseUnit] = useState('mcg')

  // reconstitution (free-form, seeded from the vial)
  const [reconMg, setReconMg] = useState(vial ? totalMg(vial.components) : 10)
  const [reconBac, setReconBac] = useState(vial?.default_bac_water_ml ?? 2)

  useEffect(() => {
    if (vial && onActiveVial) onActiveVial(vial)
  }, [vialId, vial, onActiveVial])

  useEffect(() => {
    if (!vial) return
    setBacWater(vial.default_bac_water_ml ?? 2)
    setDraw(vial.default_draw_units ?? 20)
    setTargetName(vial.components?.[0]?.name || '')
    setTarget('')
    setReconMg(totalMg(vial.components))
    setReconBac(vial.default_bac_water_ml ?? 2)
  }, [vialId])

  const components = vial?.components ?? []
  const breakdown = useMemo(
    () => doseForDraw(components, bacWater, draw, upm),
    [components, bacWater, draw, upm],
  )
  const ml = round(unitsToMl(draw, upm), 3)
  const doses = Math.floor(dosesPerVial(bacWater, draw, upm))

  function applyTarget() {
    const val = Number(target)
    if (!val || !targetName) return
    const mcg = doseUnit === 'mg' ? val * 1000 : val
    const u = drawForTarget(components, bacWater, targetName, mcg, upm)
    setDraw(Math.max(1, Math.min(upm, round(u, 0))))
  }

  if (!vial) {
    return (
      <div className="empty">
        <i className="ti ti-flask-2" aria-hidden="true" />
        <p>No vials yet.</p>
        <p className="muted sm">Add one from the Vials tab.</p>
      </div>
    )
  }

  const conc = concentration(reconMg, reconBac) // mg/mL

  return (
    <div className="page">
      <div className="vial-select-wrap">
        <i className="ti ti-flask-2" aria-hidden="true" />
        <select className="vial-select" value={vial?.id || ''} onChange={(e) => setVialId(e.target.value)}>
          {vials.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <i className="ti ti-chevron-down" aria-hidden="true" />
      </div>

      <div className="seg tool-seg">
        <button className={tool === 'dose' ? 'on' : ''} onClick={() => setTool('dose')}>Dose</button>
        <button className={tool === 'recon' ? 'on' : ''} onClick={() => setTool('recon')}>Reconstitute</button>
        <button className={tool === 'convert' ? 'on' : ''} onClick={() => setTool('convert')}>Convert</button>
      </div>

      {tool === 'dose' && (
        <>
          <div className="head">
            <div className="muted sm">
              {totalMg(components)} mg{components.length > 1 ? ' blend' : ''} · {syringe.id} syringe
            </div>
          </div>

          <div className="syringe-wrap"><SyringeBar units={draw} max={upm} /></div>

          <div className="seg-sm">
            {SYRINGES.map((s) => (
              <button key={s.id} className={s.id === syringe.id ? 'on' : ''} onClick={() => setSyringe(s)}>{s.id}</button>
            ))}
          </div>

          <div className="seg">
            <button className={mode === 'units' ? 'on' : ''} onClick={() => setMode('units')}>By units</button>
            <button className={mode === 'dose' ? 'on' : ''} onClick={() => setMode('dose')}>By dose</button>
          </div>

          <div className="inputs">
            <div className="field">
              <span>Bac water</span>
              <div className="stepper">
                <button onClick={() => setBacWater((n) => Math.max(0.5, round(n - 0.5, 1)))}><i className="ti ti-minus" /></button>
                <b>{bacWater} mL</b>
                <button onClick={() => setBacWater((n) => round(n + 0.5, 1))}><i className="ti ti-plus" /></button>
              </div>
            </div>
            {mode === 'units' ? (
              <div className="field">
                <span>Draw</span>
                <div className="stepper">
                  <button onClick={() => setDraw((n) => Math.max(1, n - 1))}><i className="ti ti-minus" /></button>
                  <b>{draw} u</b>
                  <button onClick={() => setDraw((n) => Math.min(upm, n + 1))}><i className="ti ti-plus" /></button>
                </div>
              </div>
            ) : (
              <div className="field">
                <span>Target {components.length > 1 ? targetName : ''}</span>
                <div className="dose-in">
                  <input type="number" inputMode="decimal" placeholder={doseUnit} value={target}
                    onChange={(e) => setTarget(e.target.value)} onBlur={applyTarget}
                    onKeyDown={(e) => e.key === 'Enter' && applyTarget()} />
                  <button className="mini" onClick={() => setDoseUnit((u) => (u === 'mcg' ? 'mg' : 'mcg'))}>{doseUnit}</button>
                  <button onClick={applyTarget}><i className="ti ti-arrow-right" /></button>
                </div>
              </div>
            )}
          </div>

          {mode === 'dose' && components.length > 1 && (
            <div className="target-pick">
              {components.map((c) => (
                <button key={c.name} className={`mini ${c.name === targetName ? 'on' : ''}`} onClick={() => setTargetName(c.name)}>{c.name}</button>
              ))}
            </div>
          )}

          <input className="slider" type="range" min="1" max={upm} step="1" value={draw}
            onChange={(e) => { setMode('units'); setDraw(Number(e.target.value)) }} />

          <div className="hero">
            <div className="hero-label">PER DOSE · {ml} mL</div>
            <div className="hero-row">
              <span className="hero-num">{draw}</span>
              <span className="hero-unit">units on a {syringe.id} syringe</span>
            </div>
          </div>

          <div className="breakdown">
            <div className="muted xs">WHAT YOU'RE ACTUALLY GETTING</div>
            {breakdown.map((b) => (
              <button className="row row-btn" key={b.name} onClick={() => setInfoName(b.name)}>
                <span className="dot-name"><span className="dot" style={{ background: colorFor(b.name) }} />{b.name}</span>
                <span className="amt">{fmtAmount(b.mcg)} <i className="ti ti-info-circle" aria-hidden="true" /></span>
              </button>
            ))}
          </div>

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

          <div className="actions">
            <button className="primary" onClick={() => onLog({
              vial_id: vial.persisted ? vial.id : null, vial_name: vial.name,
              draw_units: draw, bac_water_ml: bacWater,
              breakdown: breakdown.map((b) => ({ name: b.name, mcg: round(b.mcg, 0) })),
            })}>Log dose</button>
          </div>
        </>
      )}

      {tool === 'recon' && (
        <div className="pad recon-tool">
          <div className="muted sm mb">Mix a vial and see the concentration. Values update live.</div>
          <div className="two">
            <div>
              <label className="lbl">Vial amount (mg)</label>
              <input className="in" type="number" inputMode="decimal" value={reconMg} onChange={(e) => setReconMg(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="lbl">Bac water (mL)</label>
              <input className="in" type="number" inputMode="decimal" value={reconBac} onChange={(e) => setReconBac(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="bac-chips" style={{ paddingLeft: 0 }}>
            <span className="muted xs">BAC</span>
            {[1, 2, 3, 5].map((v) => (
              <button key={v} className={`mini ${reconBac === v ? 'on' : ''}`} onClick={() => setReconBac(v)}>{v} mL</button>
            ))}
          </div>

          <div className="hero" style={{ margin: '12px 0' }}>
            <div className="hero-label">CONCENTRATION</div>
            <div className="hero-row">
              <span className="hero-num">{round(conc, 2)}</span>
              <span className="hero-unit">mg/mL · {round(conc * 1000, 0)} mcg/mL</span>
            </div>
          </div>

          <div className="muted xs mb">EACH DRAW DELIVERS ({syringe.id})</div>
          <div className="seg-sm mb">
            {SYRINGES.map((s) => (
              <button key={s.id} className={s.id === syringe.id ? 'on' : ''} onClick={() => setSyringe(s)}>{s.id}</button>
            ))}
          </div>
          <div className="recon-table">
            {[10, 20, 30, 50].map((u) => (
              <div className="row" key={u}>
                <span className="dot-name">{u} units ({round(unitsToMl(u, upm), 2)} mL)</span>
                <span className="amt">{fmtAmount(conc * unitsToMl(u, upm) * 1000)}</span>
              </div>
            ))}
          </div>
          <div className="recon">
            <i className="ti ti-droplet" aria-hidden="true" />
            Add {reconBac} mL bacteriostatic water to the {reconMg} mg vial.
          </div>
        </div>
      )}

      {tool === 'convert' && <Converter />}

      {infoName && (
        <Sheet title={infoName} onClose={() => setInfoName(null)}>
          <PeptideInfo name={infoName} />
        </Sheet>
      )}
    </div>
  )
}
