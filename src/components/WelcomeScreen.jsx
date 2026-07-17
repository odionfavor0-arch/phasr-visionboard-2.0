import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import SageCharacter from './SageCharacter'

/**
 * Full-screen, shown-once welcome moment after first signup, before onboarding.
 * Sage peeks out from behind a slim wall on the right and waves; a small
 * glass butterfly crosses first. Both "Begin Your Journey" and "Skip"
 * continue straight into onboarding — they only differ in whether the
 * animation gets to play.
 */
export default function WelcomeScreen({ onContinue, onSkip }) {
  const reducedMotion = useReducedMotion()
  const [stage, setStage] = useState('hidden')
  const [emotion, setEmotion] = useState('idle')
  const [showButterfly, setShowButterfly] = useState(false)
  const [showText, setShowText] = useState(false)
  const [isPhone, setIsPhone] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 640 : false))

  useEffect(() => {
    const onResize = () => setIsPhone(window.innerWidth <= 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setStage('peek')
      setShowText(true)
      return
    }
    const timers = [
      setTimeout(() => setShowButterfly(true), 300),
      setTimeout(() => setShowButterfly(false), 3000),
      setTimeout(() => setStage('peek'), 3200),
      setTimeout(() => setEmotion('wave'), 3500),
      setTimeout(() => setEmotion('idle'), 4900),
      setTimeout(() => setShowText(true), 5000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [reducedMotion])

  const textMotion = (delay) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 16 },
    animate: showText ? { opacity: 1, y: 0 } : {},
    transition: { duration: reducedMotion ? 0.01 : 0.6, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <div className="ws-root">
      <style>{WELCOME_STYLES}</style>
      <div className="ws-glow" aria-hidden="true" />
      <Butterfly visible={showButterfly} reducedMotion={reducedMotion} />

      <div className="ws-text">
        <motion.h1 className="ws-headline" {...textMotion(0)}>
          Welcome to PHASR
        </motion.h1>
        <motion.p className="ws-subtitle" {...textMotion(0.15)}>
          Your future has been waiting for you. Let&apos;s build it together.
        </motion.p>
        <motion.div className="ws-actions" {...textMotion(0.32)}>
          <button type="button" className="ws-primary" onClick={onContinue}>
            Begin Your Journey
          </button>
          <button type="button" className="ws-skip" onClick={onSkip}>
            Skip
          </button>
        </motion.div>
      </div>

      <div className="ws-sage-area">
        <div className="ws-wall" aria-hidden="true" />
        <motion.div
          className="ws-sage-figure"
          initial={false}
          animate={stage}
          variants={{
            hidden: { x: 130, opacity: reducedMotion ? 1 : 0.5 },
            peek: { x: 20, opacity: 1 },
          }}
          transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 130, damping: 16, mass: 0.9 }}
        >
          <SageCharacter emotion={emotion} size={isPhone ? 150 : 220} />
        </motion.div>
      </div>
    </div>
  )
}

function Butterfly({ visible, reducedMotion }) {
  if (reducedMotion) return null
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ws-butterfly"
          initial={{ opacity: 0, x: '-8vw', y: '46vh', rotate: -8, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 1, 1, 0],
            x: ['-8vw', '18vw', '42vw', '58vw', '52vw'],
            y: ['46vh', '24vh', '32vh', '16vh', '-8vh'],
            rotate: [-8, 10, -6, 12, 0],
            scale: [0.6, 1, 1, 0.9, 0.7],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.6, times: [0, 0.25, 0.5, 0.78, 1], ease: 'easeInOut' }}
        >
          <span className="ws-butterfly-trail" />
          <motion.svg
            width="36"
            height="28"
            viewBox="0 0 34 26"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(240,96,144,0.35))', display: 'block' }}
          >
            <motion.g
              animate={{ scaleX: [1, 0.55, 1] }}
              transition={{ duration: 0.32, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              style={{ transformOrigin: '17px 13px' }}
            >
              <path d="M17 13 C10 1, -1 2, 2 12 C-1 21, 10 20, 17 13Z" fill="rgba(240,96,144,0.55)" />
              <path d="M17 13 C24 1, 35 2, 32 12 C35 21, 24 20, 17 13Z" fill="rgba(247,143,176,0.55)" />
            </motion.g>
            <rect x="16" y="8" width="2" height="10" rx="1" fill="#c2185b" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const WELCOME_STYLES = `
  .ws-root {
    position: fixed; inset: 0; z-index: 9500; overflow: hidden;
    background: linear-gradient(135deg, #fff8fa 0%, #fff0f4 55%, #ffe3ec 100%);
    font-family: 'General Sans', sans-serif; color: #3d1020;
    animation: wsFadeIn 0.6s ease-out;
  }
  @keyframes wsFadeIn { from { opacity: 0 } to { opacity: 1 } }

  .ws-glow {
    position: absolute; right: 4%; top: 16%; width: 46vw; height: 46vw; max-width: 520px; max-height: 520px;
    background: radial-gradient(circle, rgba(240,96,144,0.22) 0%, rgba(240,96,144,0) 70%);
    pointer-events: none;
  }

  .ws-text {
    position: absolute; left: 7%; top: 50%; transform: translateY(-50%);
    max-width: 460px; z-index: 4;
  }
  .ws-headline {
    margin: 0 0 16px; font-family: 'Fraunces', serif; font-weight: 600;
    font-size: clamp(2.6rem, 5vw, 4rem); line-height: 1.03; letter-spacing: -0.02em; color: #3d1020;
  }
  .ws-subtitle {
    margin: 0 0 32px; font-size: clamp(1rem, 1.6vw, 1.15rem); line-height: 1.6; color: #8a5060; max-width: 40ch;
  }
  .ws-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .ws-primary {
    min-height: 52px; padding: 0.85rem 1.9rem; border-radius: 999px; border: none;
    background: linear-gradient(135deg, #f78fb0, #f06090); color: #fff; font: inherit; font-weight: 700;
    font-size: 1rem; cursor: pointer; box-shadow: 0 14px 32px rgba(194,24,91,0.28);
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .ws-primary:hover { transform: translateY(-2px); box-shadow: 0 18px 36px rgba(194,24,91,0.36); }
  .ws-skip {
    background: none; border: none; color: #8a5060; font: inherit; font-size: 0.92rem; font-weight: 600;
    cursor: pointer; text-decoration: underline; text-underline-offset: 3px; padding: 0.5rem;
  }
  .ws-skip:hover { color: #c2185b; }

  .ws-sage-area {
    position: absolute; right: 0; top: 0; bottom: 0; width: min(44vw, 440px);
    display: flex; align-items: flex-end; justify-content: flex-end; overflow: hidden; z-index: 2;
  }
  .ws-wall {
    position: absolute; right: 0; top: 0; bottom: 0; width: 9%;
    background: linear-gradient(180deg, #ffe9f0, #fcc0d4);
    box-shadow: -10px 0 30px rgba(240,96,144,0.14);
    z-index: 3; border-radius: 14px 0 0 14px;
  }
  .ws-sage-figure { position: relative; z-index: 2; margin-right: -34px; margin-bottom: 4%; }

  .ws-butterfly { position: absolute; left: 0; top: 0; z-index: 5; pointer-events: none; }
  .ws-butterfly-trail { display: none; }

  @media (max-width: 860px) {
    .ws-root { display: flex; flex-direction: column; }
    .ws-sage-area { position: relative; width: 100%; height: 40vh; order: 1; }
    .ws-wall { width: 16%; border-radius: 0 0 0 14px; }
    .ws-sage-figure { margin-right: -18px; margin-bottom: 6%; }
    .ws-text {
      position: relative; left: 0; top: 0; transform: none; order: 2;
      max-width: none; padding: 8px 24px 32px; text-align: left;
    }
    .ws-glow { right: 6%; top: 2%; width: 72vw; height: 72vw; }
    .ws-headline { font-size: clamp(2.1rem, 9vw, 2.8rem); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ws-root { animation: none; }
  }
`
