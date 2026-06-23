import Protocols from './Protocols'
import Vials from './Vials'

// "My Stack" = your scheduled protocols on top, your vial library below.
export default function Stack({ vials, onLog, onChanged }) {
  return (
    <div className="stack-page">
      <Protocols vials={vials} onLog={onLog} />
      <div className="stack-divider" />
      <Vials vials={vials} onChanged={onChanged} />
    </div>
  )
}
