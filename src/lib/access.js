const ACCESS_KEY_PREFIX = 'phasr_access_'
const TRIAL_DAYS = 3

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

function getIdentity(user) {
  return user?.id || user?.email || 'guest'
}

function getAccessKey(user) {
  return `${ACCESS_KEY_PREFIX}${getIdentity(user)}`
}

function buildDefaultAccess() {
  const startedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  return {
    plan: 'trial',
    startedAt,
    expiresAt,
    trialDays: TRIAL_DAYS,
  }
}

export function getUserAccess(user) {
  if (!user) {
    return {
      plan: 'free',
      isPro: false,
      isTrial: false,
      trialDaysLeft: 0,
      startedAt: null,
      expiresAt: null,
    }
  }

  const key = getAccessKey(user)
  const existing = safeRead(key, null)
  const access = existing || buildDefaultAccess()

  if (!existing) safeWrite(key, access)

  const now = Date.now()
  const expiry = access?.expiresAt ? new Date(access.expiresAt).getTime() : 0
  const isTrialActive = access.plan === 'trial' && expiry > now
  const isPro = access.plan === 'pro' || isTrialActive
  const trialDaysLeft = isTrialActive ? Math.max(1, Math.ceil((expiry - now) / (24 * 60 * 60 * 1000))) : 0

  if (access.plan === 'trial' && !isTrialActive) {
    const downgraded = {
      ...access,
      plan: 'free',
      expiredAt: new Date().toISOString(),
    }
    safeWrite(key, downgraded)
    return {
      ...downgraded,
      isPro: false,
      isTrial: false,
      trialDaysLeft: 0,
    }
  }

  return {
    ...access,
    isPro,
    isTrial: isTrialActive,
    trialDaysLeft,
  }
}

export function setUserPlan(user, plan) {
  if (!user) return
  const current = getUserAccess(user)
  const next = {
    ...current,
    plan,
  }
  safeWrite(getAccessKey(user), next)
}
