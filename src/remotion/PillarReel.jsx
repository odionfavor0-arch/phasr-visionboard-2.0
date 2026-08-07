import { AbsoluteFill, Audio, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { FONT_FACES } from './fonts.js'

// PHASR pre-launch pillar content — problem-diagnosis videos that run before
// PHASR is ever pitched. Every beat gets a genuinely different visual that
// argues the idea (a diagram, a branching-paths metaphor that evolves across
// the video) instead of the same text-card template repeated four times.
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
        fontSize: 25,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color: COLORS.rose,
        opacity: 0.75 * fadeRise(frame, 30, delay).opacity,
      }}
    >
      {children}
    </div>
  )
}

// Sequential bold caption — the actual "TikTok caption" look: heavy white
// Inter with a dark stroke so it reads over any background, one consistent
// treatment used for every spoken line across every scene (not a different
// typography system per beat). Each line holds for a time proportional to
// its length, so a long sentence doesn't get crammed on screen at once, but
// the diagram/visual behind it never pauses for it.
function TimedCaption({ lines, sceneDuration, style }) {
  const frame = useCurrentFrame()
  const totalChars = lines.reduce((a, l) => a + l.length, 0)
  let acc = 0
  const spans = lines.map((line) => {
    const dur = Math.round((line.length / totalChars) * sceneDuration)
    const start = acc
    acc += dur
    return { line, start, dur }
  })
  const active = spans.find((s) => frame >= s.start && frame < s.start + s.dur) || spans[spans.length - 1]
  const local = frame - active.start
  const opacity = interpolate(local, [0, 8, active.dur - 10, active.dur], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const pop = spring({ frame: local, fps: 30, from: 0.92, to: 1, durationInFrames: 10 })
  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        bottom: 150,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        fontSize: 46,
        lineHeight: 1.28,
        color: COLORS.white,
        WebkitTextStroke: `2px ${COLORS.text}`,
        textShadow: '0 6px 18px rgba(61,16,32,0.35)',
        textAlign: 'center',
        letterSpacing: 0.2,
        opacity,
        transform: `scale(${pop})`,
        ...style,
      }}
    >
      {active.line}
    </div>
  )
}

// A goal-chip: one scattered, low-opacity pill used to build the "messy
// collection" backdrop in the opening scene.
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

// Shared branching-paths diagram. `resolve` (0→1) controls how settled it
// looks: 0 = fully scattered/overloaded, 1 = a single glowing resolved path.
// The same visual motif recurs across scenes 2, 3 and 5 so the video argues
// one continuous idea instead of introducing a new unrelated graphic each cut.
function BranchDiagram({ frame, resolve, sceneDuration }) {
  const paths = [-70, -40, -15, 15, 40, 70]
  const grow = interpolate(frame, [0, BEAT * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const settle = interpolate(frame, [sceneDuration - BEAT * 6, sceneDuration - BEAT], [0, resolve], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <div style={{ position: 'relative', width: '100%', height: 520 }}>
      <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 14, height: 14, borderRadius: 7, background: COLORS.rose, transform: 'translateX(-50%)' }} />
      {paths.map((angle, i) => {
        const isKeptPath = angle === 15 // the one path that survives when resolve -> 1
        const fade = isKeptPath ? 1 : 1 - settle
        const length = 420 * grow
        const wobble = isKeptPath ? 0 : Math.sin(frame / 40 + i) * 4 * (1 - settle)
        const finalAngle = isKeptPath ? angle * (1 - settle) : angle + wobble
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 7,
              width: 3,
              height: length,
              background: isKeptPath ? COLORS.pink : COLORS.quartz,
              opacity: Math.max(0.12, fade),
              transformOrigin: 'bottom center',
              transform: `translateX(-50%) rotate(${finalAngle}deg)`,
              borderRadius: 2,
              boxShadow: isKeptPath && settle > 0.5 ? `0 0 ${18 * settle}px ${COLORS.pink}` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

// Scene 1 — the messy collection of vague goals; the hook lands here. Same
// bold caption system as every other scene, over a drifting goal-chip field.
function MessyCollageScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const chips = [
    { text: 'save money', x: 90, y: 260, rotate: -8, phase: 0 },
    { text: 'eat better', x: 700, y: 210, rotate: 6, phase: 1 },
    { text: 'wake up early', x: 120, y: 1180, rotate: 5, phase: 2 },
    { text: 'read more', x: 760, y: 1220, rotate: -6, phase: 3 },
    { text: 'network more', x: 660, y: 640, rotate: 4, phase: 4 },
    { text: 'get organized', x: 90, y: 700, rotate: -4, phase: 5 },
    { text: '"get healthier"', x: 340, y: 420, rotate: 3, phase: 6 },
    { text: '"build the business"', x: 260, y: 940, rotate: -3, phase: 7 },
  ]
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', padding: '0 56px' }}>
      {chips.map((c, i) => (
        <GoalChip key={i} {...c} frame={frame} />
      ))}
      <div style={{ position: 'absolute', top: 140, left: 56, right: 56 }}>
        <Kicker frame={frame} delay={0}>The problem</Kicker>
      </div>
      <TimedCaption
        sceneDuration={durationInFrames}
        lines={[
          "Maybe you're not inconsistent.",
          "Maybe you're trying to work toward a goal you haven't clearly defined.",
          '"Get healthier." "Be more consistent." "Build the business."',
        ]}
      />
    </AbsoluteFill>
  )
}

// Scene 2 — decision overload: paths branch out in every direction while the
// brain-has-nothing-to-grab-onto line plays.
function DecisionOverloadScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 420 }}>
      <div style={{ position: 'absolute', top: 140, left: 64, right: 64 }}>
        <Kicker frame={frame} delay={0}>No clear target</Kicker>
      </div>
      <BranchDiagram frame={frame} resolve={0} sceneDuration={durationInFrames} />
      <TimedCaption
        sceneDuration={durationInFrames}
        lines={[
          'Those sound like goals, but none of them tell you what to actually do today.',
          'So you sit down to work on it and your brain has nothing to grab onto. No clear target means no clear next move.',
        ]}
      />
    </AbsoluteFill>
  )
}

// Scene 3 — the same branching paths now dim and lose energy (drift) while
// the guilt/discipline-mislabel line plays, resolving partway.
function NarrowingScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 420 }}>
      <div style={{ position: 'absolute', top: 140, left: 64, right: 64 }}>
        <Kicker frame={frame} delay={0}>What actually happens</Kicker>
      </div>
      <BranchDiagram frame={frame} resolve={0.55} sceneDuration={durationInFrames} />
      <TimedCaption
        sceneDuration={durationInFrames}
        lines={[
          'You drift, feel guilty, and call it a discipline problem.',
          "But here's the part nobody tells you: you can't consistently act on something you haven't clearly defined.",
        ]}
      />
    </AbsoluteFill>
  )
}

// Scene 4 — the diagram: vague chain vs. clear chain, side by side.
function FlowDiagramScene({ durationInFrames }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const rowA = ['Vague goal', 'Unclear action', 'Inconsistent progress']
  const rowB = ['Clear goal', 'Clear action', 'Consistent progress']
  const Row = ({ items, color, bg, delay }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...fadeRise(frame, fps, delay) }}>
      {items.map((t, i) => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 19,
              color,
              background: bg,
              padding: '14px 16px',
              borderRadius: 14,
              textAlign: 'center',
              width: 168,
            }}
          >
            {t}
          </div>
          {i < items.length - 1 && (
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, color, opacity: 0.6 }}>&rarr;</div>
          )}
        </div>
      ))}
    </div>
  )
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 50px' }}>
      <Kicker frame={frame} delay={0}>The actual diagram</Kicker>
      <div style={{ marginTop: 30 }}>
        <Row items={rowA} color={COLORS.muted} bg={COLORS.quartz} delay={BEAT} />
        <div style={{ height: 22 }} />
        <Row items={rowB} color={COLORS.white} bg={COLORS.rose} delay={BEAT * 5} />
      </div>
      <TimedCaption
        sceneDuration={durationInFrames}
        lines={[
          'So before you ask yourself, "Why can\'t I stay consistent?"',
          'Ask: "What exactly am I trying to make happen, and what does that look like today?"',
        ]}
        style={{ bottom: 220 }}
      />
    </AbsoluteFill>
  )
}

// Scene 5 — the click: one path resolves fully and glows. No PHASR pitch —
// pillar videos 1-8 stay product-free by design. Same bold caption system.
function FinalClickScene({ ctaKeyword, durationInFrames }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 460 }}>
      <BranchDiagram frame={frame} resolve={1} sceneDuration={durationInFrames} />
      <TimedCaption
        sceneDuration={durationInFrames}
        lines={["Sometimes you don't need more discipline.", 'You need a goal your brain knows how to move toward.']}
        style={{ bottom: 620 }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: 2,
          color: COLORS.text,
          opacity: 0.6 * fadeRise(frame, 30, BEAT * 8).opacity,
        }}
      >
        {ctaKeyword}
      </div>
    </AbsoluteFill>
  )
}

export default function PillarReel({
  audioFile = 'audio/pillar-01-clarity.mp3',
  musicFile = 'audio/ambient-bed-pillar.wav',
  musicVolume = 0.13,
  ctaKeyword = 'Clarity before consistency.',
  beatFrames = { s1: BEAT * 18, s2: BEAT * 26, s3: BEAT * 17, s4: BEAT * 17, s5: BEAT * 16 },
  transitionFrames = BEAT,
}) {
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <style>{FONT_FACES}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      {musicFile && <Audio src={staticFile(musicFile)} volume={musicVolume} />}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={beatFrames.s1}>
          <MessyCollageScene durationInFrames={beatFrames.s1} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.s2}>
          <DecisionOverloadScene durationInFrames={beatFrames.s2} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.s3}>
          <NarrowingScene durationInFrames={beatFrames.s3} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.s4}>
          <FlowDiagramScene durationInFrames={beatFrames.s4} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.s5}>
          <FinalClickScene ctaKeyword={ctaKeyword} durationInFrames={beatFrames.s5} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

export function pillarReelDuration(
  beatFrames = { s1: BEAT * 18, s2: BEAT * 26, s3: BEAT * 17, s4: BEAT * 17, s5: BEAT * 16 },
  transitionFrames = BEAT
) {
  const raw = beatFrames.s1 + beatFrames.s2 + beatFrames.s3 + beatFrames.s4 + beatFrames.s5
  return raw - transitionFrames * 4
}
