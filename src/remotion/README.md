# PHASR Hero — Remotion composition

A looping, animated hero for the landing page. Embedded live via `@remotion/player`
(see `src/components/HeroPlayer.jsx`, used in `src/pages/LandingPage.jsx`) and
renderable to MP4 via the Remotion CLI.

## Required images (drop these in `public/images/`)

The composition references three mockups by exact filename:

| File | Used for |
| --- | --- |
| `public/images/mockup-1.png` | Centered phone (the main mockup) |
| `public/images/mockup-2.png` | Cropped into the Vision Board + My Statistics cards |
| `public/images/mockup-3.png` | Cropped into the Daily Streaks + Journal cards |

Until `mockup-1.png` exists, the phone shows a branded "PHASR" fallback frame so
nothing looks broken. The glass cards crop their image via `background-position`
in `HeroVideo.jsx` (`CARDS[].crop`) — tweak `size`/`pos` there to frame the slice
you want once the real screenshots are in place.

## Timeline (30fps · 10s · loops)

- 0–2s phone fades/scales in
- 2–4s Vision Board card flies in from the left (-8°)
- 3–5s Daily Streaks card flies in from the right (8°)
- 4–6s Journal card rises from below-left (-4°)
- 5–7s Statistics card rises from below-right (4°)
- 7–10s every card floats independently; phone holds still

A faint chime (`public/audio/transition.wav`, regenerate with `npm run hero:sound`)
plays on the phone reveal and on each card entrance. In the embedded player the
sound starts muted (browser autoplay policy) and unmutes on first hover/click;
the rendered MP4 always contains the audio track.

## Commands

```bash
npm run hero:studio   # open Remotion Studio to preview/scrub
npm run hero:render   # render to out/phasr-hero.mp4 (video + audio)
npm run hero:sound    # regenerate the transition chime WAV
```
