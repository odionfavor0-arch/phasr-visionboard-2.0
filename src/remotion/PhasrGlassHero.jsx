import {
  AbsoluteFill,
  Img,
  staticFile,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

/*
 * PHASR liquid-glass 3D hero (portrait 1080x1920, 120f @ 30fps).
 *
 * A tilted phone sits centered-slightly-left on a warm cream background.
 * Six frosted-glass feature cards fly in around it with a staggered spring
 * (scale 0.6->1, opacity 0->1, translateY +40->0), then drift on independent
 * Math.sin float loops. The phone slowly oscillates on its Y axis (±5°).
 *
 * Cards are softened slices of the real PHASR mockups, so they read as
 * translucent "liquid glass" app pages.
 */

export const G_FPS = 30
export const G_WIDTH = 1080
export const G_HEIGHT = 1920
export const G_DURATION = 120

// Source images + their pixel dimensions.
const M1 = { src: 'images/mockup-1.jpg', w: 1080, h: 864 }
const M3 = { src: 'images/mockup-3.jpg', w: 1280, h: 853 }

// Centered phone (slice of mockup-1), placed slightly left of center.
const PHONE = { img: M1, box: [360, 36, 702, 804], cx: 470, cy: 900, h: 900 }

// Six glass cards: slice + on-canvas center + target width + 3D tilt + float.
const CARDS = [
  { key: 'vision',   img: M1, box: [52, 188, 232, 668],    cx: 250, cy: 470,  w: 250, rx: 9,  rz: -7, delay: 0,  ph: 0.0 },
  { key: 'showroom', img: M1, box: [812, 182, 1032, 692],  cx: 835, cy: 430,  w: 260, rx: 9,  rz: 7,  delay: 10, ph: 1.1 },
  { key: 'journal',  img: M1, box: [232, 222, 400, 668],   cx: 210, cy: 980,  w: 240, rx: 4,  rz: -9, delay: 20, ph: 2.2 },
  { key: 'stats',    img: M3, box: [1095, 195, 1262, 665], cx: 880, cy: 960,  w: 250, rx: 4,  rz: 8,  delay: 30, ph: 3.3 },
  { key: 'streak',   img: M1, box: [684, 200, 814, 602],   cx: 300, cy: 1470, w: 230, rx: -7, rz: -5, delay: 40, ph: 4.4 },
  { key: 'rooms',    img: M3, box: [905, 195, 1085, 645],  cx: 800, cy: 1450, w: 250, rx: -7, rz: 6,  delay: 50, ph: 5.5 },
]

// Renders an image slice at a target display width (or height).
function Slice({ img, box, width, height }) {
  const [x0, y0, x1, y1] = box
  const bw = x1 - x0
  const bh = y1 - y0
  const scale = width ? width / bw : height / bh
  const dispW = bw * scale
  const dispH = bh * scale
  return (
    <div style={{ width: dispW, height: dispH, overflow: 'hidden', position: 'relative' }}>
      <Img
        src={staticFile(img.src)}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
        style={{
          position: 'absolute',
          left: -x0 * scale,
          top: -y0 * scale,
          width: img.w * scale,
          height: img.h * scale,
          maxWidth: 'none',
        }}
      />
    </div>
  )
}

function GlassCard({ data }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const p = spring({
    frame: frame - data.delay,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 90 },
    durationInFrames: 40,
  })
  const scale = interpolate(p, [0, 1], [0.6, 1])
  const opacity = interpolate(p, [0, 1], [0, 1], { extrapolateRight: 'clamp' })
  const enterY = interpolate(p, [0, 1], [40, 0])

  // independent drift once settled
  const floatY = Math.sin(frame / 40 + data.ph) * 12
  const floatX = Math.cos(frame / 55 + data.ph) * 6

  return (
    <div
      style={{
        position: 'absolute',
        left: data.cx,
        top: data.cy,
        opacity,
        transform:
          `translate(-50%, -50%) translate(${floatX}px, ${enterY + floatY}px) ` +
          `perspective(1000px) rotateX(${data.rx}deg) rotateZ(${data.rz}deg) scale(${scale})`,
        borderRadius: 26,
        overflow: 'hidden',
        border: '1.5px solid rgba(255,255,255,0.7)',
        boxShadow:
          '0 34px 60px rgba(120,100,88,0.22), 0 6px 16px rgba(120,100,88,0.12), inset 0 1px 2px rgba(255,255,255,0.9)',
        background: 'rgba(255,255,255,0.35)',
      }}
    >
      {/* softened app screenshot */}
      <div style={{ opacity: 0.72 }}>
        <Slice img={data.img} box={data.box} width={data.w} />
      </div>
      {/* frosted-glass sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.0) 60%, rgba(255,255,255,0.28) 100%)',
        }}
      />
      {/* top specular highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '42%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
    </div>
  )
}

function Phone() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const p = spring({ frame, fps, config: { damping: 18, mass: 1, stiffness: 70 }, durationInFrames: 45 })
  const opacity = interpolate(p, [0, 1], [0, 1], { extrapolateRight: 'clamp' })
  const rise = interpolate(p, [0, 1], [50, 0])

  // slow Y-axis oscillation (base tilt -12°, ±5°)
  const rotY = -12 + Math.sin(frame / 30) * 5

  return (
    <div
      style={{
        position: 'absolute',
        left: PHONE.cx,
        top: PHONE.cy,
        opacity,
        transform:
          `translate(-50%, -50%) translateY(${rise}px) perspective(1400px) rotateY(${rotY}deg)`,
        filter: 'drop-shadow(0 50px 70px rgba(90,70,60,0.35))',
        borderRadius: 40,
      }}
    >
      <Slice img={PHONE.img} box={PHONE.box} height={PHONE.h} />
    </div>
  )
}

export default function PhasrGlassHero() {
  return (
    <AbsoluteFill>
      {/* warm cream radial background */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 48% 42%, #F5F0EA 0%, #EFE7DC 55%, #E8E0D5 100%)',
        }}
      />
      {/* soft vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 55%, rgba(120,100,85,0.18) 100%)',
        }}
      />
      {/* warm glow behind the phone */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle 22% at 46% 46%, rgba(255,244,224,0.85) 0%, transparent 60%)',
        }}
      />

      {CARDS.map((c) => (
        <GlassCard key={c.key} data={c} />
      ))}

      <Phone />
    </AbsoluteFill>
  )
}
