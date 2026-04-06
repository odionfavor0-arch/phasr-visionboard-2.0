import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import OurStory from './pages/OurStory'
import AuthPage from './pages/AuthPage'
import AppShell from './pages/AppShell'
import Onboarding from './components/Onboarding'
import { supabase, supabaseConfigError } from './lib/supabase'
import phasrLogo from './assets/phasr-mark.png'
import './Styles/themes.css'

const AUTH_RETURN_KEY = 'phasr_auth_return'
const ONBOARDING_KEY_PREFIX = 'phasr_onboarded'
const ONBOARDING_ACTIVE_KEY = 'phasr_onboarding_active'
const POST_ONBOARDING_KEY = 'phasr_post_onboarding_target'
const PRODUCT_ENTRY_KEY = 'phasr_enter_product'
const PRODUCT_READY_KEY = 'phasr_product_ready'

function getOnboardingKey(user) {
  const identifier = user?.id || user?.email || 'guest'
  return `${ONBOARDING_KEY_PREFIX}:${identifier}`
}

function getStoredOnboarded(user) {
  if (!user) return false
  const userOnboardingKey = getOnboardingKey(user)
  const userDone = localStorage.getItem(userOnboardingKey) === 'true'
  const globalDone = localStorage.getItem(ONBOARDING_KEY_PREFIX) === 'true'
  if (globalDone && !userDone) {
    localStorage.setItem(userOnboardingKey, 'true')
    localStorage.removeItem(ONBOARDING_KEY_PREFIX)
    return true
  }
  return userDone
}

function hasAuthRedirectParams() {
  if (typeof window === 'undefined') return false
  const search = window.location.search || ''
  const hash = window.location.hash || ''
  return (
    search.includes('code=') ||
    search.includes('error=') ||
    hash.includes('access_token') ||
    hash.includes('refresh_token') ||
    hash.includes('error=') ||
    hash.includes('error_description=')
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('phasr_theme')
    if (savedTheme === 'slate') return 'slate'
    return 'rose'
  })
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState(() => (
    localStorage.getItem(AUTH_RETURN_KEY) === 'google' ||
    localStorage.getItem(ONBOARDING_ACTIVE_KEY) === 'true' ||
    hasAuthRedirectParams()
      ? 'auth'
      : 'landing'
  ))
  const [loading, setLoading] = useState(true)
  const [onboarded, setOnboarded] = useState(false)

  function finishOnboarding(nextUser = user, _choice = 'later') {
    if (nextUser) {
      localStorage.setItem(getOnboardingKey(nextUser), 'true')
    }
    localStorage.removeItem(ONBOARDING_KEY_PREFIX)
    localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
    localStorage.removeItem(AUTH_RETURN_KEY)
    localStorage.setItem(POST_ONBOARDING_KEY, 'app')
    localStorage.setItem(PRODUCT_ENTRY_KEY, 'true')
    localStorage.setItem(PRODUCT_READY_KEY, 'true')
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname)
    }
    setOnboarded(true)
    setScreen('app')
    setTimeout(() => setScreen('app'), 0)
  }

  useEffect(() => {
    const normalizedTheme = theme === 'slate' ? 'slate' : 'rose'
    document.documentElement.setAttribute('data-theme', normalizedTheme)
    localStorage.setItem('phasr_theme', normalizedTheme)
  }, [theme])

  useEffect(() => {
    document.title = 'Phasr'
    let favicon = document.querySelector("link[rel='icon']")
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.setAttribute('rel', 'icon')
      document.head.appendChild(favicon)
    }
    favicon.setAttribute('type', 'image/png')
    favicon.setAttribute('href', phasrLogo)
  }, [])

  useEffect(() => {
    if (user || screen !== 'landing') return
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash) return
    const target = document.querySelector(hash)
    if (!target) return
    setTimeout(() => {
      const top = target.getBoundingClientRect().top + window.scrollY - 90
      window.scrollTo({ top, behavior: 'smooth' })
    }, 80)
  }, [user, screen])

  useEffect(() => {
    localStorage.removeItem('phasr_screen')
    localStorage.removeItem('phasr_demo_user')
  }, [])

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
      setOnboarded(false)
      return
    }

    const identifier = user?.id || user?.email || user?.user_metadata?.email || ''
    if (identifier) {
      localStorage.setItem('phasr_active_user', identifier)
    }
    setOnboarded(getStoredOnboarded(user))
  }, [user])


  useEffect(() => {
    if (user && screen === 'app' && !onboarded) {
      localStorage.setItem(ONBOARDING_ACTIVE_KEY, 'true')
      return
    }

    if (user && onboarded) {
      localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
    }
  }, [user, screen, onboarded])

  useEffect(() => {
    if (supabaseConfigError || !supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const nextUser = data.session?.user || null
      const returningToAuth = localStorage.getItem(AUTH_RETURN_KEY) === 'google' || hasAuthRedirectParams()
      const postOnboardingTarget = localStorage.getItem(POST_ONBOARDING_KEY) === 'app'
      const forceProduct = localStorage.getItem(PRODUCT_ENTRY_KEY) === 'true'
      const productReady = localStorage.getItem(PRODUCT_READY_KEY) === 'true'
      const nextOnboarded = getStoredOnboarded(nextUser)
      setUser(nextUser)
      setOnboarded(nextOnboarded)
      setScreen(nextUser || forceProduct || productReady ? 'app' : returningToAuth || postOnboardingTarget ? 'auth' : 'landing')
      if (nextUser) {
        const identifier = nextUser?.id || nextUser?.email || nextUser?.user_metadata?.email || ''
        if (identifier) {
          localStorage.setItem('phasr_active_user', identifier)
        }
      }
      if (nextUser) localStorage.removeItem(AUTH_RETURN_KEY)
      if (nextUser) localStorage.removeItem(POST_ONBOARDING_KEY)
      if (nextUser) localStorage.removeItem(PRODUCT_ENTRY_KEY)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null
      const postOnboardingTarget = localStorage.getItem(POST_ONBOARDING_KEY) === 'app'
      const forceProduct = localStorage.getItem(PRODUCT_ENTRY_KEY) === 'true'
      const productReady = localStorage.getItem(PRODUCT_READY_KEY) === 'true'
      const nextOnboarded = getStoredOnboarded(nextUser)
      setUser(nextUser)
      setOnboarded(nextOnboarded)
      setScreen(
        nextUser || forceProduct || productReady
          ? 'app'
          : localStorage.getItem(AUTH_RETURN_KEY) === 'google' || hasAuthRedirectParams() || postOnboardingTarget
            ? 'auth'
            : 'landing'
      )
      if (nextUser) {
        const identifier = nextUser?.id || nextUser?.email || nextUser?.user_metadata?.email || ''
        if (identifier) {
          localStorage.setItem('phasr_active_user', identifier)
        }
      }
      if (nextUser) localStorage.removeItem(AUTH_RETURN_KEY)
      if (nextUser) localStorage.removeItem(POST_ONBOARDING_KEY)
      if (nextUser) localStorage.removeItem(PRODUCT_ENTRY_KEY)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    localStorage.removeItem(AUTH_RETURN_KEY)
    localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
    localStorage.removeItem(PRODUCT_ENTRY_KEY)
    localStorage.removeItem(PRODUCT_READY_KEY)
    localStorage.removeItem('phasr_active_user')
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

  if (user && !onboarded) {
    return (
      <Onboarding
        userName={user?.user_metadata?.full_name || 'there'}
        onComplete={choice => finishOnboarding(user, choice)}
      />
    )
  }

  if (user) {
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
        configError={supabaseConfigError}
        onBack={() => setScreen('landing')}
        onSuccess={nextUser => {
          setUser(nextUser)
          const isAlreadyOnboarded = getStoredOnboarded(nextUser)
          setOnboarded(isAlreadyOnboarded)
          setScreen('app')
        }}
      />
    )
  }

  const path = typeof window !== 'undefined' ? window.location.pathname : '/'
  const showStory = path === '/story'

  if (showStory) {
    return (
      <OurStory
        onGetStarted={() => {
          localStorage.removeItem(AUTH_RETURN_KEY)
          localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/')
          }
          setScreen('auth')
        }}
      />
    )
  }

  return (
    <LandingPage
      onGetStarted={() => {
        localStorage.removeItem(AUTH_RETURN_KEY)
        localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
        setScreen('auth')
      }}
    />
  )
}
