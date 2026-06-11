import { useState } from 'react'

export default function Research({ vial }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const context = vial
    ? `${vial.name} — ${(vial.components || []).map((c) => `${c.name} ${c.mg}mg`).join(', ')}`
    : null

  async function send(q) {
    const question = (q ?? input).trim()
    if (!question || busy) return
    const next = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
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

  const starters = [
    'Typical dose range and frequency?',
    'How do people titrate this up?',
    'Usual cycle length?',
  ]

  return (
    <div className="page pad">
      <div className="title">Research</div>
      <div className="muted sm mb">
        {context ? `About: ${vial.name}` : 'Ask about any peptide.'} · information, not medical advice
      </div>

      {messages.length === 0 && (
        <div className="starters">
          {starters.map((s) => (
            <button key={s} className="starter" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
        ))}
        {busy && <div className="bubble assistant muted">Thinking…</div>}
      </div>

      <div className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask a follow-up…"
        />
        <button className="primary" disabled={busy} onClick={() => send()}>
          <i className="ti ti-arrow-up" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
