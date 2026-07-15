import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation, useReducedMotion } from 'framer-motion'

/**
 * Sage, built entirely from layered HTML/CSS shapes and animated with
 * Framer Motion — no images, no external animation libraries.
 *
 * <SageCharacter emotion="wave" /> crossfades smoothly into that pose.
 */

const BASE_SIZE = 220

const SPRING = { type: 'spring', stiffness: 260, damping: 15, mass: 0.7 }
const SOFT_SPRING = { type: 'spring', stiffness: 200, damping: 18, mass: 0.8 }

const HAND_REST = { x: 0, y: 0, rotate: 0 }

// Every shape here stays blocky (small border-radius, not 50%) so the face
// reads as tiny pixel-style LEDs rather than smooth circular "eyes".
const EYE_POSE = {
  idle: { scaleY: 1, scaleX: 1, y: 0, borderRadius: '3px', opacity: 0.9 },
  wave: { scaleY: 1.05, scaleX: 1.05, y: 0, borderRadius: '3px', opacity: 1 },
  thinking: { scaleY: 0.85, scaleX: 0.85, y: -6, borderRadius: '3px', opacity: 0.85 },
  happy: { scaleY: 0.5, scaleX: 1.3, y: -2, borderRadius: '40% 40% 3px 3px', opacity: 1 },
  celebrating: { scaleY: 0.55, scaleX: 1.4, y: -3, borderRadius: '40% 40% 3px 3px', opacity: 1 },
  concerned: { scaleY: 0.45, scaleX: 0.9, y: 2, borderRadius: '3px', opacity: 0.7 },
  peace: { scaleY: 1, scaleX: 1, y: 0, borderRadius: '3px', opacity: 1 },
}

const MOUTH_POSE = {
  idle: { scaleX: 1, scaleY: 1, opacity: 0.85, borderRadius: '2px 2px 6px 6px' },
  wave: { scaleX: 1.15, scaleY: 1.1, opacity: 1, borderRadius: '2px 2px 7px 7px' },
  thinking: { scaleX: 0.5, scaleY: 0.4, opacity: 0.6, borderRadius: '2px' },
  happy: { scaleX: 1.3, scaleY: 2, opacity: 1, borderRadius: '3px 3px 7px 7px' },
  celebrating: { scaleX: 1.5, scaleY: 2.4, opacity: 1, borderRadius: '3px 3px 8px 8px' },
  concerned: { scaleX: 0.7, scaleY: 0.6, opacity: 0.55, borderRadius: '6px 6px 2px 2px' },
  peace: { scaleX: 1.2, scaleY: 1.15, opacity: 1, borderRadius: '2px 2px 7px 7px' },
}

const CHEEK_POSE = {
  idle: 0.35,
  wave: 0.9,
  thinking: 0.25,
  happy: 0.9,
  celebrating: 1,
  concerned: 0.12,
  peace: 0.7,
}

const HEAD_POSE = {
  idle: { rotate: 0, y: 0, x: 0 },
  wave: { rotate: -2, y: 0, x: 0 },
  thinking: { rotate: -6, y: -2, x: -2 },
  happy: { rotate: 2, y: -2, x: 0 },
  celebrating: { rotate: 0, y: -4, x: 0 },
  concerned: { rotate: 5, y: 3, x: 2 },
  peace: { rotate: -10, y: -1, x: -2 },
}

const BODY_POSE = {
  idle: { rotate: 0, y: 0 },
  wave: { rotate: 1, y: 0 },
  thinking: { rotate: 0, y: 0 },
  happy: { rotate: 0, y: -2 },
  celebrating: { rotate: 0, y: 0 },
  concerned: { rotate: 3, y: 4 },
  peace: { rotate: -2, y: 0 },
}

const LEFT_HAND_POSE = {
  celebrating: { x: -8, y: -74, rotate: 150 },
}

const RIGHT_HAND_POSE = {
  thinking: { x: 14, y: -58, rotate: -95 },
  peace: { x: 22, y: -88, rotate: -35 },
  celebrating: { x: 8, y: -74, rotate: -150 },
}

const SPARKLE_SPOTS = [
  { x: 10, y: 10 }, { x: 185, y: 20 }, { x: -6, y: 90 },
  { x: 200, y: 100 }, { x: 40, y: -10 }, { x: 160, y: -14 },
]

function usePartControls() {
  return {
    body: useAnimation(),
    head: useAnimation(),
    leftEye: useAnimation(),
    rightEye: useAnimation(),
    mouth: useAnimation(),
    cheeks: useAnimation(),
    leftHand: useAnimation(),
    rightHand: useAnimation(),
  }
}

export default function SageCharacter({ emotion = 'idle', size = BASE_SIZE, className = '' }) {
  const reducedMotion = useReducedMotion()
  const parts = usePartControls()
  const idleCancelRef = useRef(null)

  // Drive every part to its target pose whenever the emotion prop changes.
  // Simple parts settle with one spring; hands/body get a bespoke gesture
  // for the emotions that need a performed action rather than a held pose.
  useEffect(() => {
    const spring = reducedMotion ? { duration: 0.01 } : SPRING
    const softSpring = reducedMotion ? { duration: 0.01 } : SOFT_SPRING

    parts.head.start({ ...HEAD_POSE[emotion], transition: softSpring })
    parts.body.start({ ...BODY_POSE[emotion], transition: softSpring })
    parts.mouth.start({ ...MOUTH_POSE[emotion], transition: spring })
    parts.cheeks.start({ opacity: CHEEK_POSE[emotion], transition: { duration: 0.5 } })

    // peace winks the left eye; every other emotion keeps both eyes in sync
    if (emotion === 'peace') {
      parts.leftEye.start({ ...EYE_POSE.peace, scaleY: 0.1, transition: { duration: 0.18 } })
    } else {
      parts.leftEye.start({ ...EYE_POSE[emotion], transition: spring })
    }
    parts.rightEye.start({ ...EYE_POSE[emotion], transition: spring })

    parts.leftHand.start({ ...HAND_REST, ...(LEFT_HAND_POSE[emotion] || {}), transition: spring })

    if (emotion === 'wave') {
      parts.rightHand.start({ x: -6, y: -50, rotate: 0, transition: spring }).then(() => {
        if (reducedMotion) return
        parts.rightHand.start({
          rotate: [0, -26, 12, -26, 12, -26, 0],
          transition: { duration: 1.3, ease: 'easeInOut' },
        })
      })
    } else if (emotion === 'celebrating') {
      parts.rightHand.start({ ...RIGHT_HAND_POSE.celebrating, transition: spring })
      if (!reducedMotion) {
        parts.body.start({
          y: [0, -16, 0, -12, 0],
          transition: { duration: 0.9, ease: 'easeOut' },
        })
      }
    } else if (emotion === 'happy') {
      parts.rightHand.start({ ...HAND_REST, transition: spring })
      if (!reducedMotion) {
        parts.body.start({
          y: [0, -10, 0],
          transition: { duration: 0.45, ease: 'easeOut' },
        })
      }
    } else {
      parts.rightHand.start({ ...HAND_REST, ...(RIGHT_HAND_POSE[emotion] || {}), transition: spring })
    }
    // parts' animation controls are stable refs from useAnimation(); safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, reducedMotion])

  // Idle-only ambient life: gentle breathing sway and the occasional blink.
  useEffect(() => {
    if (emotion !== 'idle' || reducedMotion) return
    let cancelled = false
    idleCancelRef.current = () => { cancelled = true }

    parts.body.start({
      y: [0, -4, 0],
      transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
    })
    // tiny hand sway so idle never fully freezes, offset from the body's
    // own breathing rhythm so the two don't move in lockstep
    parts.leftHand.start({
      y: [0, 2, 0],
      transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 },
    })
    parts.rightHand.start({
      y: [0, 2, 0],
      transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
    })

    async function blinkLoop() {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 2400 + Math.random() * 2200))
        if (cancelled) break
        await Promise.all([
          parts.leftEye.start({ scaleY: 0.1, transition: { duration: 0.09 } }),
          parts.rightEye.start({ scaleY: 0.1, transition: { duration: 0.09 } }),
        ])
        if (cancelled) break
        await Promise.all([
          parts.leftEye.start({ scaleY: EYE_POSE.idle.scaleY, transition: { duration: 0.14 } }),
          parts.rightEye.start({ scaleY: EYE_POSE.idle.scaleY, transition: { duration: 0.14 } }),
        ])
      }
    }
    blinkLoop()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, reducedMotion])

  const scale = size / BASE_SIZE

  return (
    <div className={`sage-char-wrap ${className}`} style={{ width: size, height: size * 1.2 }}>
      <style>{STYLES}</style>
      <div className="sage-char-stage" style={{ transform: `scale(${scale})` }}>

        <motion.div className="sage-body" animate={parts.body}>
          <div className="sage-chest-glow" />

          <motion.div className="sage-hand sage-hand-left" animate={parts.leftHand} />

          <motion.div className="sage-hand sage-hand-right" animate={parts.rightHand}>
            <AnimatePresence>
              {emotion === 'peace' && (
                <>
                  <motion.span
                    key="finger-1"
                    className="sage-finger sage-finger-1"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={SPRING}
                  />
                  <motion.span
                    key="finger-2"
                    className="sage-finger sage-finger-2"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ ...SPRING, delay: 0.04 }}
                  />
                </>
              )}
              {emotion === 'thinking' && (
                <motion.span
                  key="finger-chin"
                  className="sage-finger sage-finger-chin"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={SPRING}
                />
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div className="sage-head" animate={parts.head}>
            <div className="sage-bow">
              <span className="sage-bow-wing sage-bow-wing-left" />
              <span className="sage-bow-wing sage-bow-wing-right" />
              <span className="sage-bow-knot" />
            </div>

            <div className="sage-ear sage-ear-left" />
            <div className="sage-ear sage-ear-right" />

            <div className="sage-face-screen">
              <motion.div className="sage-eye sage-eye-left" animate={parts.leftEye} />
              <motion.div className="sage-eye sage-eye-right" animate={parts.rightEye} />
              <motion.div className="sage-mouth" animate={parts.mouth} />
            </div>

            <motion.div className="sage-cheek sage-cheek-left" animate={parts.cheeks}>
              <span /><span /><span />
            </motion.div>
            <motion.div className="sage-cheek sage-cheek-right" animate={parts.cheeks}>
              <span /><span /><span />
            </motion.div>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {emotion === 'celebrating' && !reducedMotion && SPARKLE_SPOTS.map((pos, i) => (
            <motion.span
              key={i}
              className="sage-sparkle"
              style={{ left: pos.x, top: pos.y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.6], y: -26 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.1, repeat: Infinity, repeatDelay: 0.5 }}
            >
              ✦
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

const STYLES = `
  .sage-char-wrap { position: relative; }
  .sage-char-stage {
    position: relative;
    width: ${BASE_SIZE}px; height: ${BASE_SIZE * 1.2}px;
    transform-origin: top center;
  }

  .sage-body {
    /* centered with margin, not transform: translateX(-50%) — this is a
       motion.div whose animate prop fully owns the transform property, so a
       CSS-only centering transform would be silently dropped */
    position: absolute; left: 50%; margin-left: -66px; bottom: 8px;
    width: 132px; height: 118px;
    background: #fff8f5;
    border-radius: 50% 50% 46% 46% / 55% 55% 45% 45%;
    box-shadow: 0 10px 22px rgba(240,96,144,0.18), inset 0 -10px 18px rgba(240,96,144,0.06);
  }
  .sage-chest-glow {
    position: absolute; left: 50%; top: 30px; transform: translateX(-50%);
    width: 26px; height: 26px; border-radius: 8px;
    background: radial-gradient(circle, #f9b8ce 0%, #f06090 100%);
    box-shadow: 0 0 14px rgba(240,96,144,0.55);
  }

  .sage-hand {
    position: absolute; top: 46px; z-index: 2;
    width: 34px; height: 34px; border-radius: 50%;
    background: #fff8f5;
    box-shadow: 0 4px 10px rgba(240,96,144,0.2), inset 0 -4px 6px rgba(240,96,144,0.08);
    transform-origin: 50% 0%;
  }
  .sage-hand-left { left: -14px; }
  .sage-hand-right { right: -14px; transform-origin: 50% 0%; }

  .sage-finger {
    position: absolute; top: -14px;
    width: 7px; height: 18px; border-radius: 4px;
    background: #fff8f5;
    box-shadow: 0 2px 5px rgba(240,96,144,0.18);
    transform-origin: 50% 100%;
  }
  .sage-finger-1 { left: 8px; transform: rotate(-8deg); }
  .sage-finger-2 { left: 18px; transform: rotate(8deg); }
  .sage-finger-chin { left: 13px; width: 6px; height: 14px; transform: rotate(2deg); }

  .sage-head {
    position: absolute; left: 50%; margin-left: -74px; bottom: 96px;
    width: 148px; height: 138px;
    background: #fff8f5;
    border-radius: 50%;
    box-shadow: 0 12px 24px rgba(240,96,144,0.16), inset 0 -10px 16px rgba(240,96,144,0.06);
  }

  .sage-ear {
    position: absolute; top: 38px;
    width: 26px; height: 34px; border-radius: 50%;
    background: #fff8f5;
    box-shadow: inset 0 -4px 8px rgba(240,96,144,0.08);
  }
  .sage-ear-left { left: -12px; }
  .sage-ear-right { right: -12px; }

  .sage-bow {
    position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    width: 46px; height: 26px; z-index: 3;
  }
  .sage-bow-wing {
    position: absolute; top: 2px; width: 20px; height: 20px;
    background: #f06090; border-radius: 40% 60% 60% 40%;
  }
  .sage-bow-wing-left { left: 0; transform: rotate(-18deg); }
  .sage-bow-wing-right { right: 0; transform: rotate(18deg) scaleX(-1); }
  .sage-bow-knot {
    position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
    width: 10px; height: 10px; border-radius: 50%; background: #d1447a;
  }

  .sage-face-screen {
    position: absolute; left: 50%; top: 44px; transform: translateX(-50%);
    width: 96px; height: 62px; border-radius: 46% 46% 50% 50% / 60% 60% 40% 40%;
    background: #1a1a1a;
    box-shadow: inset 0 2px 6px rgba(255,255,255,0.06), 0 4px 10px rgba(0,0,0,0.25);
    overflow: hidden;
  }
  .sage-eye {
    position: absolute; top: 22px;
    width: 12px; height: 12px; border-radius: 3px;
    background: #f06090;
    box-shadow: 0 0 8px 2px rgba(240,96,144,0.75);
  }
  .sage-eye-left { left: 24px; }
  .sage-eye-right { right: 24px; }
  .sage-mouth {
    position: absolute; bottom: 13px; left: 50%; margin-left: -8px;
    width: 16px; height: 6px;
    background: #f06090;
    box-shadow: 0 0 6px rgba(240,96,144,0.7);
  }

  .sage-cheek {
    position: absolute; top: 78px;
    width: 20px; height: 14px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .sage-cheek-left { left: 4px; align-items: flex-start; }
  .sage-cheek-right { right: 4px; align-items: flex-end; }
  .sage-cheek span {
    display: block; width: 14px; height: 2px; border-radius: 2px;
    background: #f06090;
  }
  .sage-cheek-left span:nth-child(2) { width: 11px; }
  .sage-cheek-left span:nth-child(3) { width: 8px; }
  .sage-cheek-right span:nth-child(2) { width: 11px; }
  .sage-cheek-right span:nth-child(3) { width: 8px; }

  .sage-sparkle {
    position: absolute; font-size: 16px; color: #f06090;
    text-shadow: 0 0 8px rgba(240,96,144,0.6);
    pointer-events: none;
  }
`
