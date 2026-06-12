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

export function searchLibrary(q) {
  const s = (q || '').trim().toLowerCase()
  if (!s) return SEED_LIBRARY
  return SEED_LIBRARY.filter(
    (p) => p.name.toLowerCase().includes(s) || p.tags.some((t) => t.toLowerCase().includes(s)),
  )
}
