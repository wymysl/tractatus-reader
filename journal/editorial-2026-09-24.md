# Editorial pass — 2026-09-24

Not a daily run. Piotr asked for a review of days 1–50 after a stretch
without merges. Five read-only reviewers checked every content file
against `data/tractatus.json`, METHOD.md, and one another; their
must-fix findings were applied surgically. ROUTINE.md allows revising the
past with confession — this is the confession.

## What changed in `content/`

Only `## Explanation` and `## Zen` sections. **No `## Method` note was
touched** (METHOD.md: method notes are never retro-edited), so a few
Method notes still carry the errors listed below; they stand as record.

Classes of correction:

- **Miscounts and relative dates** — "nine words" (day 1, it is eight),
  "four/five sentences in" (days 5, 47), "two/three days ago" pointing
  at the wrong day (days 21, 32, 33, 34, 35, 41), "six hundred theses
  later" (day 21), wrong day numbers in cross-references (days 12, 14, 17).
- **Claims the text does not make** — atomic facts read into 1.21
  (days 7, 8); "object" as an ordinary word (day 9); *gleichsam* at
  2.0131, which uses *sozusagen* (day 17); argument-places as the
  picture theory's building block (day 18); *Elementarsatz* first at
  4.221, really 4.21 (day 22); 1.11 for 1.12 and 6.4 for 6.45 (day 44);
  2.0141 and 2.023 misdescribed (day 42); "not one of those sentences
  mentioned a representation" (day 50, 2.0212 did); 2.11 paraphrased
  instead of quoted (day 50).
- **Interpretive readings misstated** — resolute reading glossed as
  rule-giving (day 47).
- **Scholarship slips** — Sarvāstivāda as the example of impermanent
  dharmas (day 8); E. J. Lowe named as a structural realist (day 28);
  Chandogya chapter and count (day 49); al-Ghazali's regularity called
  "guaranteed" (day 48); citation apparatus removed (day 27).
- **Backstage bookkeeping cut from reader-facing sections** — journal
  references and tradition tallies in Zen notes (days 11, 14, 21, 26, 50).

## What changed in the app

`build.mjs` `mdToHtml`: backtick spans now render as `<code>` (they
showed as literal backticks in ~25 Method notes), and a compound word
hard-wrapped at its hyphen ("load-\nbearing") no longer renders as
"load- bearing". Both fixes apply retroactively without editing the
notes. Test added.

## Findings not acted on — for the owner

1. **The Zen section has drifted.** From about day 21 every day carries
   one, and most are Western comparative philosophy (Kant, Leibniz,
   Locke, Democritus, al-Ghazali…) under a heading that says Zen and an
   About page that says "most, honestly, do not." METHOD.md needs a
   decision: rename/widen the section with confession, or return to rare
   and genuinely Zen.
2. **Length.** Explanations grew from ~300 words to 500–800; Method
   notes run 350–590 words of recurring checklists. METHOD.md could cap
   the Method note or allow it to be omitted when nothing changed.
3. **Relative dating from memory** is the most common error class.
   Cross-references should name the day or thesis, not "N days ago".
4. **Source-text artefacts**: some theses in `data/tractatus.json` are
   split mid-sentence across `<p>` (e.g. 2.0131) or carry TeX residue.

## Later the same day — owner decisions

- **Zen → Elsewhere.** Piotr chose to rename rather than retreat. The
  section heading is now `## Elsewhere` in METHOD.md, ROUTINE.md, the
  build and all 43 content files that had one (heading only; note text
  untouched). METHOD.md now requires trying for a *legitimate* Zen analogy
  first and widening only when none holds, naming the tradition up front,
  and keeping source-rotation bookkeeping out of the note. The About page
  says the same. The build still accepts a legacy `## Zen` heading.
- **Human-merge rule lifted.** Piotr authorised automatic merging.
  `.github/workflows/auto-merge.yml` (drafted 2026-07-22, never pushed
  until now) merges `claude/**` PRs; ROUTINE.md step 7 makes landing the
  day part of a successful run, and step 1 now merges a stranded PR
  instead of re-authoring it.
