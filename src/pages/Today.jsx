import { useEffect, useState } from 'react'
import { listProtocols, listLogs, listSupplements, archiveVial } from '../lib/db'
import { doseForDraw, dosesPerVial, fmtAmount, round } from '../lib/calc'
import { isDueToday, nextDue, fmtNext, currentDraw } from '../lib/schedule'
import { colorFor } from '../lib/library'
import Sheet from '../components/Sheet'
import ScanWizard from '../components/ScanWizard'
import VialForm from '../components/VialForm'
import TakeSheet from '../components/TakeSheet'
import LibraryBrowser from '../components/LibraryBrowser'

function timeToday(t) {
  const [h, m] = (t || '08:00').split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

export default function Today({ vials = [], onLog, onQuickLog, onChanged, refreshKey }) {
  const [protocols, setProtocols] = useState([])
  const [logs, setLogs] = useState([])
  const [supplements, setSupplements] = useState([])
  const [loading, setLoading] = useState(true)
  const [scan, setScan] = useState(false)
  const [editVial, setEditVial] = useState(null)
  const [takeVial, setTakeVial] = useState(null)
  const [addMode, setAddMode] = useState(null) // 'choose'|'library'|'manual'|{prefill}

  useEffect(() => {
    let on = true
    Promise.all([listProtocols(), listLogs(), listSupplements().catch(() => [])])
      .then(([p, l, s]) => {
        if (!on) return
        setProtocols(p)
        setLogs(l)
        setSupplements(s)
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

  const suppDue = supplements
    .filter((s) => isDueToday(s))
    .map((s) => {
      const t = timeToday(s.time_of_day)
      const logged = logs.some(
        (l) => l.supplement_id === s.id && new Date(l.taken_at).toDateString() === todayStr,
      )
      return { s, t, logged }
    })
    .sort((a, b) => a.t - b.t)

  const upNext = protocols
    .filter((p) => p.vial)
    .map((p) => ({ p, d: nextDue(p) }))
    .filter((x) => x.d)
    .sort((a, b) => a.d - b.d)[0]

  const remaining = [...due, ...suppDue].filter((x) => !x.logged)
  const hasToday = due.length > 0 || suppDue.length > 0

  const usedByVial = {}
  for (const l of logs) if (l.vial_id && l.status !== 'skipped') usedByVial[l.vial_id] = (usedByVial[l.vial_id] || 0) + 1
  const myVials = vials.filter((v) => v.persisted).map((v) => ({ ...v, _used: usedByVial[v.id] || 0 }))

  return (
    <div className="page pad">
      <div className="today-head">
        <div className="title">Today</div>
        <div className="muted sm">{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>

      <button className="scan-btn" onClick={() => setScan(true)}>
        <i className="ti ti-camera" aria-hidden="true" />
        <span>Scan a vial</span>
      </button>

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

      {hasToday && (
        <>
          <div className="muted xs section-h">
            {remaining.length ? `${remaining.length} DUE TODAY` : 'ALL DONE TODAY 🎉'}
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

          {suppDue.map(({ s, t, logged }) => (
            <div className={`today-card ${logged ? 'done' : ''}`} key={s.id}>
              <div className="tc-time">{t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
              <div className="tc-body">
                <div className="title sm">{s.name}</div>
                <div className="muted sm">{s.dose || 'supplement'}</div>
              </div>
              {logged ? (
                <span className="tc-done"><i className="ti ti-check" aria-hidden="true" /></span>
              ) : (
                <button className="tc-log" onClick={() => onQuickLog({ supplement_id: s.id, vial_name: s.name, status: 'taken' })}>
                  Log
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {!hasToday && upNext && (
        <div className="upnext">
          <div className="muted xs section-h">UP NEXT</div>
          <div className="title sm">{upNext.p.vial.name}</div>
          <div className="muted sm">{fmtNext(upNext.d)}</div>
        </div>
      )}

      {myVials.length > 0 && (
        <>
          <div className="section-h-row">
            <span className="muted xs">MY PEPTIDES</span>
            <button className="mini" onClick={() => setAddMode('choose')}><i className="ti ti-plus" aria-hidden="true" /> Add</button>
          </div>
          {myVials.map((v) => (
            <PeptideRow
              key={v.id}
              vial={v}
              onEdit={() => setEditVial(v)}
              onTake={() => setTakeVial(v)}
              onDelete={async () => {
                if (confirm(`Remove ${v.name} from inventory?`)) {
                  await archiveVial(v.id)
                  onChanged?.()
                }
              }}
            />
          ))}
        </>
      )}

      {scan && (
        <Sheet title="Scan a vial" onClose={() => setScan(false)}>
          <ScanWizard vials={vials} onDone={() => { setScan(false); onChanged?.() }} />
        </Sheet>
      )}

      {editVial && (
        <Sheet title={`Edit ${editVial.name}`} onClose={() => setEditVial(null)}>
          <VialForm existing={editVial} onDone={() => { setEditVial(null); onChanged?.() }} />
        </Sheet>
      )}

      {takeVial && (
        <Sheet title={`Take · ${takeVial.name}`} onClose={() => setTakeVial(null)}>
          <TakeSheet
            vial={takeVial}
            onConfirm={async (entry) => { await onQuickLog(entry); setTakeVial(null) }}
            onClose={() => setTakeVial(null)}
          />
        </Sheet>
      )}

      {addMode === 'choose' && (
        <Sheet title="Add a peptide" onClose={() => setAddMode(null)}>
          <div className="choices">
            <button className="choice" onClick={() => setAddMode('library')}>
              <i className="ti ti-books" aria-hidden="true" /><span>From library</span><small>Browse or AI lookup</small>
            </button>
            <button className="choice" onClick={() => setAddMode('manual')}>
              <i className="ti ti-pencil" aria-hidden="true" /><span>Manual</span><small>Type it in</small>
            </button>
          </div>
        </Sheet>
      )}
      {addMode === 'library' && (
        <Sheet title="From library" onClose={() => setAddMode(null)}>
          <LibraryBrowser onPick={(prefill) => setAddMode({ prefill })} />
        </Sheet>
      )}
      {addMode === 'manual' && (
        <Sheet title="New vial" onClose={() => setAddMode(null)}>
          <VialForm onDone={() => { setAddMode(null); onChanged?.() }} />
        </Sheet>
      )}
      {addMode?.prefill && (
        <Sheet title={`Add ${addMode.prefill.name}`} onClose={() => setAddMode(null)}>
          <VialForm prefill={addMode.prefill} onDone={() => { setAddMode(null); onChanged?.() }} />
        </Sheet>
      )}
    </div>
  )
}

function PeptideRow({ vial, onTake, onDelete, onEdit }) {
  const [dx, setDx] = useState(0)
  const [startX, setStartX] = useState(null)
  const used = (vial._used) || 0
  const cap = (vial.vials_on_hand || 1) * dosesPerVial(vial.default_bac_water_ml || 2, vial.default_draw_units || 10)
  const left = Math.max(0, Math.floor(cap - used))
  const low = left <= (vial.low_stock_doses || 5)

  return (
    <div className="pep-wrap">
      <button className="pep-del" onClick={onDelete}><i className="ti ti-trash" aria-hidden="true" /></button>
      <div
        className="pep-row"
        style={{ transform: `translateX(${dx}px)` }}
        onTouchStart={(e) => setStartX(e.touches[0].clientX)}
        onTouchMove={(e) => startX != null && setDx(Math.max(-72, Math.min(0, e.touches[0].clientX - startX)))}
        onTouchEnd={() => { setDx(dx < -36 ? -72 : 0); setStartX(null) }}
      >
        <div className="pep-body" onClick={() => dx === 0 && onTake()}>
          <div className="title sm">
            {vial.name}
            <button className="pep-edit-btn" aria-label="Edit" onClick={(e) => { e.stopPropagation(); onEdit() }}>
              <i className="ti ti-pencil" aria-hidden="true" />
            </button>
          </div>
          <div className={`muted sm ${low ? 'pep-low' : ''}`}>
            {left <= 0 ? 'Empty — swipe to remove' : `≈ ${left} doses left`}{vial.vials_on_hand > 1 ? ` · ${vial.vials_on_hand} vials` : ''}
          </div>
        </div>
        <button className="pep-take" onClick={onTake}>Take</button>
      </div>
    </div>
  )
}
