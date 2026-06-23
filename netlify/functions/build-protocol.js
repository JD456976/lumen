// Lumen AI Protocol Builder — turn a goal description or a provider/protocol
// screenshot into a complete stack (vials + schedules + titration + cycles).

const SYSTEM = `You design a peptide protocol stack from a user's goal or a screenshot of a provider/protocol.
Return ONLY a JSON object in this exact shape:
{
  "summary": string,                         // one sentence describing the stack
  "stack": [
    {
      "name": string,                        // vial/blend name
      "components": [ { "name": string, "mg": number } ],  // per-vial peptide(s) in mg
      "bac_water_ml": number,                // suggested reconstitution volume
      "draw_units": number,                  // units to draw on a U-100 syringe for one dose
      "frequency": "daily" | "custom" | "weekly" | "as_needed",
      "days_of_week": number[],              // 0=Sun..6=Sat (only for custom/weekly; else [])
      "time_of_day": string,                 // "HH:MM" 24h
      "phases": [ { "weeks": number, "draw_units": number } ],  // titration ramp; [] if none
      "cycle_weeks_on": number,              // 0 = continuous
      "cycle_weeks_off": number,
      "rationale": string                    // one short line why
    }
  ]
}
Rules:
- Compute draw_units from the dose, vial mg, and bac_water_ml on a U-100 syringe (100 units = 1 mL). Be internally consistent.
- Use typical community dose ranges. Include titration phases when commonly used (e.g. GH secretagogues).
- This is informational, typical-range guidance, NOT medical advice. Don't invent exotic compounds.
- If a screenshot is given, extract the actual peptides/doses shown and structure them.`

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
  const { goal, image, media_type } = body
  if (!goal && !image) return json({ error: 'provide a goal or image' }, 400)

  const content = []
  if (image) {
    content.push({ type: 'image', source: { type: 'base64', media_type: media_type || 'image/png', data: image } })
  }
  content.push({ type: 'text', text: goal ? `Build a stack for: ${goal}` : 'Build a stack from this protocol image.' })

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: 'user', content }],
      }),
    })
    if (!res.ok) return json({ error: 'anthropic error', detail: await res.text() }, 502)
    const data = await res.json()
    const parsed = extractJson(data.content?.[0]?.text || '{}')
    if (!parsed?.stack) return json({ error: 'could not parse stack' }, 422)
    return json(parsed, 200)
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
