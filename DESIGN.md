---
name: Phasr
description: A vision-to-action system — beautiful, structured, and built for women who finish things.
colors:
  petal: "#f06090"
  petal-light: "#f78fb0"
  petal-blush: "#fcc0d4"
  obsidian: "#1a0a10"
  obsidian-mid: "#240d16"
  obsidian-lift: "#2e101c"
  surface: "#fff8fa"
  surface-warm: "#fff0f4"
  text-on-dark: "#fff0f4"
  text-muted-dark: "#b08090"
  text-on-light: "#3d1020"
  text-muted-light: "#8a5060"
  border-rose: "#f5c0cc"
  slate-accent: "#4a6cf7"
typography:
  headline:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.18px"
  label:
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "12px"
  md: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.petal}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.petal-light}"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.petal}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  card-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-on-light}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  card-dark:
    backgroundColor: "{colors.obsidian-mid}"
    textColor: "{colors.text-on-dark}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
---

# Design System: Phasr

## 1. Overview

**Creative North Star: "The Beautiful Operating System"**

Phasr is not a productivity tool with a pretty skin. It is a complete system for following through on a life vision — and it should look and feel like one. The UI runs on two registers simultaneously: a dark Obsidian shell (the structure, the backbone, the app) wrapping lighter surface views where the actual work happens. The contrast is intentional. The shell holds you. The surfaces breathe.

Everything is confident and warm. Buttons know what they are. Cards don't apologize for taking up space. The rose accent (Petal) is used with authority, not decoration — it marks the things that matter, not the things that merely exist. The system should feel like a woman who has figured herself out designed it for women who are in the process of doing the same.

This system explicitly rejects the corporate productivity aesthetic (cold, utilitarian, team-facing), the hustle-culture fitness app (aggressive gamification, leaderboard anxiety), and the ambient wellness app (soft, passive, nothing gets done). Phasr is aesthetic but with teeth.

**Key Characteristics:**
- Dual-surface: deep Obsidian shell + warm light product views
- Rose (Petal) accent used sparingly and with authority
- Rounded corners (12–16px) that feel considered, not fluffy
- Ambient glow and soft shadow as depth vocabulary — never decorative chrome
- System font only — legibility over typographic showmanship
- Motion: responsive and purposeful; transitions ≤ 0.3s; always reduced-motion safe

## 2. Colors: The Petal + Obsidian Palette

Two palettes in one system: the dark shell and the light product view. Both share the same Petal accent. The accent is the thread.

### Primary
- **Petal** (`#f06090`): The primary brand accent. Used on primary CTAs, active states, streak highlights, and Sage's visual identity. Its rarity on light surfaces is the point — when Petal appears, it means something.
- **Petal Light** (`#f78fb0`): Hover states, gradient endpoints, coach header. Secondary energy — not a dilution, a softer variation.
- **Petal Blush** (`#fcc0d4`): Streak glow, background tints, empty-state accents. The quietest form of the accent; used for warmth, not action.

### Neutral (Dark Shell)
- **Obsidian** (`#1a0a10`): The deepest app background. The foundation. Navigation, app shell, full-screen dark surfaces.
- **Obsidian Mid** (`#240d16`): Second background layer. Cards and panels inside the dark shell.
- **Obsidian Lift** (`#2e101c`): Third layer. Hover surfaces, focused panels. Used to show lift without shadows.
- **Text on Dark** (`#fff0f4`): Near-white with a warm pink undertone. Never pure white — Obsidian needs warmth.
- **Text Muted Dark** (`#b08090`): Secondary text, timestamps, labels on dark. Mauve-grey, not cold grey.

### Neutral (Light Product Views)
- **Surface** (`#fff8fa`): Light app background. The breathing room. Where daily tasks, journals, and check-ins live.
- **Surface Warm** (`#fff0f4`): Slightly richer surface — cards, coach panels, elevated content.
- **Text on Light** (`#3d1020`): Deep wine for legible body text on light. 4.5:1+ against Surface.
- **Text Muted Light** (`#8a5060`): Secondary text on light surfaces. Warm mauve — passes 4.5:1 against Surface.
- **Border Rose** (`#f5c0cc`): Borders and dividers on light surfaces. Soft but visible.

### Tertiary (Slate Theme)
- **Slate Accent** (`#4a6cf7`): Alternative theme. Periwinkle blue — same structural role as Petal for users who prefer a cooler palette.

### Named Rules
**The Petal Authority Rule.** Petal (`#f06090`) appears on no more than one primary interactive element per screen. When everything glows rose, nothing does.

**The Thread Rule.** The Petal accent crosses both dark and light surfaces unchanged. It is the one constant. Never substitute a lighter or darker rose on light surfaces — the same `#f06090` works on both registers because its contrast is ≥ 3:1 against Obsidian and reads as intentional on Surface.

## 3. Typography

**Body & Headline Font:** system-ui, 'Segoe UI', Roboto, sans-serif

**Character:** System fonts are chosen deliberately here — not a compromise. Phasr is a personal operating system, not a brand showcase. The interface should feel native to the device: immediate, familiar, unobtrusive. Type serves legibility and structure, not aesthetic display. If a display font is introduced later, it must be warmer than geometric and never used inside the product views (only marketing/landing).

### Hierarchy
- **Headline** (weight 500, `clamp(1.5rem, 3vw, 2rem)`, line-height 1.2, tracking −0.01em): View titles, modal headers, section names. Present, not shouting.
- **Body** (weight 400, 18px / 145%, tracking 0.18px): All prose, journal entries, Sage messages, card content. Max line length 65ch on desktop. `text-rendering: optimizeLegibility` active.
- **Label** (weight 500, 13px, tracking 0.02em): Navigation items, form labels, stat headings, timestamps. No uppercase forced — sentence case only.

### Named Rules
**The No-Display Rule.** No decorative display font inside product views. Headlines are structural, not expressive. Expressiveness lives in color, spacing, and Sage's copy voice.

## 4. Elevation

Phasr uses a hybrid elevation vocabulary: ambient rose glow on dark surfaces, soft drop shadows on light surfaces. Neither is decorative chrome — each serves a clear structural purpose.

### Shadow Vocabulary
- **Glow (dark)** (`0 0 40px rgba(240, 96, 144, 0.3)`): Applied to coach bubbles, active state highlights, Sage UI. Signals live, warm, interactive.
- **App Glow (light)** (`0 4px 24px rgba(240, 96, 144, 0.15)`): Hover and focus glow on light surfaces. Subtle — a warmth, not a spotlight.
- **Soft Shadow** (`0 4px 24px rgba(0, 0, 0, 0.06)`): Cards, panels, light surface containers. Ambient; never structural.
- **Lift Shadow** (`0 8px 32px rgba(0, 0, 0, 0.12)`): Modals, drawers, elevated overlays. Higher placement, not heavier weight.
- **Tonal Lift (dark)** (`obsidian-lift` bg shift to `#2e101c`): On dark surfaces, hover states use a background color step instead of a shadow. Shadow on shadow disappears — color steps don't.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flat. Shadows appear only as a response to state: hover, focus, or modal elevation. No decorative lifted card shadows on idle content.

## 5. Components

### Buttons
Confident and warm. The primary button means business; the ghost button defers.

- **Shape:** Gently rounded (12px radius) — considered, not pill-shaped
- **Primary:** Petal (`#f06090`) fill, white text, 12px × 24px padding. Bold enough to hold the page.
- **Hover / Focus:** Petal Light (`#f78fb0`) fill; `box-shadow: 0 4px 24px rgba(240, 96, 144, 0.4)`; transition 0.3s `cubic-bezier(0.4, 0, 0.2, 1)`. Focus: 2px offset outline in Petal.
- **Ghost:** Transparent fill, 1px Petal border, Petal text. Used for secondary actions where the primary is already clear.
- **Disabled:** 40% opacity, cursor not-allowed. No separate color override.

### Cards / Containers
- **Corner Style:** 16px radius — slightly larger than buttons; the room, not the door
- **Light Surface Cards:** Surface (`#fff8fa`) background, Border Rose (`#f5c0cc`) border or Soft Shadow; 20px padding
- **Dark Shell Panels:** Obsidian Mid (`#240d16`) background; no border; 20px padding; Tonal Lift on hover
- **Shadow Strategy:** Soft Shadow at rest; App Glow on hover (light); color step on hover (dark)
- **Rule:** No nested cards. A card inside a card is always a table or a list that hasn't admitted what it is.

### Inputs / Fields
- **Style:** Surface background, Border Rose border (1px), 12px radius, 18px body text
- **Focus:** Border shifts to Petal; `box-shadow: 0 0 0 3px rgba(240, 96, 144, 0.2)`. No outline — the shadow IS the focus ring.
- **Error:** Border shifts to a red-rose tone; helper text in `#c0304a`
- **Disabled:** 50% opacity; pointer-events none

### Navigation (App Shell)
- **Style:** Dark Obsidian sidebar or bottom bar on mobile; Petal accent on active item; weight 500 labels; 16px padding per nav item
- **Active state:** Petal fill or Petal left-border (2px) + Surface Warm background; never both simultaneously
- **Mobile:** Bottom tab bar with icon + label; 48px minimum touch target

### Sage Bubble (Signature Component)
Sage is Phasr's thinking companion. Her visual presence is the most expressive part of the UI — coach gradient (Petal to a deeper rose), soft glow, always warm.

- **Coach Header:** `linear-gradient(135deg, #f78fb0, #f06090)`, white text, 16px rounded top
- **Bubble:** `linear-gradient(135deg, #f78fb0, #d04070)`, white text. Rose-to-deep-rose — alive, not static.
- **User message:** Petal gradient, right-aligned
- **Background:** `linear-gradient(160deg, #fff8fa, #fff)` — the one place in the app that breathes widest

## 6. Do's and Don'ts

### Do:
- **Do** use Petal (`#f06090`) on exactly one primary CTA per screen — its rarity is its authority
- **Do** verify `≥ 4.5:1` contrast for all body text; `≥ 3:1` for large text (≥18px bold or ≥24px regular)
- **Do** use Obsidian tonal steps (mid → lift) for hover states in dark surfaces instead of box shadows
- **Do** wrap every animation and transition in `@media (prefers-reduced-motion: reduce)` — Phasr is used on hard days when sensory sensitivity matters
- **Do** use `text-wrap: balance` on all h1–h3 for even line breaks
- **Do** keep body copy ≤ 65ch line length on desktop views
- **Do** match Sage's copy voice: warm, direct, no motivational filler — the UI copy should sound the same way
- **Do** use the rose border-glow (`0 0 0 3px rgba(240, 96, 144, 0.2)`) as the primary focus treatment on light surfaces

### Don't:
- **Don't** use Notion's neutral grey-on-white utilitarian aesthetic — Phasr is personal and warm, not a work tool
- **Don't** add leaderboards, aggressive streak counters, or comparative metrics — that's Nike Run; Phasr motivates without punishing
- **Don't** make the interface soft, ambient, or passive — no gradient-fades-to-nothing, no "breathe in" prompts, no Calm-inspired spacing that makes action feel optional
- **Don't** use generic self-help visual language: no gold serif on cream, no "Live Your Best Life" motivational poster aesthetics
- **Don't** add `border-left` greater than 1px as a colored stripe accent — rewrite with a background tint or full border
- **Don't** use gradient text (`background-clip: text`) — Phasr's type is solid and confident
- **Don't** use glassmorphism decoratively — blur and glass effects are reserved for Sage's modal context only, and only purposefully
- **Don't** nest cards — a card inside a card is a list or a table that hasn't admitted what it is
- **Don't** force uppercase on labels — sentence case only; uppercase tracked eyebrows are the most visible AI design tell
- **Don't** use pure white (`#ffffff`) as a background in product views — always Surface (`#fff8fa`) or Surface Warm (`#fff0f4`) to preserve warmth
