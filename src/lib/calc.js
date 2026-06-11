// Lumen dosing math — single source of truth.
// A vial is a container of one-or-more peptide components sharing one
// reconstitution volume. U-100 syringe: 100 units = 1.0 mL.

export const UNITS_PER_ML = 100

export function unitsToMl(units) {
  return units / UNITS_PER_ML
}

export function mlToUnits(ml) {
  return ml * UNITS_PER_ML
}

// concentration of a single component, in mg/mL, after reconstitution
export function concentration(componentMg, bacWaterMl) {
  if (!bacWaterMl || bacWaterMl <= 0) return 0
  return componentMg / bacWaterMl
}

// Given a vial (components + bac water) and a draw in units, return the
// per-component delivered amount. Each entry: { name, mg, mcg }.
export function doseForDraw(components, bacWaterMl, drawUnits) {
  const ml = unitsToMl(drawUnits)
  return components.map((c) => {
    const mg = concentration(c.mg, bacWaterMl) * ml
    return { name: c.name, mg, mcg: mg * 1000 }
  })
}

// Reverse: how many units delivers `targetMcg` of the named component?
export function drawForTarget(components, bacWaterMl, componentName, targetMcg) {
  const c = components.find((x) => x.name === componentName)
  if (!c) return 0
  const conc = concentration(c.mg, bacWaterMl) // mg/mL
  if (conc <= 0) return 0
  const targetMg = targetMcg / 1000
  const ml = targetMg / conc
  return mlToUnits(ml)
}

export function totalMg(components) {
  return components.reduce((s, c) => s + c.mg, 0)
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
