// Scheduled: checks active protocols and pushes a reminder when a dose is due
// in the user's local time. Fires once per scheduled occurrence.
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const DOW_ALL = [0, 1, 2, 3, 4, 5, 6]

// Local wall-clock parts for a tz.
function localParts(tz, now) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]))
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    dow: dowMap[p.weekday],
    minutes: Number(p.hour) * 60 + Number(p.minute),
    dateKey: `${p.year}-${p.month}-${p.day}`,
  }
}

function activeDays(p) {
  return p.frequency === 'daily' ? DOW_ALL : p.days_of_week || []
}

export default async (req) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'missing supabase service env' }, 500)
  if (!process.env.VAPID_PRIVATE_KEY) return json({ error: 'missing VAPID keys' }, 500)

  webpush.setVapidDetails(
    'mailto:craig219@comcast.net',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )

  const sb = createClient(url, key, { auth: { persistSession: false } })
  const now = new Date()

  const { data: protocols } = await sb
    .from('protocols')
    .select('*, vial:vials(name, vials_on_hand, low_stock_doses, doses_remaining)')
    .eq('active', true)
  const { data: subs } = await sb.from('push_subscriptions').select('*')
  const { data: allLogs } = await sb.from('dose_logs').select('vial_id, status')
  const vialUsed = {}
  for (const l of allLogs || []) if (l.vial_id && l.status !== 'skipped') vialUsed[l.vial_id] = (vialUsed[l.vial_id] || 0) + 1

  const subsByUser = {}
  for (const s of subs || []) (subsByUser[s.user_id] ||= []).push(s)

  let sent = 0
  for (const p of protocols || []) {
    if (p.frequency === 'as_needed') continue
    const userSubs = subsByUser[p.user_id]
    if (!userSubs?.length) continue
    const tz = userSubs[0].tz || 'America/New_York'
    const { dow, minutes, dateKey } = localParts(tz, now)
    if (!activeDays(p).includes(dow)) continue

    const [h, m] = (p.time_of_day || '08:00').split(':').map(Number)
    const schedMinutes = h * 60 + m
    if (minutes < schedMinutes) continue // not time yet today

    // already fired for today's occurrence?
    if (p.last_notified_at) {
      const last = localParts(tz, new Date(p.last_notified_at)).dateKey
      if (last === dateKey) continue
    }

    const payload = JSON.stringify({
      title: "It's time for your dose",
      body: `${p.vial?.name || 'Dose'} · ${p.draw_units} u`,
      url: '/',
    })
    for (const s of userSubs) {
      try {
        await webpush.sendNotification(s.subscription, payload)
        sent++
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }
    await sb.from('protocols').update({ last_notified_at: now.toISOString() }).eq('id', p.id)
  }

  // Low-vial warnings, sent once/day in each user's noon window (12:00–12:14 local).
  let lowSent = 0
  const seenLowVial = new Set()
  for (const p of protocols || []) {
    if (!p.vial) continue
    const userSubs = subsByUser[p.user_id]
    if (!userSubs?.length) continue
    const tz = userSubs[0].tz || 'America/New_York'
    const { minutes } = localParts(tz, now)
    if (minutes < 720 || minutes >= 735) continue // only 12:00–12:14
    let left
    if (p.vial.doses_remaining != null) {
      left = Math.max(0, p.vial.doses_remaining)
    } else {
      const perDose = p.draw_units / 100
      const cap = (p.vial.vials_on_hand || 1) * (perDose > 0 ? p.bac_water_ml / perDose : 0)
      left = Math.max(0, Math.floor(cap - (vialUsed[p.vial_id] || 0)))
    }
    const key = `${p.user_id}:${p.vial_id}`
    if (left > (p.vial.low_stock_doses || 5) || seenLowVial.has(key)) continue
    seenLowVial.add(key)
    const payload = JSON.stringify({ title: 'Low vial', body: `${p.vial.name} — ≈ ${left} doses left. Reorder soon.`, url: '/' })
    for (const s of userSubs) {
      try {
        await webpush.sendNotification(s.subscription, payload)
        lowSent++
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      }
    }
  }

  return json({ ok: true, sent, lowSent }, 200)
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}

export const config = { schedule: '*/15 * * * *' }
