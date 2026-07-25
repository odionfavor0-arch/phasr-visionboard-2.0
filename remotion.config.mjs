// Remotion CLI config (used only for `remotion studio` / `remotion render`).
// The embedded <Player> in the landing page does not use this file.
import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
// public/ holds the mockup images + transition.wav referenced via staticFile().
Config.setPublicDir('public')
