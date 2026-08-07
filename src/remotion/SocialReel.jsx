import { AbsoluteFill, Audio, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { Moon, CheckCircle2, ArrowRight } from 'lucide-react'

// PHASR social-content motion graphic — kinetic typography + line icons,
// built to spec instead of AI-guessed so the brand colors/fonts are exact.
export const SR_WIDTH = 1080
export const SR_HEIGHT = 1920
export const SR_FPS = 30

// One BEAT = half a second at 30fps (120bpm) — every cut and pulse below is a
// multiple of this so the piece lands on-grid once real music is dropped in.
const BEAT = 15

const COLORS = {
  cream: '#fff8fa',
  text: '#3d1020',
  pink: '#f06090',
  rose: '#c2185b',
  quartz: '#e8c9d1',
  white: '#ffffff',
}

const GOOGLE_FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');"

const ICONS = { moon: Moon, check: CheckCircle2, arrow: ArrowRight }

function fadeRise(frame, fps, delay = 0, riseFrom = 16) {
  const local = frame - delay
  const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = spring({ frame: local, fps, from: riseFrom, to: 0, durationInFrames: 18 })
  const scale = spring({ frame: local, fps, from: 0.97, to: 1, durationInFrames: 20 })
  return { opacity, transform: `translateY(${y}px) scale(${scale})` }
}

// Slow, continuous zoom applied to a whole beat's content for the length of
// that beat — the thing that was missing before: motion that never fully
// stops, instead of an entrance animation followed by a static hold.
function kenBurns(frame, durationInFrames, from = 1, to = 1.045) {
  return interpolate(frame, [0, durationInFrames], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

// Background layer that drifts for the *entire* video (driven by the root
// frame, not a per-beat local frame) so it reads as one continuous camera
// move running underneath every card, the way a real edit layers a moving
// backplate behind cut text instead of swapping static pages.
function DriftField({ frame }) {
  const blobs = [
    { color: COLORS.quartz, size: 520, baseX: 0.18, baseY: 0.22, speed: 0.09, radius: 60, opacity: 0.55 },
    { color: COLORS.pink, size: 380, baseX: 0.82, baseY: 0.32, speed: 0.07, radius: 50, opacity: 0.28 },
    { color: COLORS.quartz, size: 460, baseX: 0.7, baseY: 0.82, speed: 0.06, radius: 70, opacity: 0.4 },
    { color: COLORS.rose, size: 300, baseX: 0.22, baseY: 0.78, speed: 0.1, radius: 45, opacity: 0.16 },
  ]
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {blobs.map((b, i) => {
        const t = frame * b.speed * 0.02
        const x = b.baseX * SR_WIDTH + Math.sin(t + i) * b.radius
        const y = b.baseY * SR_HEIGHT + Math.cos(t * 0.8 + i) * b.radius
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - b.size / 2,
              top: y - b.size / 2,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: b.color,
              opacity: b.opacity,
              filter: 'blur(70px)',
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

// A thin accent rule that draws in left-to-right — the recurring "after
// effects" touch that ties every beat's kicker back to the same motion idea.
function AccentRule({ frame, delay = 0, width = 64, color = COLORS.rose }) {
  const w = interpolate(frame - delay, [0, BEAT], [0, width], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <div style={{ height: 3, width: w, background: color, borderRadius: 2, marginTop: 14, marginBottom: 30 }} />
}

// Kicker label: Inter, wide tracking, uppercase — the one recurring small-text
// treatment. Fraunces is reserved for the emotional line, never labels.
function Kicker({ children, frame, delay = 0, color = COLORS.text, opacity = 0.55 }) {
  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 27,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color,
        opacity: opacity * fadeRise(frame, 30, delay).opacity,
      }}
    >
      {children}
    </div>
  )
}

// Slide 1 — hook: kicker, then headline word-by-word in Fraunces, the last
// word landing inside a pink block a beat after the rest. The whole stack
// rides a slow continuous zoom so nothing is ever fully still.
function HookBeat({ lines, highlightWord, durationInFrames }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const zoom = kenBurns(frame, durationInFrames)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: '0 90px', transform: `scale(${zoom})` }}>
      <Kicker frame={frame} delay={0}>The pattern</Kicker>
      <AccentRule frame={frame} delay={BEAT * 0.6} />
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 600,
            fontSize: 90,
            lineHeight: 1.14,
            color: COLORS.text,
            ...fadeRise(frame, fps, BEAT + i * (BEAT * 0.7)),
          }}
        >
          {line === highlightWord ? (
            <span
              style={{
                background: COLORS.pink,
                color: COLORS.cream,
                padding: '4px 20px',
                borderRadius: 18,
                display: 'inline-block',
                ...fadeRise(frame, fps, BEAT * 1.6 + i * (BEAT * 0.7), 8),
              }}
            >
              {line}
            </span>
          ) : (
            line
          )}
        </div>
      ))}
    </AbsoluteFill>
  )
}

// Beat — a plain-language point on a white card, riding the same slow zoom
// plus a faint continuous drift so the card itself feels handled, not glued.
function PointBeat({ label, text, durationInFrames }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const zoom = kenBurns(frame, durationInFrames, 1, 1.03)
  const drift = Math.sin(frame / (BEAT * 3)) * 6
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 70px' }}>
      <div
        style={{
          background: COLORS.white,
          borderRadius: 32,
          padding: '72px 56px',
          boxShadow: '0 8px 40px rgba(61,16,32,0.10)',
          width: '100%',
          transform: `scale(${zoom}) translateY(${drift}px)`,
          ...fadeRise(frame, fps, 0),
        }}
      >
        <Kicker frame={frame} delay={BEAT * 0.4} color={COLORS.rose} opacity={1}>
          {label}
        </Kicker>
        <AccentRule frame={frame} delay={BEAT} color={COLORS.quartz} width={48} />
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 54,
            lineHeight: 1.3,
            color: COLORS.text,
            ...fadeRise(frame, fps, BEAT * 1.4),
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Beat — the method, illustrated as three simple line icons ticking in on the
// beat grid, joined by a progress line that draws in behind them. Icons keep
// a slow breathing pulse after they land instead of sitting frozen.
function IconRowBeat({ text, iconSequence, durationInFrames }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const zoom = kenBurns(frame, durationInFrames, 1, 1.035)
  const lineWidth = interpolate(frame - BEAT * 2, [0, BEAT * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 80px', transform: `scale(${zoom})` }}>
      <div
        style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 600,
          fontSize: 52,
          lineHeight: 1.3,
          color: COLORS.text,
          textAlign: 'center',
          marginBottom: 70,
          ...fadeRise(frame, fps, 0),
        }}
      >
        {text}
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 56, alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 54,
            right: 54,
            top: '50%',
            height: 2,
            background: COLORS.quartz,
            transform: `scaleX(${lineWidth})`,
            transformOrigin: 'left center',
            zIndex: 0,
          }}
        />
        {iconSequence.map((key, i) => {
          const Icon = ICONS[key] || CheckCircle2
          const delay = BEAT * 1.3 + i * BEAT
          const local = frame - delay
          const entrance = spring({ frame: local, fps, from: 0.5, to: 1, durationInFrames: 16 })
          const breathe = local > 16 ? 1 + Math.sin((local - 16) / (BEAT * 2)) * 0.05 : 1
          const scale = local < 16 ? entrance : breathe
          const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <div key={key + i} style={{ transform: `scale(${scale})`, opacity, zIndex: 1, display: 'flex', alignItems: 'center', gap: 56 }}>
              <div style={{ width: 108, height: 108, borderRadius: 28, background: COLORS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(61,16,32,0.08)' }}>
                <Icon size={52} color={key === 'check' ? COLORS.pink : COLORS.text} strokeWidth={1.75} />
              </div>
              {i < iconSequence.length - 1 && <div style={{ width: 28 }} />}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// Final beat — PHASR wordmark (breathing gently on the beat grid, never a
// bounce) + CTA line, riding the same slow zoom as every other beat.
function CtaBeat({ ctaText, durationInFrames }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const zoom = kenBurns(frame, durationInFrames, 1, 1.03)
  const breathe = 1 + Math.sin((frame / (BEAT * 2)) * Math.PI) * 0.02
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 90px', transform: `scale(${zoom})` }}>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 5,
          color: COLORS.text,
          marginBottom: 40,
          transform: `scale(${breathe})`,
          ...fadeRise(frame, fps, 0),
        }}
      >
        PHASR
      </div>
      <AccentRule frame={frame} delay={BEAT * 0.6} width={72} />
      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 52, lineHeight: 1.3, color: COLORS.text, textAlign: 'center', ...fadeRise(frame, fps, BEAT * 1.2) }}>
        {ctaText}
      </div>
    </AbsoluteFill>
  )
}

export default function SocialReel({
  headlineLines = ['Why I audit myself', 'every night.'],
  highlightWord = 'every night.',
  painLabel = 'THE PATTERN',
  painText = 'Not lack of discipline. No system that holds when life gets loud.',
  methodText = 'Somewhere to come back to. Not a plan to finish.',
  iconSequence = ['moon', 'check', 'arrow'],
  ctaText = 'Drop a comment if you do this too.',
  audioFile = null,
  musicFile = 'audio/ambient-bed.wav',
  musicVolume = 0.13,
  // All beat lengths are BEAT multiples (0.5s each) so cuts land on-grid.
  beatFrames = { hook: BEAT * 6, pain: BEAT * 10, method: BEAT * 10, cta: BEAT * 6 },
  transitionFrames = BEAT,
}) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <style>{GOOGLE_FONTS_IMPORT}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      {musicFile && <Audio src={staticFile(musicFile)} volume={musicVolume} />}
      <DriftField frame={frame} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={beatFrames.hook}>
          <HookBeat lines={headlineLines} highlightWord={highlightWord} durationInFrames={beatFrames.hook} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.pain}>
          <PointBeat label={painLabel} text={painText} durationInFrames={beatFrames.pain} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.method}>
          <IconRowBeat text={methodText} iconSequence={iconSequence} durationInFrames={beatFrames.method} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.cta}>
          <CtaBeat ctaText={ctaText} durationInFrames={beatFrames.cta} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}

export function socialReelDuration(
  beatFrames = { hook: BEAT * 6, pain: BEAT * 10, method: BEAT * 10, cta: BEAT * 6 },
  transitionFrames = BEAT
) {
  const raw = beatFrames.hook + beatFrames.pain + beatFrames.method + beatFrames.cta
  // TransitionSeries overlaps three transitions into the total.
  return raw - transitionFrames * 3
}
