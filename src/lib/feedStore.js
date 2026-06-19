function safeJson(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

const _channels = {}

function getChannel(roomId) {
  if (!_channels[roomId]) {
    try { _channels[roomId] = new BroadcastChannel(`phasr_feed_v1_${roomId}`) } catch { _channels[roomId] = null }
  }
  return _channels[roomId]
}

function storageKey(roomId) {
  return `phasr_feed_v1_${roomId}`
}

export function readLocalPosts(roomId) {
  return safeJson(localStorage.getItem(storageKey(roomId)), [])
}

export function writeLocalPosts(roomId, posts) {
  try { localStorage.setItem(storageKey(roomId), JSON.stringify(posts)) } catch {}
  try { getChannel(roomId)?.postMessage({ type: 'sync', posts }) } catch {}
}

export function subscribeLocalFeed(roomId, callback) {
  const channel = getChannel(roomId)
  if (!channel) return () => {}
  const handler = e => { if (e.data?.type === 'sync') callback(e.data.posts) }
  channel.addEventListener('message', handler)
  return () => channel.removeEventListener('message', handler)
}
