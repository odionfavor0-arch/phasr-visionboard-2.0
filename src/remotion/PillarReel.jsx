import { AbsoluteFill, Audio, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { CheckCircle2, PenLine, Target, Calendar, BarChart3, BookOpen } from 'lucide-react'
import { FONT_FACES } from './fonts.js'

// PHASR pre-launch pillar content, video 1 — built from Favour's 9-scene
// storyboard (timing table + narration + captions), not the card template.
// Every scene is a genuinely different visual; captions are short highlighted
// phrases positioned away from the bottom UI-safe area, never full sentences.
export const PR_WIDTH = 1080
export const PR_HEIGHT = 1920
export const PR_FPS = 30

const BEAT = 15 // 0.5s at 30fps

const COLORS = {
  cream: '#fff8fa',
  text: '#3d1020',
  pink: '#f06090',
  rose: '#c2185b',
  quartz: '#e8c9d1',
  white: '#ffffff',
  muted: '#c9a8b3',
}

function fadeRise(frame, fps, delay = 0, riseFrom = 16) {
  const local = frame - delay
  const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = spring({ frame: local, fps, from: riseFrom, to: 0, durationInFrames: 18 })
  return { opacity, transform: `translateY(${y}px)` }
}

function Kicker({ children, frame, delay = 0 }) {
  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color: COLORS.rose,
        opacity: 0.65 * fadeRise(frame, 30, delay).opacity,
      }}
    >
      {children}
    </div>
  )
}

// The one caption system used across every scene: a short, all-caps, bold
// phrase with a highlighted word/phrase, sitting in the upper third — clear
// of TikTok's own bottom UI — never the full voiceover sentence.
function BoldCaption({ text, highlight, frame, delay = 0 }) {
  const { opacity, transform } = fadeRise(frame, 30, delay, 20)
  const parts = highlight ? text.split(highlight) : [text]
  return (
    <div
      style={{
        position: 'absolute',
        top: 300,
        left: 64,
        right: 64,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        fontSize: 50,
        lineHeight: 1.25,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: COLORS.text,
        opacity,
        transform,
      }}
    >
      {highlight ? (
        <>
          {parts[0]}
          <span style={{ color: COLORS.rose }}>{highlight}</span>
          {parts[1]}
        </>
      ) : (
        text
      )}
    </div>
  )
}

function GoalChip({ text, x, y, rotate, frame, phase }) {
  const drift = Math.sin(frame / 90 + phase) * 8
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + drift,
        transform: `rotate(${rotate}deg)`,
        background: COLORS.white,
        color: COLORS.muted,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: 22,
        padding: '10px 18px',
        borderRadius: 20,
        boxShadow: '0 4px 16px rgba(61,16,32,0.06)',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  )
}

// ---------- Scene 1 — HOOK: fan of scattered lines from one point ----------
function FanBurstScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const paths = [-70, -50, -30, -10, 10, 30, 50, 70]
  const grow = interpolate(frame, [0, BEAT * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 620 }}>
      <div
        style={{
          position: 'absolute',
          bottom: 480,
          width: 720,
          height: 360,
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          background: `radial-gradient(circle at 50% 100%, ${COLORS.quartz} 0%, transparent 72%)`,
          opacity: 0.7,
        }}
      />
      <div style={{ position: 'relative', width: '100%', height: 460 }}>
        <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 16, height: 16, borderRadius: 8, background: COLORS.rose, transform: 'translateX(-50%)' }} />
        {paths.map((angle, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 8,
              width: 3,
              height: 400 * grow,
              background: COLORS.pink,
              opacity: 0.55,
              transformOrigin: 'bottom center',
              transform: `translateX(-50%) rotate(${angle}deg)`,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <BoldCaption
        frame={frame}
        delay={BEAT * 2}
        text="You can't consistently act on something you haven't CLEARLY DEFINED."
        highlight="CLEARLY DEFINED"
      />
    </AbsoluteFill>
  )
}

// ---------- Scene 2 — THE PROBLEM: floating vague-goal chips ----------
function GoalCloudScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const chips = [
    { text: 'save money', x: 90, y: 700, rotate: -8, phase: 0 },
    { text: 'eat better', x: 700, y: 640, rotate: 6, phase: 1 },
    { text: 'wake up early', x: 120, y: 1220, rotate: 5, phase: 2 },
    { text: 'read more', x: 760, y: 1260, rotate: -6, phase: 3 },
    { text: 'network more', x: 660, y: 940, rotate: 4, phase: 4 },
    { text: 'get organized', x: 90, y: 980, rotate: -4, phase: 5 },
    { text: '"get healthier"', x: 330, y: 800, rotate: 3, phase: 6 },
    { text: '"build the business."', x: 250, y: 1100, rotate: -3, phase: 7 },
  ]
  return (
    <AbsoluteFill>
      {chips.map((c, i) => (
        <GoalChip key={i} {...c} frame={frame} />
      ))}
      <div style={{ position: 'absolute', top: 200, left: 64, right: 64 }}>
        <Kicker frame={frame} delay={0}>The problem</Kicker>
      </div>
      <BoldCaption frame={frame} delay={BEAT * 2} text="VAGUE GOALS = VAGUE ACTION" highlight="VAGUE ACTION" />
    </AbsoluteFill>
  )
}

// ---------- Scene 3 — WHY IT STALLS: head silhouette with a tangled line ----------
function HeadTangleScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const draw = interpolate(frame, [BEAT * 2, BEAT * 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const marks = [
    { x: -90, y: -40, delay: BEAT * 3 },
    { x: 100, y: -80, delay: BEAT * 4 },
    { x: -60, y: 90, delay: BEAT * 5 },
    { x: 90, y: 80, delay: BEAT * 6 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 420, height: 480 }}>
        {/* simple head-in-profile: circle skull + jaw wedge */}
        <div style={{ position: 'absolute', left: 40, top: 20, width: 300, height: 300, borderRadius: '50%', background: COLORS.quartz, opacity: 0.55 }} />
        <div
          style={{
            position: 'absolute',
            left: 210,
            top: 220,
            width: 160,
            height: 160,
            background: COLORS.quartz,
            opacity: 0.55,
            borderRadius: '0 0 60px 30px',
            clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 70%)',
          }}
        />
        <svg width="420" height="480" style={{ position: 'absolute', left: 0, top: 0 }}>
          <polyline
            points="140,110 190,150 130,180 220,190 150,230 210,260 160,290"
            fill="none"
            stroke={COLORS.rose}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="600"
            strokeDashoffset={600 * (1 - draw)}
          />
        </svg>
        {marks.map((m, i) => {
          const { opacity } = fadeRise(frame, 30, m.delay, 8)
          const fadeOut = interpolate(frame, [m.delay + 20, m.delay + 30], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 190 + m.x,
                top: 150 + m.y,
                fontFamily: 'Fraunces, serif',
                fontSize: 40,
                fontWeight: 700,
                color: COLORS.pink,
                opacity: opacity * fadeOut,
              }}
            >
              ?
            </div>
          )
        })}
      </div>
      <BoldCaption
        frame={frame}
        delay={BEAT * 7}
        text="NO CLEAR TARGET = NO CLEAR NEXT MOVE"
        highlight="NO CLEAR NEXT MOVE"
      />
    </AbsoluteFill>
  )
}

// ---------- Scene 4 — THE CYCLE: drift -> guilt -> discipline problem -> repeat ----------
function CycleScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const nodes = [
    { label: 'DRIFT', angle: -90, delay: BEAT * 1 },
    { label: 'GUILT', angle: 0, delay: BEAT * 3 },
    { label: 'DISCIPLINE\nPROBLEM', angle: 90, delay: BEAT * 5 },
    { label: 'REPEAT', angle: 180, delay: BEAT * 7 },
  ]
  const radius = 260
  // arrow accelerates around the loop, then stops abruptly near the end
  const stopFrame = durationInFrames - BEAT * 3
  const rawProgress = interpolate(frame, [BEAT * 2, stopFrame], [0, 1.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const eased = Math.min(rawProgress, frame < stopFrame ? rawProgress : rawProgress)
  const arrowAngle = -90 + eased * 360
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 200, left: 64, right: 64 }}>
        <Kicker frame={frame} delay={0}>The cycle</Kicker>
      </div>
      <div style={{ position: 'relative', width: radius * 2 + 160, height: radius * 2 + 160 }}>
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 80,
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            border: `2px dashed ${COLORS.quartz}`,
          }}
        />
        {frame < stopFrame + BEAT * 2 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 22,
              height: 22,
              borderRadius: 11,
              background: COLORS.rose,
              boxShadow: `0 0 16px ${COLORS.pink}`,
              transform: `translate(-50%, -50%) rotate(${arrowAngle}deg) translate(${radius}px) rotate(${-arrowAngle}deg)`,
            }}
          />
        )}
        {nodes.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180
          const x = radius + radius * Math.cos(rad)
          const y = radius + radius * Math.sin(rad)
          const { opacity, transform } = fadeRise(frame, 30, n.delay, 10)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x + 80,
                top: y + 80,
                transform: `translate(-50%, -50%) ${transform}`,
                opacity,
                background: COLORS.white,
                borderRadius: 20,
                padding: '14px 20px',
                boxShadow: '0 6px 20px rgba(61,16,32,0.08)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                color: COLORS.text,
                textAlign: 'center',
                whiteSpace: 'pre-line',
              }}
            >
              {n.label}
            </div>
          )
        })}
      </div>
      <BoldCaption frame={frame} delay={BEAT * 9} text="IT WAS NEVER A DISCIPLINE PROBLEM." highlight="NEVER" />
    </AbsoluteFill>
  )
}

// ---------- Scene 5 — THE REAL TRUTH: unclear goal -> clear direction ----------
function ClaritySplitScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const { opacity: arrowOpacity } = fadeRise(frame, 30, BEAT * 4, 6)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 40px' }}>
        <div
          style={{
            width: 380,
            height: 480,
            borderRadius: 32,
            background: `linear-gradient(160deg, ${COLORS.quartz} 0%, #f3e3e8 60%, ${COLORS.cream} 100%)`,
            filter: 'blur(0.3px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 30,
            ...fadeRise(frame, 30, 0, 12),
          }}
        >
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.muted, letterSpacing: 1 }}>UNCLEAR GOAL</div>
        </div>
        <div style={{ fontSize: 34, color: COLORS.rose, opacity: arrowOpacity }}>&rarr;</div>
        <div
          style={{
            width: 380,
            height: 480,
            borderRadius: 32,
            background: `linear-gradient(160deg, #ffe3ee 0%, ${COLORS.pink} 60%, ${COLORS.rose} 100%)`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 30,
            boxShadow: `0 10px 40px rgba(240,96,144,0.35)`,
            ...fadeRise(frame, 30, BEAT * 5, 12),
          }}
        >
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: COLORS.white, letterSpacing: 1 }}>CLEAR DIRECTION</div>
        </div>
      </div>
      <BoldCaption frame={frame} delay={BEAT * 8} text="CLARITY CREATES DIRECTION." highlight="CLARITY" />
    </AbsoluteFill>
  )
}

// ---------- Scene 6 — THE SHIFT: the better question ----------
function QuestionScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const pulse = 1 + Math.sin(frame / 14) * 0.04
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 130, color: COLORS.pink, transform: `scale(${pulse})`, ...fadeRise(frame, 30, 0, 10) }}>?</div>
      <div
        style={{
          marginTop: 30,
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 42,
          lineHeight: 1.35,
          color: COLORS.rose,
          textAlign: 'center',
          ...fadeRise(frame, 30, BEAT * 4, 14),
        }}
      >
        "What exactly am I trying to make happen, and what does that look like today?"
      </div>
      <div style={{ position: 'absolute', top: 300 }}>
        <BoldCaption frame={frame} delay={BEAT * 9} text="ASK BETTER QUESTIONS." highlight="BETTER QUESTIONS" />
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 7 — THE ANSWER: today's next step checklist ----------
function ChecklistScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const items = ['Define the target', 'Break it down', 'Take the first action']
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 70px' }}>
      <div
        style={{
          background: COLORS.white,
          borderRadius: 28,
          padding: '48px 40px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(61,16,32,0.10)',
          position: 'relative',
          ...fadeRise(frame, 30, 0, 14),
        }}
      >
        <PenLine size={26} color={COLORS.rose} style={{ position: 'absolute', top: 40, right: 40, opacity: 0.5 }} />
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: 1, color: COLORS.rose, marginBottom: 26 }}>
          TODAY'S NEXT STEP
        </div>
        {items.map((it, i) => {
          const delay = BEAT * (2 + i * 2)
          const { opacity, transform } = fadeRise(frame, 30, delay, 10)
          return (
            <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, opacity, transform }}>
              <CheckCircle2 size={28} color={COLORS.pink} strokeWidth={2} />
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 26, color: COLORS.text }}>{it}</div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', top: 300 }}>
        <BoldCaption frame={frame} delay={BEAT * 9} text="CLARITY BEFORE CONSISTENCY." highlight="CLARITY" />
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 8 — RELEASE: rising light, arm-raised silhouette ----------
function ReleaseScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const rise = interpolate(frame, [0, durationInFrames], [40, -10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const particles = [0, 1, 2, 3, 4, 5]
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: `radial-gradient(circle at 50% 85%, #ffe3ee 0%, ${COLORS.quartz} 45%, ${COLORS.cream} 85%)`,
        paddingBottom: 260,
      }}
    >
      {particles.map((p) => {
        const t = (frame + p * 40) % 240
        const y = interpolate(t, [0, 240], [900, -100])
        const x = 200 + p * 130 + Math.sin(frame / 50 + p) * 30
        const op = interpolate(t, [0, 40, 200, 240], [0, 0.5, 0.5, 0])
        return <div key={p} style={{ position: 'absolute', left: x, top: y, width: 8, height: 8, borderRadius: 4, background: COLORS.pink, opacity: op }} />
      })}
      <div style={{ position: 'relative', transform: `translateY(${rise}px)`, ...fadeRise(frame, 30, BEAT * 2, 16) }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: COLORS.rose, margin: '0 auto' }} />
        <div style={{ width: 90, height: 200, borderRadius: '40px 40px 0 0', background: COLORS.rose, marginTop: -4 }} />
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: -10,
            width: 12,
            height: 140,
            borderRadius: 6,
            background: COLORS.rose,
            transform: 'rotate(-55deg)',
            transformOrigin: 'bottom center',
          }}
        />
      </div>
      <div style={{ position: 'absolute', top: 300 }}>
        <BoldCaption frame={frame} delay={BEAT * 5} text="CLARITY CHANGES EVERYTHING." highlight="EVERYTHING" />
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 9 — CTA / BRIDGE: steps rising into the PHASR wordmark ----------
function BridgeScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const steps = [
    { icon: Target, h: 90 },
    { icon: Calendar, h: 150 },
    { icon: BarChart3, h: 210 },
    { icon: BookOpen, h: 270 },
  ]
  const wordmarkDelay = BEAT * 6
  const { opacity: wordOpacity } = fadeRise(frame, 30, wordmarkDelay, 10)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 30, letterSpacing: 1, color: COLORS.text, textAlign: 'center', ...fadeRise(frame, 30, 0, 14) }}>
        FROM CLARITY TO ACTION.
      </div>
      <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: COLORS.rose, marginTop: 10, ...fadeRise(frame, 30, BEAT * 2, 10) }}>
        That's what we build.
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: 60 }}>
        {steps.map((s, i) => {
          const delay = BEAT * (3 + i)
          const growH = interpolate(frame, [delay, delay + 12], [0, s.h], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const Icon = s.icon
          const { opacity } = fadeRise(frame, 30, delay, 6)
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Icon size={26} color={COLORS.rose} style={{ opacity }} />
              <div style={{ width: 60, height: growH, background: COLORS.quartz, borderRadius: 10 }} />
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 50, textAlign: 'center', opacity: wordOpacity }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 42, letterSpacing: 4, color: COLORS.text }}>PHASR</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16, letterSpacing: 2, color: COLORS.muted, marginTop: 10 }}>
          TURN VISION INTO REAL PROGRESS
        </div>
      </div>
    </AbsoluteFill>
  )
}

const SCENES = [
  { Comp: FanBurstScene, key: 'hook' },
  { Comp: GoalCloudScene, key: 'problem' },
  { Comp: HeadTangleScene, key: 'stalls' },
  { Comp: CycleScene, key: 'cycle' },
  { Comp: ClaritySplitScene, key: 'truth' },
  { Comp: QuestionScene, key: 'shift' },
  { Comp: ChecklistScene, key: 'answer' },
  { Comp: ReleaseScene, key: 'release' },
  { Comp: BridgeScene, key: 'bridge' },
]

export default function PillarReel({
  audioFile = 'audio/pillar-01-clarity.mp3',
  musicFile = 'audio/ambient-bed-pillar.wav',
  musicVolume = 0.13,
  // Matches Favour's timing table: 4,6,6,6,6,6,6,6,4 seconds (BEAT=15=0.5s).
  beatFrames = [BEAT * 8, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 8],
  transitionFrames = BEAT,
}) {
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <style>{FONT_FACES}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      {musicFile && <Audio src={staticFile(musicFile)} volume={musicVolume} />}
      <TransitionSeries>
        {SCENES.map(({ Comp, key }, i) => (
          <>
            <TransitionSeries.Sequence key={key} durationInFrames={beatFrames[i]}>
              <Comp durationInFrames={beatFrames[i]} />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 && (
              <TransitionSeries.Transition
                key={key + '-t'}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: transitionFrames })}
              />
            )}
          </>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  )
}

export function pillarReelDuration(
  beatFrames = [BEAT * 8, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 12, BEAT * 8],
  transitionFrames = BEAT
) {
  const raw = beatFrames.reduce((a, b) => a + b, 0)
  return raw - transitionFrames * (beatFrames.length - 1)
}
