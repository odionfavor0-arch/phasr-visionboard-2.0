// Remotion CLI config (used only for `remotion studio` / `remotion render`).
// The embedded <Player> in the landing page does not use this file.
import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
// Sandboxed egress blocks remotion.media (its own Chrome download host);
// use the Playwright-provisioned headless Chromium already on this machine.
Config.setBrowserExecutable(
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'
)
// public/ holds the mockup images + transition.wav referenced via staticFile().
Config.setPublicDir('public')
