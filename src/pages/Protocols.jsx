import { useEffect, useState } from 'react'
import { listProtocols, endProtocol, dosesLoggedByVial } from '../lib/db'
import { doseForDraw, dosesPerVial, fmtAmount, round } from '../lib/calc'
import { nextDue, fmtNext, frequencyLabel } from '../lib/schedule'
import { colorFor } from '../lib/library'
import Sheet from '../components/Sheet'
import ProtocolForm from '../components/ProtocolForm'
import { pushSupported, isSubscribed, enableReminders, disableReminders } from '../lib/push'

export default function Protocols({ vials, onLog }) {
  const [protocols, setProtocols] = useState([])
  const [logged, setLogged] = useState({})
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [subbed, setSubbed] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)

  useEffect(() => {
    if (pushSupported()) isSubscribed().then(setSubbed).catch(() => {})
  }, [])

  async function toggleReminders() {
    setPushBusy(true)
    try {
      if (subbed) {
        await disableReminders()
        setSubbed(false)
      } else {
        await enableReminders()
        setSubbed(true)
      }
    } catch (e) {
      alert(e.message || String(e))
    } finally {
      setPushBusy(false)
    }
  }

  async function refresh() {
    try {
      const [p, l] = await Promise.all([listProtocols(), dosesLoggedByVial()])
      setProtocols(p)
      setLogged(l)
    } catch {
      setProtocols([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    refresh()
  }, [])

  async function end(id) {
    if (!confirm('End this protocol?')) return
    await endProtocol(id)
    refresh()
  }

  if (loading) return <div className="page pad muted">Loading…</div>

  return (
    <div className="page pad">
      <div className="head-row mb">
        <span className="title">Protocols</span>
        <button className="pill" onClick={() => setSheet(true)}>
          <i className="ti ti-plus" aria-hidden="true" /> New
        </button>
      </div>

      {pushSupported() && (
        <button className={`reminder-banner ${subbed ? 'on' : ''}`} disabled={pushBusy} onClick={toggleReminders}>
          <i className={`ti ${subbed ? 'ti-bell-ringing' : 'ti-bell'}`} aria-hidden="true" />
          <span>{pushBusy ? '…' : subbed ? 'Reminders on — tap to turn off' : 'Enable dose reminders'}</span>
        </button>
      )}

      {protocols.length === 0 && (
        <div className="muted sm">No protocols yet. Schedule a vial to see next-due times and supply.</div>
      )}

      {protocols.map((p) => {
        const v = p.vial
        if (!v) return null
        const breakdown = doseForDraw(v.components, p.bac_water_ml, p.draw_units)
        const capacity = (v.vials_on_hand || 1) * dosesPerVial(p.bac_water_ml, p.draw_units)
        const used = logged[v.id] || 0
        const left = Math.max(0, Math.floor(capacity - used))
        const low = left <= (v.low_stock_doses || 5)
        const due = nextDue(p)
        return (
          <div className="proto-card" key={p.id}>
            <div className="vc-top">
              <div>
                <div className="title sm">{v.name}</div>
                <div className="muted sm">{frequencyLabel(p)} · {p.draw_units} u</div>
              </div>
              <button className="icon-btn" aria-label="End protocol" onClick={() => end(p.id)}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>

            <div className="chips">
              {breakdown.map((b) => (
                <span className="chip" key={b.name}>
                  <span className="dot" style={{ background: colorFor(b.name) }} /> {b.name} {fmtAmount(b.mcg)}
                </span>
              ))}
            </div>

            <div className="proto-foot">
              <span className="next"><i className="ti ti-clock" aria-hidden="true" /> {fmtNext(due)}</span>
              <span className={`supply ${low ? 'low' : ''}`}>
                {low && <i className="ti ti-alert-triangle" aria-hidden="true" />}
                ≈ {left} doses left
              </span>
            </div>

            <button
              className="primary block mt"
              onClick={() =>
                onLog({
                  vial_id: v.id,
                  vial_name: v.name,
                  protocol_id: p.id,
                  draw_units: p.draw_units,
                  bac_water_ml: p.bac_water_ml,
                  breakdown: breakdown.map((b) => ({ name: b.name, mcg: round(b.mcg, 0) })),
                })
              }
            >
              Log this dose
            </button>
          </div>
        )
      })}

      {sheet && (
        <Sheet title="New protocol" onClose={() => setSheet(false)}>
          <ProtocolForm
            vials={vials}
            onDone={() => {
              setSheet(false)
              refresh()
            }}
          />
        </Sheet>
      )}
    </div>
  )
}
