import {
  AbsoluteFill,
  Audio,
  Sequence,
  Img,
  staticFile,
  interpolate,
  Easing,
  useCurrentFrame,
} from 'remotion'

/*
 * PHASR mockup assembly — downloadable looping video/GIF.
 *
 * The pink phone sits centered. The four feature panels (Vision Board,
 * Journaling, Daily Streak, Showroom) fly IN from the sides, settle into
 * their fanned positions around the phone, drift gently, then fly back OUT
 * — a seamless loop. A faint chime plays as each panel arrives.
 *
 * Every panel is an exact rectangular slice of public/images/mockup-1.jpg,
 * so when settled they reconstruct the original marketing mockup precisely.
 */

const SRC = 'images/mockup-1.jpg'
const SRC_W = 1080
const SRC_H = 864

export const A_FPS = 30
export const A_WIDTH = SRC_W
export const A_HEIGHT = SRC_H
export const A_DURATION = 300 // 10s

// Center phone slice (stays put).
const PHONE = [360, 36, 702, 804]

// Each panel: its slice box + which side it flies from + timing + float.
const PANELS = [
  {
    key: 'vision',
    box: [52, 188, 232, 668],
    off: [-470, 30],
    in: [10, 58],
    out: [234, 286],
    float: { ax: 6, ay: 14, rot: 1.2, spd: 0.9, ph: 0.0 },
  },
  {
    key: 'journal',
    box: [232, 222, 400, 668],
    off: [-640, 10],
    in: [24, 72],
    out: [226, 280],
    float: { ax: 5, ay: 11, rot: -1.0, spd: 1.05, ph: 1.7 },
  },
  {
    key: 'streak',
    box: [684, 200, 814, 602],
    off: [480, 30],
    in: [16, 64],
    out: [238, 288],
    float: { ax: 6, ay: 13, rot: -1.3, spd: 0.85, ph: 3.0 },
  },
  {
    key: 'showroom',
    box: [812, 182, 1032, 692],
    off: [650, 10],
    in: [30, 78],
    out: [222, 276],
    float: { ax: 7, ay: 12, rot: 1.1, spd: 0.95, ph: 4.4 },
  },
]

const easeOut = Easing.out(Easing.cubic)
const easeIn = Easing.in(Easing.cubic)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }

// A slice of the source image, clipped to its box.
function Slice({ box }) {
  const [x0, y0, x1, y1] = box
  const w = x1 - x0
  const h = y1 - y0
  return (
    <div style={{ width: w, height: h, overflow: 'hidden', position: 'relative' }}>
      <Img
        src={staticFile(SRC)}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
        style={{
          position: 'absolute',
          left: -x0,
          top: -y0,
          width: SRC_W,
          height: SRC_H,
          maxWidth: 'none',
        }}
      />
    </div>
  )
}

function Panel({ data }) {
  const frame = useCurrentFrame()
  const { box, off, float } = data
  const [x0, y0] = box

  // 0 = off-screen, 1 = home. Eased in, eased out, seamless at loop ends.
  const inP = interpolate(frame, data.in, [0, 1], { ...clamp, easing: easeOut })
  const outP = interpolate(frame, data.out, [0, 1], { ...clamp, easing: easeIn })
  const p = inP * (1 - outP)
  if (p <= 0) return null

  // Drift around the home position while settled.
  const t = frame / A_FPS
  const fx = Math.cos(t * float.spd + float.ph) * float.ax * p
  const fy = Math.sin(t * float.spd + float.ph) * float.ay * p
  const fr = Math.sin(t * float.spd * 0.7 + float.ph) * float.rot * p

  const tx = x0 + off[0] * (1 - p) + fx
  const ty = y0 + off[1] * (1 - p) + fy

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(${tx}px, ${ty}px) rotate(${fr}deg)`,
        opacity: Math.min(1, p * 1.6),
        filter: 'drop-shadow(0 18px 40px rgba(240,96,144,0.18))',
      }}
    >
      <Slice box={box} />
    </div>
  )
}

export default function PhasrAssemble() {
  const [px, py] = PHONE
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      {/* soft pink glow behind everything */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 50% 52%, rgba(240,96,144,0.12) 0%, transparent 68%)',
        }}
      />

      {/* faint chime as each panel arrives (at the midpoint of its entrance) */}
      {PANELS.map((pn) => (
        <Sequence
          key={`a-${pn.key}`}
          from={Math.round((pn.in[0] + pn.in[1]) / 2)}
          durationInFrames={30}
        >
          <Audio src={staticFile('audio/transition.wav')} volume={0.22} />
        </Sequence>
      ))}

      {/* panels fly in behind/around the phone */}
      {PANELS.map((pn) => (
        <Panel key={pn.key} data={pn} />
      ))}

      {/* static centered phone, drawn on top */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${px}px, ${py}px)`,
          filter: 'drop-shadow(0 30px 60px rgba(61,16,32,0.22))',
        }}
      >
        <Slice box={PHONE} />
      </div>
    </AbsoluteFill>
  )
}
