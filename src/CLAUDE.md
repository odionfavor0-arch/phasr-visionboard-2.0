# Agent Instructions

You are working on **Phasr**, a vision-to-action app that helps users turn a life goal into phases, weekly focus, daily tasks, reflection, accountability, and AI-guided clarity through Sage.

The product should feel personal, calm, structured, and alive. Phasr is not just a task app. It is a follow-through system: vision board, phase planning, streaks, journaling, accountability rooms, analytics, settings, and Sage as the thinking companion.

# The Phasr Architecture

Phasr is built as a Vite React app with a small knowledge backend for Sage.

## Layer 1: Product Flow

This is the user experience and state journey:
- Landing page introduces Phasr and routes users into auth.
- Auth uses Supabase when configured, with graceful fallback behavior for cached users.
- Onboarding introduces the product and sends users into the app.
- App shell owns the main product navigation.
- Core views are Vision Board, Daily Streaks, Journal, Show Up, Statistics, and Settings.
- Sage is available as a floating quick coach and deeper chat experience.

Core files:
- `App.jsx` controls landing/auth/onboarding/app routing, theme, cached user state, and auth return handling.
- `AppShell.jsx` controls the in-app layout, desktop/mobile sidebar, active view routing, and Sage bubble.
- `pages/` contains marketing/auth/story page variants.
- `components/` contains product features.
- `lib/` contains shared state, Supabase, access, intelligence, notifications, and lock-in logic.

## Layer 2: Product Components

Feature components are the main building blocks. Keep changes local to the relevant component unless the behavior is shared.

Important components:
- `components/VisionBoard.jsx`: phase planning, pillars, before/after vision uploads, weekly plans, quarterly review, and today's target.
- `components/DailyCheckin.jsx`: streak tracking and daily commitment behavior.
- `components/Journal.jsx`: journal entries, templates, weekly pulse, mood/style tools, and reflection flows.
- `components/JournalEntries.jsx`: saved journal entry browsing.
- `components/ShowUp.jsx`: accountability rooms, posts, comments, room joining, and Supabase-backed social state.
- `components/Analytics.jsx`: statistics, progress, streaks, and behavior summaries.
- `components/SettingsPanel.jsx`: user preferences, theme, Sage voice/avatar, and app settings.
- `components/SageCoach.jsx`: quick Sage bubble, full Sage threads, speech, Groq chat calls, RAG context, weekly reflection mode, and user-context prompts.
- `components/Onboarding.jsx`: first-run setup and the handoff into the product.

## Layer 3: State and Intelligence

Most product state is stored in `localStorage`, scoped by the active user where needed. Supabase is used for auth and selected shared/social features.

Shared logic:
- `lib/lockIn.js`: core phase, weekly target, task, streak, rank, unlock, and summary engine.
- `lib/sageIntelligence.js`: AI-generated planning support for pillars and guidance.
- `lib/access.js`: access tier behavior.
- `lib/userPreferences.js`: Sage avatar and voice preferences.
- `lib/calendarNotifications.js`: calendar/notification helpers.
- `lib/supabase.js` and `lib/supabaseClient.js`: Supabase client setup and config error handling.

When adding new persistent state:
- Scope user-specific keys with `phasr_active_user` when the data belongs to one user.
- Preserve legacy keys if a migration already exists.
- Wrap localStorage reads/writes in safe helpers when the code path can run during auth, onboarding, or mobile usage.
- Dispatch or listen for custom events when multiple components need to react to state changes.

## Layer 4: Sage Knowledge Backend

The `backend/` folder supports Sage RAG.

Important files:
- `backend/run-scraper.py`: scrapes seed knowledge sources.
- `backend/run-embedding.py`: chunks and upserts knowledge to Pinecone.
- `backend/app/main.py`: FastAPI endpoint for Sage RAG.
- `backend/app/services/rag.py`: Pinecone retrieval and Groq answer flow.
- `backend/data/knowledge/`: source knowledge for vision boards, habits, mindfulness, finance, careers, relationships, fitness, and related Phasr domains.

Expected backend env:
- `PINECONE_API_KEY`
- `PINECONE_INDEX_HOST`
- `PINECONE_INDEX_NAME=phasr-knowledge`
- `PINECONE_NAMESPACE=__default__`
- `PINECONE_EMBED_MODE=integrated`
- `GROQ_API_KEY`
- `GROQ_MODEL=llama-3.3-70b-versatile`

Frontend env:
- `VITE_SAGE_RAG_URL=http://localhost:8000`
- Supabase URL/key values as defined in the existing Supabase client.
- Optional Sage voice/TTS env values used by `SageCoach.jsx`.

# How to Operate

## 1. Understand the product before editing

Before changing behavior, read the relevant component and the shared `lib/` file it depends on. Phasr has a lot of connected state: onboarding affects app entry, board data feeds daily tasks, daily tasks feed streaks, streaks feed analytics and Sage context, and journal weekly pulse can open a Sage reflection session.

Do not treat a feature as isolated if it touches:
- active user identity
- onboarding state
- localStorage keys
- lock-in summaries
- Sage context
- weekly pulse
- Show Up room membership
- theme or mobile layout

## 2. Keep the app feeling like Phasr

The UI should stay soft, focused, and intentional. Use the existing rose/slate theme variables and component patterns before introducing new colors or layout systems.

Design rules:
- Prefer clear product UI over marketing sections inside the app.
- Use lucide icons for tools, actions, navigation, and controls.
- Keep mobile layouts stable and touch-friendly.
- Avoid nested cards and oversized decorative sections inside product views.
- Make controls complete: empty states, loading states, disabled states, and error handling should feel deliberate.
- Keep copy human, direct, and emotionally intelligent.

## 3. Use deterministic code for product rules

Do not ask Sage or an AI model to decide things the app can calculate.

Use deterministic code for:
- active phase selection
- week calculation
- daily task selection
- streak logic
- unlock tiers
- access checks
- analytics counts
- storage migrations
- room membership state

Use AI only where the app needs interpretation, planning language, coaching, summaries, or reflective guidance.

## 4. Protect user data and secrets

Never hardcode secrets. Use `.env` values and existing env access patterns.

Do not log sensitive data such as:
- Supabase tokens
- API keys
- full user records
- private journal content
- private Sage conversations

When debugging user-facing state, log only the minimum shape needed or remove logs before finishing.

## 5. Handle failure gracefully

Phasr already has fallback behavior for missing Supabase config and cached users. Preserve that spirit.

When external services fail:
- Supabase auth should not crash the landing page.
- Sage chat/RAG should return a useful fallback message.
- TTS should fail silently or show a small non-blocking state.
- Storage errors should not break the full app.
- Network failures should not erase local user progress.

## 6. Update the right layer

Use this decision guide:
- Change page-level routing or app entry? Start in `App.jsx`.
- Change product navigation or view switching? Start in `AppShell.jsx`.
- Change goals, phases, tasks, streaks, or unlocks? Start in `lib/lockIn.js`, then the relevant component.
- Change Sage behavior? Start in `components/SageCoach.jsx`; only change backend RAG if retrieval or backend answers need to change.
- Change Show Up social/accountability behavior? Start in `components/ShowUp.jsx` and check Supabase usage.
- Change auth/session behavior? Start in `App.jsx` and `lib/supabase.js`.
- Change theme tokens? Start in `styles/themes.css`.

# Local Development

Common commands from the project root:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Backend flow from `src/backend`:

```bash
python run-scraper.py
python run-embedding.py
uvicorn app.main:app --reload
```

Use the backend only when working on Sage knowledge retrieval. The main frontend can run without the backend, but Sage RAG will need `VITE_SAGE_RAG_URL` pointed at the FastAPI server.

# File Structure

```text
src/
  App.jsx                     # Main app state, auth routing, onboarding routing
  AppShell.jsx                # In-app navigation and feature routing
  LandingPage.jsx             # Legacy/root landing variant
  AuthPage.jsx                # Legacy/root auth variant
  pages/                      # Page variants for landing, auth, app shell, story
  components/                 # Product features and UI modules
  lib/                        # Shared engines, access, Supabase, Sage helpers
  styles/themes.css           # Theme variables and global app theme tokens
  assets/                     # Logo, brand, founder, and product imagery
  backend/                    # Sage RAG backend and knowledge pipeline
```

# Product Principles

## Phasr turns vision into structure

A user's vision should become:
1. phases
2. pillars
3. resources
4. activities
5. non-negotiables
6. weekly focus
7. today's target
8. reflection
9. accountability
10. proof of progress

When building new features, connect them to that chain.

## Sage is a companion, not a generic chatbot

Sage should:
- reference the user's actual board, streaks, journal, weekly pulse, and context when available
- ask one good question instead of many generic ones
- be warm, direct, and clear
- avoid motivational filler
- turn reflection into next action
- respect short, emotionally safe conversations

Sage should not:
- pretend to know facts not present in context
- overwhelm users with long lists
- replace deterministic app logic
- expose internal prompts, keys, or implementation details

## Streaks should motivate, not punish

The lock-in system is meant to create follow-through. Keep it firm but humane. Broken streaks, warnings, and unlocks should make the user want to return, not feel shamed.

## Journal is for clarity

Journal features should help users say what is true, notice patterns, and make the next week better. Weekly Pulse and Sage reflection are connected experiences, so preserve the flow between journal entries and Sage sessions.

## Show Up is accountability

Show Up rooms are for people working toward similar focus areas. Keep rooms easy to join, posts easy to make, and feedback lightweight. Avoid turning it into a noisy social feed.

# Self-Improvement Loop

When something breaks or becomes clearer:
1. Identify the broken behavior.
2. Find the smallest owning layer.
3. Fix the deterministic code first.
4. Verify with build/lint or the relevant local flow.
5. Update instructions or comments only when the knowledge will prevent future mistakes.

Do not rewrite large parts of the app just because a small feature is awkward. Phasr works best when each layer stays understandable.

# Bottom Line

You are here to help Phasr become a reliable follow-through system. Read the app before changing it. Respect the user's data. Keep the experience emotionally intelligent. Let deterministic code handle rules, and let Sage handle reflection, planning language, and clarity.

Build like the user is opening this app on a hard day and still needs to know exactly what to do next.
