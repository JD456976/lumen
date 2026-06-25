import { supabase } from './supabase'

// ---- vials ----
export async function listVials() {
  const { data, error } = await supabase
    .from('vials')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addVial(v) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('vials')
    .insert({
      user_id: u.user.id,
      name: v.name,
      note: v.note ?? null,
      vial_ml: v.vial_ml ?? null,
      components: v.components ?? [],
      default_bac_water_ml: v.default_bac_water_ml ?? null,
      default_draw_units: v.default_draw_units ?? null,
      vials_on_hand: v.vials_on_hand ?? 1,
      dose_rec: v.dose_rec ?? null,
      doses_remaining: v.doses_remaining ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateVial(id, patch) {
  const { data, error } = await supabase
    .from('vials')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Most recent taken log for a vial (for the double-dose guard).
export async function lastVialLog(vialId) {
  const { data } = await supabase
    .from('dose_logs')
    .select('taken_at')
    .eq('vial_id', vialId)
    .eq('status', 'taken')
    .order('taken_at', { ascending: false })
    .limit(1)
  return data?.[0] || null
}

// Tick a vial's directly-set doses-remaining counter down by one (if set).
export async function decrementDoses(vialId) {
  const { data } = await supabase.from('vials').select('doses_remaining').eq('id', vialId).single()
  if (data && data.doses_remaining != null) {
    await supabase.from('vials').update({ doses_remaining: Math.max(0, data.doses_remaining - 1) }).eq('id', vialId)
  }
}

export async function archiveVial(id) {
  const { error } = await supabase.from('vials').update({ archived: true }).eq('id', id)
  if (error) throw error
}

// ---- dose logs ----
export async function listLogs() {
  const { data, error } = await supabase
    .from('dose_logs')
    .select('*')
    .order('taken_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

export async function addLog(entry) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('dose_logs')
    .insert({ user_id: u.user.id, ...entry })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLog(id) {
  const { error } = await supabase.from('dose_logs').delete().eq('id', id)
  if (error) throw error
}

// ---- protocols ----
export async function listProtocols() {
  const { data, error } = await supabase
    .from('protocols')
    .select('*, vial:vials(*)')
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addProtocol(p) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('protocols')
    .insert({ user_id: u.user.id, ...p })
    .select('*, vial:vials(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateProtocol(id, patch) {
  const { error } = await supabase.from('protocols').update(patch).eq('id', id)
  if (error) throw error
}

export async function endProtocol(id) {
  const { error } = await supabase.from('protocols').update({ active: false }).eq('id', id)
  if (error) throw error
}

// ---- supplements ----
export async function listSupplements() {
  const { data, error } = await supabase
    .from('supplements')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addSupplement(s) {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('supplements')
    .insert({ user_id: u.user.id, ...s })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endSupplement(id) {
  const { error } = await supabase.from('supplements').update({ active: false }).eq('id', id)
  if (error) throw error
}

// Count of doses logged per vial_id — used for supply remaining.
export async function dosesLoggedByVial() {
  const { data, error } = await supabase.from('dose_logs').select('vial_id')
  if (error) throw error
  const counts = {}
  for (const r of data) if (r.vial_id) counts[r.vial_id] = (counts[r.vial_id] || 0) + 1
  return counts
}
