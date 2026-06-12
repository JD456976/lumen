// Rough pharmacokinetics for the "in your system" estimate.
// Half-lives are approximate / community-derived, in HOURS. Estimates only.

export const HALF_LIVES = {
  'BPC-157': 4,
  'TB-500': 60,
  'GHK-Cu': 4,
  Ipamorelin: 2,
  'CJC-1295 (no DAC)': 0.5,
  'CJC-1295 NO DAC (MOD GRF 1-29)': 0.5,
  Tesamorelin: 0.5,
  Sermorelin: 0.3,
  Semaglutide: 168,
  Tirzepatide: 120,
  Retatrutide: 144,
  'MOTS-c': 3,
  Epitalon: 1,
  'PT-141': 2,
}

const DEFAULT_HL = 6 // hours, when unknown

export function halfLifeFor(name) {
  if (HALF_LIVES[name]) return HALF_LIVES[name]
  // loose match (e.g. "CJC-1295 ..." variants)
  const key = Object.keys(HALF_LIVES).find(
    (k) => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase()),
  )
  return key ? HALF_LIVES[key] : DEFAULT_HL
}

// mcg of `name` from a single log's breakdown
function mcgInLog(log, name) {
  const c = (log.breakdown || []).find((b) => b.name === name)
  return c ? Number(c.mcg) || 0 : 0
}

// Estimated mcg of `name` in system at time t (ms).
export function levelAt(logs, name, tMs) {
  const hlMs = halfLifeFor(name) * 3600000
  let total = 0
  for (const l of logs) {
    if (l.status === 'skipped') continue
    const dose = mcgInLog(l, name)
    if (!dose) continue
    const lt = new Date(l.taken_at).getTime()
    if (lt > tMs) continue
    total += dose * Math.pow(0.5, (tMs - lt) / hlMs)
  }
  return total
}

// Distinct peptide names that appear in the logs.
export function peptidesInLogs(logs) {
  const set = new Set()
  for (const l of logs) for (const b of l.breakdown || []) set.add(b.name)
  return [...set]
}

// Sampled series over the past `days`, ending now. Returns [{t, v}].
export function series(logs, name, days = 14, now = Date.now()) {
  const start = now - days * 86400000
  const steps = 56 // ~ every 6h over 14d
  const out = []
  for (let i = 0; i <= steps; i++) {
    const t = start + ((now - start) * i) / steps
    out.push({ t, v: levelAt(logs, name, t) })
  }
  return out
}
