import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function signIn(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="auth">
      <div className="brand">
        <span className="spark" />
        <span className="wordmark">lumen</span>
      </div>
      {sent ? (
        <p className="muted">Check your email for a sign-in link.</p>
      ) : (
        <form onSubmit={signIn} className="auth-form">
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="primary" disabled={busy}>{busy ? 'Sending…' : 'Send magic link'}</button>
          {error && <div className="alert">{error}</div>}
        </form>
      )}
    </div>
  )
}
