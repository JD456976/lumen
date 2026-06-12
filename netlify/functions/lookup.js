// Lumen library autofill — given a peptide name, return a typical vial config
// to pre-fill (values are typical starting points, editable, not prescriptions).

const SYSTEM = `You return a typical vial configuration for a peptide, to pre-fill a form.
Return ONLY a JSON object in this shape:
{
  "name": string,
  "persona": string,            // 2-3 word nickname, e.g. "The Healer"
  "tags": string[],             // 1-3 short tags, e.g. ["Recovery","Gut"]
  "blurb": string,              // one sentence on what it's researched for
  "typical_vial_mg": number,    // a common vial strength in mg
  "typical_bac_ml": number,     // a common reconstitution volume in mL
  "components": [ { "name": string, "mg": number } ]  // for blends; single peptide = one entry
}
Rules:
- These are typical/common values to pre-fill an editable form, NOT prescriptions.
- If it's a known blend, list each component. Otherwise one component matching the vial strength.
- Be realistic; if unsure of a common strength, pick the most typical.`

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
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Vial config for: ${name}` }],
      }),
    })
    if (!res.ok) return json({ error: 'anthropic error', detail: await res.text() }, 502)
    const data = await res.json()
    const parsed = extractJson(data.content?.[0]?.text || '{}')
    if (!parsed) return json({ error: 'could not parse lookup' }, 422)
    return json({ peptide: parsed }, 200)
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
