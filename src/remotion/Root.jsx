import { Composition } from 'remotion'
import PhasrAssemble, {
  A_DURATION,
  A_FPS,
  A_WIDTH,
  A_HEIGHT,
} from './PhasrAssemble.jsx'
import PhasrGlassHero, {
  G_DURATION,
  G_FPS,
  G_WIDTH,
  G_HEIGHT,
} from './PhasrGlassHero.jsx'
import SocialReel, { SR_WIDTH, SR_HEIGHT, SR_FPS, socialReelDuration } from './SocialReel.jsx'

// Registered compositions for the Remotion CLI (preview + MP4/GIF render).
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="PhasrMockup"
        component={PhasrAssemble}
        durationInFrames={A_DURATION}
        fps={A_FPS}
        width={A_WIDTH}
        height={A_HEIGHT}
      />
      <Composition
        id="PhasrGlass"
        component={PhasrGlassHero}
        durationInFrames={G_DURATION}
        fps={G_FPS}
        width={G_WIDTH}
        height={G_HEIGHT}
      />
      <Composition
        id="PhasrSocialReel"
        component={SocialReel}
        durationInFrames={socialReelDuration()}
        fps={SR_FPS}
        width={SR_WIDTH}
        height={SR_HEIGHT}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: socialReelDuration(props.beatFrames),
        })}
      />
    </>
  )
}
