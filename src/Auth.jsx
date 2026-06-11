import { useState } from 'react'
import { supabase } from './lib/supabase'
import Spark from './components/Spark'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function signIn(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message)
      else setSent(true)
    } catch (err) {
      // Network-level failure (e.g. "Load failed") — give an actionable hint.
      setError(
        `Could not reach the server (${err?.message || err}). If this app was ` +
          `open before, fully close it and reopen to clear a stale cache, then retry.`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="brand">
        <Spark size={40} />
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
