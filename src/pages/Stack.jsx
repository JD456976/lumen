import { useState } from 'react'
import Protocols from './Protocols'
import Supplements from './Supplements'
import Sheet from '../components/Sheet'
import ProtocolBuilder from '../components/ProtocolBuilder'

// "My Stack" = scheduled protocols + supplements (vials live on Today).
export default function Stack({ vials, onLog, onChanged }) {
  const [builder, setBuilder] = useState(false)
  const [bump, setBump] = useState(0)

  return (
    <div className="stack-page">
      <div className="pad" style={{ paddingBottom: 0 }}>
        <button className="reminder-banner" onClick={() => setBuilder(true)}>
          <i className="ti ti-sparkles" aria-hidden="true" />
          <span>Build a protocol with AI</span>
        </button>
      </div>

      <Protocols key={`p${bump}`} vials={vials} onLog={onLog} />
      <div className="stack-divider" />
      <Supplements key={`s${bump}`} />

      {builder && (
        <Sheet title="Build with AI" onClose={() => setBuilder(false)}>
          <ProtocolBuilder
            onDone={() => {
              setBuilder(false)
              onChanged()
              setBump((n) => n + 1)
            }}
          />
        </Sheet>
      )}
    </div>
  )
}
