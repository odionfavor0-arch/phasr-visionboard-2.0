import {
  AbsoluteFill,
  Sequence,
  staticFile,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

/*
 * PHASR landing hero animation.
 * 30fps · 10s (300 frames) · loops.
 *
 *  0–2s  phone fades in (scale 0.9 → 1.0)
 *  2–4s  Vision Board card flies in from left,  settles at -8deg
 *  3–5s  Daily Streaks card flies in from right, settles at  8deg
 *  4–6s  Journal card rises from below-left,     settles at -4deg
 *  5–7s  Community card rises from below-right,   settles at  4deg
 *  7–10s every card gently floats on its own timing; phone stays still
 *
 * A faint chime plays on the phone reveal and on each card entrance.
 */

const PINK = '#f06090'

// ── Glass card surface ────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 20px 60px rgba(240,96,144,0.12)',
  borderRadius: 20,
  overflow: 'hidden',
}

// Each card crops a region of one mockup screenshot via background-position.
// `image` is a /public path, `size`/`pos` pick the visible slice.
const CARDS = [
  {
    key: 'vision',
    label: 'Vision Board',
    image: 'images/mockup-spread-1.jpg',
    crop: { size: '280%', pos: '0% 30%' },
    settle: { x: 70, y: 210, rot: -8 },
    from: { x: -420, y: 240, rot: -18 },
    enter: { start: 60, end: 120 },
    float: { amp: 16, speed: 0.9, phase: 0 },
  },
  {
    key: 'streaks',
    label: 'Daily Streaks',
    image: 'images/mockup-spread-2.jpg',
    crop: { size: '260%', pos: '50% 35%' },
    settle: { x: 800, y: 180, rot: 8 },
    from: { x: 1320, y: 210, rot: 18 },
    enter: { start: 90, end: 150 },
    float: { amp: 20, speed: 1.05, phase: 1.7 },
  },
  {
    key: 'journal',
    label: 'Journal',
    image: 'images/journal-mockup.jpg',
    crop: { size: '180%', pos: '50% 20%' },
    settle: { x: 120, y: 600, rot: -4 },
    from: { x: 120, y: 1180, rot: -12 },
    enter: { start: 120, end: 180 },
    float: { amp: 14, speed: 0.8, phase: 3.1 },
  },
  {
    key: 'stats',
    label: 'Statistics',
    image: 'images/stat-mockup.jpg',
    crop: { size: '200%', pos: '50% 30%' },
    settle: { x: 770, y: 630, rot: 4 },
    from: { x: 770, y: 1200, rot: 12 },
    enter: { start: 150, end: 210 },
    float: { amp: 18, speed: 0.95, phase: 4.6 },
  },
]

const CARD_W = 280
const CARD_H = 340

function FeatureCard({ data }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { start, end } = data.enter

  // Eased 0→1 entrance progress driven by a spring (no snapping).
  const progress = spring({
    frame: frame - start,
    fps,
    durationInFrames: end - start,
    config: { damping: 200, mass: 0.9, stiffness: 90 },
  })

  // Interpolate position + rotation from off-screen to the settled spot.
  const x = interpolate(progress, [0, 1], [data.from.x, data.settle.x])
  const y0 = interpolate(progress, [0, 1], [data.from.y, data.settle.y])
  const rot = interpolate(progress, [0, 1], [data.from.rot, data.settle.rot])
  const opacity = interpolate(progress, [0, 0.25, 1], [0, 1, 1])

  // Independent floating drift, faded in only once the card has settled.
  const t = frame / fps
  const floatY = Math.sin(t * data.float.speed + data.float.phase) * data.float.amp
  const floatRot = Math.sin(t * data.float.speed * 0.7 + data.float.phase) * 1.2
  const y = y0 - floatY * progress

  return (
    <div
      style={{
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px) rotate(${rot + floatRot * progress}deg)`,
        opacity,
        ...glass,
      }}
    >
      {/* cropped screenshot */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${staticFile(data.image)})`,
          backgroundSize: data.crop.size,
          backgroundPosition: data.crop.pos,
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* soft white wash so the glass + label read clearly */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.85) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 18,
          bottom: 16,
          fontFamily: 'Manrope, system-ui, sans-serif',
          fontSize: 17,
          fontWeight: 700,
          color: '#3d1020',
          letterSpacing: '-0.01em',
        }}
      >
        <span style={{ color: PINK }}>● </span>
        {data.label}
      </div>
    </div>
  )
}

function Phone() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 0–2s reveal: scale 0.9 → 1.0, opacity 0 → 1.
  const reveal = spring({
    frame,
    fps,
    durationInFrames: 60,
    config: { damping: 200, mass: 1, stiffness: 70 },
  })
  const scale = interpolate(reveal, [0, 1], [0.9, 1])
  const opacity = interpolate(reveal, [0, 1], [0, 1])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Branded fallback shown until images/mockup-1.png exists. */}
      <div
        style={{
          position: 'absolute',
          height: '94%',
          aspectRatio: '0.49',
          borderRadius: 44,
          background: 'linear-gradient(170deg, #fff5f8 0%, #ffe3ee 100%)',
          border: '10px solid #1c0b12',
          boxShadow: '0 40px 80px rgba(61,16,32,0.18)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'Manrope, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: '0.12em',
          color: PINK,
        }}
      >
        PHASR
      </div>
      <img
        src={staticFile('images/mockup-spread-1.jpg')}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
        alt=""
        style={{
          position: 'relative',
          height: '94%',
          width: 'auto',
          filter: 'drop-shadow(0 40px 80px rgba(61,16,32,0.18))',
        }}
      />
    </div>
  )
}

export const HERO_DURATION = 300
export const HERO_FPS = 30
export const HERO_WIDTH = 1200
export const HERO_HEIGHT = 1080

export default function HeroVideo() {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* soft radial pink glow behind the phone */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(240,96,144,0.08) 0%, transparent 70%)',
        }}
      />


      <Phone />

      {CARDS.map((c) => (
        <FeatureCard key={c.key} data={c} />
      ))}
    </AbsoluteFill>
  )
}
