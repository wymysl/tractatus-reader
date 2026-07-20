# Catch-up, sync, and a portable start — design

Date: 2026-07-20. Amends the pacing section of
`2026-07-19-tractatus-daily-design.md`: forward navigation is no longer
hard-locked at the visitor's day; it is *paced by default, open on request*.

## Problem

Three gaps in the per-visitor pacing model:

1. A visitor cannot read units that are already written but beyond their
   personal day — the frontier is invisible to them.
2. A visitor cannot choose to walk at the book's edge (receive each fresh
   unit on the day it is published).
3. The start date lives only in `localStorage`; a cleared browser or a new
   device silently restarts the journey at day 1.

## Constraints

- No accounts, no server-side identity. The push worker's KV is keyed by
  push endpoint, which is not portable across browsers.
- The pacing ethic stays the default: one unit per real day, "tomorrow" at
  the edge of *your* walk. Reading ahead is an explicit, quiet choice.
- Pure progression logic stays in `site/progress.js`, tested by `node --test`.

## Approaches considered

1. **URL-carried start date** (chosen). The start date *is* the identity.
   A `#start/YYYY-MM-DD` link stamps it into `localStorage` and resumes.
   Zero backend, works offline-first, survives anything the user can copy
   a link through (notes, bookmark, message to self).
2. Recovery code stored in the push worker's KV — adds a backend surface,
   still needs the user to save a code; strictly worse than saving a link.
3. Export/import JSON file — heavier UX for the same payload (one date).

## Design

### progress.js (pure)

- `addDaysISO(iso, n)` — calendar arithmetic via `Date.UTC`.
- `startForDay(day, todayISO)` — the start date that makes today `day`
  (inverse of `currentDay`; `startForDay(1, t) === t`).

### Reading ahead (app.js)

- `#day/N` clamps to the **frontier** (was: personal day).
- Day nav: at `day === unlocked && day < frontier`, "tomorrow" stays, and
  a quiet `read ahead ›` link appears beside it. Past that point (ahead of
  your own day) the normal `›` arrow navigates freely up to the frontier,
  which still ends in "not yet written". The day label gains `· ahead`
  when beyond the visitor's own day; the *today* nav item always returns
  to their own day.
- Tree: all authored days link; entries beyond the visitor's day get an
  `ahead` class (dimmed but live). Unwritten theses stay inert dots.

### Start here (day view)

- On any day other than the visitor's own, a quiet `start here` button
  appears under the day nav: it calls `setStart(startForDay(day, today))`,
  making the viewed day today — forward to catch up, backward to linger.
  The About-page catch-up button is the same operation pinned to the
  frontier.

### Catching up / walking in step (About page, "your walk")

- Status line: start date, own day, frontier.
- If behind the frontier: a `catch up — make today day N` button. It calls
  `setStart(startForDay(frontier, today))`. From then on the visitor's day
  tracks the frontier day by day — each fresh unit unlocks (and is pushed)
  the day it is published, which is the "synchronise" experience.
- `setStart(iso)` writes `localStorage['td.start']`, recomputes the
  unlocked day, and — if a push subscription exists — re-POSTs
  `/subscribe` with the new `startDate` (the worker upserts by endpoint),
  so the daily bell moves with the walk.

### The thread (portable continuation link)

- Route `#start/YYYY-MM-DD`: validate by regex, `setStart`, then
  `location.replace('#today')`.
- The About page renders the visitor's own thread link
  (`<origin><path>#start/<their start>`) with a copy button, and one line
  of explanation: the place lives only in this browser; keep the link to
  continue elsewhere or after a cleared browser.

### Error handling

- Malformed `#start/…` hashes fall through to the default route.
- Future-dated or nonsense dates clamp harmlessly (`currentDay` already
  floors at 1); rolled-over dates from `Date.UTC` are accepted as-is.
- Push re-upsert is fire-and-forget; failure never blocks navigation.

### Testing

- `tests/progress.test.mjs`: `addDaysISO` across month/year boundaries;
  `startForDay` round-trips with `currentDay`.
- UI paths verified against the built site in the browser (read ahead,
  catch up, thread restore in a fresh profile simulated by clearing
  `localStorage`).

## Out of scope (YAGNI)

- "Start over" / rewind controls.
- Cross-device *automatic* sync of any kind.
- Per-day read receipts; the thread carries the start date only.
