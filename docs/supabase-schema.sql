-- PHASR — Supabase schema, Phase 1 (core data sync)
-- ============================================================================
-- Source-of-truth map was built directly from the current codebase — the
-- doc `system-data-flow.md` referenced in the task does not exist in this
-- repo (searched by filename and by content; not found). Every table below
-- is traced to a specific localStorage key and read/write site, listed in
-- the comment above each CREATE TABLE.
--
-- DESIGN PRINCIPLE — sync sources of truth, not derived caches.
-- lib/lockIn.js's ensureProgressEngine() recomputes several localStorage
-- keys from OTHER localStorage keys on every load: phasr_weekly_goals,
-- phasr_today_task, phasr_week_progress, phasr_phase_weeks, and
-- phasr_engine_meta are all 100% derived from board data + completions +
-- dial state (see calculateWeeklyTargets, syncWeekProgress in lockIn.js).
-- Syncing those AS WELL as their inputs would let two devices compute and
-- store two different "current" values for the same derived number,
-- racing each other. So this schema syncs only the actual sources of
-- truth; every device keeps recomputing the derived stuff locally from
-- data that IS synced. Same reasoning applies to journal's
-- phasr_weekly_pulse_completion / phasr_weekly_pulse_w{n}_done /
-- phasr_weekly_pulse_date — all derivable from journal_entries by
-- checking weeklyPulseMeta, so none of them gets a table.
-- phasr_streak_history and phasr_stats_log are diagnostic/audit logs, not
-- state the app reads back to decide anything — left out of Phase 1;
-- can be added later if you want cross-device audit history.
--
-- NOT COVERED (flagging, not building): lib/access.js's per-user trial/
-- plan state (phasr_access_<id>) isn't in your 6 named categories. It's
-- account entitlement, not gamification, but it currently means a trial
-- started on one device won't be recognized on another even after this
-- migration. Call it out for a decision, not building it silently.
--
-- Every table: RLS enabled, 4 policies (select/insert/update/delete),
-- every policy predicate is `auth.uid() = user_id`. Test plan for RLS is
-- at the bottom of this file — run it against the live project in Step 2
-- before wiring the app to it, per the instruction not to assume.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. board_data — pillars/board data
-- Source: lib/lockIn.js loadBoardData() / BOARD_KEY = 'phasr_vb'
--         (written by VisionBoard.jsx, shape: normalizeBoardData() —
--         { boardTitle, phases: [...], activePhaseId })
-- Kept as a single JSONB blob per user, matching the exact shape lockIn.js
-- and VisionBoard.jsx already read/write in memory — no rewrite of the
-- phases/pillars normalization logic needed.
-- ----------------------------------------------------------------------------
create table public.board_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.board_data enable row level security;

create policy "board_data_select_own" on public.board_data
  for select using (auth.uid() = user_id);
create policy "board_data_insert_own" on public.board_data
  for insert with check (auth.uid() = user_id);
create policy "board_data_update_own" on public.board_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "board_data_delete_own" on public.board_data
  for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 2. lock_in_completions — daily completion logs (lockIn), per-activity ticks
-- Source: lib/lockIn.js getCompletionRecords()/saveCompletionRecords() /
--         COMPLETIONS_KEY = 'phasr_completions' — array of
--         { id, date, task, pillar, activityId, phaseId, weeklyGoalId }.
-- One row per completion event (not one JSONB blob) — this is a genuine
-- growing log queried by date/activity, a natural relational table.
-- ----------------------------------------------------------------------------
create table public.lock_in_completions (
  -- text, not a generated uuid: the app already assigns its own id to each
  -- completion (`${goal.id}-${completionDate}-${rand}`, see lockIn.js
  -- addCompletionForGoal). Reusing that id as the primary key makes the
  -- client push idempotent (upsert by id) without a round trip to fetch a
  -- server-generated id back.
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  phase_id       text,
  activity_id    text,
  weekly_goal_id text,
  date           date not null,
  task           text,
  pillar         text,
  created_at     timestamptz not null default now()
);

create index lock_in_completions_user_date_idx on public.lock_in_completions (user_id, date);
create index lock_in_completions_user_activity_idx on public.lock_in_completions (user_id, phase_id, activity_id);

alter table public.lock_in_completions enable row level security;

create policy "lock_in_completions_select_own" on public.lock_in_completions
  for select using (auth.uid() = user_id);
create policy "lock_in_completions_insert_own" on public.lock_in_completions
  for insert with check (auth.uid() = user_id);
create policy "lock_in_completions_update_own" on public.lock_in_completions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lock_in_completions_delete_own" on public.lock_in_completions
  for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 3. daily_logs — the actual streak-driving log (one row per calendar day)
-- Source: lib/lockIn.js loadLockInState()/saveLockInState() /
--         LOCK_IN_KEY = 'phasr_lock_in' → state.logs: [{date, task, note, status}]
-- This is what upsertTodayLog() and logYesterdayIfEmpty() read/write —
-- the canonical per-day "did she show up" record the streak math scans.
-- PK is (user_id, date): mirrors the invariant lockIn.js already assumes
-- (one log per calendar date per user; upsertTodayLog upserts on date).
-- ----------------------------------------------------------------------------
create table public.daily_logs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  task       text,
  note       text,
  status     text not null default 'done',
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.daily_logs enable row level security;

create policy "daily_logs_select_own" on public.daily_logs
  for select using (auth.uid() = user_id);
create policy "daily_logs_insert_own" on public.daily_logs
  for insert with check (auth.uid() = user_id);
create policy "daily_logs_update_own" on public.daily_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs_delete_own" on public.daily_logs
  for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 4. streak_state — unlock/progress state (canonical streak snapshot)
-- Source: lib/lockIn.js loadStreakState()/saveStreakState() /
--         STREAK_KEY = 'phasr_streak' →
--         { current, best, lastCompleted, risk, warning,
--           weeklyConsistency, bestWeeklyConsistency }
-- Note on "unlock state": UNLOCK_TIERS/getCompletedTierCount/getRankLabel
-- are pure functions of streak.current — there is no separate stored
-- "unlocked tiers" key in the current app, so no separate table for it;
-- it's derived client-side from this row, same as today.
-- ----------------------------------------------------------------------------
create table public.streak_state (
  user_id                   uuid primary key references auth.users(id) on delete cascade,
  current                   int not null default 0,
  best                      int not null default 0,
  last_completed            date,
  risk                      boolean not null default false,
  warning                   text default '',
  weekly_consistency        int not null default 0,
  best_weekly_consistency   int not null default 0,
  updated_at                timestamptz not null default now()
);

alter table public.streak_state enable row level security;

create policy "streak_state_select_own" on public.streak_state
  for select using (auth.uid() = user_id);
create policy "streak_state_insert_own" on public.streak_state
  for insert with check (auth.uid() = user_id);
create policy "streak_state_update_own" on public.streak_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "streak_state_delete_own" on public.streak_state
  for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 5. lock_in_config — the rest of phasr_lock_in that's real state, not cache
-- Source: lib/lockIn.js loadLockInState()/saveLockInState() /
--         LOCK_IN_KEY = 'phasr_lock_in' →
--         { pointsBank, commitmentMode, penalties, lastPenaltyAnchor, customTarget }
-- (state.logs itself is daily_logs above — split out because it's a list,
-- everything else here is a small per-user settings/counter blob.)
-- ----------------------------------------------------------------------------
create table public.lock_in_config (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  points_bank         int not null default 0,
  commitment_mode     boolean not null default false,
  penalties           jsonb not null default '[]'::jsonb,
  last_penalty_anchor date,
  custom_target       text default '',
  updated_at          timestamptz not null default now()
);

alter table public.lock_in_config enable row level security;

create policy "lock_in_config_select_own" on public.lock_in_config
  for select using (auth.uid() = user_id);
create policy "lock_in_config_insert_own" on public.lock_in_config
  for insert with check (auth.uid() = user_id);
create policy "lock_in_config_update_own" on public.lock_in_config
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lock_in_config_delete_own" on public.lock_in_config
  for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 6. dial_state — adaptive difficulty dial
-- Source: lib/lockIn.js getDialState()/saveDialState() /
--         DIAL_STATE_KEY = 'phasr_dial_state' →
--         { [phaseId]: { step, effectiveFromWeek } }
-- One row per (user, phase) rather than one JSONB blob keyed by phaseId —
-- natural relational shape, and calculateWeeklyTargets/resolveDailyTaskCount
-- only ever need one phase's dial state at a time.
-- ----------------------------------------------------------------------------
create table public.dial_state (
  user_id             uuid not null references auth.users(id) on delete cascade,
  phase_id            text not null,
  step                int not null default 0,
  effective_from_week int not null default 1,
  updated_at          timestamptz not null default now(),
  primary key (user_id, phase_id)
);

alter table public.dial_state enable row level security;

create policy "dial_state_select_own" on public.dial_state
  for select using (auth.uid() = user_id);
create policy "dial_state_insert_own" on public.dial_state
  for insert with check (auth.uid() = user_id);
create policy "dial_state_update_own" on public.dial_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dial_state_delete_own" on public.dial_state
  for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 7. journal_entries — journal entries + weekly reflections
-- Source: components/Journal.jsx safeWrite() / STORAGE_KEY = 'phasr_journal_v2'
--         (also read by SageCoach.jsx, userLevel.js, Review.jsx) — array of
--         entries with a rich, variable shape: id, createdAt, date, title,
--         content, prompt, mood, clarityScore, clarityLabel, sageResponse,
--         backgroundId, fontId, color, images, templateFields,
--         templateAnswers, weeklyPulseMeta (null or an object with
--         phaseName/pillars/weekNumber/completedDays/totalDays/
--         difficultyChoice/dialOutcome/dialReason/dialStep/whatWorked/whatSlipped).
-- date/created_at/is_weekly_pulse promoted to real columns for querying
-- (Review.jsx filters by phase date range; SageCoach.jsx looks up today's
-- entry; userLevel.js counts pulses vs regular entries) — everything else
-- stays in `data` jsonb as-is, so Journal.jsx's entry object doesn't need
-- reshaping.
-- ----------------------------------------------------------------------------
create table public.journal_entries (
  -- text, not a generated uuid: Journal.jsx already assigns its own entry id
  -- (Date.now(), or the id being edited) — reused as the primary key for the
  -- same idempotent-upsert reason as lock_in_completions.id above.
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             date not null,
  is_weekly_pulse  boolean not null default false,
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index journal_entries_user_date_idx on public.journal_entries (user_id, date);
create index journal_entries_user_pulse_idx on public.journal_entries (user_id, is_weekly_pulse);

alter table public.journal_entries enable row level security;

create policy "journal_entries_select_own" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "journal_entries_insert_own" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "journal_entries_update_own" on public.journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_entries_delete_own" on public.journal_entries
  for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 8. pillar_reviews — pillar review answers (+ wrap synthesis folded in)
-- Source: components/Review.jsx safeWrite() /
--         PILLAR_REVIEWS_KEY = 'phasr_pillar_reviews' →
--         { phaseId, phaseName, pillarId, pillarName, whatWorked,
--           whatDidntWork, whatDrained, nextStrategy, decision,
--           createdAt, updatedAt }
--         PILLAR_WRAPS_KEY = 'phasr_pillar_wraps' →
--         { pillarId, pillarName, phaseId, synthesis, generatedAt }
-- Wraps are keyed by the exact same (phaseId, pillarId) pair as reviews
-- and are just the AI-drafted synthesis for that same pillar — folded in
-- as two extra columns instead of a second table.
-- ----------------------------------------------------------------------------
create table public.pillar_reviews (
  user_id                 uuid not null references auth.users(id) on delete cascade,
  phase_id                text not null,
  pillar_id               text not null,
  phase_name              text,
  pillar_name             text,
  what_worked             text default '',
  what_didnt_work         text default '',
  what_drained            text default '',
  next_strategy           text default '',
  decision                text,
  synthesis               text,
  synthesis_generated_at  timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  primary key (user_id, phase_id, pillar_id)
);

alter table public.pillar_reviews enable row level security;

create policy "pillar_reviews_select_own" on public.pillar_reviews
  for select using (auth.uid() = user_id);
create policy "pillar_reviews_insert_own" on public.pillar_reviews
  for insert with check (auth.uid() = user_id);
create policy "pillar_reviews_update_own" on public.pillar_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pillar_reviews_delete_own" on public.pillar_reviews
  for delete using (auth.uid() = user_id);


-- ============================================================================
-- RLS TEST PLAN — run this in Step 2 against the live project before
-- wiring the app to it. Do not assume the policies above are correct just
-- because they're present; ShowUp shipped broken on exactly this assumption.
--
-- 1. Create two throwaway test users (A and B) via Supabase Auth.
-- 2. As user A (using A's JWT / supabase client signed in as A):
--      insert into board_data (user_id, data) values (auth.uid(), '{"boardTitle":"A"}');
--      -- should succeed
-- 3. Still as A, try to read B's row directly by id:
--      select * from board_data where user_id = '<B's uuid>';
--      -- must return ZERO rows (not an error — RLS silently filters, which
--      -- is exactly the failure mode that bit ShowUp: a query that looks
--      -- like it worked but came back empty because of RLS, not because
--      -- there was no data. Confirm this is EXPECTED here, not a bug.)
-- 4. Still as A, try to insert a row claiming to be B:
--      insert into board_data (user_id, data) values ('<B's uuid>', '{}');
--      -- must be REJECTED by the insert policy's `with check`.
-- 5. Repeat 2-4 for every table above.
-- 6. As B, confirm B reads B's own row from step 2 with the same query
--    shape as step 3 — same query, different auth context, non-empty this
--    time. This is the check that actually distinguishes "RLS is scoping
--    correctly" from "RLS is blocking everything" (which would also make
--    step 3 pass for the wrong reason).
-- ============================================================================
