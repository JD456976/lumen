// Lumen dose recommendation — low / normal / high in mcg for one peptide,
// plus timing and cycling. Sourced from research + common community practice.
// Information only, not medical advice.

const SYSTEM = `You give typical dosing recommendations for ONE peptide for a private research log.
Return ONLY a JSON object in this exact shape:
{
  "peptide": string,
  "low_mcg": number,            // cautious STARTING / titration-in per-dose amount (mcg)
  "normal_mcg": number,         // the dose MOST people actually run for results — the commonly-cited EFFECTIVE per-dose amount (mcg)
  "high_mcg": number,           // upper end of the commonly-used per-dose range (mcg)
  "frequency": string,          // e.g. "once daily", "every other day", "once weekly", "as needed"
  "timing": string,             // when to take and any fasting note, one sentence
  "cycle": string,              // whether/how it's cycled, or "typically run continuously"
  "source": string              // e.g. "human clinical trials", "community protocols (PepPedia/forums/Reddit)"
}
Rules:
- "normal_mcg" is the TYPICAL EFFECTIVE dose people actually run (what references like PepPedia / common protocols list as the standard dose) — NOT a conservative beginner dose. "low_mcg" is the cautious starting dose; "high_mcg" is the top of the common range. Do not under-dose "normal".
- The three values MUST be strictly increasing: low_mcg < normal_mcg < high_mcg. Never make them equal.
- Calibrate to mainstream community references and clinical data; e.g. CJC-1295/Ipamorelin normal ≈ 200 mcg (range 100–300). Match what experienced users and dosing references actually use.
- The user administers ALL peptides by SUBCUTANEOUS INJECTION using a U-100 insulin syringe. Give injectable per-dose micrograms — NOT oral/capsule dosing. If a compound is normally oral, give the typical injectable-research equivalent and note it in "source".
- All values are PER-DOSE micrograms (numbers only, no units in the value).
- Base on human clinical data where it exists; otherwise common community practice — state which in "source".
- This is informational, not medical advice.`

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
  const name = (body.name || '').trim()
  if (!name) return json({ error: 'name required' }, 400)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Dosing recommendation for: ${name}` }],
      }),
    })
    if (!res.ok) return json({ error: 'anthropic error', detail: await res.text() }, 502)
    const data = await res.json()
    const parsed = extractJson(data.content?.[0]?.text || '{}')
    if (!parsed) return json({ error: 'could not parse recommendation' }, 422)
    return json({ rec: parsed }, 200)
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
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
