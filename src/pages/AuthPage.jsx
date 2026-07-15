import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AUTH_RETURN_KEY = 'phasr_auth_return'

function setAuthReturnValue(value) {
  try {
    sessionStorage.setItem(AUTH_RETURN_KEY, value)
    return true
  } catch {}
  try {
    localStorage.setItem(AUTH_RETURN_KEY, value)
    return true
  } catch {
    return false
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

function getFriendlyAuthError(message) {
  if (!message) return ''

  if (message.toLowerCase().includes('invalid api key')) {
    return 'Your Supabase API key is invalid. Update `VITE_SUPABASE_ANON_KEY` in `C:\\Users\\Favour odion\\visionboard\\.env` with the public anon or publishable key from your Supabase project settings, then restart Vite.'
  }

  const normalized = message.toLowerCase()
  if (
    normalized.includes('user already registered') ||
    normalized.includes('already registered') ||
    normalized.includes('already exists')
  ) {
    return 'This email already has an account. Please sign in instead.'
  }

  return message
}

export default function AuthPage({ onBack, onSuccess, configError = '', initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(configError)
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const authError =
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error')

    if (authError) {
      const friendly = decodeURIComponent(authError.replace(/\+/g, ' '))
      setError(getFriendlyAuthError(friendly))
      setSuccess('')
      setLoading(false)
      return
    }

    if (
      searchParams.get('code') ||
      hashParams.get('access_token') ||
      hashParams.get('refresh_token')
    ) {
      setSuccess('Signing you in...')
    }
  }, [])

  // Quiz answers from the Sage landing bubble (if she came from "Build My Personal Roadmap").
  // No email is ever captured in the bubble — this is answers only, for later personalization.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('phasr_sage_answers')
      if (raw) setMode('signup')
    } catch {}
  }, [])

  function switchMode(nextMode) {
    setMode(nextMode)
    setError(configError)
    setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (configError || !supabase) return

    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name } },
      })

      if (signUpError) {
        const friendly = getFriendlyAuthError(signUpError.message)
        setError(friendly)
        if (friendly.includes('already has an account')) {
          switchMode('signin')
        }
      } else if (data?.user && data?.session) {
        onSuccess(data.user)
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.')
        switchMode('signin')
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      })

      if (signInError) {
        setError(getFriendlyAuthError(signInError.message))
      } else {
        onSuccess(data?.user || data?.session?.user || { email })
      }
    }

    setLoading(false)
  }

  async function handleGoogle() {
    if (configError || !supabase || loading) return

    setError('')
    setSuccess('')
    setLoading(true)
    setAuthReturnValue('google')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (oauthError) {
      clearAuthReturnValue()
      setError(getFriendlyAuthError(oauthError.message))
      setLoading(false)
      return
    }
  }

  async function handleForgot() {
    if (configError || !supabase) return

    if (!email) {
      setError('Enter your email first.')
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    if (resetError) setError(getFriendlyAuthError(resetError.message))
    else setSuccess('Password reset email sent!')
  }

  const isDisabled = loading || Boolean(configError)

  const authHighlights = [
    { icon: '◉', text: 'AI coaching that stays close to your goals and your phase.' },
    { icon: '◈', text: 'Structured planning across your year so progress never feels random.' },
    { icon: '◎', text: 'Weekly reflection and phase wrap, so you always see what moved.' },
  ]

  return (
    <div className="auth-page">
      <style>{AUTH_STYLES}</style>

      <div className="auth-left-panel">
        <div className="auth-left-glow" aria-hidden="true" />

        <div className="auth-left-top">
          <span className="auth-logo" onClick={onBack}>PHASR</span>
        </div>

        <div className="auth-left-main">
          <h2 className="auth-left-h2">
            Turn your goals into <em>real achievements.</em>
          </h2>
          <div className="auth-highlights">
            {authHighlights.map(({ icon, text }) => (
              <div key={icon} className="auth-highlight">
                <div className="auth-highlight-icon">{icon}</div>
                <p className="auth-highlight-text">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-testimonial">
          <p className="auth-testimonial-quote">
            "I've quit on myself more times than I'd like to admit. This time, I didn't — every Q1 goal, actually done."
          </p>
          <div className="auth-testimonial-person">
            <img src="/images/avatars/avatar-3.jpg" alt="" className="auth-testimonial-avatar" />
            <div>
              <p className="auth-testimonial-name">Amara T.</p>
              <p className="auth-testimonial-role">Entrepreneur</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-wrap">
          <h1 className="auth-h1">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-sub">
            {mode === 'signin' ? 'Sign in to access your vision boards.' : 'Free forever. No credit card required.'}
          </p>

          <div className="auth-mode-switch">
            {['signin', 'signup'].map(entryMode => (
              <button
                key={entryMode}
                onClick={() => switchMode(entryMode)}
                className={`auth-mode-btn${mode === entryMode ? ' active' : ''}`}
              >
                {entryMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <button onClick={handleGoogle} disabled={Boolean(configError) || loading} className="auth-google-btn">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span />
            or continue with email
            <span />
          </div>

          {error && <div className="auth-banner auth-banner-error">{error}</div>}
          {success && <div className="auth-banner auth-banner-success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  type="text"
                  placeholder="Your name"
                  className="auth-input"
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                required
                className="auth-input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label auth-label-row">
                Password
                {mode === 'signin' && (
                  <span onClick={handleForgot} className="auth-forgot">Forgot password?</span>
                )}
              </label>
              <input
                value={pass}
                onChange={e => setPass(e.target.value)}
                type="password"
                placeholder="Your password"
                required
                minLength={8}
                className="auth-input"
              />
            </div>

            <button type="submit" disabled={isDisabled} className="auth-submit-btn">
              {loading ? 'One moment…' : mode === 'signin' ? 'Sign In →' : 'Create Free Account →'}
            </button>
          </form>

          <p className="auth-legal">
            By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

const AUTH_STYLES = `
  html, body, #root { margin: 0; min-height: 100dvh; background: #fff7fa; }

  .auth-page {
    min-height: 100dvh;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: #ffffff;
    overflow: hidden;
    margin: 0;
    font-family: 'General Sans', sans-serif;
  }

  /* ── Left panel ── */
  .auth-left-panel {
    background: linear-gradient(160deg, #fff0f5 0%, #ffe4ed 55%, #ffd9e6 100%);
    border-right: 1px solid rgba(240,96,144,0.14);
    display: flex; flex-direction: column;
    justify-content: space-between;
    gap: 2.5rem;
    padding: 2.4rem 3rem 3rem;
    position: relative;
    overflow: hidden;
  }
  .auth-left-glow {
    position: absolute; width: 480px; height: 480px; border-radius: 50%;
    background: radial-gradient(circle, rgba(240,96,144,0.28) 0%, transparent 70%);
    top: -120px; left: -120px; pointer-events: none;
  }
  .auth-left-top { position: relative; z-index: 1; }
  .auth-logo {
    font-family: 'Fraunces', serif;
    font-weight: 700; font-size: 1.5rem;
    color: #c2185b; letter-spacing: -0.02em;
    cursor: pointer;
  }
  .auth-left-main { position: relative; z-index: 1; max-width: 480px; margin-top: 2rem; }
  .auth-left-h2 {
    font-family: 'Fraunces', serif;
    font-size: 2.5rem; font-weight: 700;
    line-height: 1.16; letter-spacing: -0.02em;
    color: #3d1020; margin: 0 0 2.4rem;
  }
  .auth-left-h2 em { font-style: italic; color: #f06090; }
  .auth-highlights { display: flex; flex-direction: column; gap: 0.9rem; }
  .auth-highlight {
    display: flex; align-items: flex-start; gap: 0.9rem;
    padding-bottom: 0.9rem;
    border-bottom: 1px solid rgba(194,24,91,0.12);
  }
  .auth-highlight-icon {
    width: 40px; height: 40px; border-radius: 14px; flex-shrink: 0;
    background: rgba(255,255,255,0.6);
    border: 1px solid rgba(194,24,91,0.16);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; font-weight: 700; color: #c2185b;
  }
  .auth-highlight-text { font-size: 0.9rem; color: #8a5060; line-height: 1.65; margin: 0; }

  .auth-testimonial {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(16px) saturate(1.3);
    -webkit-backdrop-filter: blur(16px) saturate(1.3);
    border: 1px solid rgba(255,255,255,0.7);
    border-radius: 20px; padding: 1.4rem 1.5rem;
    position: relative; z-index: 1; max-width: 460px;
    box-shadow: 0 8px 28px rgba(194,24,91,0.10);
  }
  .auth-testimonial-quote {
    font-family: 'Fraunces', serif; font-style: italic;
    font-size: 0.98rem; color: #3d1020;
    line-height: 1.6; margin: 0 0 0.9rem;
  }
  .auth-testimonial-person { display: flex; align-items: center; gap: 0.75rem; }
  .auth-testimonial-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .auth-testimonial-name { font-weight: 700; font-size: 0.88rem; color: #3d1020; margin: 0; }
  .auth-testimonial-role { font-size: 0.76rem; color: #b08090; margin: 2px 0 0; }

  /* ── Right panel ── */
  .auth-right-panel {
    display: flex; align-items: center; justify-content: center;
    padding: 2.5rem 1.75rem;
    background: #ffffff;
  }
  .auth-form-wrap { width: 100%; max-width: 420px; }
  .auth-h1 {
    font-family: 'Fraunces', serif;
    font-size: 2rem; font-weight: 700;
    margin: 0 0 0.4rem; color: #3d1020; letter-spacing: -0.02em;
  }
  .auth-sub { color: #8a5060; font-size: 0.92rem; margin: 0 0 2rem; }

  .auth-mode-switch {
    display: flex; background: rgba(240,96,144,0.08);
    border: 1px solid rgba(240,96,144,0.16);
    border-radius: 100px; padding: 4px; margin-bottom: 1.8rem;
  }
  .auth-mode-btn {
    flex: 1; padding: 0.65rem; border-radius: 100px; border: none;
    background: transparent; color: #8a5060;
    font-size: 0.88rem; font-weight: 700; cursor: pointer;
    font-family: 'General Sans', sans-serif;
    transition: all 0.2s;
  }
  .auth-mode-btn.active { background: #c2185b; color: #fff; box-shadow: 0 4px 14px rgba(194,24,91,0.3); }

  .auth-google-btn {
    width: 100%; padding: 0.8rem; border-radius: 12px;
    border: 1.5px solid rgba(240,96,144,0.22);
    background: #fff; color: #3d1020;
    font-size: 0.9rem; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 0.7rem;
    font-family: 'General Sans', sans-serif; margin-bottom: 1.5rem;
    transition: border-color 0.18s, background 0.18s;
  }
  .auth-google-btn:hover { border-color: #c2185b; background: rgba(240,96,144,0.04); }
  .auth-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .auth-divider {
    display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
    color: #b08090; font-size: 0.8rem;
  }
  .auth-divider span { flex: 1; height: 1px; background: rgba(240,96,144,0.18); }

  .auth-banner { border-radius: 12px; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  .auth-banner-error { background: rgba(240,96,144,0.1); border: 1px solid rgba(240,96,144,0.35); color: #c2185b; }
  .auth-banner-success { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: #1a8c66; }

  .auth-form { display: flex; flex-direction: column; gap: 1rem; }
  .auth-field { display: flex; flex-direction: column; }
  .auth-label {
    font-size: 0.82rem; font-weight: 600; color: #8a5060;
    letter-spacing: 0.02em; margin-bottom: 0.4rem;
    font-family: 'General Sans', sans-serif;
  }
  .auth-label-row { display: flex; justify-content: space-between; align-items: center; }
  .auth-forgot { font-size: 0.8rem; color: #c2185b; cursor: pointer; font-weight: 600; }
  .auth-input {
    width: 100%; padding: 0.8rem 1rem; border-radius: 12px;
    border: 1.5px solid rgba(240,96,144,0.22);
    background: rgba(255,240,244,0.35);
    color: #3d1020; font-size: 0.92rem; outline: none;
    font-family: 'General Sans', sans-serif;
    transition: border-color 0.2s, background 0.2s;
  }
  .auth-input::placeholder { color: #c79ba8; }
  .auth-input:focus { border-color: #c2185b; background: rgba(255,240,244,0.7); }

  .auth-submit-btn {
    width: 100%; padding: 0.9rem; border-radius: 12px; border: none;
    background: #c2185b; color: #fff;
    font-size: 0.95rem; font-weight: 700; cursor: pointer;
    font-family: 'General Sans', sans-serif;
    box-shadow: 0 6px 22px rgba(194,24,91,0.32);
    margin-top: 0.5rem;
    transition: background 0.18s, transform 0.12s;
  }
  .auth-submit-btn:hover:not(:disabled) { background: #a8124e; transform: translateY(-1px); }
  .auth-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  .auth-legal { text-align: center; font-size: 0.78rem; color: #b08090; margin-top: 1.2rem; line-height: 1.6; }
  .auth-legal a { color: #c2185b; text-decoration: none; font-weight: 600; }
  .auth-legal a:hover { text-decoration: underline; }

  @media (max-width: 860px) {
    .auth-page { grid-template-columns: 1fr; }
    .auth-left-panel { display: none; }
  }
`
