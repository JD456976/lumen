import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { listLogs } from '../lib/db'

function csvCell(v) {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function exportCsv() {
  const logs = await listLogs()
  const headers = ['taken_at', 'vial', 'status', 'draw_units', 'bac_water_ml', 'site', 'doses', 'side_effects', 'notes']
  const rows = logs.map((l) => [
    new Date(l.taken_at).toISOString(),
    l.vial_name, l.status, l.draw_units, l.bac_water_ml, l.site,
    (l.breakdown || []).map((b) => `${b.name} ${b.mcg}mcg`).join('; '),
    l.side_effects, l.notes,
  ])
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `lumen-log.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Settings({ email }) {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  async function changePw() {
    if (pw.length < 8) {
      setMsg({ type: 'err', text: 'Use at least 8 characters.' })
      return
    }
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) setMsg({ type: 'err', text: error.message })
    else {
      setMsg({ type: 'ok', text: 'Password updated.' })
      setPw('')
    }
  }

  return (
    <div className="form">
      <div className="muted sm mb">Signed in as {email}</div>

      <label className="lbl">New password</label>
      <input
        className="in"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      {msg && <div className={msg.type === 'err' ? 'alert' : 'ok-note'}>{msg.text}</div>}
      <button className="primary block mt" disabled={busy} onClick={changePw}>
        {busy ? 'Updating…' : 'Change password'}
      </button>

      <button className="ghost wide mt" onClick={() => exportCsv().catch((e) => setMsg({ type: 'err', text: String(e.message || e) }))}>
        <i className="ti ti-download" aria-hidden="true" /> Export log (CSV)
      </button>

      <button className="ghost wide mt" onClick={() => supabase.auth.signOut()}>
        <i className="ti ti-logout" aria-hidden="true" /> Sign out
      </button>
    </div>
  )
}
