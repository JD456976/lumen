import { useEffect, useState } from 'react'

const LEVELS = {
  clinical: { label: 'Clinical evidence', cls: 'ev-clinical', icon: 'ti-microscope' },
  preclinical: { label: 'Preclinical only', cls: 'ev-preclinical', icon: 'ti-flask' },
  anecdotal: { label: 'Anecdotal / unindexed', cls: 'ev-anecdotal', icon: 'ti-message-circle' },
}

export default function PeptideInfo({ name, seed, onAdd }) {
  const [b, setB] = useState(null)
  const [error, setError] = useState(null)
  const [ev, setEv] = useState(null)

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
    fetch('/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    })
      .then((r) => r.json())
      .then((d) => on && d.level && setEv(d))
      .catch(() => {})
    return () => {
      on = false
    }
  }, [name])

  return (
    <div className="pinfo">
      {seed?.persona && <div className="lib-persona">{seed.persona}</div>}

      {ev && (
        <div className="evidence-box">
          <span className={`ev-badge ${LEVELS[ev.level].cls}`}>
            <i className={`ti ${LEVELS[ev.level].icon}`} aria-hidden="true" /> {LEVELS[ev.level].label}
          </span>
          <div className="muted xs ev-counts">
            {ev.trials.count} clinical trial{ev.trials.count === 1 ? '' : 's'} · {ev.pubmed.count} PubMed paper{ev.pubmed.count === 1 ? '' : 's'}
          </div>
          {ev.trials.studies?.slice(0, 2).map((s) => (
            <a className="ev-link" key={s.nctId} href={s.url}><i className="ti ti-external-link" aria-hidden="true" /> {s.title}</a>
          ))}
          {ev.trials.count === 0 && ev.pubmed.articles?.slice(0, 2).map((a) => (
            <a className="ev-link" key={a.pmid} href={a.url}><i className="ti ti-external-link" aria-hidden="true" /> {a.title} {a.year && `(${a.year})`}</a>
          ))}
        </div>
      )}

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
