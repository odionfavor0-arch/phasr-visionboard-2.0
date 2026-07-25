import {
  AbsoluteFill,
  Audio,
  Sequence,
  Img,
  staticFile,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

/*
 * PHASR mockup reel — a downloadable looping video/GIF.
 *
 * Cycles through the three mockup images. Each one slides + zooms IN, holds,
 * then slides + zooms OUT as the next one comes in. Seamless loop (the last
 * image crossfades back into the first across the loop boundary).
 *
 * A faint chime plays each time the image changes.
 *
 * Drop your images in public/images/ as mockup-1.png, mockup-2.png, mockup-3.png
 * (rename the array below if you used .jpg).
 */

const IMAGES = ['images/mockup-1.png', 'images/mockup-2.png', 'images/mockup-3.png']

export const REEL_FPS = 30
export const REEL_WIDTH = 1920
export const REEL_HEIGHT = 1080
const SEGMENT = 90 // frames each image is on screen (3s)
const FADE = 24 // crossfade / slide length (0.8s)
export const REEL_DURATION = SEGMENT * IMAGES.length // 270 frames · 9s

const ease = Easing.inOut(Easing.cubic)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }

function Slide({ src, index }) {
  const frame = useCurrentFrame()

  // Cyclic local time for this image so the whole reel loops with no seam.
  const local = (((frame - index * SEGMENT) % REEL_DURATION) + REEL_DURATION) % REEL_DURATION

  const inP = interpolate(local, [0, FADE], [0, 1], { ...clamp, easing: ease })
  const outP = interpolate(local, [SEGMENT, SEGMENT + FADE], [0, 1], { ...clamp, easing: ease })
  const drift = interpolate(local, [FADE, SEGMENT], [0, 1], clamp)

  const opacity = inP * (1 - outP)
  // grows as it enters, drifts in slowly, pushes outward as it leaves
  const scale = 0.94 + 0.06 * inP + 0.03 * drift + 0.06 * outP
  // slides up from below on enter, continues up and away on exit
  const translateY = (1 - inP) * 36 + outP * -36

  if (opacity <= 0) return null

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4%',
      }}
    >
      <Img
        src={staticFile(src)}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 30px 70px rgba(61,16,32,0.16))',
        }}
      />
    </AbsoluteFill>
  )
}

export default function MockupReel() {
  return (
    <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
      {/* soft pink glow on the white background */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(240,96,144,0.10) 0%, transparent 70%)',
        }}
      />

      {/* faint chime each time the image changes */}
      {IMAGES.map((src, i) => (
        <Sequence key={`a-${src}`} from={i * SEGMENT} durationInFrames={30}>
          <Audio src={staticFile('audio/transition.wav')} volume={0.22} />
        </Sequence>
      ))}

      {IMAGES.map((src, i) => (
        <Slide key={src} src={src} index={i} />
      ))}
    </AbsoluteFill>
  )
}
