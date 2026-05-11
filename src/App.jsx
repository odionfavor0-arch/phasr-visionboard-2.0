import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import OurStory from './pages/OurStory'
import AuthPage from './pages/AuthPage'
import AppShell from './AppShell'
import Onboarding from './components/Onboarding'
import { supabase, supabaseConfigError } from './lib/supabase'
import phasrLogo from './assets/phasr-mark.png'
import './styles/themes.css'

const AUTH_RETURN_KEY = 'phasr_auth_return'
const ONBOARDING_KEY_PREFIX = 'phasr_onboarded'
const ONBOARDING_ACTIVE_KEY = 'phasr_onboarding_active'
const POST_ONBOARDING_KEY = 'phasr_post_onboarding_target'
const PRODUCT_ENTRY_KEY = 'phasr_enter_product'
const PRODUCT_READY_KEY = 'phasr_product_ready'
const ACTIVE_USER_KEY = 'phasr_active_user'
const CACHED_USER_KEY = 'phasr_cached_user'
const SIGNOUT_INTENT_KEY = 'phasr_signout_intent'

function safeLocalGet(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeLocalRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

function getAuthReturnValue() {
  try {
    const sessionValue = sessionStorage.getItem(AUTH_RETURN_KEY)
    if (sessionValue != null) return sessionValue
  } catch {}
  try {
    return localStorage.getItem(AUTH_RETURN_KEY)
  } catch {
    return null
  }
}

function clearAuthReturnValue() {
  try {
    sessionStorage.removeItem(AUTH_RETURN_KEY)
  } catch {}
  try {
    localStorage.removeItem(AUTH_RETURN_KEY)
  } catch {}
}

function setExplicitSignOutIntent(value) {
  if (value) safeLocalSet(SIGNOUT_INTENT_KEY, 'true')
  else safeLocalRemove(SIGNOUT_INTENT_KEY)
}

function hasExplicitSignOutIntent() {
  return safeLocalGet(SIGNOUT_INTENT_KEY) === 'true'
}

function getCachedUser() {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function cacheUser(user) {
  if (!user) return
  const nextCachedUser = {
    id: user?.id || user?.email || 'cached-user',
    email: user?.email || user?.user_metadata?.email || '',
    user_metadata: {
      ...user?.user_metadata,
      email: user?.email || user?.user_metadata?.email || '',
      full_name:
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email ||
        'Phasr User',
    },
  }
  safeLocalSet(CACHED_USER_KEY, JSON.stringify(nextCachedUser))
}

function clearCachedUser() {
  safeLocalRemove(CACHED_USER_KEY)
}

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
    getAuthReturnValue() === 'google' ||
    safeLocalGet(ONBOARDING_ACTIVE_KEY) === 'true' ||
    hasAuthRedirectParams()
      ? 'auth'
      : getCachedUser() && !hasExplicitSignOutIntent()
        ? 'app'
      : 'landing'
  ))
  const [loading, setLoading] = useState(true)
  const [onboarded, setOnboarded] = useState(false)
  const effectiveUser = user || (!hasExplicitSignOutIntent() ? getCachedUser() : null)

  function finishOnboarding(nextUser = user, _choice = 'later') {
    if (nextUser) {
      localStorage.setItem(getOnboardingKey(nextUser), 'true')
    }
    localStorage.removeItem(ONBOARDING_KEY_PREFIX)
    localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
    clearAuthReturnValue()
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
      if (!hasExplicitSignOutIntent() && getCachedUser()) return
      safeLocalRemove(ONBOARDING_ACTIVE_KEY)
      setOnboarded(Boolean(getCachedUser() && !hasExplicitSignOutIntent()))
      return
    }

    const identifier = user?.id || user?.email || user?.user_metadata?.email || ''
    if (identifier) {
      safeLocalSet(ACTIVE_USER_KEY, identifier)
    }
    cacheUser(user)
    setExplicitSignOutIntent(false)
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
      const cachedUser = getCachedUser()
      if (cachedUser && !hasExplicitSignOutIntent()) {
        queueMicrotask(() => {
          setUser(cachedUser)
          setOnboarded(getStoredOnboarded(cachedUser))
          setScreen('app')
          setLoading(false)
        })
        return
      }
      queueMicrotask(() => setLoading(false))
      return
    }

    let mounted = true

    ;(async () => {
      const cachedUser = getCachedUser()
      try {
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionUser = sessionData.session?.user || null
      const fallbackUser = sessionUser ? null : (await supabase.auth.getUser()).data.user || null
      if (!mounted) return
      const nextUser = sessionUser || fallbackUser || (!hasExplicitSignOutIntent() ? cachedUser : null)
      const returningToAuth = getAuthReturnValue() === 'google' || hasAuthRedirectParams()
      const postOnboardingTarget = safeLocalGet(POST_ONBOARDING_KEY) === 'app'
      const forceProduct = safeLocalGet(PRODUCT_ENTRY_KEY) === 'true'
      const productReady = safeLocalGet(PRODUCT_READY_KEY) === 'true'
      const nextOnboarded = getStoredOnboarded(nextUser)
      setUser(nextUser)
      setOnboarded(nextOnboarded)
      setScreen(nextUser || forceProduct || productReady ? 'app' : returningToAuth || postOnboardingTarget ? 'auth' : 'landing')
      if (nextUser) {
        const identifier = nextUser?.id || nextUser?.email || nextUser?.user_metadata?.email || ''
        if (identifier) {
          safeLocalSet(ACTIVE_USER_KEY, identifier)
        }
        cacheUser(nextUser)
        setExplicitSignOutIntent(false)
      }
      if (nextUser) clearAuthReturnValue()
      if (nextUser) safeLocalRemove(POST_ONBOARDING_KEY)
      if (nextUser) safeLocalRemove(PRODUCT_ENTRY_KEY)
      setLoading(false)
      } catch {
        if (!mounted) return
        const nextUser = !hasExplicitSignOutIntent() ? cachedUser : null
        setUser(nextUser)
        setOnboarded(getStoredOnboarded(nextUser))
        setScreen(nextUser ? 'app' : hasAuthRedirectParams() ? 'auth' : 'landing')
        setLoading(false)
      }
    })()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user || null
      const cachedUser = getCachedUser()
      if (event === 'SIGNED_OUT' && !hasExplicitSignOutIntent() && cachedUser) {
        setUser(cachedUser)
        setOnboarded(getStoredOnboarded(cachedUser))
        setScreen('app')
        setLoading(false)
        return
      }
      const resolvedUser = nextUser || (!hasExplicitSignOutIntent() ? cachedUser : null)
      const postOnboardingTarget = safeLocalGet(POST_ONBOARDING_KEY) === 'app'
      const forceProduct = safeLocalGet(PRODUCT_ENTRY_KEY) === 'true'
      const productReady = safeLocalGet(PRODUCT_READY_KEY) === 'true'
      const nextOnboarded = getStoredOnboarded(nextUser)
      setUser(resolvedUser)
      setOnboarded(getStoredOnboarded(resolvedUser) || nextOnboarded)
      setScreen(
        resolvedUser || forceProduct || productReady
          ? 'app'
          : getAuthReturnValue() === 'google' || hasAuthRedirectParams() || postOnboardingTarget
            ? 'auth'
          : 'landing'
      )
      if (resolvedUser) {
        const identifier = resolvedUser?.id || resolvedUser?.email || resolvedUser?.user_metadata?.email || ''
        if (identifier) {
          safeLocalSet(ACTIVE_USER_KEY, identifier)
        }
        cacheUser(resolvedUser)
        setExplicitSignOutIntent(false)
      }
      if (resolvedUser) clearAuthReturnValue()
      if (resolvedUser) safeLocalRemove(POST_ONBOARDING_KEY)
      if (resolvedUser) safeLocalRemove(PRODUCT_ENTRY_KEY)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    setExplicitSignOutIntent(true)
    await supabase.auth.signOut()
    clearAuthReturnValue()
    clearCachedUser()
    safeLocalRemove(ONBOARDING_ACTIVE_KEY)
    safeLocalRemove(PRODUCT_ENTRY_KEY)
    safeLocalRemove(PRODUCT_READY_KEY)
    safeLocalRemove(ACTIVE_USER_KEY)
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

  if (effectiveUser && !onboarded) {
    return (
      <Onboarding
        userName={effectiveUser?.user_metadata?.full_name || 'there'}
        onComplete={choice => finishOnboarding(effectiveUser, choice)}
      />
    )
  }

  if (effectiveUser) {
    return (
      <AppShell
        user={effectiveUser}
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
          clearAuthReturnValue()
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
        clearAuthReturnValue()
        localStorage.removeItem(ONBOARDING_ACTIVE_KEY)
        setScreen('auth')
      }}
    />
  )
}
