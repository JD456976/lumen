import { useState } from 'react'
import { archiveVial } from '../lib/db'
import { totalMg } from '../lib/calc'
import { colorFor } from '../lib/library'
import Sheet from '../components/Sheet'
import VialForm from '../components/VialForm'
import LibraryBrowser from '../components/LibraryBrowser'
import AddVial from './AddVial'

export default function Vials({ vials, onChanged }) {
  const [sheet, setSheet] = useState(null) // 'choose'|'manual'|'scan'|'library'|{edit}|{prefill}
  const persisted = vials.filter((v) => v.persisted)

  async function remove(v) {
    if (!v.persisted) return
    if (!confirm(`Archive ${v.name}?`)) return
    await archiveVial(v.id)
    onChanged()
  }

  function close() {
    setSheet(null)
  }
  function afterSave() {
    close()
    onChanged()
  }

  return (
    <div className="page pad">
      <div className="head-row mb">
        <span className="title">Vials</span>
        <button className="pill" onClick={() => setSheet('choose')}>
          <i className="ti ti-plus" aria-hidden="true" /> Add
        </button>
      </div>

      {persisted.length === 0 && (
        <div className="muted sm">No saved vials yet. The calculator is showing examples — add your own to log doses against them.</div>
      )}

      {persisted.map((v) => (
        <div className="vial-card" key={v.id}>
          <div className="vc-top">
            <div>
              <div className="title sm">{v.name}</div>
              <div className="muted sm">
                {totalMg(v.components)} mg{v.components.length > 1 ? ' blend' : ''}
                {v.vial_ml ? ` · ${v.vial_ml} mL` : ''}
              </div>
            </div>
            <div className="vc-actions">
              <button className="icon-btn" aria-label="Edit" onClick={() => setSheet({ edit: v })}>
                <i className="ti ti-edit" aria-hidden="true" />
              </button>
              <button className="icon-btn" aria-label="Archive" onClick={() => remove(v)}>
                <i className="ti ti-trash" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="dots">
            {v.components.map((c) => (
              <span className="dot-name" key={c.name}>
                <span className="dot" style={{ background: colorFor(c.name) }} />
                {c.name} {c.mg}mg
              </span>
            ))}
          </div>
        </div>
      ))}

      {sheet === 'choose' && (
        <Sheet title="Add a vial" onClose={close}>
          <div className="choices">
            <button className="choice" onClick={() => setSheet('library')}>
              <i className="ti ti-books" aria-hidden="true" />
              <span>From library</span>
              <small>Browse or AI lookup</small>
            </button>
            <button className="choice" onClick={() => setSheet('scan')}>
              <i className="ti ti-camera" aria-hidden="true" />
              <span>Scan or paste</span>
              <small>Screenshot or text</small>
            </button>
            <button className="choice" onClick={() => setSheet('manual')}>
              <i className="ti ti-pencil" aria-hidden="true" />
              <span>Manual</span>
              <small>Type it in</small>
            </button>
          </div>
        </Sheet>
      )}

      {sheet === 'manual' && (
        <Sheet title="New vial" onClose={close}>
          <VialForm onDone={afterSave} />
        </Sheet>
      )}

      {sheet === 'library' && (
        <Sheet title="From library" onClose={close}>
          <LibraryBrowser onPick={(prefill) => setSheet({ prefill })} />
        </Sheet>
      )}

      {sheet?.prefill && (
        <Sheet title={`Add ${sheet.prefill.name}`} onClose={close}>
          <VialForm prefill={sheet.prefill} onDone={afterSave} />
        </Sheet>
      )}

      {sheet === 'scan' && (
        <Sheet title="Scan or paste" onClose={close}>
          <AddVial onSaved={afterSave} embedded />
        </Sheet>
      )}

      {sheet?.edit && (
        <Sheet title={`Edit ${sheet.edit.name}`} onClose={close}>
          <VialForm existing={sheet.edit} onDone={afterSave} />
        </Sheet>
      )}
    </div>
  )
}
