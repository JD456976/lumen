import { useEffect, useState } from 'react'
import { listProtocols, listLogs } from '../lib/db'
import { doseForDraw, dosesPerVial, fmtAmount, round } from '../lib/calc'
import { isDueToday, nextDue, fmtNext, currentDraw } from '../lib/schedule'
import { colorFor } from '../lib/library'

function timeToday(t) {
  const [h, m] = (t || '08:00').split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

export default function Today({ onLog, refreshKey }) {
  const [protocols, setProtocols] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    Promise.all([listProtocols(), listLogs()])
      .then(([p, l]) => {
        if (!on) return
        setProtocols(p)
        setLogs(l)
      })
      .catch(() => on && setProtocols([]))
      .finally(() => on && setLoading(false))
    return () => {
      on = false
    }
  }, [refreshKey])

  if (loading) return <div className="page pad muted">Loading…</div>

  const now = new Date()
  const todayStr = now.toDateString()

  const due = protocols
    .filter((p) => p.vial && isDueToday(p))
    .map((p) => {
      const t = timeToday(p.time_of_day)
      const logged = logs.some(
        (l) => l.protocol_id === p.id && l.status !== 'skipped' && new Date(l.taken_at).toDateString() === todayStr,
      )
      return { p, t, logged }
    })
    .sort((a, b) => a.t - b.t)

  const lowStock = protocols
    .filter((p) => p.vial)
    .map((p) => {
      const cap = (p.vial.vials_on_hand || 1) * dosesPerVial(p.bac_water_ml, p.draw_units)
      const used = logs.filter((l) => l.vial_id === p.vial.id && l.status !== 'skipped').length
      return { name: p.vial.name, left: Math.max(0, Math.floor(cap - used)), thresh: p.vial.low_stock_doses || 5 }
    })
    .filter((x) => x.left <= x.thresh)

  const upNext = protocols
    .filter((p) => p.vial)
    .map((p) => ({ p, d: nextDue(p) }))
    .filter((x) => x.d)
    .sort((a, b) => a.d - b.d)[0]

  const remaining = due.filter((d) => !d.logged)

  return (
    <div className="page pad">
      <div className="today-head">
        <div className="title">Today</div>
        <div className="muted sm">{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>

      {lowStock.map((s) => (
        <div className="lowstock-banner" key={s.name}>
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <span><strong>{s.name}</strong> — ≈ {s.left} doses left. Reorder soon.</span>
        </div>
      ))}

      {protocols.length === 0 && (
        <div className="empty">
          <i className="ti ti-calendar-check" aria-hidden="true" />
          <p>No protocols scheduled.</p>
          <p className="muted sm">Add a vial and schedule it in the Stack tab to see your day here.</p>
        </div>
      )}

      {due.length > 0 && (
        <>
          <div className="muted xs section-h">
            {remaining.length ? `${remaining.length} DOSE${remaining.length > 1 ? 'S' : ''} DUE TODAY` : 'ALL DONE TODAY 🎉'}
          </div>
          {due.map(({ p, t, logged }) => {
            const draw = currentDraw(p)
            const breakdown = doseForDraw(p.vial.components, p.bac_water_ml, draw)
            return (
              <div className={`today-card ${logged ? 'done' : ''}`} key={p.id}>
                <div className="tc-time">{t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                <div className="tc-body">
                  <div className="title sm">{p.vial.name}</div>
                  <div className="chips">
                    {breakdown.map((b) => (
                      <span className="chip" key={b.name}>
                        <span className="dot" style={{ background: colorFor(b.name) }} /> {b.name} {fmtAmount(b.mcg)}
                      </span>
                    ))}
                  </div>
                </div>
                {logged ? (
                  <span className="tc-done"><i className="ti ti-check" aria-hidden="true" /></span>
                ) : (
                  <button
                    className="tc-log"
                    onClick={() =>
                      onLog({
                        vial_id: p.vial.id,
                        vial_name: p.vial.name,
                        protocol_id: p.id,
                        draw_units: draw,
                        bac_water_ml: p.bac_water_ml,
                        breakdown: breakdown.map((b) => ({ name: b.name, mcg: round(b.mcg, 0) })),
                      })
                    }
                  >
                    Log
                  </button>
                )}
              </div>
            )
          })}
        </>
      )}

      {due.length === 0 && upNext && (
        <div className="upnext">
          <div className="muted xs section-h">UP NEXT</div>
          <div className="title sm">{upNext.p.vial.name}</div>
          <div className="muted sm">{fmtNext(upNext.d)}</div>
        </div>
      )}
    </div>
  )
}
