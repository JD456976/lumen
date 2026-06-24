import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { SEED_VIALS } from './lib/library'
import { listVials, addLog } from './lib/db'
import Auth from './Auth'
import Today from './pages/Today'
import Calculator from './pages/Calculator'
import Stack from './pages/Stack'
import LogPage from './pages/LogPage'
import Research from './pages/Research'
import Sheet from './components/Sheet'
import LogSheet from './components/LogSheet'
import Settings from './components/Settings'
import Spark from './components/Spark'
import './App.css'

const TABS = [
  { id: 'today', label: 'Today', icon: 'ti-home' },
  { id: 'calc', label: 'Calc', icon: 'ti-calculator' },
  { id: 'stack', label: 'Stack', icon: 'ti-stack-2' },
  { id: 'log', label: 'Log', icon: 'ti-clipboard-list' },
  { id: 'research', label: 'Research', icon: 'ti-sparkles' },
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState('today')
  const [vials, setVials] = useState([])
  const [activeVial, setActiveVial] = useState(null)
  const [logRefresh, setLogRefresh] = useState(0)
  const [logDraft, setLogDraft] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function refreshVials() {
    try {
      const db = await listVials()
      const mapped = db.map((v) => ({ ...v, persisted: true }))
      setVials(mapped.length ? mapped : SEED_VIALS.map((v) => ({ ...v, persisted: false })))
    } catch {
      setVials(SEED_VIALS.map((v) => ({ ...v, persisted: false })))
    }
  }

  useEffect(() => {
    if (session) refreshVials()
  }, [session])

  if (session === undefined) return <div className="app boot">Loading…</div>
  if (!session) return <div className="app"><Auth /></div>

  async function quickLog(entry) {
    try {
      await addLog(entry)
      setLogRefresh((n) => n + 1)
    } catch (e) {
      alert('Could not log: ' + (e.message || e))
    }
  }

  async function confirmLog(entry) {
    try {
      await addLog(entry)
      setLogDraft(null)
      setLogRefresh((n) => n + 1)
      setTab('log')
    } catch (e) {
      alert('Could not log dose: ' + (e.message || e))
    }
  }

  return (
    <div className="app">
      <header className="brand">
        <Spark size={24} />
        <span className="wordmark">lumen</span>
        <button className="signout" onClick={() => setShowSettings(true)} aria-label="Settings">
          <i className="ti ti-settings" aria-hidden="true" />
        </button>
      </header>

      <main className="surface">
        <div className="view" key={tab}>
          {tab === 'today' && (
            <Today
              vials={vials}
              onLog={setLogDraft}
              onQuickLog={quickLog}
              onChanged={() => { refreshVials(); setLogRefresh((n) => n + 1) }}
              refreshKey={logRefresh}
            />
          )}
          {tab === 'calc' && (
            <Calculator vials={vials} onActiveVial={setActiveVial} onLog={setLogDraft} />
          )}
          {tab === 'stack' && <Stack vials={vials} onLog={setLogDraft} onChanged={refreshVials} />}
          {tab === 'log' && <LogPage refreshKey={logRefresh} />}
          {tab === 'research' && <Research vial={activeVial || vials[0]} vials={vials} />}
          <p className="disclaimer">Personal dosing calculator and log. Not medical advice.</p>
        </div>
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`ti ${t.icon}`} aria-hidden="true" />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {logDraft && (
        <Sheet title="Log dose" onClose={() => setLogDraft(null)}>
          <LogSheet draft={logDraft} onConfirm={confirmLog} onClose={() => setLogDraft(null)} />
        </Sheet>
      )}

      {showSettings && (
        <Sheet title="Settings" onClose={() => setShowSettings(false)}>
          <Settings email={session.user?.email} />
        </Sheet>
      )}
    </div>
  )
}
