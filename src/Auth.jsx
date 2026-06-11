import { useState } from 'react'
import { supabase } from './lib/supabase'
import Spark from './components/Spark'

export default function Auth() {
  const [mode, setMode] = useState('password') // 'password' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) setError(error.message)
        else setSent(true)
      }
    } catch (err) {
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
        <form onSubmit={submit} className="auth-form">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode === 'password' && (
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <button className="primary" disabled={busy}>
            {busy ? '…' : mode === 'password' ? 'Sign in' : 'Send magic link'}
          </button>
          {error && <div className="alert">{error}</div>}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setError(null)
              setMode((m) => (m === 'password' ? 'magic' : 'password'))
            }}
          >
            {mode === 'password' ? 'Email me a link instead' : 'Use a password instead'}
          </button>
        </form>
      )}
    </div>
  )
}
