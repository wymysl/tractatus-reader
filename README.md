# Tractatus Daily

Wittgenstein's *Tractatus Logico-Philosophicus*, one thesis a day, on a
mostly empty page. English (Ogden, public domain) with the German original
a tap away. Authored day by day — and self-revised — by a scheduled agent;
`journal/` is the memory, git is the safety net.

- Spec: `docs/superpowers/specs/2026-07-19-tractatus-daily-design.md`
- Agent instructions & guardrails: `ROUTINE.md`
- Explanation charter: `METHOD.md`

## Develop

    npm test               # parser, build, progression tests
    node build.mjs         # data + content + site → dist/
    python3 -m http.server -d dist 8317

## Deployment

- **Repo**: `github.com/wymysl/tractatus-reader` (plain commits to `main`).
- **Site**: `https://tractatus-daily.pages.dev` — Cloudflare Pages project
  `tractatus-daily`, **direct upload** (no git integration; it cannot be
  converted to one). Deploy with:

      node build.mjs && npx wrangler pages deploy dist --project-name tractatus-daily --branch main

- **Push worker**: `https://tractatus-push.ekpc.workers.dev` — deployed,
  KV namespace bound, VAPID keys set as Worker secrets (the private key
  exists *only* there), cron `0 6 * * *` UTC. `PUSH` in `site/app.js` is
  wired to it.

## Remaining one-time setup (Piotr)

1. **Daily routine**: schedule a Claude Code cloud routine against the repo
   that follows `ROUTINE.md` each morning. It needs a Cloudflare API token
   (Pages write) as `CLOUDFLARE_API_TOKEN` so it can run the deploy step.
2. Hand checks before announcing: e-ink pass on the Boox; one real push
   subscription end-to-end (the "a daily bell" button on the About page).

## Provenance

Source text: Project Gutenberg ebook #5740 (`data/5740-t.tex`), parsed by
`scripts/parse.mjs` into `data/tractatus.json` (526 statements). Immutable
by charter: `data/tractatus.json`, `journal/**`.
