// src/AuthPage.jsx
// ─────────────────────────────────────────────
// Auth screen — sign in / sign up
// Uses Supabase directly
// ─────────────────────────────────────────────

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage({ onBack, onSuccess }) {
  const [mode,    setMode]    = useState('signin') // 'signin' | 'signup'
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [name,    setName]    = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m) {
    setMode(m); setError(''); setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { full_name: name } },
      })
      if (error) setError(error.message)
      else { setSuccess('Account created! Check your email to confirm, then sign in.'); switchMode('signin') }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) setError(error.message)
      else onSuccess(data.user)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  async function handleForgot() {
    if (!email) { setError('Enter your email first.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setSuccess('Password reset email sent!')
  }

  const inputStyle = {
    width: '100%', padding: '0.8rem 1rem',
    borderRadius: 12, border: '1.5px solid var(--border)',
    background: 'rgba(255,255,255,0.03)', color: 'var(--text)',
    fontSize: '0.92rem', outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

      {/* ── Left panel (hidden on mobile) ── */}
      <div style={{
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '3rem', position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        {/* Glow */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(232,64,122,0.15) 0%,transparent 70%)', top: -100, left: -100, pointerEvents: 'none' }} />

        {/* Logo */}
        <span onClick={onBack} style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem',
          background: 'linear-gradient(135deg,#f472a8,#ffd6e7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', cursor: 'pointer', position: 'relative', zIndex: 1,
        }}>Phasr</span>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '2.4rem', fontWeight: 800,
            lineHeight: 1.15, marginBottom: '1.2rem',
          }}>
            Turn your goals into{' '}
            <span style={{ background: 'linear-gradient(135deg,var(--accent2),var(--accent3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              real achievements.
            </span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            The only vision board platform that breaks your year into structured phases and gives you AI coaching to keep going.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '🧠', text: 'AI Life Coach — Sage — available 24/7' },
              { icon: '📋', text: 'Phased planning across your whole year' },
              { icon: '📸', text: 'Before & after transformation tracking' },
              { icon: '📓', text: 'Daily journal to build your reflection habit' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,64,122,0.12)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ background: 'rgba(232,64,122,0.06)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.2rem 1.4rem', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '0.8rem' }}>
            "I hit every Q1 goal I set. The phased approach is what makes this different from anything else."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff' }}>M</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>Marcus T.</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Entrepreneur</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', position: 'relative', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            {mode === 'signin' ? 'Welcome back 👋' : 'Create your account ✨'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            {mode === 'signin' ? 'Sign in to access your vision boards.' : 'Free forever. No credit card required.'}
          </p>

          {/* Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 99, padding: 4, marginBottom: '2rem' }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '0.6rem', borderRadius: 99, border: 'none',
                background: mode === m ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'transparent',
                color: mode === m ? '#fff' : 'var(--muted)',
                fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
              }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button onClick={handleGoogle} style={{
            width: '100%', padding: '0.8rem', borderRadius: 12,
            border: '1.5px solid var(--border)', background: 'rgba(255,255,255,0.03)',
            color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem',
            fontFamily: "'DM Sans', sans-serif", marginBottom: '1.5rem',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or continue with email
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Error / Success */}
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#fca5a5', marginBottom: '1rem' }}>⚠️ {error}</div>}
          {success && <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#6ee7b7', marginBottom: '1rem' }}>✅ {success}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Your name" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                Password
                {mode === 'signin' && <span onClick={handleForgot} style={{ fontSize: '0.8rem', color: 'var(--accent2)', cursor: 'pointer' }}>Forgot password?</span>}
              </label>
              <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Your password" required minLength={8} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
              color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(232,64,122,0.35)', marginTop: '0.5rem',
            }}>
              {loading ? '...' : mode === 'signin' ? 'Sign In →' : 'Create Free Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '1rem', lineHeight: 1.6 }}>
            By continuing you agree to our <a href="#" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>Terms</a> and <a href="#" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
          [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
