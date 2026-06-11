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
    })
    .select()
    .single()
  if (error) throw error
  return data
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
