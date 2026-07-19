# Tractatus Daily — Design

*2026-07-19 · approved by Piotr in brainstorming session*

## What this is

A self-revising web app that walks a reader through Wittgenstein's *Tractatus
Logico-Philosophicus* one thesis (or one tightly-coupled group of theses) per
day. Each day carries:

- the thesis in Ogden's English translation (public domain), with the German
  original accessible behind a tap;
- an explanation written to be as simple as possible without becoming trivial;
- a connection to Zen philosophy/practice **only when genuine** — many theses
  (truth-table mechanics, logical constants) have no honest Zen counterpart,
  and on those days the app says nothing rather than something strained.
  Occasionally the most useful note is a disanalogy;
- a **method note**, tucked behind a small `°` mark: the authoring agent's
  honest self-critique — did today's thesis put pressure on how the app
  explains or presents? — and a record of any change it made in response.

The app is authored day by day by a scheduled cloud agent with **full freedom
to rewire the app** (layout, interaction, explanation format, even its own
method charter) when a thesis demands it. Git is the safety net; the journal
is the memory.

## Design principles (from the holistic reading of the Tractatus)

1. **The numbering is the interface.** The decimal hierarchy expresses the
   logical weight of each proposition; the book is a tree. Navigation shows
   today's thesis in its place: parent chain above, siblings/children context.
2. **Show, don't say** (4.121). Explain less, arrange more; structure is
   conveyed typographically, not narrated.
3. **Honor the interpretive war.** Where traditional (Russell/Anscombe,
   doctrine) and resolute (Diamond/Conant, ladder-as-therapy) readings
   genuinely diverge, a quiet second layer says so. The app does not silently
   pick a winner.
4. **Silence as design ethic** (7; Engelmann's "the point is ethical").
   One thesis on a mostly empty page, generous margins, serif type, high
   contrast, e-ink friendly. No animation required for anything essential.
   The app should be prepared to dismantle its own apparatus as the reader
   climbs toward 6.54 — enacted, if the agent so decides, via self-revision.

## Chosen shape (decisions from brainstorming)

| Decision | Choice |
|---|---|
| Self-revision mechanism | Daily scheduled **cloud agent session** that authors content and may edit the app itself |
| Reading surface | Public static website (Cloudflare Pages), any device (Boox/iPad/Mac/phone) |
| Language | English by default; German original accessible per thesis |
| Daily unit | Usually one numbered statement; agent may bundle tightly-coupled runs (e.g. 4.411–4.4661) when splitting would make single days meaningless (~8–10 months total) |
| Rewiring freedom | Full freedom; git history as safety net |
| Self-assessment visibility | Visible but tucked away (the `°` method note) |
| Scheduling | Claude Code scheduled cloud routine against the GitHub repo |
| Audience model | **Anyone** starts from day 1 on first visit and advances one unit per real day |
| Notifications | Daily Web Push via a Cloudflare Worker (cron + KV) |

## Reconstructibility (hard requirement)

The entire history of the artifact must remain inspectable and recoverable,
including — especially — if a future agent session decides to dismantle or
wipe the site.

- **Append-only journal.** `journal/day-NNN.md`, one file per authored day,
  written by the agent every run: which theses it authored, what it changed
  in the app and why, what its self-assessment concluded. Journal files are
  never edited or deleted after the day they are written.
- **Immutable files.** `journal/**` and `data/tractatus.json` may never be
  modified or deleted by the agent.
- **No history rewriting.** No force-push, no rebase of pushed commits, no
  branch deletion. Every daily run is one or more plain commits to `main`.
- **Explained destruction.** Any removal or radical restructuring must be
  argued in that day's journal entry *before* the commit that performs it.
- **Revising the past is allowed** (a later thesis may reveal an earlier
  explanation was wrong) but must be confessed in the day's method note and
  journal entry.

These guardrails live in `ROUTINE.md` (the agent's standing instructions) and
are the only constraints on its otherwise full freedom.

## Architecture

```
tractatus-daily/
  data/tractatus.json      # all ~526 statements: number, German, Ogden English — IMMUTABLE
  METHOD.md                # living explanation charter; the daily self-critique anchor
  ROUTINE.md               # standing instructions + guardrails for the daily agent
  journal/day-NNN.md       # append-only daily log (why-record)
  content/day-NNN.md       # authored unit: thesis id(s), explanation, zen note, method note
  state.json               # cursor: next unauthored statement, day counter
  site/                    # static site source (plain HTML/CSS/JS — no framework)
  build.mjs                # generator: data + content → dist/ (incl. units.json manifest)
  push-worker/             # Cloudflare Worker: subscribe endpoint + daily cron push
  docs/superpowers/specs/  # this document and successors
```

**No framework, on purpose.** The daily agent must be able to safely rewire
presentation; plain HTML/CSS/JS generated by a small readable script is the
most modifiable substrate.

### Source text

Parsed once at setup from Project Gutenberg (Ogden translation, ebook #5740)
plus the German original (public domain) into `data/tractatus.json`:
`[{ num: "2.012", de: "…", en: "…" }, …]`. Setup validates statement count
and numbering integrity. Pears–McGuinness is under copyright and is never
reproduced.

### The daily routine (cloud agent, each morning)

1. **Idempotency check**: if today's journal entry already exists, stop.
2. Read `state.json`, `METHOD.md`, recent journal entries.
3. Select today's unit: next statement, bundling a tightly-coupled run only
   when splitting it would make single days meaningless.
4. Write `content/day-NNN.md`: explanation per current method; Zen note only
   if genuine; method note.
5. **Self-assess**: does today's thesis put pressure on `METHOD.md` or on the
   site's presentation? If yes — revise `METHOD.md` and/or edit `site/`,
   within the reconstructibility guardrails.
6. Write `journal/day-NNN.md`; update `state.json`; run `build.mjs`; commit
   with a message summarizing the day; push. Pages auto-deploys.

Missed days don't pile up: the next run advances exactly one unit. It is a
practice, not a feed.

### Site behavior (per-visitor progression)

- **First visit** stamps a start date in `localStorage`; the visitor is on
  day 1 regardless of how far the global frontier is.
- Each real calendar day unlocks the next unit. A visitor's position is
  `min(days since their start, global frontier)` where the frontier is the
  number of units the agent has authored (from `units.json`).
- Free navigation backward through already-unlocked days; forward is locked
  ("tomorrow" — or, at the frontier, "not yet written").
- **Views**: *Today* (default; one thesis, near-empty page) and *Tree* (the
  whole Tractatus as Wittgenstein's outline: unlocked entries live, locked
  ones dimmed — the map of the climb).
- Per-thesis German toggle; `°` opens the method note; small about page.
- Latecomers see day-1 *content* under the *current* design; method notes
  stay attached to the day they were written, so the evolution story still
  unfolds for every walker in order.
- **PWA**: manifest + service worker (offline caching of unlocked days,
  installable on iOS/Android — required for iOS push).

### Push notifications

- Subscribe button on the site → Web Push subscription POSTed to the Worker,
  stored in KV as `{ subscription, startDate }`.
- Daily cron trigger: for each subscriber, compute their day number from
  their `startDate` (capped at the frontier via `units.json` fetched from the
  site), send a push whose payload is *their* next thesis number and first
  line. Prune dead subscriptions (410s).
- VAPID keys stored as Worker secrets. Unsubscribe = delete from KV via the
  same endpoint.

## Error handling

- Routine runs are idempotent (journal check) — a double-fired schedule
  cannot double-advance.
- `build.mjs` validates content files against `data/tractatus.json` (every
  referenced thesis exists, no gaps in day numbering) and fails the build
  loudly rather than deploying a broken site.
- Worker push failures are logged and non-fatal; a failed push never blocks
  other subscribers.

## Testing

- Parser validation at setup: statement count, numbering monotonicity, spot
  checks against the printed text.
- `build.mjs` test run over sample content before first deploy.
- Local preview of `dist/` before the first Pages deploy; e-ink check on the
  Boox by hand.
- Push path tested end-to-end with one real subscription before announcing.

## Setup requiring Piotr

One-time authorizations the agent cannot do alone:

1. GitHub repo creation/push under his account (`gh auth`).
2. Cloudflare Pages project connected to the repo; Worker + KV namespace +
   VAPID secrets (`wrangler`).
3. Creating the scheduled cloud routine (needs the repo on GitHub first).

## Out of scope (YAGNI)

- Accounts, server-side per-user state (localStorage is enough).
- Comments, social features, analytics.
- Multiple translations or languages beyond EN + DE original.
- Native apps.
