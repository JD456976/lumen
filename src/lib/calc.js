// Lumen dosing math — single source of truth.
// A vial is a container of one-or-more peptide components sharing one
// reconstitution volume. U-100 syringe: 100 units = 1.0 mL.

export const UNITS_PER_ML = 100

// Insulin syringe scales: units that equal 1.0 mL.
export const SYRINGES = [
  { id: 'U-100', unitsPerMl: 100 },
  { id: 'U-50', unitsPerMl: 50 },
  { id: 'U-40', unitsPerMl: 40 },
]

export function unitsToMl(units, unitsPerMl = UNITS_PER_ML) {
  return units / unitsPerMl
}

export function mlToUnits(ml, unitsPerMl = UNITS_PER_ML) {
  return ml * unitsPerMl
}

// concentration of a single component, in mg/mL, after reconstitution
export function concentration(componentMg, bacWaterMl) {
  if (!bacWaterMl || bacWaterMl <= 0) return 0
  return componentMg / bacWaterMl
}

// Given a vial (components + bac water) and a draw in units, return the
// per-component delivered amount. Each entry: { name, mg, mcg }.
export function doseForDraw(components, bacWaterMl, drawUnits, unitsPerMl = UNITS_PER_ML) {
  const ml = unitsToMl(drawUnits, unitsPerMl)
  return components.map((c) => {
    const mg = concentration(c.mg, bacWaterMl) * ml
    return { name: c.name, mg, mcg: mg * 1000 }
  })
}

// Reverse: how many units delivers `targetMcg` of the named component?
export function drawForTarget(components, bacWaterMl, componentName, targetMcg, unitsPerMl = UNITS_PER_ML) {
  const c = components.find((x) => x.name === componentName)
  if (!c) return 0
  const conc = concentration(c.mg, bacWaterMl) // mg/mL
  if (conc <= 0) return 0
  const targetMg = targetMcg / 1000
  const ml = targetMg / conc
  return mlToUnits(ml, unitsPerMl)
}

export function totalMg(components) {
  return components.reduce((s, c) => s + c.mg, 0)
}

// How many doses of this draw size the reconstituted vial yields.
export function dosesPerVial(bacWaterMl, drawUnits, unitsPerMl = UNITS_PER_ML) {
  const perDose = unitsToMl(drawUnits, unitsPerMl)
  if (!bacWaterMl || perDose <= 0) return 0
  return bacWaterMl / perDose
}

// Doses left for a vial: the user-set count if present, else estimated from
// vials-on-hand × doses-per-vial minus what's been logged.
export function effectiveDosesLeft(vial, usedCount = 0) {
  if (vial.doses_remaining != null) return Math.max(0, vial.doses_remaining)
  const cap = (vial.vials_on_hand || 1) * dosesPerVial(vial.default_bac_water_ml || 2, vial.default_draw_units || 10)
  return Math.max(0, Math.floor(cap - usedCount))
}

// Pretty mcg/mg formatting — mg once we cross 1000 mcg.
export function fmtAmount(mcg) {
  if (mcg >= 1000) {
    const mg = mcg / 1000
    return `${round(mg, mg < 10 ? 2 : 1)} mg`
  }
  return `${round(mcg, 0)} mcg`
}

export function round(n, dp = 0) {
  const f = Math.pow(10, dp)
  return Math.round(n * f) / f
}
