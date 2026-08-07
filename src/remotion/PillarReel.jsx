import { AbsoluteFill, Audio, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { FONT_FACES } from './fonts.js'

// PHASR pillar video 1 — "physical paper" After-Effects-style rebuild.
// Voiceover is LOCKED (Favour's exact text, unaltered) — visuals must argue
// the idea through motion: cards flying in/out, stamps, handwriting reveals,
// diagrams that build themselves, no static slides, no full-sentence
// subtitles. Kept the dark/neon palette from the version she saw last since
// this brief doesn't specify colors — flagged as an assumption, easy to flip.
export const PR_WIDTH = 1080
export const PR_HEIGHT = 1920
export const PR_FPS = 30

const BEAT = 15 // 0.5s at 30fps

const COLORS = {
  black: '#0a0a0c',
  paper: '#f4ede0',
  paperDark: '#e8dfcd',
  pink: '#ff2f8f',
  yellow: '#ffd23f',
  blue: '#3fd0ff',
  white: '#ffffff',
  dim: '#8a8a92',
  ink: '#241a1c',
}

function fadeRise(frame, fps, delay = 0, riseFrom = 16) {
  const local = frame - delay
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = spring({ frame: local, fps, from: riseFrom, to: 0, durationInFrames: 14 })
  return { opacity, transform: `translateY(${y}px)` }
}

// A physical paper/card flying in from an off-screen edge, settling with a
// tiny overshoot — the core "physical" motion primitive used everywhere.
function FlyCard({ children, frame, delay = 0, from = { x: -400, y: 0, rotate: -25 }, to = { x: 0, y: 0, rotate: 0 }, style }) {
  const local = frame - delay
  const p = spring({ frame: local, fps: 30, config: { damping: 14, mass: 0.6 }, durationInFrames: 20 })
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const x = interpolate(p, [0, 1], [from.x, to.x])
  const y = interpolate(p, [0, 1], [from.y, to.y])
  const rot = interpolate(p, [0, 1], [from.rotate, to.rotate])
  return (
    <div
      style={{
        position: 'absolute',
        opacity,
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
        boxShadow: '0 14px 30px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// A stamp slamming down — fast overshoot-in, not a fade.
function Stamp({ text, frame, delay = 0, color = '#e11d48', rotate = -8, size = 26, x = 0, y = 0 }) {
  const local = frame - delay
  const scale = spring({ frame: local, fps: 30, config: { damping: 8, mass: 0.4 }, durationInFrames: 10, from: 2.6, to: 1 })
  const opacity = interpolate(local, [0, 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity,
        transform: `scale(${local < 0 ? 0 : scale}) rotate(${rotate}deg)`,
        border: `4px solid ${color}`,
        borderRadius: 8,
        padding: '6px 14px',
        color,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 1,
      }}
    >
      {text}
    </div>
  )
}

// Handwriting-style progressive reveal, Caveat font.
function TypeOn({ text, frame, delay = 0, speed = 1.4, size = 34, color = COLORS.ink, style }) {
  const local = Math.max(0, frame - delay)
  const count = Math.floor(local * speed)
  const shown = text.slice(0, count)
  const caretOn = Math.floor(frame / 10) % 2 === 0 && count < text.length
  return (
    <div style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: size, color, opacity: count > 0 ? 1 : 0, ...style }}>
      {shown}
      {caretOn && <span>|</span>}
    </div>
  )
}

function NeonText({ children, color = COLORS.pink, size = 44, frame, delay = 0, weight = 800 }) {
  const { opacity, transform } = fadeRise(frame, 30, delay, 12)
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: weight, fontSize: size, color: COLORS.white, textShadow: `0 0 6px ${color}, 0 0 18px ${color}, 0 0 36px ${color}`, opacity, transform }}>
      {children}
    </div>
  )
}

function PaperCard({ text, color = COLORS.paper, size = 20 }) {
  return (
    <div style={{ background: color, borderRadius: 8, padding: '18px 22px', minWidth: 160, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: size, color: COLORS.ink }}>{text}</div>
    </div>
  )
}

// ---------- Scene 1 — HOOK: "MY GOALS" paper slides in, notes fly around it ----------
function HookScene() {
  const frame = useCurrentFrame()
  const pushIn = interpolate(frame, [0, 90], [1, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const notes = [
    { x: -260, y: -200, from: { x: -500, y: -300, rotate: -40 }, delay: 6 },
    { x: 220, y: -180, from: { x: 500, y: -260, rotate: 30 }, delay: 10 },
    { x: -250, y: 220, from: { x: -480, y: 320, rotate: 25 }, delay: 14 },
    { x: 230, y: 240, from: { x: 480, y: 300, rotate: -30 }, delay: 18 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `scale(${pushIn})` }}>
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        <FlyCard frame={frame} delay={0} from={{ x: 0, y: -260, rotate: -8 }} to={{ x: -140, y: -140, rotate: -4 }} style={{ background: COLORS.paper, borderRadius: 10, padding: '30px 34px', width: 260 }}>
          <TypeOn text="MY GOALS" frame={frame} delay={4} speed={1.6} size={30} />
          <div style={{ marginTop: 10 }}>
            <TypeOn text="Maybe it isn't inconsistency." frame={frame} delay={26} speed={1.1} size={20} color={COLORS.pink} />
          </div>
        </FlyCard>
        {notes.map((n, i) => (
          <FlyCard key={i} frame={frame} delay={n.delay} from={n.from} to={{ x: n.x, y: n.y, rotate: (i % 2 ? 1 : -1) * 6 }}>
            <div style={{ width: 90, height: 90, background: [COLORS.pink, COLORS.blue, COLORS.yellow, COLORS.paperDark][i], borderRadius: 6 }} />
          </FlyCard>
        ))}
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 2 — notes drift apart, then the question lands ----------
function DriftScene() {
  const frame = useCurrentFrame()
  const notes = [
    { text: 'get healthier', x: -280, y: -260, delay: 0, hi: 0 },
    { text: 'save money', x: 260, y: -240, delay: 12, hi: 12 },
    { text: 'build the business', x: -260, y: 60, delay: 24, hi: 24 },
    { text: 'read more', x: 260, y: 80, delay: 36, hi: 36 },
  ]
  const questionDelay = 70
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        {notes.map((n, i) => {
          const drift = interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const glow = frame >= n.hi && frame < n.hi + 14
          return (
            <div key={i} style={{ position: 'absolute', left: n.x * drift, top: n.y * drift, opacity: fadeRise(frame, 30, 0, 0).opacity }}>
              <div style={{ background: COLORS.paper, borderRadius: 8, padding: '14px 18px', boxShadow: glow ? `0 0 24px ${COLORS.blue}` : '0 8px 20px rgba(0,0,0,0.4)', transform: glow ? 'scale(1.1)' : 'scale(1)' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.ink }}>{n.text}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', top: 780, left: 60, right: 60, textAlign: 'center' }}>
        <TypeOn text="BUT WHAT EXACTLY AM I DOING?" frame={frame} delay={questionDelay} speed={1.3} size={34} color={COLORS.white} style={{ textShadow: `0 0 20px ${COLORS.pink}` }} />
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 3 — three cards enter, expand, get stamped TOO VAGUE ----------
function VagueCardsScene() {
  const frame = useCurrentFrame()
  const cards = [
    { text: 'GET HEALTHIER', color: COLORS.pink, y: -280, delay: 0, stampDelay: 30 },
    { text: 'BE MORE CONSISTENT', color: COLORS.blue, y: -20, delay: 20, stampDelay: 50 },
    { text: 'BUILD THE BUSINESS', color: COLORS.yellow, y: 240, delay: 40, stampDelay: 70 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        {cards.map((c, i) => {
          const local = frame - c.delay
          const expand = spring({ frame: local, fps: 30, config: { damping: 10 }, durationInFrames: 14, from: 0.9, to: 1.08 })
          return (
            <FlyCard key={i} frame={frame} delay={c.delay} from={{ x: i % 2 ? 500 : -500, y: c.y, rotate: i % 2 ? 20 : -20 }} to={{ x: -120, y: c.y, rotate: 0 }}>
              <div style={{ transform: `scale(${local > 0 && local < 20 ? expand : 1})` }}>
                <PaperCard text={c.text} color={c.color} />
              </div>
              <Stamp text="TOO VAGUE" frame={frame} delay={c.stampDelay} x={40} y={-14} />
            </FlyCard>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 4 — cards pile, hand reaches, slide away, blank TODAY ----------
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
            <PaperCard text={['GET HEALTHIER', 'BE CONSISTENT', 'BUILD BUSINESS'][i]} color={[COLORS.pink, COLORS.blue, COLORS.yellow][i]} size={16} />
          </div>
        ))}
        <div style={{ position: 'absolute', left: 30, top: -60, width: 24, height: 24, borderRadius: 12, border: `3px solid ${COLORS.white}`, opacity: reachPulse }} />
      </div>
      <div style={{ position: 'absolute', background: COLORS.paper, borderRadius: 10, padding: '40px 50px', opacity: fadeRise(frame, 30, 70, 10).opacity, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 22, color: COLORS.dim, letterSpacing: 2 }}>TODAY</div>
        <div style={{ height: 70 }} />
        <TypeOn text="WHAT DO I DO TODAY?" frame={frame} delay={90} speed={1.2} size={26} />
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 5 — head silhouette, tangled lines, question marks, freeze ----------
function BrainTangleScene() {
  const frame = useCurrentFrame()
  const draw = interpolate(frame, [10, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const marks = [
    { x: -90, y: -50, delay: 30 },
    { x: 100, y: -90, delay: 40 },
    { x: -60, y: 100, delay: 50 },
    { x: 90, y: 90, delay: 60 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 420, height: 480 }}>
        <div style={{ position: 'absolute', left: 40, top: 20, width: 300, height: 300, borderRadius: '50%', border: `3px solid ${COLORS.dim}`, opacity: 0.6 }} />
        <svg width="420" height="480" style={{ position: 'absolute', left: 0, top: 0 }}>
          <polyline
            points="140,110 190,150 130,180 220,190 150,230 210,260 160,290"
            fill="none"
            stroke={COLORS.pink}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="600"
            strokeDashoffset={600 * (1 - draw)}
          />
        </svg>
        {marks.map((m, i) => (
          <div key={i} style={{ position: 'absolute', left: 190 + m.x, top: 150 + m.y, fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: COLORS.yellow, opacity: fadeRise(frame, 30, m.delay, 6).opacity }}>
            ?
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 400, textAlign: 'center' }}>
        <NeonText frame={frame} delay={80} color={COLORS.blue} size={30}>
          Nothing to grab onto.
        </NeonText>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 6 — target/move diagram, breaks apart, reforms clean ----------
function TargetDiagramScene() {
  const frame = useCurrentFrame()
  const breakApart = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const reform = interpolate(frame, [45, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: 1 - breakApart, display: 'flex', alignItems: 'center', gap: 20 }}>
        <NeonText frame={frame} delay={0} color={COLORS.pink} size={24}>NO CLEAR TARGET</NeonText>
        <div style={{ color: COLORS.dim, fontSize: 26, transform: `translateX(${breakApart * 60}px)` }}>&rarr;</div>
        <NeonText frame={frame} delay={10} color={COLORS.pink} size={24}>NO CLEAR NEXT MOVE</NeonText>
      </div>
      <div style={{ position: 'absolute', opacity: reform, transform: `scale(${0.9 + reform * 0.1})`, textAlign: 'center' }}>
        <NeonText frame={frame} delay={45} color={COLORS.blue} size={32}>CLEAR TARGET</NeonText>
        <div style={{ color: COLORS.dim, fontSize: 26, margin: '10px 0' }}>&darr;</div>
        <NeonText frame={frame} delay={55} color={COLORS.blue} size={32}>NEXT MOVE</NeonText>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 7 — the cycle, accelerating, abrupt stop, crossed out ----------
function CycleScene() {
  const frame = useCurrentFrame()
  const steps = ['DRIFT', 'GUILT', "WHY CAN'T I BE CONSISTENT?", 'DISCIPLINE PROBLEM', 'TRY AGAIN']
  const cyclePos = [
    { top: -240, left: '50%', tx: '-50%' },
    { top: -100, right: -180 },
    { bottom: 40, left: '50%', tx: '-50%' },
    { top: -100, left: -180 },
    { top: -240, left: '50%', tx: '-50%' },
  ]
  const stopFrame = 90
  const showCross = frame > stopFrame + 10
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 10, height: 10 }}>
        {frame < stopFrame + 15 &&
          steps.slice(0, 4).map((s, i) => {
            const delay = i * 18
            const p = cyclePos[i]
            return (
              <div key={i} style={{ position: 'absolute', top: p.top, left: p.left, right: p.right, bottom: p.bottom, transform: `translateX(${p.tx || 0})`, opacity: fadeRise(frame, 30, delay, 8).opacity }}>
                <NeonText frame={frame} delay={delay} color={i % 2 ? COLORS.yellow : COLORS.pink} size={20}>
                  {s}
                </NeonText>
              </div>
            )
          })}
        {showCross && (
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ position: 'relative' }}>
              <NeonText frame={frame} delay={stopFrame + 10} color={COLORS.white} size={34}>
                DISCIPLINE?
              </NeonText>
              <Stamp text="X" frame={frame} delay={stopFrame + 20} rotate={0} size={40} x={70} y={-24} />
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 8 — blank breath, then "THE PROBLEM WASN'T YOU." ----------
function BreathScene() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <TypeOn text="THE PROBLEM WASN'T YOU." frame={frame} delay={20} speed={1.1} size={38} color={COLORS.white} style={{ textShadow: `0 0 24px ${COLORS.pink}` }} />
    </AbsoluteFill>
  )
}

// ---------- Scene 9 — resolution: question -> goal -> 3 cards lock in -> PHASR ----------
function ResolutionScene() {
  const frame = useCurrentFrame()
  const lock = interpolate(frame, [40, 60], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 60px' }}>
      <div style={{ background: COLORS.paper, borderRadius: 10, padding: '30px 34px', marginBottom: 40, opacity: fadeRise(frame, 30, 0).opacity }}>
        <TypeOn text="WHAT AM I ACTUALLY TRYING TO MAKE HAPPEN?" frame={frame} delay={4} speed={1.3} size={22} />
      </div>
      <div style={{ display: 'flex', gap: 14, transform: `translateY(${lock}px)`, opacity: fadeRise(frame, 30, 36).opacity }}>
        {['TARGET', 'TODAY', 'NEXT ACTION'].map((t, i) => (
          <div key={t} style={{ background: [COLORS.pink, COLORS.blue, COLORS.yellow][i], borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 16, color: COLORS.ink }}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 50, textAlign: 'center', opacity: fadeRise(frame, 30, 60, 14).opacity }}>
        <NeonText frame={frame} delay={60} color={COLORS.pink} size={30}>CLARITY BEFORE CONSISTENCY</NeonText>
        <div style={{ marginTop: 18, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 44, letterSpacing: 4, color: COLORS.white, textShadow: `0 0 30px ${COLORS.yellow}` }}>PHASR</div>
      </div>
    </AbsoluteFill>
  )
}

const SCENES = [
  { Comp: HookScene, dur: 90 },
  { Comp: DriftScene, dur: 120 },
  { Comp: VagueCardsScene, dur: 120 },
  { Comp: EmptyTodayScene, dur: 120 },
  { Comp: BrainTangleScene, dur: 120 },
  { Comp: TargetDiagramScene, dur: 90 },
  { Comp: CycleScene, dur: 120 },
  { Comp: BreathScene, dur: 60 },
  { Comp: ResolutionScene, dur: 90 },
]

export default function PillarReel({
  audioFile = 'audio/pillar-01-clarity.mp3',
  musicFile = 'audio/ambient-bed-pillar.wav',
  musicVolume = 0.12,
  beatFrames = SCENES.map((s) => s.dur),
  transitionFrames = 8,
}) {
  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      <style>{FONT_FACES}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      {musicFile && <Audio src={staticFile(musicFile)} volume={musicVolume} />}
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

export function pillarReelDuration(beatFrames = SCENES.map((s) => s.dur), transitionFrames = 8) {
  const raw = beatFrames.reduce((a, b) => a + b, 0)
  return raw - transitionFrames * (beatFrames.length - 1)
}
