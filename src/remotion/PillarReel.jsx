import { AbsoluteFill, Audio, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { Check, X, Calendar, Target, Lightbulb, PenLine } from 'lucide-react'
import { FONT_FACES } from './fonts.js'

// PHASR pillar video 1 — "high dopamine" rebuild: black background, neon
// pink/yellow/electric-blue, editorial-collage + sticky-note + handwritten
// annotation language, fast cuts. A deliberate departure from the soft
// cream/pink PHASR brand used elsewhere, per Favour's explicit storyboard.
export const PR_WIDTH = 1080
export const PR_HEIGHT = 1920
export const PR_FPS = 30

const BEAT = 15 // 0.5s at 30fps

const COLORS = {
  black: '#0a0a0c',
  cream: '#fff8fa',
  pink: '#ff2f8f',
  hotpink: '#ff2f8f',
  yellow: '#ffd23f',
  blue: '#3fd0ff',
  white: '#ffffff',
  dim: '#8a8a92',
}

function fadeRise(frame, fps, delay = 0, riseFrom = 16) {
  const local = frame - delay
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = spring({ frame: local, fps, from: riseFrom, to: 0, durationInFrames: 14 })
  return { opacity, transform: `translateY(${y}px)` }
}

function shake(frame, delay, amount = 4) {
  const local = frame - delay
  if (local < 0 || local > 10) return 0
  return Math.sin(local * 3) * amount * (1 - local / 10)
}

function NeonText({ children, color = COLORS.pink, size = 48, frame, delay = 0, weight = 800, family = 'Inter, sans-serif' }) {
  const { opacity, transform } = fadeRise(frame, 30, delay, 14)
  return (
    <div
      style={{
        fontFamily: family,
        fontWeight: weight,
        fontSize: size,
        color: COLORS.white,
        textShadow: `0 0 6px ${color}, 0 0 18px ${color}, 0 0 40px ${color}`,
        opacity,
        transform,
      }}
    >
      {children}
    </div>
  )
}

function StickyNote({ text, color, x, y, rotate = 0, frame, delay = 0, struck = false, strikeDelay }) {
  const { opacity, transform } = fadeRise(frame, 30, delay, 24)
  const strikeProgress = strikeDelay != null ? interpolate(frame, [strikeDelay, strikeDelay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 190,
        padding: '20px 16px',
        background: color,
        borderRadius: 6,
        boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
        transform: `rotate(${rotate}deg) ${transform}`,
        opacity,
      }}
    >
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.black, textAlign: 'center', lineHeight: 1.2 }}>{text}</div>
      {struck && (
        <div
          style={{
            position: 'absolute',
            left: '10%',
            top: '50%',
            width: `${80 * strikeProgress}%`,
            height: 4,
            background: '#e11d48',
            transform: 'translateY(-50%) rotate(-8deg)',
          }}
        />
      )}
    </div>
  )
}

function Scribble({ frame, delay = 0, x = 0, y = 0, w = 140, h = 90, color = COLORS.white, opacity = 0.5 }) {
  const draw = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <svg width={w} height={h} style={{ position: 'absolute', left: x, top: y, opacity: opacity * draw }}>
      <path
        d={`M5,${h * 0.5} C ${w * 0.2},${h * 0.1} ${w * 0.3},${h * 0.9} ${w * 0.5},${h * 0.4} S ${w * 0.8},${h * 0.1} ${w - 5},${h * 0.6}`}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Star({ x, y, size = 20, color = COLORS.yellow, frame, delay = 0 }) {
  const { opacity } = fadeRise(frame, 30, delay, 0)
  const spin = (frame - delay) * 1.5
  return (
    <div style={{ position: 'absolute', left: x, top: y, fontSize: size, color, opacity, transform: `rotate(${spin}deg)` }}>&#10022;</div>
  )
}

function Kicker({ children, color = COLORS.dim, frame, delay = 0 }) {
  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color,
        opacity: 0.9 * fadeRise(frame, 30, delay).opacity,
      }}
    >
      {children}
    </div>
  )
}

// ---------- Scene 1 — HOOK ----------
function HookScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: '0 70px' }}>
      <Scribble frame={frame} delay={0} x={60} y={200} w={220} h={140} />
      <Star x={850} y={180} frame={frame} delay={BEAT * 2} />
      <Star x={120} y={900} size={16} frame={frame} delay={BEAT * 3} />
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 48, color: COLORS.white, transform: `translateX(${shake(frame, BEAT * 3)}px)` }}>
        Maybe you're not
      </div>
      <div style={{ marginTop: 6 }}>
        <NeonText frame={frame} delay={BEAT * 2} color={COLORS.pink} size={64}>
          INCONSISTENT.
        </NeonText>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 2 — THE GOAL ----------
function GoalScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const notes = [
    { text: 'GET HEALTHIER.', color: COLORS.pink, x: 70, y: 700, rotate: -6, delay: BEAT * 1 },
    { text: 'BE MORE CONSISTENT.', color: COLORS.blue, x: 330, y: 780, rotate: 3, delay: BEAT * 3 },
    { text: 'BUILD THE BUSINESS.', color: COLORS.yellow, x: 620, y: 700, rotate: 6, delay: BEAT * 5 },
  ]
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 220, left: 64, right: 64 }}>
        <NeonText frame={frame} delay={0} color={COLORS.blue} size={40}>
          Those goals...
        </NeonText>
      </div>
      {notes.map((n, i) => (
        <div key={i}>
          <StickyNote {...n} frame={frame} />
          <div style={{ position: 'absolute', left: n.x + 70, top: n.y + 100, opacity: fadeRise(frame, 30, n.delay + BEAT * 2).opacity, fontFamily: 'Caveat, cursive', fontSize: 30, color: COLORS.white }}>
            ...what?
          </div>
        </div>
      ))}
    </AbsoluteFill>
  )
}

// ---------- Scene 3 — THE PROBLEM ----------
function ProblemScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const notes = [
    { text: 'GET HEALTHIER.', color: COLORS.pink, x: 70, y: 500, rotate: -6, delay: 0, struck: true, strikeDelay: BEAT * 3 },
    { text: 'BE MORE CONSISTENT.', color: COLORS.blue, x: 330, y: 460, rotate: 3, delay: BEAT * 0.5, struck: true, strikeDelay: BEAT * 4 },
    { text: 'BUILD THE BUSINESS.', color: COLORS.yellow, x: 620, y: 500, rotate: 6, delay: BEAT, struck: true, strikeDelay: BEAT * 5 },
  ]
  return (
    <AbsoluteFill>
      {notes.map((n, i) => (
        <StickyNote key={i} {...n} frame={frame} />
      ))}
      <div style={{ position: 'absolute', top: 900, left: 64, right: 64, textAlign: 'center' }}>
        <NeonText frame={frame} delay={BEAT * 7} color={COLORS.yellow} size={38}>
          But what's the action?
        </NeonText>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 4 — THE FREEZE ----------
function FreezeScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const notes = [
    { text: 'IDEAS', color: COLORS.pink, x: 70, y: 260, rotate: -8, delay: BEAT },
    { text: 'SO MUCH TO DO', color: COLORS.blue, x: 640, y: 300, rotate: 6, delay: BEAT * 2 },
    { text: 'WHERE DO I START?', color: COLORS.yellow, x: 620, y: 1100, rotate: -4, delay: BEAT * 3 },
  ]
  const blink = Math.floor(frame / 15) % 2 === 0
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {notes.map((n, i) => (
        <StickyNote key={i} {...n} frame={frame} />
      ))}
      <div
        style={{
          background: '#151517',
          border: `2px solid ${COLORS.dim}`,
          borderRadius: 16,
          width: 640,
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...fadeRise(frame, 30, 0, 10),
        }}
      >
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 30, color: COLORS.white, textAlign: 'center' }}>
          WHERE DO I{'\n'}EVEN START?
          {blink && <span style={{ color: COLORS.pink }}>|</span>}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 5 — THE CYCLE ----------
function CycleScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const steps = [
    { label: 'SCROLL', delay: BEAT * 1 },
    { label: 'DISTRACT', delay: BEAT * 3 },
    { label: 'FEEL GUILTY', delay: BEAT * 5 },
    { label: 'GIVE UP', delay: BEAT * 7 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 640, height: 640 }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: '#151517', border: `2px solid ${COLORS.pink}`, borderRadius: 20, padding: '30px 26px', textAlign: 'center', ...fadeRise(frame, 30, BEAT * 9, 8) }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 26, color: COLORS.pink }}>DISCIPLINE{'\n'}PROBLEM?</div>
        </div>
        {[
          { pos: { top: 0, left: '50%', transform: 'translateX(-50%)' } },
          { pos: { top: '50%', right: 0, transform: 'translateY(-50%)' } },
          { pos: { bottom: 0, left: '50%', transform: 'translateX(-50%)' } },
          { pos: { top: '50%', left: 0, transform: 'translateY(-50%)' } },
        ].map((p, i) => {
          const s = steps[i]
          const { opacity } = fadeRise(frame, 30, s.delay, 10)
          return (
            <div key={i} style={{ position: 'absolute', ...p.pos, opacity }}>
              <NeonText frame={frame} delay={s.delay} color={i % 2 ? COLORS.blue : COLORS.yellow} size={26}>
                {s.label}
              </NeonText>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 6 — THE TURN ----------
function TurnScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const pulse = 1 + Math.sin(frame / 8) * 0.03
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 500, textAlign: 'center', ...fadeRise(frame, 30, 0, 10) }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 34, color: COLORS.white }}>But here's the part</div>
        <NeonText frame={frame} delay={BEAT * 2} color={COLORS.blue} size={36}>
          nobody tells you.
        </NeonText>
      </div>
      <div style={{ marginTop: 260, transform: `scale(${pulse})` }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: 100,
            color: COLORS.white,
            textShadow: `0 0 10px ${COLORS.pink}, 0 0 30px ${COLORS.pink}, 0 0 70px ${COLORS.pink}`,
            opacity: fadeRise(frame, 30, BEAT * 6, 0).opacity,
          }}
        >
          STOP.
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 7 — THE OH MOMENT ----------
function OhMomentScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const underline = interpolate(frame, [BEAT * 6, BEAT * 9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 70px' }}>
      <Lightbulb size={64} color={COLORS.yellow} style={{ opacity: fadeRise(frame, 30, 0, 0).opacity, filter: `drop-shadow(0 0 14px ${COLORS.yellow})`, marginBottom: 30 }} />
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 40, lineHeight: 1.3, color: COLORS.white, textAlign: 'center', ...fadeRise(frame, 30, BEAT * 2, 10) }}>
        You can't consistently act on something you haven't
      </div>
      <div style={{ marginTop: 10, position: 'relative' }}>
        <NeonText frame={frame} delay={BEAT * 6} color={COLORS.pink} size={54}>
          CLEARLY DEFINED.
        </NeonText>
        <div style={{ position: 'absolute', bottom: -6, left: 0, width: `${100 * underline}%`, height: 4, background: COLORS.pink, borderRadius: 2 }} />
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 8 — THE QUESTION ----------
function QuestionScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const bounce = 1 + Math.abs(Math.sin(frame / 10)) * 0.06
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          background: '#fdf6e3',
          borderRadius: 8,
          padding: '50px 44px',
          width: 720,
          transform: 'rotate(-2deg)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          ...fadeRise(frame, 30, 0, 16),
        }}
      >
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 40, color: COLORS.black, textAlign: 'center', lineHeight: 1.3 }}>
          WHY CAN'T I STAY CONSISTENT?
        </div>
      </div>
      <div style={{ marginTop: 30, fontSize: 60, color: COLORS.pink, transform: `scale(${bounce})`, textShadow: `0 0 20px ${COLORS.pink}` }}>?</div>
    </AbsoluteFill>
  )
}

// ---------- Scene 9 — THE REAL QUESTION ----------
function RealQuestionScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const lines = ['What exactly am I trying to make happen?', 'And what does that look like today?']
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: '0 70px' }}>
      <div style={{ background: '#f4ede0', borderRadius: 14, padding: '48px 40px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', ...fadeRise(frame, 30, 0, 14) }}>
        <PenLine size={22} color={COLORS.pink} style={{ position: 'absolute', top: -16, right: -10, transform: 'rotate(-30deg)' }} />
        {lines.map((l, i) => {
          const delay = BEAT * (2 + i * 4)
          const { opacity } = fadeRise(frame, 30, delay, 10)
          return (
            <div key={l} style={{ display: 'flex', gap: 14, marginBottom: 20, opacity }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: COLORS.pink, fontSize: 22 }}>{i + 1}</div>
              <div style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: 34, color: COLORS.black, lineHeight: 1.3 }}>{l}</div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 10 — THE RELEASE ----------
function ReleaseScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const crumpleScale = interpolate(frame, [0, BEAT * 3], [1, 0.75], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{ position: 'relative', transform: `scale(${crumpleScale}) rotate(-6deg)`, ...fadeRise(frame, 30, 0, 10) }}>
          <div style={{ width: 220, padding: '30px 20px', background: '#d4d4d8', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.black }}>MORE{'\n'}DISCIPLINE</div>
          </div>
          <X size={44} color="#e11d48" strokeWidth={4} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: fadeRise(frame, 30, BEAT * 4, 0).opacity }} />
        </div>
        <div style={{ fontSize: 30, color: COLORS.dim, opacity: fadeRise(frame, 30, BEAT * 5).opacity }}>&rarr;</div>
        <div style={{ transform: 'rotate(4deg)', ...fadeRise(frame, 30, BEAT * 6, 14) }}>
          <div style={{ width: 220, padding: '30px 20px', background: COLORS.yellow, borderRadius: 10, textAlign: 'center', boxShadow: `0 0 30px ${COLORS.yellow}55` }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.black }}>MORE{'\n'}CLARITY</div>
          </div>
          <Check size={36} color="#16a34a" strokeWidth={4} style={{ position: 'absolute', top: -14, right: -14, opacity: fadeRise(frame, 30, BEAT * 8).opacity }} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 400 }}>
        <NeonText frame={frame} delay={BEAT * 2} color={COLORS.blue} size={38}>
          You don't need more discipline.
        </NeonText>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 11 — THE FINAL CLICK (the big dopamine moment) ----------
function FinalClickScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const days = [0, 1, 2, 3, 4, 5, 6]
  const litDays = [1, 3, 4, 6]
  const progress = interpolate(frame, [BEAT * 12, BEAT * 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 60px' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', ...fadeRise(frame, 30, 0, 10) }}>
          <div style={{ padding: '18px 22px', background: '#d4d4d8', borderRadius: 10 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.black }}>GET HEALTHIER.</div>
          </div>
          <X size={34} color="#e11d48" strokeWidth={4} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: fadeRise(frame, 30, BEAT * 2).opacity }} />
        </div>
      </div>
      <div style={{ fontSize: 26, color: COLORS.dim, marginBottom: 20, opacity: fadeRise(frame, 30, BEAT * 4).opacity }}>&darr;</div>
      <div style={{ background: COLORS.yellow, borderRadius: 14, padding: '22px 26px', boxShadow: `0 0 30px ${COLORS.yellow}66`, ...fadeRise(frame, 30, BEAT * 5, 16) }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, color: COLORS.black, textAlign: 'center', lineHeight: 1.3 }}>
          WALK 20 MINS AFTER DINNER, 4X THIS WEEK.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 34, opacity: fadeRise(frame, 30, BEAT * 8).opacity }}>
        {days.map((d) => (
          <div
            key={d}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: litDays.includes(d) ? COLORS.pink : '#2a2a2e',
              boxShadow: litDays.includes(d) ? `0 0 12px ${COLORS.pink}` : 'none',
            }}
          />
        ))}
      </div>
      <div style={{ width: 400, height: 10, background: '#2a2a2e', borderRadius: 5, marginTop: 26, overflow: 'hidden', opacity: fadeRise(frame, 30, BEAT * 11).opacity }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: COLORS.pink, boxShadow: `0 0 10px ${COLORS.pink}` }} />
      </div>
      <div style={{ position: 'absolute', top: 300, textAlign: 'center' }}>
        <NeonText frame={frame} delay={BEAT * 17} color={COLORS.pink} size={34}>
          Your brain knows how to move toward it.
        </NeonText>
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 12 — BRAND TAG ----------
function BrandTagScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const glow = 0.6 + Math.sin(frame / 10) * 0.15
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 900,
          fontSize: 70,
          letterSpacing: 4,
          color: COLORS.white,
          textShadow: `0 0 ${14 * glow}px ${COLORS.yellow}, 0 0 ${40 * glow}px ${COLORS.pink}`,
          ...fadeRise(frame, 30, 0, 14),
        }}
      >
        PHASR
      </div>
      <div style={{ marginTop: 30, textAlign: 'center' }}>
        {['Goals you can see.', 'Steps you can take.', 'Progress you can feel.'].map((l, i) => (
          <div key={l} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 24, color: COLORS.dim, marginBottom: 6, opacity: fadeRise(frame, 30, BEAT * (2 + i * 2)).opacity }}>
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

const SCENES = [
  { Comp: HookScene, dur: BEAT * 8 },
  { Comp: GoalScene, dur: BEAT * 10 },
  { Comp: ProblemScene, dur: BEAT * 12 },
  { Comp: FreezeScene, dur: BEAT * 12 },
  { Comp: CycleScene, dur: BEAT * 16 },
  { Comp: TurnScene, dur: BEAT * 10 },
  { Comp: OhMomentScene, dur: BEAT * 10 },
  { Comp: QuestionScene, dur: BEAT * 8 },
  { Comp: RealQuestionScene, dur: BEAT * 14 },
  { Comp: ReleaseScene, dur: BEAT * 10 },
  { Comp: FinalClickScene, dur: BEAT * 12 },
  { Comp: BrandTagScene, dur: BEAT * 8 },
]

export default function PillarReel({
  audioFile = 'audio/pillar-01-clarity.mp3',
  musicFile = 'audio/ambient-bed-pillar.wav',
  musicVolume = 0.13,
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
              <Comp durationInFrames={beatFrames[i]} />
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
