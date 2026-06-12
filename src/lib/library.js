// Seed library — the static spine. AI fallback + your own saved vials
// will grow around this later. Colors are per-component accents.

export const COMPONENT_COLORS = {
  'GHK-Cu': '#5dcaa5',
  'TB-500': '#85b7eb',
  'BPC-157': '#f0997b',
  default: '#f5c66b',
}

export const SEED_VIALS = [
  {
    id: 'diamond-glow',
    name: 'Diamond Glow',
    note: '70 mg blend · 8 mL vial',
    vialMl: 8,
    components: [
      { name: 'GHK-Cu', mg: 50 },
      { name: 'TB-500', mg: 10 },
      { name: 'BPC-157', mg: 10 },
    ],
    defaultBacWaterMl: 4,
    defaultDrawUnits: 20,
  },
  {
    id: 'bpc-157',
    name: 'BPC-157',
    note: '10 mg · single',
    vialMl: 3,
    components: [{ name: 'BPC-157', mg: 10 }],
    defaultBacWaterMl: 2,
    defaultDrawUnits: 25,
  },
]

export function colorFor(name) {
  return COMPONENT_COLORS[name] || COMPONENT_COLORS.default
}

// Curated starting library. Typical values are starting points to edit,
// not prescriptions. Anything not here falls back to AI lookup.
export const SEED_LIBRARY = [
  { name: 'BPC-157', persona: 'The Healer', tags: ['Recovery', 'Gut'], blurb: 'Tissue repair across gut, tendon, and muscle.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'TB-500', persona: 'The Repair Agent', tags: ['Recovery', 'Performance'], blurb: 'Systemic tissue repair and flexibility.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'GHK-Cu', persona: 'The Renewer', tags: ['Skin', 'Healing'], blurb: 'Copper peptide for skin, hair, and regeneration.', typical_vial_mg: 50, typical_bac_ml: 5 },
  { name: 'Ipamorelin', persona: 'The Gentle Pulse', tags: ['GH', 'Sleep'], blurb: 'Selective GH secretagogue, minimal side effects.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'CJC-1295 (no DAC)', persona: 'The Amplifier', tags: ['GH'], blurb: 'GHRH analog, often paired with a GHRP.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'Tesamorelin', persona: 'The Trimmer', tags: ['GH', 'Fat loss'], blurb: 'GHRH analog studied for visceral fat.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'Semaglutide', persona: 'The Regulator', tags: ['GLP-1', 'Metabolic'], blurb: 'GLP-1 agonist for appetite and glucose.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'Tirzepatide', persona: 'The Dual', tags: ['GLP-1', 'Metabolic'], blurb: 'Dual GIP/GLP-1 agonist.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'MOTS-c', persona: 'The Mitochondrial', tags: ['Metabolic', 'Energy'], blurb: 'Mitochondrial-derived peptide for metabolism.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'Epitalon', persona: 'The Clock', tags: ['Longevity'], blurb: 'Telomerase/pineal peptide studied for aging.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'Sermorelin', persona: 'The Primer', tags: ['GH', 'Sleep'], blurb: 'GHRH analog for GH support.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'PT-141', persona: 'The Spark', tags: ['Libido'], blurb: 'Melanocortin agonist for libido.', typical_vial_mg: 10, typical_bac_ml: 2 },
]

// More common peptides so manual typing finds them.
SEED_LIBRARY.push(
  { name: 'AOD-9604', persona: 'The Fragment', tags: ['Fat loss'], blurb: 'GH fragment studied for fat metabolism.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'Melanotan II', persona: 'The Tan', tags: ['Skin', 'Libido'], blurb: 'Melanocortin agonist for tanning and libido.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'Selank', persona: 'The Calm', tags: ['Nootropic', 'Anxiety'], blurb: 'Anxiolytic/nootropic peptide.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'Semax', persona: 'The Focus', tags: ['Nootropic'], blurb: 'Nootropic peptide for focus and recovery.', typical_vial_mg: 10, typical_bac_ml: 2 },
  { name: 'Thymosin Alpha-1', persona: 'The Guardian', tags: ['Immune'], blurb: 'Immune-modulating peptide.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'KPV', persona: 'The Soother', tags: ['Gut', 'Anti-inflammatory'], blurb: 'Anti-inflammatory tripeptide.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'GHRP-2', persona: 'The Pulse', tags: ['GH'], blurb: 'GH secretagogue (ghrelin mimetic).', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'GHRP-6', persona: 'The Hunger', tags: ['GH', 'Appetite'], blurb: 'GH secretagogue, strong appetite effect.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'Hexarelin', persona: 'The Potent', tags: ['GH'], blurb: 'Potent GH-releasing peptide.', typical_vial_mg: 5, typical_bac_ml: 2 },
  { name: 'Cagrilintide', persona: 'The Satiator', tags: ['Metabolic'], blurb: 'Amylin analog, often paired with GLP-1s.', typical_vial_mg: 5, typical_bac_ml: 2 },
)

// Curated multi-peptide stacks. Picking one builds a blend vial.
export const SEED_STACKS = [
  { name: 'Wolverine (BPC + TB)', blurb: 'Classic healing stack — soft tissue and gut.', tags: ['Recovery'], components: [{ name: 'BPC-157', mg: 10 }, { name: 'TB-500', mg: 10 }], default_bac_water_ml: 3 },
  { name: 'GH Stack (CJC + Ipa)', blurb: 'GH pulse — GHRH + GHRP pairing.', tags: ['GH', 'Sleep'], components: [{ name: 'CJC-1295 (no DAC)', mg: 5 }, { name: 'Ipamorelin', mg: 5 }], default_bac_water_ml: 3 },
  { name: 'Glow (GHK + BPC + TB)', blurb: 'Skin, healing, and regeneration.', tags: ['Skin', 'Recovery'], components: [{ name: 'GHK-Cu', mg: 50 }, { name: 'BPC-157', mg: 10 }, { name: 'TB-500', mg: 10 }], default_bac_water_ml: 4 },
]

// Normalize for fuzzy matching: lowercase, strip non-alphanumerics.
function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Score a query against a text. -1 = no match; higher = better.
function fuzzyScore(query, text) {
  const q = norm(query)
  const t = norm(text)
  if (!q) return 0
  const idx = t.indexOf(q)
  if (idx !== -1) return 100 - idx // contiguous substring, earlier = better
  // subsequence fallback (chars in order, gaps allowed)
  let ti = 0
  let gaps = 0
  for (let qi = 0; qi < q.length; qi++) {
    const found = t.indexOf(q[qi], ti)
    if (found === -1) return -1
    gaps += found - ti
    ti = found + 1
  }
  return 40 - Math.min(gaps, 39)
}

export function searchLibrary(q) {
  if (!(q || '').trim()) return SEED_LIBRARY
  return SEED_LIBRARY.map((p) => {
    const score = Math.max(fuzzyScore(q, p.name), ...p.tags.map((t) => fuzzyScore(q, t) - 20))
    return { p, score }
  })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)
}

export function searchStacks(q) {
  if (!(q || '').trim()) return SEED_STACKS
  return SEED_STACKS.filter((s) => fuzzyScore(q, s.name) >= 0 || s.tags.some((t) => fuzzyScore(q, t) >= 0))
}
