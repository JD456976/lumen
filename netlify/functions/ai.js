// Lumen research assistant — free-form Q&A about peptides, scoped to a vial.
// Information only, explicitly not medical advice.

const SYSTEM = `You are Lumen's peptide research assistant for a single private user.
Give clear, practical, well-organized information about peptides: typical dose
ranges, frequency, titration approaches, cycle length, and things to watch for.

Understanding what they ask:
- The user often refers to their own vials by a product or BLEND name (e.g. "Diamond Glow"). The vial's composition is given in the context below. ALWAYS interpret a named blend as that combination of peptides — never ask the user to "specify a peptide" when the blend is described in context. Address the blend as a whole and, where useful, break down by component.
- If something is genuinely ambiguous and no context is given, make a reasonable assumption and say what you assumed rather than refusing.

Important framing:
- Peptide dosing data is largely community/anecdotal, not FDA-label clinical guidance. Say so when relevant.
- You provide information, not medical advice. Do not give individualized medical direction.
- Be concrete and useful; use ranges and note when evidence is thin.

Formatting (IMPORTANT — output is rendered as Markdown):
- Use Markdown: short ## or ** bold headers, - bullet lists, and **bold** for key numbers.
- Keep it tight and skimmable. Lead with the answer, then details. No wall-of-text paragraphs.`

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return json({ error: 'server missing ANTHROPIC_API_KEY' }, 500)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }

  const { messages, context } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages[] required' }, 400)
  }

  const system = context ? `${SYSTEM}\n\nCurrent vial context: ${context}` : SYSTEM

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      return json({ error: 'anthropic error', detail }, 502)
    }
    const data = await res.json()
    return json({ reply: data.content?.[0]?.text || '' }, 200)
  } catch (e) {
    return json({ error: 'request failed', detail: String(e) }, 500)
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
