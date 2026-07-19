// Generator: data/tractatus.json + content/day-NNN.md + site/ → dist/.
// Validates everything loudly and fails rather than deploying a broken site.
//   node build.mjs

import { readFile, writeFile, mkdir, rm, cp, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pad = n => String(n).padStart(3, '0');

export function mdToHtml(md) {
  const esc = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const blocks = esc.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const isQuote = block.split('\n').every(l => l.startsWith('&gt;'));
    let t = isQuote
      ? block.split('\n').map(l => l.replace(/^&gt;\s?/, '')).join('\n')
      : block;
    t = t
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\s*\n\s*/g, ' '); // hard-wrapped source lines are one paragraph
    return isQuote ? `<blockquote><p>${t}</p></blockquote>` : `<p>${t}</p>`;
  }).join('\n');
}

export function parseContent(name, raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${name}: missing frontmatter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (mm) meta[mm[1]] = mm[2].trim();
  }
  const sections = {};
  let current = null;
  for (const line of m[2].split('\n')) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) { current = h[1].trim().toLowerCase(); sections[current] = []; }
    else if (current !== null) sections[current].push(line);
  }
  const sec = k => (sections[k] ?? []).join('\n').trim();
  return {
    day: Number(meta.day),
    date: meta.date ?? '',
    theses: (meta.theses ?? '').split(',').map(s => s.trim()).filter(Boolean),
    explanation: sec('explanation'),
    zen: sec('zen'),
    method: sec('method'),
  };
}

export async function build(opts = {}) {
  const root = opts.root ?? fileURLToPath(new URL('./', import.meta.url));
  const outDir = opts.outDir ?? path.join(root, 'dist');
  const statements = JSON.parse(await readFile(path.join(root, 'data/tractatus.json'), 'utf8'));
  const byNum = new Map(statements.map(s => [s.num, s]));

  const preface = JSON.parse(await readFile(path.join(root, 'data/preface.json'), 'utf8'));
  if (typeof preface.de !== 'string' || !preface.de.trim()
    || typeof preface.en !== 'string' || !preface.en.trim()) {
    throw new Error('data/preface.json: de and en must both be non-empty strings');
  }

  const files = (await readdir(path.join(root, 'content')))
    .filter(f => /^day-\d{3}\.md$/.test(f)).sort();
  if (files.length === 0) throw new Error('no content files in content/');

  const seen = new Set();
  const units = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const u = parseContent(f, await readFile(path.join(root, 'content', f), 'utf8'));
    const n = i + 1;
    if (u.day !== n || f !== `day-${pad(n)}.md`) {
      throw new Error(`${f}: day ${u.day}, expected ${n} (days must be contiguous from 1)`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(u.date)) throw new Error(`${f}: bad or missing date`);
    if (u.theses.length === 0) throw new Error(`${f}: no theses listed`);
    if (!u.explanation) throw new Error(`${f}: empty Explanation section`);
    for (const t of u.theses) {
      if (!byNum.has(t)) throw new Error(`${f}: unknown thesis ${t}`);
      if (seen.has(t)) throw new Error(`${f}: thesis ${t} already authored on an earlier day`);
      seen.add(t);
    }
    units.push(u);
  }

  const state = JSON.parse(await readFile(path.join(root, 'state.json'), 'utf8'));
  if (state.day !== units.length) {
    throw new Error(`state.json says day=${state.day} but there are ${units.length} content files`);
  }

  await rm(outDir, { recursive: true, force: true });
  await cp(path.join(root, 'site'), outDir, { recursive: true });
  await mkdir(path.join(outDir, 'units'), { recursive: true });

  const manifest = {
    built: opts.now ?? new Date().toISOString(),
    frontier: units.length,
    units: units.map(u => ({ day: u.day, date: u.date, theses: u.theses })),
  };
  await writeFile(path.join(outDir, 'units.json'), JSON.stringify(manifest));
  for (const u of units) {
    await writeFile(path.join(outDir, 'units', `day-${pad(u.day)}.json`), JSON.stringify({
      day: u.day,
      date: u.date,
      statements: u.theses.map(t => byNum.get(t)),
      explanation: mdToHtml(u.explanation),
      zen: u.zen ? mdToHtml(u.zen) : null,
      method: u.method ? mdToHtml(u.method) : null,
    }));
  }
  await writeFile(path.join(outDir, 'tree.json'), JSON.stringify(statements));
  await writeFile(path.join(outDir, 'preface.json'), JSON.stringify(preface));

  const swPath = path.join(outDir, 'sw.js');
  try { await access(swPath); } catch { return manifest; }
  const sw = await readFile(swPath, 'utf8');
  await writeFile(swPath, sw.replaceAll('__BUILD__', manifest.built));
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const m = await build();
  console.log(`Built dist/: frontier day ${m.frontier} (${m.units.at(-1).theses.join(', ')})`);
}
