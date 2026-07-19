# Preface page — design

**Date:** 2026-07-19
**Status:** approved (design), pending spec review

## Purpose

The Tractatus opens with Wittgenstein's own preface — the only place he
says what the book is doing ("What can be said at all can be said clearly;
and whereof one cannot speak thereof one must be silent") and the closest
thing to a reading instruction the book offers. The site currently starts
cold at thesis 1. This feature adds the preface as a **standing prologue
page**: every new reader sees it before their day 1, and it remains
permanently reachable. It is *not* a daily unit — no renumbering, no
change to day-001 or the journal.

The preface is presented **bare**: Wittgenstein's words alone, no
Explanation, no Zen, no Method. Bare presentation is itself a statement —
the preface needs no ladder.

## Decisions made

- **Option chosen:** standing page ("Day 0"), over (a) authoring it as a
  later daily unit (wrong order) or (b) renumbering days (contradicts the
  append-only journal).
- **No commentary.** The page carries only the primary text.
- **Bilingual, site idiom.** English (Ogden) shown, German (Vorwort)
  behind the same "de" toggle the daily statements use. Bare ≠ monolingual.
- **Omitted:** the Pinsent dedication and the Kürnberger motto. The
  preface is the reading instruction; the rest is front-matter furniture.
  They can join this page later without redesign.
- **Copyright:** both texts come from Gutenberg #5740 (German original +
  Ogden translation) — inside the project's copyright guardrail.

## Components

### 1. Data: `data/preface.json`

`{ "de": "<p>…</p>…", "en": "<p>…</p>…" }` — paragraphs as HTML, same
conventions as the statements in `tractatus.json`. Extracted once from
`data/5740-t.tex` (English preface at the `\Preface{…}{Preface}` block,
German at `\Preface{…}{Vorwort}`) by a script in `scripts/` (extend
`parse.mjs` or add `extract-preface.mjs`). The committed JSON is the
source of truth; the script never needs to run again. `tractatus.json`
is not touched (immutable per ROUTINE.md).

### 2. Build: `build.mjs`

- Read `data/preface.json`; fail the build if missing, unparsable, or
  either language is empty (loud validation, matching the existing ethic).
- Copy it to `dist/preface.json`.

### 3. Site: `#preface` view

- Fourth view alongside today/tree/about; "preface" added to the nav;
  `route()` handles `#preface`; `setActive()` covers the new view.
- Renders: title "Preface", the English text, a "de" toggle revealing the
  Vorwort (same interaction pattern and markup classes as the daily
  statements' de-toggle).
- Footer of the page: one link — "Begin — day 1" for a reader on day 1,
  otherwise pointing at the reader's current day (`#today` semantics).

### 4. First-visit routing

In `boot()`: when `td.start` is absent from localStorage (the one moment
we know the reader is brand new), route to `#preface` instead of the
default `#today`. `td.start` is still stamped immediately, so this
happens exactly once. All later visits land on today as before.

### 5. Offline

Add `preface.json` to the service worker's cached assets so the preface
works offline like the rest of the site.

## Untouched

`content/day-001.md`, `journal/**`, `state.json`, day numbering,
`data/tractatus.json`, the push worker.

## Testing

- `build.test.mjs`: build emits `dist/preface.json`; both `de` and `en`
  are non-empty; build fails loudly when `data/preface.json` is missing
  or malformed.
- Extraction: assert output shape (both languages present, expected
  opening words of each — "This book will perhaps" / "Dieses Buch wird
  vielleicht") at extraction time or in a small test.
- Manual: first visit in a fresh profile lands on the preface; returning
  visit lands on today; de-toggle and "Begin" link work.

## Error handling

All failure surfaces are at build time (missing/empty preface data →
build fails, broken site never deploys). At runtime the view fetches a
static JSON the service worker also caches; no new error states beyond
those the existing views already have.
