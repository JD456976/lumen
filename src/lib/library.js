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
