import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X, Send } from 'lucide-react'

const SEEN_KEY = 'phasr_sage_intro_seen'
const OPEN_EVENT = 'phasr:open-sage'

const GREETING = "Hi, I'm Sage. What's the one thing you want to change this year?"
const STARTER_CHIPS = ['Career', 'Health', 'Money', 'Relationships', 'Myself']

function getSeen() {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1') } catch {}
}

export default function SageIntroBubble() {
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [typing, setTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [peekOpen, setPeekOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const scrollRef = useRef(null)
  const greetedRef = useRef(false)

  useEffect(() => {
    if (getSeen()) return
    const t = setTimeout(() => {
      markSeen()
      setOpen(true)
      setStarted(true)
    }, 8000)
    return () => clearTimeout(t)
  }, [])

  // A small, noticeable "thought bubble" so Sage doesn't go unnoticed even
  // if the user never opens the full chat panel. Waits 5s so visitors get
  // a chance to scroll before Sage shows up at all.
  useEffect(() => {
    const t = setTimeout(() => setPeekOpen(true), 5000)
    return () => clearTimeout(t)
  }, [])

  // Lets any button on the page ("Talk to Sage" in the Meet Sage section)
  // open this same panel instead of duplicating the chat experience.
  useEffect(() => {
    const handler = () => { setOpen(true); setStarted(true) }
    window.addEventListener(OPEN_EVENT, handler)
    return () => window.removeEventListener(OPEN_EVENT, handler)
  }, [])

  // A single warm opener, not a scripted tree — everything after this goes
  // through the real Sage LLM (see handleSend), free text or chip alike.
  useEffect(() => {
    if (!started || !open || greetedRef.current) return
    greetedRef.current = true
    setTyping(true)
    const t = setTimeout(() => {
      setTyping(false)
      setTranscript([{ role: 'sage', text: GREETING }])
    }, 550)
    return () => clearTimeout(t)
  }, [started, open])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [transcript, typing, streamText])

  function handleOpenToggle() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (!started) setStarted(true)
  }

  async function sendMessage(text) {
    if (!text || streaming) return
    const nextTranscript = [...transcript, { role: 'user', text }]
    setTranscript(nextTranscript)
    setStreaming(true)
    setStreamText('')

    try {
      const res = await fetch('/api/sage-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextTranscript.map(m => ({ role: m.role === 'sage' ? 'assistant' : 'user', content: m.text })) }),
      })
      if (!res.body) throw new Error('no stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setStreamText(acc)
      }
      setTranscript(prev => [...prev, { role: 'sage', text: acc || "I'm here, tell me a bit more?" }])
    } catch {
      setTranscript(prev => [...prev, { role: 'sage', text: "I'm having trouble connecting right now. Try again in a moment?" }])
    } finally {
      setStreaming(false)
      setStreamText('')
    }
  }

  function handleChip(value) {
    sendMessage(value)
  }

  function handleSend() {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    sendMessage(text)
  }

  // Chips are a starting nudge, not a cage — they only ever show once,
  // right after the opener, and disappear the moment she says anything.
  const showChips = started && !typing && transcript.length === 1 && transcript[0]?.role === 'sage'
  const showCta = started && transcript.some(m => m.role === 'user')

  return (
    <div className="sage-bubble-root">
      <style>{STYLES}</style>

      <AnimatePresence>
        {open && (
          <motion.div
            className="sage-panel"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="sage-panel-header">
              <img src="/images/sage.jpg" alt="Sage" className="sage-orb-sm" />
              <span className="sage-panel-title">Sage</span>
              <button className="sage-close-btn" onClick={() => setOpen(false)} aria-label="Close Sage">
                <X size={16} />
              </button>
            </div>

            <div className="sage-transcript" ref={scrollRef}>
              {transcript.map((item, i) => (
                <div key={i} className={`sage-line ${item.role === 'sage' ? 'sage-line-sage' : 'sage-line-reply'}`}>
                  {item.text}
                </div>
              ))}

              {typing && (
                <div className="sage-line sage-line-sage sage-typing">
                  <span className="sage-dot" /><span className="sage-dot" /><span className="sage-dot" />
                </div>
              )}

              {streaming && (
                <div className="sage-line sage-line-sage">
                  {streamText || <span className="sage-typing-inline"><span className="sage-dot" /><span className="sage-dot" /><span className="sage-dot" /></span>}
                </div>
              )}

              {showChips && (
                <div className="sage-options">
                  {STARTER_CHIPS.map(opt => (
                    <button key={opt} className="sage-option-btn" onClick={() => handleChip(opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {showCta && (
                <a href="/login" className="sage-cta-link">
                  Ready to start? Join the waitlist →
                </a>
              )}
            </div>

            <form
              className="sage-input-row"
              onSubmit={e => { e.preventDefault(); handleSend() }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask Sage anything"
                className="sage-text-input"
                disabled={streaming}
              />
              <button type="submit" className="sage-send-btn" disabled={streaming || !inputValue.trim()} aria-label="Send">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="sage-fab-wrap"
        aria-hidden={open}
        style={{
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : 'auto',
          transition: 'opacity 0.18s ease-out',
        }}
      >
        <AnimatePresence>
          {!open && peekOpen && (
            <motion.div
              className="sage-peek-stack"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: [1, 1.04, 1] }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={reducedMotion
                ? { duration: 0.3 }
                : {
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3 },
                    scale: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
                  }}
            >
              <div className="sage-peek" onClick={handleOpenToggle}>
                <span className="sage-peek-text">hey, got a sec? 👋</span>
                <span className="sage-peek-typing">
                  <span className="sage-dot" /><span className="sage-dot" /><span className="sage-dot" />
                </span>
                <button
                  type="button"
                  className="sage-peek-close"
                  onClick={(e) => { e.stopPropagation(); setPeekOpen(false) }}
                  aria-label="Dismiss"
                >
                  <X size={11} />
                </button>
              </div>
              <span className="sage-peek-dot sage-peek-dot-md" aria-hidden="true" />
              <span className="sage-peek-dot sage-peek-dot-sm" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>

        <button className="sage-fab" onClick={handleOpenToggle} tabIndex={open ? -1 : 0} aria-label={open ? 'Close Sage' : 'Chat with Sage'}>
          <span className="sage-fab-glow" aria-hidden="true" />
          <img src="/images/sage.jpg" alt="" className="sage-fab-img" />
        </button>
      </div>
    </div>
  )
}

const STYLES = `
  .sage-bubble-root {
    position: fixed; right: 24px; bottom: 24px; z-index: 300;
    display: flex; flex-direction: column; align-items: flex-end; gap: 14px;
    font-family: 'General Sans', sans-serif;
  }

  .sage-fab {
    width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
    background: #ffffff;
    box-shadow: 0 10px 30px rgba(183,164,217,0.35), 0 4px 14px rgba(194,24,91,0.14);
    display: flex; align-items: center; justify-content: center;
    position: relative; flex-shrink: 0; padding: 0; overflow: visible;
    transition: transform 0.2s;
  }
  .sage-fab:hover { transform: scale(1.06); }
  .sage-fab-wrap { position: relative; }

  .sage-peek-stack {
    position: absolute; bottom: calc(100% + 14px); right: -4px;
    display: flex; flex-direction: column; align-items: flex-end;
    z-index: 2;
  }
  .sage-peek {
    position: relative;
    background: linear-gradient(150deg, rgba(255,255,255,0.94) 0%, rgba(255,225,235,0.88) 100%);
    backdrop-filter: blur(10px) saturate(1.3);
    -webkit-backdrop-filter: blur(10px) saturate(1.3);
    color: #3d1020;
    padding: 10px 12px 10px 16px; border-radius: 18px;
    font-family: 'General Sans', sans-serif; font-size: 13px; font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 10px 28px rgba(194,24,91,0.18), inset 0 1px 0 rgba(255,255,255,0.85);
    border: 1px solid rgba(255,255,255,0.65);
    display: flex; align-items: center; gap: 8px;
    cursor: pointer;
  }
  .sage-peek-text { cursor: pointer; }
  .sage-peek-typing { display: inline-flex; align-items: center; gap: 3px; }
  .sage-peek-close {
    background: rgba(61,16,32,0.06); border: none; border-radius: 50%;
    width: 18px; height: 18px; flex-shrink: 0; padding: 0;
    display: flex; align-items: center; justify-content: center;
    color: #a58a95; cursor: pointer; transition: background 0.15s;
  }
  .sage-peek-close:hover { background: rgba(61,16,32,0.14); }
  .sage-peek-dot {
    display: block; border-radius: 50%;
    background: rgba(255,255,255,0.92);
    box-shadow: 0 4px 10px rgba(194,24,91,0.16);
    border: 1px solid rgba(255,255,255,0.65);
  }
  .sage-peek-dot-md { width: 12px; height: 12px; margin: 6px 30px 0 0; }
  .sage-peek-dot-sm { width: 7px; height: 7px; margin: 4px 16px 0 0; }
  .sage-fab-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; position: relative; z-index: 1; }
  .sage-fab-glow {
    position: absolute; inset: -6px; border-radius: 50%;
    background: radial-gradient(circle, rgba(183,164,217,0.4) 0%, transparent 70%);
    animation: sage-pulse 3s ease-in-out infinite;
  }
  @keyframes sage-pulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }

  .sage-panel {
    width: 380px; max-width: calc(100vw - 32px);
    max-height: 560px;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(22px) saturate(1.4);
    -webkit-backdrop-filter: blur(22px) saturate(1.4);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 24px;
    box-shadow: 0 24px 64px rgba(61,16,32,0.18), inset 0 1.5px 0 rgba(255,255,255,0.9);
    display: flex; flex-direction: column;
    overflow: hidden;
    position: relative;
    z-index: 2;
  }
  .sage-fab-wrap { z-index: 1; }
  .sage-panel-header {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px 13px 16px;
    border-bottom: 1px solid rgba(183,164,217,0.16);
    flex-shrink: 0;
  }
  .sage-orb-sm {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(183,164,217,0.4);
  }
  .sage-panel-title {
    font-family: 'Fraunces', serif; font-weight: 700; font-size: 15px; color: #3d1020;
    flex: 1;
  }
  .sage-close-btn {
    background: none; border: none; cursor: pointer; color: #a58; opacity: 0.6;
    padding: 4px; border-radius: 8px; transition: opacity 0.15s, background 0.15s;
  }
  .sage-close-btn:hover { opacity: 1; background: rgba(183,164,217,0.12); }

  .sage-transcript {
    flex: 1; overflow-y: auto; padding: 18px 18px 16px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .sage-line {
    font-size: 14.5px; line-height: 1.55; max-width: 88%;
    padding: 11px 15px; border-radius: 16px;
  }
  .sage-line-sage {
    font-family: 'Fraunces', serif; font-size: 15.5px; color: #3d1020;
    background: rgba(183,164,217,0.12);
    border-bottom-left-radius: 6px;
    align-self: flex-start;
  }
  .sage-line-reply {
    font-family: 'General Sans', sans-serif; color: #ffffff; font-weight: 600;
    background: #c2185b;
    border-bottom-right-radius: 6px;
    align-self: flex-end;
  }
  .sage-typing { display: flex; align-items: center; gap: 5px; padding: 13px 16px; }
  .sage-typing-inline { display: inline-flex; align-items: center; gap: 5px; }
  .sage-dot { width: 6px; height: 6px; border-radius: 50%; background: #B7A4D9; display: inline-block; animation: sage-bounce 1.2s infinite ease-in-out; }
  .sage-dot:nth-child(2) { animation-delay: 0.15s; }
  .sage-dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes sage-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }

  .sage-options { display: flex; flex-wrap: wrap; gap: 8px; align-self: flex-start; max-width: 100%; }
  .sage-option-btn {
    font-family: 'General Sans', sans-serif; font-size: 13.5px; font-weight: 600;
    color: #c2185b; background: rgba(255,255,255,0.85);
    border: 1.5px solid rgba(194,24,91,0.25); border-radius: 100px;
    padding: 9px 16px; cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
  }
  .sage-option-btn:hover { border-color: #c2185b; background: rgba(194,24,91,0.06); transform: translateY(-1px); }

  .sage-cta-link {
    align-self: flex-start;
    font-family: 'General Sans', sans-serif; font-size: 13px; font-weight: 700;
    color: #c2185b; text-decoration: none;
    border-bottom: 1px solid rgba(194,24,91,0.3);
    padding-bottom: 2px;
    transition: border-color 0.18s;
  }
  .sage-cta-link:hover { border-color: #c2185b; }

  .sage-input-row {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px; border-top: 1px solid rgba(183,164,217,0.16); flex-shrink: 0;
    position: relative; z-index: 1;
  }
  .sage-text-input {
    flex: 1; padding: 10px 14px; border-radius: 100px;
    border: 1.5px solid rgba(183,164,217,0.3);
    background: rgba(255,255,255,0.8);
    font-family: 'General Sans', sans-serif; font-size: 13.5px; color: #3d1020;
    outline: none;
  }
  .sage-text-input:focus { border-color: #B7A4D9; }
  .sage-text-input:disabled { opacity: 0.6; }
  .sage-send-btn {
    width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;
    background: #c2185b; color: #fff; display: flex; align-items: center; justify-content: center;
    transition: background 0.18s;
    position: relative; z-index: 2;
  }
  .sage-send-btn:hover:not(:disabled) { background: #a8124e; }
  .sage-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (max-width: 640px) {
    .sage-bubble-root { right: 16px; bottom: 16px; left: 16px; align-items: flex-end; }
    .sage-panel {
      position: fixed; left: 0; right: 0; bottom: 0; width: 100%; max-width: 100%;
      border-radius: 24px 24px 0 0; max-height: 80vh;
    }
    .sage-line, .sage-options { max-width: 100%; }
    .sage-input-row {
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
    }
    .sage-send-btn { width: 44px; height: 44px; }
    .sage-text-input { font-size: 16px; }
  }
`
