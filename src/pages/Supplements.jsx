import { useEffect, useState } from 'react'
import { listSupplements, endSupplement } from '../lib/db'
import { frequencyLabel } from '../lib/schedule'
import Sheet from '../components/Sheet'
import SupplementForm from '../components/SupplementForm'

export default function Supplements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)

  async function refresh() {
    try {
      setItems(await listSupplements())
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    refresh()
  }, [])

  async function remove(s) {
    if (!confirm(`Remove ${s.name}?`)) return
    await endSupplement(s.id)
    refresh()
  }

  return (
    <div className="page pad">
      <div className="head-row mb">
        <span className="title">Supplements</span>
        <button className="pill" onClick={() => setSheet(true)}>
          <i className="ti ti-plus" aria-hidden="true" /> Add
        </button>
      </div>

      {!loading && items.length === 0 && (
        <div className="muted sm">No supplements yet — add vitamins, minerals, or anything non-injectable to see them in Today.</div>
      )}

      {items.map((s) => (
        <div className="vial-card" key={s.id}>
          <div className="vc-top">
            <div>
              <div className="title sm">{s.name}</div>
              <div className="muted sm">{[s.dose, frequencyLabel(s)].filter(Boolean).join(' · ')}</div>
            </div>
            <button className="icon-btn" aria-label="Remove" onClick={() => remove(s)}>
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}

      {sheet && (
        <Sheet title="New supplement" onClose={() => setSheet(false)}>
          <SupplementForm onDone={() => { setSheet(false); refresh() }} />
        </Sheet>
      )}
    </div>
  )
}
