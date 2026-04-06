const VOICE_PREF_KEY = 'phasr_voice_pref'
const SAGE_AVATAR_KEY = 'phasr_sage_avatar_url'
const DEFAULT_SAGE_AVATAR_URL = 'https://i.pinimg.com/1200x/7e/72/0a/7e720a17db0f1342dee92907ddca6e26.jpg'
const LEGACY_SAGE_AVATARS = new Set([
  'https://i.pinimg.com/1200x/23/25/3b/23253b2eaef31109bedd3d21312e062e.jpg',
  'https://i.pinimg.com/1200x/b0/b4/db/b0b4db525f914f7ee9041e4ca4c1eda8.jpg',
  'https://i.pinimg.com/1200x/16/e3/65/16e36586bc966bef58a71c713d6c79e7.jpg',
  'https://i.pinimg.com/1200x/5d/34/75/5d3475c2d3867c2104c250633c9e3019.jpg',
])

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getVoicePreference() {
  return safeRead(VOICE_PREF_KEY, 'female')
}

export function setVoicePreference(value) {
  safeWrite(VOICE_PREF_KEY, value === 'male' ? 'male' : 'female')
}

export function getSageAvatarUrl() {
  const value = safeRead(SAGE_AVATAR_KEY, '')
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim()
    return LEGACY_SAGE_AVATARS.has(trimmed) ? DEFAULT_SAGE_AVATAR_URL : trimmed
  }
  return DEFAULT_SAGE_AVATAR_URL
}

export function setSageAvatarUrl(value) {
  safeWrite(SAGE_AVATAR_KEY, String(value || '').trim())
}
