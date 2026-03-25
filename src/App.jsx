// src/App.jsx
// ─────────────────────────────────────────────
// Root component. Handles:
// - Which screen to show: landing | auth | app
// - Supabase session detection
// - Theme switching (neutral / rose / slate)
// - Streak calculation passed down to AppShell
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AppShell     from './src/AppShell'
import LandingPage  from './src/LandingPage'
import AuthPage     from './src/AuthPage'
import SageCoach    from './mycomponents/SageCoach'

// ── Supabase client ──
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL  || 'https://fhqsvsswmzhjkszdpnet.supabase.co'
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zbRozO2r8M0g1VR4ybtV3g_AXaC0vtY'
export const supabase = createClient(SUPA_URL, SUPA_KEY)

// ── Streak helper ──
function calcStreak() {
  try {
    const entries = JSON.parse(localStorage.getItem('phasr_journal') || '[]')
    if (entries.length === 0) return 0
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    let current = new Date()
    current.setHours(0, 0, 0, 0)
    for (const e of sorted) {
      const d = new Date(e.date + 'T12:00:00')
      d.setHours(0, 0, 0, 0)
      const diff = (current - d) / 86400000
      if (diff <= 1) { streak++; current = d } else break
    }
    return streak
  } catch { return 0 }
}

export default function App() {
  const [screen, setScreen] = useState('landing') // 'landing' | 'auth' | 'app'
  const [user,   setUser]   = useState(null)
  const [theme,  setTheme]  = useState(() => localStorage.getItem('phasr_theme') || 'neutral')
  const [streak, setStreak] = useState(0)

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('phasr_theme', theme)
  }, [theme])

  // Check for existing Supabase session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setScreen('app')
        setStreak(calcStreak())
      }
    })

    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setScreen('app')
        setStreak(calcStreak())
      } else {
        setUser(null)
        setScreen('landing')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setScreen('landing')
  }

  // Board data for Sage context (read from localStorage)
  const boardData = (() => {
    try { return JSON.parse(localStorage.getItem('phasr_vb') || 'null') } catch { return null }
  })()

  // Today's journal entry for Sage context
  const todayJournal = (() => {
    try {
      const entries = JSON.parse(localStorage.getItem('phasr_journal') || '[]')
      const today = new Date().toISOString().slice(0, 10)
      return entries.find(e => e.date === today) || null
    } catch { return null }
  })()

  return (
    <>
      {screen === 'landing' && (
        <LandingPage
          onGetStarted={() => setScreen('auth')}
        />
      )}

      {screen === 'auth' && (
        <AuthPage
          onBack={() => setScreen('landing')}
          onSuccess={(user) => {
            setUser(user)
            setScreen('app')
            setStreak(calcStreak())
          }}
        />
      )}

      {screen === 'app' && user && (
        <>
          <AppShell
            user={user}
            theme={theme}
            onThemeChange={setTheme}
            streak={streak}
            onSignOut={handleSignOut}
          />
          {/* Sage floats over everything */}
          <SageCoach boardData={boardData} todayJournal={todayJournal} />
        </>
      )}
    </>
  )
}
