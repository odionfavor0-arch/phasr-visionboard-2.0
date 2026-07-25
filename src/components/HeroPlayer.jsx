import { useEffect, useRef, useState } from 'react'
import { Player } from '@remotion/player'
import { Volume2, VolumeX } from 'lucide-react'
import HeroVideo, {
  HERO_DURATION,
  HERO_FPS,
  HERO_WIDTH,
  HERO_HEIGHT,
} from '../remotion/HeroVideo'

/*
 * Embeds the PHASR hero animation as an autoplaying, looping <Player>.
 *
 * Browsers block autoplay WITH sound, so we start muted (which lets it
 * autoplay) and unmute on the first user interaction. A small speaker
 * toggle lets the user mute/unmute the faint transition chimes.
 */
export default function HeroPlayer() {
  const playerRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const unlockedRef = useRef(false)

  // Keep the Player's mute state in sync with React state.
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (muted) player.mute()
    else player.unmute()
  }, [muted])

  // Unmute on the first hover/click so the chimes play without a hard click.
  const unlockSound = () => {
    if (unlockedRef.current) return
    unlockedRef.current = true
    setMuted(false)
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', aspectRatio: `${HERO_WIDTH}/${HERO_HEIGHT}` }}
      onPointerEnter={unlockSound}
      onClick={unlockSound}
    >
      <Player
        ref={playerRef}
        component={HeroVideo}
        durationInFrames={HERO_DURATION}
        fps={HERO_FPS}
        compositionWidth={HERO_WIDTH}
        compositionHeight={HERO_HEIGHT}
        autoPlay
        loop
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        initiallyMuted
        numberOfSharedAudioTags={0}
        acknowledgeRemotionLicense
        style={{ width: '100%', height: '100%' }}
      />

      <button
        type="button"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={(e) => {
          e.stopPropagation()
          unlockedRef.current = true
          setMuted((m) => !m)
        }}
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid rgba(240,96,144,0.25)',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#c2185b',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(240,96,144,0.18)',
        }}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  )
}
