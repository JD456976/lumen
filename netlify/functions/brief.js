// Lumen research briefing — structured dosing overview for a single peptide.
// Information only, community/anecdotal where clinical data is thin.

const SYSTEM = `You produce a structured research briefing for a single peptide.
Return ONLY a JSON object, no prose, in this exact shape:
{
  "peptide": string,
  "summary": string,                  // 1-2 sentences: what it is and what it's researched for
  "dose_range": string,               // typical range with units, e.g. "200–500 mcg/day"
  "frequency": string,                // e.g. "once or twice daily"
  "titration": string,                // how people commonly ramp up
  "cycle_length": string,             // typical length of time to run it / on-off cycle
  "best_time": string,                // best time of day to take and why (e.g. "before bed — GH pulse")
  "fasting": string,                  // fasting/food guidance (e.g. "inject fasted; avoid carbs/fat 2h around dose")
  "side_effects": string[],           // 2-5 commonly reported side effects
  "cautions": string[],               // 2-4 safety/handling cautions
  "evidence_note": string             // one line on how strong/anecdotal the data is
}
Rules:
- Use ranges, not single numbers. Be concrete with units (mcg/mg).
- best_time and fasting: give practical, specific guidance; if it doesn't matter for this peptide, say so plainly.
- This is informational, not medical advice; reflect that peptide dosing is largely community-derived.
- If data is genuinely sparse for this peptide, say so in evidence_note and keep ranges conservative.`

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
  const name = (body.peptide || '').trim()
  if (!name) return json({ error: 'peptide required' }, 400)

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
        max_tokens: 1100,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Briefing for: ${name}` }],
      }),
    })
    if (!res.ok) return json({ error: 'anthropic error', detail: await res.text() }, 502)
    const data = await res.json()
    const parsed = extractJson(data.content?.[0]?.text || '{}')
    if (!parsed) return json({ error: 'could not parse briefing' }, 422)
    return json({ brief: parsed }, 200)
  } catch (e) {
    return json({ error: 'request failed', detail: String(e) }, 500)
  }
}

function extractJson(s) {
  try {
    return JSON.parse(s)
  } catch {
    const m = s.match(/\{[\s\S]*\}/)
    try {
      return m ? JSON.parse(m[0]) : null
    } catch {
      return null
    }
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
