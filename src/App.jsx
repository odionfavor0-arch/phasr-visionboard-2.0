import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import AppShell from './pages/AppShell'
import { supabase } from './lib/supabase'
import './styles/themes.css'

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('phasr_theme') || 'neutral')
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('landing')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('phasr_theme', theme)
  }, [theme])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const nextUser = data.session?.user || null
      setUser(nextUser)
      setScreen(nextUser ? 'app' : 'landing')
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null
      setUser(nextUser)
      setScreen(nextUser ? 'app' : 'landing')
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setScreen('landing')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Outfit', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Phasr</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (user && screen === 'app') {
    return (
      <AppShell
        user={user}
        theme={theme}
        onThemeChange={setTheme}
        onSignOut={handleSignOut}
      />
    )
  }

  if (screen === 'auth') {
    return (
      <AuthPage
        onBack={() => setScreen('landing')}
        onSuccess={nextUser => {
          setUser(nextUser)
          setScreen('app')
        }}
      />
    )
  }

  return <LandingPage onGetStarted={() => setScreen('auth')} />
}
