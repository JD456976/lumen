// Lumen parser — turn a pasted product description or a screenshot of a
// peptide vial/label into a structured vial object. Vision-capable.

const SYSTEM = `You extract structured peptide vial data from text or product images.
Return ONLY a JSON object, no prose, matching this shape:
{
  "name": string,                       // product/blend name, e.g. "Diamond Glow"
  "vial_ml": number | null,             // vial liquid volume in mL if stated
  "components": [                        // one entry per peptide in the vial
    { "name": string, "mg": number }    // peptide name and its mg in the vial
  ],
  "total_mg": number | null,            // sum of component mg if stated
  "notes": string | null,               // anything useful (CAS, batch, cautions)
  "confidence": "high" | "medium" | "low"
}
Rules:
- A blend has multiple components (e.g. "GHK-Cu (50mg) + TB-500 (10mg) + BPC-157 (10mg)"). List each separately.
- Use mg for component amounts. Convert mcg to mg (1000 mcg = 1 mg).
- If a value is not present, use null. Never invent doses or volumes.
- Set confidence low if the image/text is unclear.`

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405)
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return json({ error: 'server missing ANTHROPIC_API_KEY' }, 500)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }

  const { text, image, media_type } = body
  if (!text && !image) return json({ error: 'provide text or image' }, 400)

  const content = []
  if (image) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: media_type || 'image/png', data: image },
    })
  }
  content.push({
    type: 'text',
    text: text
      ? `Extract the vial from this product text:\n\n${text}`
      : 'Extract the vial from this product image.',
  })

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
        max_tokens: 700,
        system: SYSTEM,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      return json({ error: 'anthropic error', detail }, 502)
    }

    const data = await res.json()
    const raw = data.content?.[0]?.text || '{}'
    const parsed = extractJson(raw)
    if (!parsed) return json({ error: 'could not parse model output', raw }, 422)
    return json({ vial: parsed }, 200)
  } catch (e) {
    return json({ error: 'request failed', detail: String(e) }, 500)
  }
}

function extractJson(s) {
  try {
    return JSON.parse(s)
  } catch {
    const m = s.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0])
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
