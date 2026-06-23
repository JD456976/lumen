import Protocols from './Protocols'
import Vials from './Vials'
import Supplements from './Supplements'

// "My Stack" = scheduled protocols, supplements, then your vial library.
export default function Stack({ vials, onLog, onChanged }) {
  return (
    <div className="stack-page">
      <Protocols vials={vials} onLog={onLog} />
      <div className="stack-divider" />
      <Supplements />
      <div className="stack-divider" />
      <Vials vials={vials} onChanged={onChanged} />
    </div>
  )
}
