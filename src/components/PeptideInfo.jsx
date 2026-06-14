import { useEffect, useState } from 'react'

export default function PeptideInfo({ name, seed, onAdd }) {
  const [b, setB] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let on = true
    fetch('/api/brief', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ peptide: name }),
    })
      .then((r) => r.json())
      .then((d) => on && (d.brief ? setB(d.brief) : setError(d.error || 'No info.')))
      .catch((e) => on && setError(String(e)))
    return () => {
      on = false
    }
  }, [name])

  return (
    <div className="pinfo">
      {seed?.persona && <div className="lib-persona">{seed.persona}</div>}

      {!b && !error && <div className="muted sm">Loading info for {name}…</div>}
      {error && <div className="alert">{error}</div>}

      {b && (
        <>
          <p className="pinfo-summary">{b.summary}</p>
          <div className="brief-grid">
            <Fact icon="ti-ruler-2" label="Dose range" value={b.dose_range} />
            <Fact icon="ti-repeat" label="Frequency" value={b.frequency} />
            <Fact icon="ti-clock-hour-8" label="Best time" value={b.best_time} />
            <Fact icon="ti-salt" label="Fasting / food" value={b.fasting} />
            <Fact icon="ti-trending-up" label="Titration" value={b.titration} />
            <Fact icon="ti-calendar" label="Cycle length" value={b.cycle_length} />
          </div>

          {b.side_effects?.length > 0 && (
            <div className="pinfo-block">
              <div className="muted xs">SIDE EFFECTS</div>
              {b.side_effects.map((s, i) => (
                <div className="caution" key={i}><i className="ti ti-activity-heartbeat" aria-hidden="true" /> {s}</div>
              ))}
            </div>
          )}

          {b.cautions?.length > 0 && (
            <div className="pinfo-block">
              <div className="muted xs">CAUTIONS</div>
              {b.cautions.map((c, i) => (
                <div className="caution" key={i}><i className="ti ti-alert-triangle" aria-hidden="true" /> {c}</div>
              ))}
            </div>
          )}

          {b.evidence_note && <p className="muted xs evidence">{b.evidence_note}</p>}
        </>
      )}

      <p className="muted xs" style={{ fontStyle: 'italic' }}>Information only — not medical advice.</p>

      {onAdd && (
        <button className="primary block mt" onClick={onAdd}>
          <i className="ti ti-plus" aria-hidden="true" /> Add to my vials
        </button>
      )}
    </div>
  )
}

function Fact({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="fact">
      <div className="fact-label"><i className={`ti ${icon}`} aria-hidden="true" /> {label}</div>
      <div className="fact-value">{value}</div>
    </div>
  )
}
