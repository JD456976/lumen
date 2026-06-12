import { useState } from 'react'
import { supabase } from '../lib/supabase'

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

      <button className="ghost wide mt" onClick={() => supabase.auth.signOut()}>
        <i className="ti ti-logout" aria-hidden="true" /> Sign out
      </button>
    </div>
  )
}
