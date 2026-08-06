import { AbsoluteFill, Audio, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion'
import { Moon, CheckCircle2, ArrowRight } from 'lucide-react'

// PHASR social-content motion graphic — kinetic typography + line icons,
// built to spec instead of AI-guessed so the brand colors/fonts are exact.
export const SR_WIDTH = 1080
export const SR_HEIGHT = 1920
export const SR_FPS = 30

const COLORS = {
  cream: '#fff8fa',
  text: '#3d1020',
  pink: '#f06090',
  rose: '#c2185b',
  quartz: '#e8c9d1',
  white: '#ffffff',
}

const GOOGLE_FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');"

const ICONS = { moon: Moon, check: CheckCircle2, arrow: ArrowRight }

function Beat({ from, durationInFrames, children }) {
  return (
    <Sequence from={from} durationInFrames={durationInFrames} layout="none">
      {children}
    </Sequence>
  )
}

function fadeRise(frame, fps, delay = 0) {
  const local = frame - delay
  const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = spring({ frame: local, fps, from: 16, to: 0, durationInFrames: 18 })
  return { opacity, transform: `translateY(${y}px)` }
}

// Slide 1 — hook: headline in Fraunces, one word highlighted in a pink block.
function HookBeat({ lines, highlightWord }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: COLORS.cream, justifyContent: 'center', padding: '0 90px' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 30, fontWeight: 600, letterSpacing: 2, color: COLORS.text, opacity: 0.6, marginBottom: 28, ...fadeRise(frame, fps, 0) }}>
        THE PATTERN
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 600,
            fontSize: 92,
            lineHeight: 1.12,
            color: COLORS.text,
            ...fadeRise(frame, fps, 6 + i * 6),
          }}
        >
          {line === highlightWord ? (
            <span style={{ background: COLORS.pink, color: COLORS.cream, padding: '4px 18px', borderRadius: 16, display: 'inline-block' }}>
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
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 600, letterSpacing: 2, color: COLORS.rose, marginBottom: 22 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 56, lineHeight: 1.28, color: COLORS.text }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Beat — the method, illustrated as three simple line icons ticking in sequence.
function IconRowBeat({ text, iconSequence }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: COLORS.cream, justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 54, lineHeight: 1.3, color: COLORS.text, textAlign: 'center', marginBottom: 64, ...fadeRise(frame, fps, 0) }}>
        {text}
      </div>
      <div style={{ display: 'flex', gap: 56, alignItems: 'center' }}>
        {iconSequence.map((key, i) => {
          const Icon = ICONS[key] || CheckCircle2
          const delay = 10 + i * 10
          const scale = spring({ frame: frame - delay, fps, from: 0.4, to: 1, durationInFrames: 14 })
          const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <div key={key + i} style={{ transform: `scale(${scale})`, opacity, display: 'flex', alignItems: 'center', gap: 56 }}>
              <div style={{ width: 108, height: 108, borderRadius: 28, background: COLORS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(61,16,32,0.08)' }}>
                <Icon size={52} color={key === 'check' ? COLORS.pink : COLORS.text} strokeWidth={1.75} />
              </div>
              {i < iconSequence.length - 1 && <ArrowRight size={28} color={COLORS.quartz} strokeWidth={2} />}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// Final beat — PHASR wordmark + CTA line.
function CtaBeat({ ctaText }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <AbsoluteFill style={{ background: COLORS.cream, justifyContent: 'center', alignItems: 'center', padding: '0 90px' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 34, letterSpacing: 4, color: COLORS.text, marginBottom: 40, ...fadeRise(frame, fps, 0) }}>
        PHASR
      </div>
      <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, fontSize: 52, lineHeight: 1.3, color: COLORS.text, textAlign: 'center', ...fadeRise(frame, fps, 8) }}>
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
  methodText = 'The audit. The plan. The follow-through.',
  iconSequence = ['moon', 'check', 'arrow'],
  ctaText = 'Drop a comment if you do this too.',
  audioFile = null,
  beatFrames = { hook: 90, pain: 150, method: 150, cta: 90 },
}) {
  const hookStart = 0
  const painStart = hookStart + beatFrames.hook
  const methodStart = painStart + beatFrames.pain
  const ctaStart = methodStart + beatFrames.method

  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <style>{GOOGLE_FONTS_IMPORT}</style>
      {audioFile && <Audio src={staticFile(audioFile)} />}
      <Beat from={hookStart} durationInFrames={beatFrames.hook}>
        <HookBeat lines={headlineLines} highlightWord={highlightWord} />
      </Beat>
      <Beat from={painStart} durationInFrames={beatFrames.pain}>
        <PointBeat label={painLabel} text={painText} />
      </Beat>
      <Beat from={methodStart} durationInFrames={beatFrames.method}>
        <IconRowBeat text={methodText} iconSequence={iconSequence} />
      </Beat>
      <Beat from={ctaStart} durationInFrames={beatFrames.cta}>
        <CtaBeat ctaText={ctaText} />
      </Beat>
    </AbsoluteFill>
  )
}

export function socialReelDuration(beatFrames = { hook: 90, pain: 150, method: 150, cta: 90 }) {
  return beatFrames.hook + beatFrames.pain + beatFrames.method + beatFrames.cta
}
