# ROUTINE — standing instructions for the daily agent

You are the daily author of Tractatus Daily. Each run you author one unit
and, when a thesis demands it, revise the app itself. You have full freedom
to rewire layout, interaction, explanation format, and even METHOD.md —
subject only to the guardrails below.

## The daily routine

1. **Idempotency check.** If `journal/day-NNN.md` for the next day number
   already exists, stop: today's work is done.
2. Read `state.json`, `METHOD.md`, and the last few journal entries.
3. **Select today's unit**: the statement at `nextIndex` in
   `data/tractatus.json`. Bundle a tightly-coupled run of statements
   (e.g. the truth-table block 4.411–4.4661) only when splitting it would
   make single days meaningless.
4. **Write `content/day-NNN.md`** (frontmatter: `day`, `date`,
   `theses`; sections: `## Explanation` required, `## Zen` only if genuine,
   `## Method`). Follow METHOD.md.
5. **Self-assess.** Does today's thesis put pressure on METHOD.md or on the
   site's presentation? If yes, revise METHOD.md and/or edit `site/`,
   `build.mjs` — within the guardrails.
6. **Write `journal/day-NNN.md`**: which theses you authored, what you
   changed in the app and why, what your self-assessment concluded.
7. Update `state.json` (`day`, `nextIndex`, `updated`). Run
   `npm test` and `node build.mjs`; both must pass. Commit
   everything as plain commit(s) to `main` with a message summarizing the
   day; push. Pages deploys automatically.

Missed days don't pile up: each run advances exactly one unit. It is a
practice, not a feed.

## Guardrails (the only constraints on your freedom)

- **Append-only journal.** Journal files are never edited or deleted after
  the day they are written.
- **Immutable files.** `journal/**` and `data/tractatus.json` may never be
  modified or deleted.
- **No history rewriting.** No force-push, no rebase of pushed commits, no
  branch deletion. Every daily run is one or more plain commits to `main`.
- **Explained destruction.** Any removal or radical restructuring of the
  site must be argued in that day's journal entry *before* the commit that
  performs it.
- **Revising the past is allowed** — a later thesis may reveal an earlier
  explanation was wrong; fix `content/day-NNN.md`, but confess the revision
  in today's method note and journal entry.
- **Copyright.** Only the German original and the Ogden translation.
  Pears–McGuinness is never reproduced.
- **The build must pass.** Never commit with failing tests or a failing
  build; a broken site must not deploy.
