# Data Integrity Audit — PHASR

Read-only investigation. No fixes applied in this pass. Every claim below was verified
directly against the current working tree (not carried over from any prior report).

**Note on repo state:** `src/lib/lockIn.js`, `src/components/SageCoach.jsx`, and
`src/components/DailyCheckin.jsx` already carry uncommitted edits, and an uncommitted
`src/components/Review.jsx` already exists — apparently from earlier work this session
that predates this investigation. This audit describes the code **as it currently sits**,
not as it was before those edits. Section 4 flags where that matters for Phase 2.

---

## a) Does anything WRITE `phasr_week_progress`?

**Yes — exactly one writer.**

- `src/lib/lockIn.js:12` — `const WEEK_PROGRESS_KEY = 'phasr_week_progress'`
- `src/lib/lockIn.js:413-436` — `export function syncWeekProgress(weeklyGoals, phaseId)`.
  Groups `weeklyGoals` by week, sums `completedTasks`/`assignedTasks` per week, and writes
  via `safeWrite(WEEK_PROGRESS_KEY, store)` at **line 434**.
- `src/lib/lockIn.js:464` — `syncWeekProgress(weeklyGoals, phase.id)`, called from inside
  `ensureProgressEngine()`, which runs on every Vision Board / Daily Streaks load.

**Reader:**
- `src/components/SageCoach.jsx:294` and `:316` — both `safeRead('phasr_week_progress', {})`.

**Key scoping — verified matching, no mismatch:**
Both files wrap `localStorage` through a local `safeRead`/`safeWrite` that internally
calls `getScopedKey(base)`, which prefixes the key with the active user id
(`phasr_week_progress:<userId>`) when one is set:
- `src/lib/lockIn.js:63-66` (`getScopedKey`) and `:68-95` (`safeRead`/`safeWrite`)
- `src/components/SageCoach.jsx:47` / `:61-63` (own `getScopedKey`/`safeRead`/`safeWrite`,
  identical scheme)

So the writer and Sage's reader resolve to the **same physical key**. There is no
scoping mismatch between them.

**Correction against an earlier draft of this file:** a previous version of this document
claimed `Review.jsx` reads `phasr_week_progress` scoped and disagrees with the writer.
That claim is false — grepped `Review.jsx` directly for `WEEK_PROGRESS`, `weekProgress`,
and `week_progress`: zero matches. `Review.jsx`'s Progress tab does not read this key at
all; it computes pillar progress live from `ensureProgressEngine(boardData).weeklyGoals`
instead (`Review.jsx:203-209`). That's a different, arguably more current data path, not a
bug — but it means `phasr_week_progress` is currently written and read only by
`SageCoach.jsx`, nowhere else.

**Verdict: has a writer, and it agrees with its only reader. Not broken as the code
currently stands.**

---

## b) Can Sage actually read journal entries?

**Yes. Read site and write sites use matching field names.**

**Read site:**
- `src/components/SageCoach.jsx:291-292` —
  ```js
  const todayJournalEntry = Array.isArray(journalEntries)
    ? journalEntries.find(entry => String(entry?.date || '').slice(0, 10) === todayKey)
    : null
  ```
- `src/components/SageCoach.jsx:312` —
  ```js
  Today's journal entry: ${todayJournalEntry?.content || todayJournalEntry?.sageResponse || 'No journal entry yet today.'}
  ```

**Write sites** (`Journal.jsx` builds the saved entry object in two places):
- `src/components/Journal.jsx:1660-1683` (Weekly Pulse save) — `content: weeklyDraft.content`
  (line 1665), `sageResponse: analysis.sageResponse || ''` (line 1670).
- `src/components/Journal.jsx:1757-1774` (regular daily entry save) — `content:
  normalizedContent` (line 1762), `sageResponse: analysis.sageResponse || ''` (line 1767).

Both write sites use `content` / `sageResponse`. The read site reads `.content` and
`.sageResponse`. **They match.**

**Storage-key scoping also verified:** `SageCoach.jsx` reads journal entries via
`safeRead(getScopedKey(JOURNAL_STORAGE_KEY))` where `JOURNAL_STORAGE_KEY = 'phasr_journal_v2'`
(`SageCoach.jsx:22`, `:65-71`); `Journal.jsx` writes via the same key through its own
`getScopedKey` wrapper (`Journal.jsx:23-24`, `:184-213`). Same scoping scheme, same
resulting key. No mismatch.

**Verdict: Sage can read today's journal entry correctly as the code stands. No field or
key mismatch found.**

---

## c) How many places WRITE streak/completion data?

**Two independent, disagreeing systems. Not three — ShowUp's writer is confirmed gone.**

### System 1 — `lib/lockIn.js`'s canonical `phasr_streak` object
- `src/lib/lockIn.js:370-372` (approx.) — `saveStreakState(streak)` writes `STREAK_KEY =
  'phasr_streak'`.
- Called from three sites, all inside `lockIn.js`: inside `ensureProgressEngine()` (~line
  504), inside `getLockInSummary()` (~line 691), and inside `upsertTodayLog()` (~line 786,
  the real completion-logging path — confirmed by reading lines 770-789 directly).

One writer file, three call sites, all funneling through `saveStreakState()`.

### System 2 — `DailyCheckin.jsx`'s own day-flag keys
- `src/components/DailyCheckin.jsx:821-839` — `function toggleTask(taskId)`. Lines 830-834:
  ```js
  safeSet(`phasr_streak_${phaseScope}_w${activeWeek}_d${displayedDay}`, 'true')
  safeSet(`phasr_streak_w${activeWeek}_d${displayedDay}`, 'true')
  // or 'false' in the else branch
  ```
  Two keys per toggle (phase-scoped + legacy unscoped), using `DailyCheckin.jsx`'s own
  local `safeSet` (`DailyCheckin.jsx:69-75`) — plain `localStorage.setItem`, **not**
  scoped by active user at all, unlike System 1.
- Read back by `countDaysDone` (`DailyCheckin.jsx:348-357`) and
  `hasTrackedProgressForScope` (`:359-373`), and separately (read-only) by
  `src/lib/userLevel.js`.

**Confirmed via direct grep of `DailyCheckin.jsx` for `upsertTodayLog`, `ensureProgressEngine`,
`getLockInSummary`, and `saveStreakState`: zero matches.** Its only `lib/lockIn.js` import
is `{ buildWeeklyGoals, loadBoardData, loadLockInState }` — all read-only
(`DailyCheckin.jsx:4`). System 2 has no path into System 1. A user checking off a daily
task updates her own local day-flags; `lib/lockIn.js`'s canonical `phasr_streak.current`
never hears about it unless something else independently calls into `lockIn.js` (e.g.
opening Vision Board triggers `ensureProgressEngine`). The two numbers can diverge.

### ShowUp's "Mark Done" writer
`src/components/ShowUp.jsx` does not exist in the working tree (confirmed: file read
fails, `No such file or directory`). It's marked deleted in `git status` but not yet
committed. No trace of a third writer anywhere in `src/`.

**Verdict: 2 independent writers remain (`lib/lockIn.js` canonical + `DailyCheckin.jsx`
day-flags), not 3. `lib/lockIn.js` is untouched here per instruction — not rewritten.**

---

## Summary

| Question | Status |
|---|---|
| a) `phasr_week_progress` writer | Has a writer (`lib/lockIn.js:413-436`, called from `ensureProgressEngine`), and its only reader (`SageCoach.jsx`) resolves to the same scoped key. Not broken. |
| b) Sage journal read/write field match | Matches — `content`/`sageResponse` on both ends, same scoped storage key. Not broken. |
| c) Streak/completion writers | 2 independent systems (`lib/lockIn.js` canonical + `DailyCheckin.jsx` day-flags, the latter **unscoped by user**), not 3 — ShowUp's writer confirmed gone. This is the one real, currently-unresolved data-integrity gap. |

---

## 4. What this means for Phase 2 (read before building)

An uncommitted `src/components/Review.jsx` already exists in the tree with a 3-tab
layout (`This week` / `Progress` / `Past`) and a working `PILLAR_REVIEWS_KEY =
'phasr_pillar_reviews'` storage shape. It does **not** match this task's Tab 3 spec:

- It has 3 tabs, not 4 — there is no standalone "Review" tab. The reflection-gated wrap
  is currently reached by clicking a completed pillar row inside the **Progress** tab.
- The wrap slides play **before** the decision point, and the decision point's reflection
  fields only appear **after** choosing "Continue" — the reverse of what this task
  specifies (answer 4 questions → decide → wrap plays only on Continue).
- It captures 3 reflection fields (`whatWorked`, `whatDrained`, `whatPaidOff`) plus an
  AI-draftable `nextPhaseStrategy`, not the 4 named in this task (What worked / What
  didn't work / What drained you / Next strategy).
- Progress tab shows per-pillar bars only, sourced live from
  `ensureProgressEngine(boardData).weeklyGoals` — no per-phase bar, and no journal
  entries/weekly reflections rendered beneath each pillar.
- Past tab is hard-limited to the active phase + 1 prior, not full phase history.

Given questions (a) and (b) above check out, Tab 2 and Tab 3 in Phase 2 can be wired to
real data without any blocking bug. The one real gap from (c) — `DailyCheckin.jsx`'s
unscoped day-flag keys running independent of `lib/lockIn.js`'s canonical streak — does
not block Tab 2/3 directly (they read `weeklyGoals`/`getLockInSummary`, not the day-flag
keys), so it's noted but not a blocker for this rebuild.
