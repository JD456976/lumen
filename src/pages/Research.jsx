import { useState } from 'react'
import { marked } from 'marked'
import { colorFor } from '../lib/library'

marked.setOptions({ breaks: true })

function vialLine(v) {
  const bac = v.default_bac_water_ml
  const comps = (v.components || [])
    .map((c) => {
      const conc = bac ? Math.round((c.mg / bac) * 100) / 100 : null
      return `${c.name} ${c.mg}mg${conc != null ? ` (${conc} mg/mL)` : ''}`
    })
    .join(' + ')
  return `${v.name}: ${comps}${bac ? `, reconstituted with ${bac} mL` : ' (not yet reconstituted)'}`
}

export default function Research({ vials = [] }) {
  const onHand = vials.filter((v) => v.persisted)
  // Distinct peptides across the whole inventory.
  const peptides = [...new Set(onHand.flatMap((v) => (v.components || []).map((c) => c.name)))]

  const [active, setActive] = useState('') // nothing selected → nothing generated
  const [briefs, setBriefs] = useState({}) // name -> { loading, data, error }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  // Only fetch a briefing when the user taps a peptide.
  function selectPeptide(name) {
    if (active === name) {
      setActive('')
      return
    }
    setActive(name)
    if (briefs[name]) return
    setBriefs((b) => ({ ...b, [name]: { loading: true } }))
    fetch('/api/brief', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ peptide: name }),
    })
      .then((r) => r.json())
      .then((d) => setBriefs((b) => ({ ...b, [name]: d.brief ? { data: d.brief } : { error: d.error } })))
      .catch((e) => setBriefs((b) => ({ ...b, [name]: { error: String(e) } })))
  }

  async function send(q) {
    const question = (q ?? input).trim()
    if (!question || busy) return
    const next = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const context = onHand.length
        ? `The user injects subcutaneously on a U-100 insulin syringe (100 units = 1 mL). Their vials on hand:\n` +
          onHand.map((v) => `- ${vialLine(v)}`).join('\n') +
          (active ? `\nCurrently focused on ${active}.` : '')
        : null
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, context }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', content: data.reply || data.error || 'No reply.' }])
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: String(e) }])
    } finally {
      setBusy(false)
    }
  }

  const b = briefs[active]

  return (
    <div className="page pad">
      <div className="title">Research</div>
      <div className="muted sm mb">Tap a peptide for a briefing, or ask anything below.</div>

      {peptides.length > 0 ? (
        <div className="pep-pills mb">
          {peptides.map((name) => (
            <button
              key={name}
              className={`mini ${name === active ? 'on' : ''}`}
              onClick={() => selectPeptide(name)}
            >
              <span className="dot" style={{ background: colorFor(name) }} /> {name}
            </button>
          ))}
        </div>
      ) : (
        <div className="muted sm mb">Add peptides on the Today screen and they'll appear here.</div>
      )}

      {b?.loading && <div className="muted sm">Preparing briefing for {active}…</div>}
      {b?.error && <div className="alert">{b.error}</div>}
      {b?.data && (
        <div className="brief">
          <div className="dot-name mb">
            <span className="dot" style={{ background: colorFor(active) }} />
            <span className="title sm">{b.data.peptide}</span>
          </div>
          <p className="muted sm mb">{b.data.summary}</p>
          <div className="brief-grid">
            <Fact icon="ti-ruler-2" label="Dose range" value={b.data.dose_range} />
            <Fact icon="ti-repeat" label="Frequency" value={b.data.frequency} />
            <Fact icon="ti-clock-hour-8" label="Best time" value={b.data.best_time} />
            <Fact icon="ti-salt" label="Fasting / food" value={b.data.fasting} />
            <Fact icon="ti-trending-up" label="Titration" value={b.data.titration} />
            <Fact icon="ti-calendar" label="Cycle" value={b.data.cycle_length} />
          </div>
          {b.data.side_effects?.length > 0 && (
            <div className="cautions">
              <div className="muted xs">SIDE EFFECTS</div>
              {b.data.side_effects.map((s, i) => (
                <div className="caution" key={i}><i className="ti ti-activity-heartbeat" aria-hidden="true" /> {s}</div>
              ))}
            </div>
          )}
          {b.data.cautions?.length > 0 && (
            <div className="cautions">
              <div className="muted xs">WATCH FOR</div>
              {b.data.cautions.map((c, i) => (
                <div className="caution" key={i}><i className="ti ti-alert-triangle" aria-hidden="true" /> {c}</div>
              ))}
            </div>
          )}
          {b.data.evidence_note && <p className="muted xs evidence">{b.data.evidence_note}</p>}
        </div>
      )}

      <div className="muted xs mt mb">ASK ANYTHING</div>
      <div className="chat">
        {messages.map((m, i) =>
          m.role === 'assistant' ? (
            <div key={i} className="bubble assistant md" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }} />
          ) : (
            <div key={i} className="bubble user">{m.content}</div>
          ),
        )}
        {busy && <div className="bubble assistant muted">Thinking…</div>}
      </div>
      <div className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={active ? `Ask about ${active}…` : 'Ask about doses, timing, stacks…'}
        />
        <button className="primary" disabled={busy} onClick={() => send()}>
          <i className="ti ti-arrow-up" aria-hidden="true" />
        </button>
      </div>
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
