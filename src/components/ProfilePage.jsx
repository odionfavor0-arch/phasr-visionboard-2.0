import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Camera } from 'lucide-react'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'

const PROFILE_KEY = 'phasr_profile_cache'

export function loadCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCachedProfile(data) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
  } catch {}
}

export async function fetchProfile(userId) {
  const cached = loadCachedProfile()
  if (!supabase || supabaseConfigError) return cached
  try {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, bio, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()
    if (data) {
      const merged = { ...cached, ...data }
      saveCachedProfile(merged)
      return merged
    }
  } catch {}
  return cached
}

export default function ProfilePage({ user, onClose, onProfileSaved }) {
  const cached = loadCachedProfile()
  const rawName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    ''
  const [displayName, setDisplayName] = useState(cached.display_name || rawName || '')
  const [bio, setBio] = useState(cached.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(cached.avatar_url || '')
  const [avatarPreview, setAvatarPreview] = useState(cached.avatar_url || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    fetchProfile(user.id).then(p => {
      if (p.display_name) setDisplayName(p.display_name)
      if (p.bio) setBio(p.bio)
      if (p.avatar_url) { setAvatarUrl(p.avatar_url); setAvatarPreview(p.avatar_url) }
    })
  }, [user?.id])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError('Photo must be under 4 MB'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
    setError('')
  }

  async function uploadAvatar(userId, file) {
    if (!supabase || supabaseConfigError) {
      const reader = new FileReader()
      return new Promise(resolve => {
        reader.onload = ev => resolve(ev.target.result)
        reader.readAsDataURL(file)
      })
    }
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      return urlData?.publicUrl || ''
    } catch {
      const reader = new FileReader()
      return new Promise(resolve => {
        reader.onload = ev => resolve(ev.target.result)
        reader.readAsDataURL(file)
      })
    }
  }

  async function handleSave() {
    if (!displayName.trim()) { setError('Display name cannot be empty'); return }
    setSaving(true)
    setError('')
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(user?.id || 'local', avatarFile)
      }

      const profile = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
      }

      saveCachedProfile(profile)

      if (supabase && !supabaseConfigError && user?.id) {
        await supabase.from('profiles').upsert(
          { user_id: user.id, ...profile, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      }

      setAvatarUrl(finalAvatarUrl)
      setSaved(true)
      window.dispatchEvent(new CustomEvent('phasr-profile-updated', { detail: profile }))
      onProfileSaved?.(profile)
      setTimeout(() => { setSaved(false); onClose() }, 800)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const initials = displayName
    ? displayName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(41,18,31,0.38)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        padding: '0 0 calc(24px + env(safe-area-inset-bottom,0px))',
        boxShadow: '0 -22px 58px rgba(77,49,66,0.16)',
        maxHeight: '92dvh',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}>
        {/* Handle */}
        <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid rgba(249,95,133,0.22)',
              background: 'transparent', color: '#f95f85',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={17} strokeWidth={2.4} />
          </button>
          <p style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: '1.05rem', fontWeight: 700, color: '#4d3142' }}>
            Your Profile
          </p>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 20px' }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'relative', width: 88, height: 88,
              borderRadius: '50%', border: 'none',
              background: 'transparent', cursor: 'pointer', padding: 0,
            }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--app-accent2,#ff8ca8),var(--app-accent,#f95f85))',
                color: '#fff', display: 'grid', placeItems: 'center',
                fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: 700,
              }}>
                {initials}
              </span>
            )}
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: '#f95f85', border: '2px solid #fff',
              display: 'grid', placeItems: 'center',
            }}>
              <Camera size={13} color="#fff" strokeWidth={2.5} />
            </span>
          </button>
          <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#b98097' }}>
            Tap to change photo
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Fields */}
        <div style={{ padding: '0 20px', display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#9a7088', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Display Name
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid rgba(249,95,133,0.28)',
                borderRadius: 12, padding: '11px 13px',
                fontSize: '0.95rem', fontFamily: "'DM Sans',sans-serif",
                color: '#4d3142', background: 'transparent', outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#9a7088', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A short line about what you're working toward..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid rgba(249,95,133,0.28)',
                borderRadius: 12, padding: '11px 13px',
                fontSize: '0.88rem', fontFamily: "'DM Sans',sans-serif",
                color: '#4d3142', background: 'transparent', outline: 'none',
                resize: 'none', lineHeight: 1.55,
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#e0445a', fontWeight: 700 }}>{error}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            style={{
              width: '100%', minHeight: 48, borderRadius: 14,
              border: 'none',
              background: saved
                ? 'rgba(47,182,109,0.18)'
                : 'linear-gradient(135deg,#f95f85,#ff8ca8)',
              color: saved ? '#2fb66d' : '#fff',
              fontWeight: 800, fontSize: '0.92rem',
              fontFamily: "'DM Sans',sans-serif",
              cursor: saving || saved ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
