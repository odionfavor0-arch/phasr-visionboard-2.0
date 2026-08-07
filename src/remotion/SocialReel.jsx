import { AbsoluteFill, Audio, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
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
// word landing inside a pink block a beat after the rest.
function HookBeat({ lines, highlightWord }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: COLORS.cream, justifyContent: 'center', padding: '0 90px' }}>
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

// Beat — a plain-language point on a white card over cream, one idea per beat.
function PointBeat({ label, text }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: COLORS.cream, justifyContent: 'center', alignItems: 'center', padding: '0 70px' }}>
      <div
        style={{
          background: COLORS.white,
          borderRadius: 32,
          padding: '72px 56px',
          boxShadow: '0 8px 40px rgba(61,16,32,0.10)',
          width: '100%',
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
// beat grid, joined by a progress line that draws in behind them.
function IconRowBeat({ text, iconSequence }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const lineWidth = interpolate(frame - BEAT * 2, [0, BEAT * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: COLORS.cream, justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>
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
          const scale = spring({ frame: frame - delay, fps, from: 0.5, to: 1, durationInFrames: 16 })
          const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
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
// bounce) + CTA line.
function CtaBeat({ ctaText }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const breathe = 1 + Math.sin((frame / (BEAT * 2)) * Math.PI) * 0.02
  return (
    <AbsoluteFill style={{ background: COLORS.cream, justifyContent: 'center', alignItems: 'center', padding: '0 90px' }}>
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
  // All beat lengths are BEAT multiples (0.5s each) so cuts land on-grid.
  beatFrames = { hook: BEAT * 6, pain: BEAT * 10, method: BEAT * 10, cta: BEAT * 6 },
  transitionFrames = BEAT,
}) {
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <style>{GOOGLE_FONTS_IMPORT}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={beatFrames.hook}>
          <HookBeat lines={headlineLines} highlightWord={highlightWord} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.pain}>
          <PointBeat label={painLabel} text={painText} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.method}>
          <IconRowBeat text={methodText} iconSequence={iconSequence} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionFrames })} />
        <TransitionSeries.Sequence durationInFrames={beatFrames.cta}>
          <CtaBeat ctaText={ctaText} />
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
