import { AbsoluteFill, Audio, Sequence, Loop, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { FONT_FACES } from './fonts.js'

// PHASR pillar video 1 — production-standard rebuild per Favour's exact
// CapCut-style spec: voiceover != on-screen text != visual, minimal
// accessibility captions (not full sentences), a distinct emphasis-text
// layer, per-phrase kinetic typography, a real 30s scene-by-scene visual
// timeline, procedural SFX on key beats, and a music "duck" at the
// emotional turn ("It was never that."). Voiceover text is LOCKED.
// On-brand cream/pink palette (no glow — that's a dark-theme technique).
// Known gap: no realistic foley (paper rustle, pencil) — only simple
// synthesized percussive SFX (pop/stamp/click), flagged honestly.
export const PR_WIDTH = 1080
export const PR_HEIGHT = 1920
export const PR_FPS = 30

const COLORS = {
  cream: '#fff8fa',
  paper: '#ffffff',
  quartz: '#e8c9d1',
  pink: '#f06090',
  rose: '#c2185b',
  ink: '#3d1020',
  muted: '#c9a8b3',
  white: '#ffffff',
}

function fadeRise(frame, fps, delay = 0, riseFrom = 16) {
  const local = frame - delay
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = spring({ frame: local, fps, from: riseFrom, to: 0, durationInFrames: 14 })
  return { opacity, transform: `translateY(${y}px)` }
}

function Sfx({ name, frame }) {
  if (frame < 0) return null
  return (
    <Sequence from={Math.round(frame)}>
      <Audio src={staticFile(`audio/sfx/${name}`)} />
    </Sequence>
  )
}

// SLIDE IN — the core physical card/paper primitive.
function FlyCard({ children, frame, delay = 0, from = { x: -400, y: 0, rotate: -25 }, to = { x: 0, y: 0, rotate: 0 }, style }) {
  const local = frame - delay
  const p = spring({ frame: local, fps: 30, config: { damping: 14, mass: 0.6 }, durationInFrames: 20 })
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const x = interpolate(p, [0, 1], [from.x, to.x])
  const y = interpolate(p, [0, 1], [from.y, to.y])
  const rot = interpolate(p, [0, 1], [from.rotate, to.rotate])
  return (
    <div style={{ position: 'absolute', opacity, transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`, boxShadow: '0 14px 30px rgba(61,16,32,0.18)', ...style }}>
      {children}
    </div>
  )
}

// STAMP keyframe pattern: scale 130% opacity 0 -> scale 95% -> settle 100%.
function Stamp({ text, frame, delay = 0, color = COLORS.rose, rotate = -8, size = 26, x = 0, y = 0 }) {
  const local = frame - delay
  const scale = spring({ frame: local, fps: 30, config: { damping: 8, mass: 0.4 }, durationInFrames: 10, from: 2.4, to: 1 })
  const opacity = interpolate(local, [0, 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity, transform: `scale(${local < 0 ? 0 : scale}) rotate(${rotate}deg)`, border: `4px solid ${color}`, borderRadius: 8, padding: '6px 14px', color, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: size, letterSpacing: 1 }}>
      {text}
    </div>
  )
}

// Handwriting-style progressive reveal (typewriter), Caveat font, with a
// looped typing tick sound running for exactly the reveal's duration.
function TypeOn({ text, frame, delay = 0, speed = 1.4, size = 34, color = COLORS.ink, style, sound = true }) {
  const local = Math.max(0, frame - delay)
  const count = Math.floor(local * speed)
  const shown = text.slice(0, count)
  const caretOn = Math.floor(frame / 10) % 2 === 0 && count < text.length
  const revealFrames = Math.ceil(text.length / speed) + 2
  return (
    <div style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: size, color, opacity: count > 0 ? 1 : 0, ...style }}>
      {sound && delay >= 0 && (
        <Sequence from={Math.round(delay)} durationInFrames={revealFrames}>
          <Loop durationInFrames={4}>
            <Audio src={staticFile('audio/sfx/type-tick.wav')} volume={0.5} />
          </Loop>
        </Sequence>
      )}
      {shown}
      {caretOn && <span>|</span>}
    </div>
  )
}

// POP keyframe pattern: scale 70% opacity 0 -> 105% -> settle 100%.
function PopText({ children, frame, delay = 0, size = 40, color = COLORS.ink, weight = 800 }) {
  const local = frame - delay
  const scale = spring({ frame: local, fps: 30, config: { damping: 9 }, durationInFrames: 14, from: 0.7, to: 1 })
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: weight, fontSize: size, color, opacity, transform: `scale(${local < 0 ? 0.7 : scale})` }}>
      {children}
    </div>
  )
}

// SHAKE — reserved for confusion/wrong-assumption moments only.
function shakeOffset(frame, delay, amount = 5) {
  const local = frame - delay
  if (local < 0 || local > 16) return 0
  return Math.sin(local * 2.6) * amount * (1 - local / 16)
}

function PaperCard({ text, color = COLORS.paper, textColor = COLORS.ink, size = 20 }) {
  return (
    <div style={{ background: color, borderRadius: 8, padding: '18px 22px', minWidth: 160, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: size, color: textColor }}>{text}</div>
    </div>
  )
}

// ============ 0:00-0:04 — "MY GOALS" paper + fly-in notes, camera push ============
function HookScene() {
  const frame = useCurrentFrame()
  const pushIn = interpolate(frame, [0, 120], [1, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const notes = [
    { x: -260, y: -200, from: { x: -500, y: -300, rotate: -40 }, delay: 6 },
    { x: 220, y: -180, from: { x: 500, y: -260, rotate: 30 }, delay: 10 },
    { x: -250, y: 220, from: { x: -480, y: 320, rotate: 25 }, delay: 14 },
    { x: 230, y: 240, from: { x: 480, y: 300, rotate: -30 }, delay: 18 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `scale(${pushIn})` }}>
      <Sfx name="pop.wav" frame={0} />
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        <FlyCard frame={frame} delay={0} from={{ x: 0, y: -260, rotate: -8 }} to={{ x: -140, y: -140, rotate: -4 }} style={{ background: COLORS.paper, borderRadius: 10, padding: '30px 34px', width: 260 }}>
          <TypeOn text="MY GOALS" frame={frame} delay={4} speed={1.6} size={30} />
        </FlyCard>
        {notes.map((n, i) => (
          <div key={i}>
            <Sfx name="pop.wav" frame={n.delay} />
            <FlyCard frame={frame} delay={n.delay} from={n.from} to={{ x: n.x, y: n.y, rotate: (i % 2 ? 1 : -1) * 6 }}>
              <div style={{ width: 90, height: 90, background: [COLORS.pink, COLORS.quartz, COLORS.rose, COLORS.quartz][i], borderRadius: 6 }} />
            </FlyCard>
          </div>
        ))}
      </div>
      {/* emphasis text — separate layer from the paper's own label */}
      <div style={{ position: 'absolute', bottom: 420, textAlign: 'center' }}>
        <TypeOn text="Maybe it isn't inconsistency." frame={frame} delay={40} speed={1.1} size={26} color={COLORS.rose} />
      </div>
    </AbsoluteFill>
  )
}

// ============ 0:04-0:08 — hand draws a target, arrows lead nowhere ============
function TargetDrawScene() {
  const frame = useCurrentFrame()
  const ringDraw = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const arrows = [
    { angle: -50, delay: 24 },
    { angle: 0, delay: 34 },
    { angle: 55, delay: 44 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 360, height: 360 }}>
        <svg width="360" height="360" style={{ position: 'absolute' }}>
          <circle cx="180" cy="180" r="90" fill="none" stroke={COLORS.ink} strokeWidth="4" strokeDasharray="566" strokeDashoffset={566 * (1 - ringDraw)} />
        </svg>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: interpolate(frame, [16, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 28, color: COLORS.muted }}>GOAL</div>
        </div>
        {arrows.map((a, i) => {
          const len = interpolate(frame, [a.delay, a.delay + 12], [0, 130], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const rad = (a.angle * Math.PI) / 180
          return (
            <div key={i}>
              <Sfx name="click.wav" frame={a.delay} />
              <div
                style={{
                  position: 'absolute',
                  left: 180,
                  top: 180,
                  width: len,
                  height: 3,
                  background: COLORS.pink,
                  transformOrigin: 'left center',
                  transform: `rotate(${a.angle}deg)`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 180 + Math.cos(rad) * (len + 14),
                  top: 180 + Math.sin(rad) * (len + 14),
                  transform: 'translate(-50%,-50%)',
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 700,
                  fontSize: 26,
                  color: COLORS.rose,
                  opacity: interpolate(frame, [a.delay + 10, a.delay + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                }}
              >
                ?
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 460, textAlign: 'center' }}>
        <TypeOn text="WHERE AM I GOING?" frame={frame} delay={70} speed={1.2} size={30} color={COLORS.ink} />
      </div>
    </AbsoluteFill>
  )
}

// ============ 0:08-0:12 — three cards, three DIFFERENT entrance styles, stamped ============
function VagueCardsScene() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        {/* Card 1 — typewriter reveal */}
        <div style={{ position: 'absolute', left: -320, top: -260 }}>
          <div style={{ opacity: fadeRise(frame, 30, 0).opacity, background: COLORS.pink, borderRadius: 8, padding: '18px 22px', minWidth: 200 }}>
            <TypeOn text="GET HEALTHIER" frame={frame} delay={4} speed={1.6} size={20} color="#ffffff" />
          </div>
          <Sfx name="stamp.wav" frame={30} />
          <Stamp text="TOO VAGUE" frame={frame} delay={30} x={40} y={-14} />
        </div>
        {/* Card 2 — slide in */}
        <FlyCard frame={frame} delay={22} from={{ x: 520, y: -20, rotate: 20 }} to={{ x: -140, y: -20, rotate: 0 }}>
          <PaperCard text="BE MORE CONSISTENT" color={COLORS.quartz} textColor={COLORS.ink} />
          <Sfx name="stamp.wav" frame={52} />
          <Stamp text="TOO VAGUE" frame={frame} delay={52} x={40} y={-14} />
        </FlyCard>
        {/* Card 3 — stamp-style pop entrance */}
        <div style={{ position: 'absolute', left: -280, top: 240 }}>
          <Sfx name="pop.wav" frame={44} />
          <PopText frame={frame} delay={44} size={20} color={COLORS.ink}>
            <div style={{ background: COLORS.rose, borderRadius: 8, padding: '18px 22px', color: '#ffffff' }}>BUILD THE BUSINESS</div>
          </PopText>
          <Sfx name="stamp.wav" frame={74} />
          <Stamp text="TOO VAGUE" frame={frame} delay={74} x={60} y={-14} />
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ============ 0:12-0:16 — cards stack, hand reaches, slide away, blank TODAY ============
function EmptyTodayScene() {
  const frame = useCurrentFrame()
  const pileProgress = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const zoomOut = interpolate(frame, [20, 40], [1, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const slideAway = interpolate(frame, [55, 75], [0, -700], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const reachPulse = interpolate(frame, [40, 50, 55], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `scale(${zoomOut}) translateX(${slideAway}px)`, position: 'relative', width: 10, height: 10 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: 'absolute', left: -100 + i * 4 * pileProgress, top: -20 + i * 6 * pileProgress, transform: `rotate(${(i - 1) * 4 * pileProgress}deg)` }}>
            <PaperCard text={['GET HEALTHIER', 'BE CONSISTENT', 'BUILD BUSINESS'][i]} color={[COLORS.pink, COLORS.quartz, COLORS.rose][i]} textColor={[COLORS.white, COLORS.ink, COLORS.white][i] || COLORS.ink} size={16} />
          </div>
        ))}
        <div style={{ position: 'absolute', left: 30, top: -60, width: 24, height: 24, borderRadius: 12, border: `3px solid ${COLORS.ink}`, opacity: reachPulse }} />
      </div>
      <Sfx name="pop.wav" frame={70} />
      <div style={{ position: 'absolute', background: COLORS.paper, borderRadius: 10, padding: '40px 50px', opacity: fadeRise(frame, 30, 70, 10).opacity, textAlign: 'center', boxShadow: '0 10px 30px rgba(61,16,32,0.12)' }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 22, color: COLORS.muted, letterSpacing: 2 }}>TODAY</div>
        <div style={{ height: 70 }} />
        <TypeOn text="WHAT DO I DO TODAY?" frame={frame} delay={90} speed={1.2} size={26} />
      </div>
    </AbsoluteFill>
  )
}

// ============ 0:16-0:20 — brain with crowded word-nodes and tangled lines ============
function BrainCrowdedScene() {
  const frame = useCurrentFrame()
  const words = [
    { label: 'GOAL', angle: -90, delay: 8 },
    { label: 'MONEY', angle: -30, delay: 16 },
    { label: 'HEALTH', angle: 30, delay: 24 },
    { label: 'BUSINESS', angle: 90, delay: 32 },
    { label: 'FITNESS', angle: 150, delay: 40 },
    { label: 'CAREER', angle: -150, delay: 48 },
  ]
  const r = 190
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 420, height: 420 }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 16, height: 16, borderRadius: 8, background: COLORS.rose, transform: 'translate(-50%,-50%)' }} />
        {words.map((w, i) => {
          const rad = (w.angle * Math.PI) / 180
          const x = 210 + Math.cos(rad) * r
          const y = 210 + Math.sin(rad) * r
          const lineLen = interpolate(frame, [w.delay, w.delay + 14], [0, r], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const jitter = Math.sin(frame / 9 + i) * 3
          return (
            <div key={w.label}>
              <div
                style={{
                  position: 'absolute',
                  left: 210,
                  top: 210,
                  width: lineLen,
                  height: 2,
                  background: COLORS.quartz,
                  transformOrigin: 'left center',
                  transform: `rotate(${w.angle + jitter}deg)`,
                }}
              />
              <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', opacity: fadeRise(frame, 30, w.delay + 10, 6).opacity }}>
                <div style={{ background: COLORS.paper, borderRadius: 16, padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: COLORS.ink, boxShadow: '0 4px 14px rgba(61,16,32,0.10)' }}>
                  {w.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 420, textAlign: 'center' }}>
        <PopText frame={frame} delay={90} size={30} color={COLORS.rose}>
          TOO MANY POSSIBILITIES.
        </PopText>
      </div>
    </AbsoluteFill>
  )
}

// ============ 0:20-0:23 — split diagram, then transforms into clear chain ============
function SplitTargetScene() {
  const frame = useCurrentFrame()
  const transform1 = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: 1 - transform1, display: 'flex', gap: 50 }}>
        <div style={{ textAlign: 'center' }}>
          <PopText frame={frame} delay={0} size={20} color={COLORS.ink}>NO CLEAR TARGET</PopText>
          <div style={{ color: COLORS.muted, fontSize: 22, margin: '8px 0' }}>&darr;</div>
          <div style={{ fontSize: 26, color: COLORS.rose, opacity: fadeRise(frame, 30, 14).opacity }}>?</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <PopText frame={frame} delay={8} size={20} color={COLORS.ink}>NO CLEAR NEXT MOVE</PopText>
          <div style={{ color: COLORS.muted, fontSize: 22, margin: '8px 0' }}>&darr;</div>
          <div style={{ fontSize: 26, color: COLORS.rose, opacity: fadeRise(frame, 30, 22).opacity }}>?</div>
        </div>
      </div>
      <div style={{ position: 'absolute', opacity: transform1, transform: `scale(${0.9 + transform1 * 0.1})`, textAlign: 'center' }}>
        <Sfx name="click.wav" frame={40} />
        <PopText frame={frame} delay={40} size={32} color={COLORS.rose}>CLEAR TARGET</PopText>
        <div style={{ color: COLORS.muted, fontSize: 26, margin: '10px 0' }}>&darr;</div>
        <Sfx name="click.wav" frame={52} />
        <PopText frame={frame} delay={52} size={32} color={COLORS.rose}>NEXT ACTION</PopText>
      </div>
    </AbsoluteFill>
  )
}

// ============ 0:23-0:27 — the cycle, accelerating, STOP, shake, cross out ============
function CycleScene() {
  const frame = useCurrentFrame()
  const steps = ['DRIFT', 'GUILT', "I'M INCONSISTENT", 'TRY AGAIN']
  const cyclePos = [
    { top: -220, left: '50%', tx: '-50%' },
    { top: -90, right: -170 },
    { bottom: 30, left: '50%', tx: '-50%' },
    { top: -90, left: -170 },
  ]
  const stopFrame = 120
  const showStop = frame >= stopFrame && frame < stopFrame + 16
  const showCross = frame >= stopFrame + 16
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        {frame < stopFrame &&
          steps.map((s, i) => {
            const delay = i * 16
            const p = cyclePos[i]
            return (
              <div key={i} style={{ position: 'absolute', top: p.top, left: p.left, right: p.right, bottom: p.bottom, transform: `translateX(${p.tx || 0})`, opacity: fadeRise(frame, 30, delay, 8).opacity }}>
                <PopText frame={frame} delay={delay} size={18} color={i % 2 ? COLORS.rose : COLORS.ink}>
                  {s}
                </PopText>
              </div>
            )
          })}
        {showStop && (
          <>
            <Sfx name="pop.wav" frame={stopFrame} />
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }}>
              <PopText frame={frame} delay={stopFrame} size={54} color={COLORS.rose} weight={900}>
                STOP.
              </PopText>
            </div>
          </>
        )}
        {showCross && (
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: `translate(calc(-50% + ${shakeOffset(frame, stopFrame + 16)}px), 0)` }}>
            <div style={{ position: 'relative' }}>
              <PopText frame={frame} delay={stopFrame + 16} size={32} color={COLORS.ink}>
                DISCIPLINE PROBLEM?
              </PopText>
              <Sfx name="stamp.wav" frame={stopFrame + 26} />
              <Stamp text="X" frame={frame} delay={stopFrame + 26} rotate={0} size={40} x={100} y={-24} />
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

// ============ 0:27-0:30+ — blank pause, "It was never that.", CLARITY, resolution ============
function ResolutionScene() {
  const frame = useCurrentFrame()
  const switchFrame = 80
  const lock = interpolate(frame, [110, 125], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 60px' }}>
      {/* "everything disappears except this sentence" beat — held for real breathing room */}
      {frame < switchFrame && (
        <PopText frame={frame} delay={6} size={38} color={COLORS.ink} weight={700}>
          It was never that.
        </PopText>
      )}
      {frame >= switchFrame && (
        <>
          <TypeOn text="CLARITY" frame={frame} delay={switchFrame} speed={0.8} size={64} color={COLORS.rose} style={{ marginBottom: 30 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transform: `translateY(${lock}px)`, opacity: fadeRise(frame, 30, 110).opacity }}>
            {['CLEAR TARGET', 'TODAY', 'NEXT ACTION'].map((t, i) => (
              <div key={t} style={{ background: [COLORS.pink, COLORS.quartz, COLORS.rose][i], borderRadius: 8, padding: '10px 22px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 16, color: [COLORS.white, COLORS.ink, COLORS.white][i] || COLORS.ink }}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, textAlign: 'center', opacity: fadeRise(frame, 30, 145, 14).opacity }}>
            <Sfx name="pop.wav" frame={145} />
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 44, letterSpacing: 4, color: COLORS.ink }}>PHASR</div>
            <div style={{ marginTop: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 18, color: COLORS.rose, letterSpacing: 1 }}>CLARITY BEFORE CONSISTENCY</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  )
}

// Durations are sized generously against the LOCKED voiceover's actual word
// count per beat (not the storyboard's suggested seconds) so no scene races
// ahead of or gets cut off before the narrator finishes that line. These are
// an estimate pending the real ElevenLabs render — once that's available,
// true these up to its exact measured duration per scene.
const SCENES = [
  { Comp: HookScene, dur: 165 },
  { Comp: TargetDrawScene, dur: 170 },
  { Comp: VagueCardsScene, dur: 175 },
  { Comp: EmptyTodayScene, dur: 165 },
  { Comp: BrainCrowdedScene, dur: 170 },
  { Comp: SplitTargetScene, dur: 130 },
  { Comp: CycleScene, dur: 175 },
  { Comp: ResolutionScene, dur: 190 },
]

const TRANSITION_FRAMES = 8

function computeSceneStarts(durations, transitionFrames) {
  let raw = 0
  let compressed = 0
  const starts = []
  durations.forEach((d, i) => {
    starts.push(compressed)
    raw += d
    compressed = raw - transitionFrames * (i + 1)
  })
  return starts
}

export default function PillarReel({
  // Placeholder voiceover removed — it was the wrong (old, mismatched)
  // script. Silent until the real locked-script voiceover is generated
  // (needs ElevenLabs enabled in-chat).
  audioFile = null,
  musicFile = 'audio/ambient-bed-pillar.wav',
  musicVolume = 0.12,
  beatFrames = SCENES.map((s) => s.dur),
  transitionFrames = TRANSITION_FRAMES,
}) {
  // duck the music under "It was never that." (start of the last scene) for
  // the emotional release, then bring it back for the CLARITY resolution.
  const duckAt = computeSceneStarts(beatFrames, transitionFrames)[beatFrames.length - 1]
  const musicVolumeFn = (frame) => {
    if (frame < duckAt) return musicVolume
    if (frame < duckAt + 16) return interpolate(frame, [duckAt, duckAt + 16], [musicVolume, 0.02])
    if (frame < duckAt + 46) return 0.02
    if (frame < duckAt + 66) return interpolate(frame, [duckAt + 46, duckAt + 66], [0.02, musicVolume])
    return musicVolume
  }
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <style>{FONT_FACES}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      {musicFile && <Audio src={staticFile(musicFile)} volume={musicVolumeFn} />}
      <TransitionSeries>
        {SCENES.map(({ Comp }, i) => (
          <>
            <TransitionSeries.Sequence key={i} durationInFrames={beatFrames[i]}>
              <Comp />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 && (
              <TransitionSeries.Transition key={i + '-t'} presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
            )}
          </>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  )
}

export function pillarReelDuration(beatFrames = SCENES.map((s) => s.dur), transitionFrames = TRANSITION_FRAMES) {
  const raw = beatFrames.reduce((a, b) => a + b, 0)
  return raw - transitionFrames * (beatFrames.length - 1)
}
