import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build, mdToHtml, parseContent } from '../build.mjs';

test('mdToHtml: paragraphs, emphasis, links, blockquote, escaping', () => {
  assert.equal(mdToHtml('Hello *w* **s**'), '<p>Hello <em>w</em> <strong>s</strong></p>');
  assert.equal(mdToHtml('a\n\nb'), '<p>a</p>\n<p>b</p>');
  assert.ok(mdToHtml('[x](https://e.co)').includes('<a href="https://e.co">x</a>'));
  assert.equal(mdToHtml('> quoted'), '<blockquote><p>quoted</p></blockquote>');
  assert.ok(mdToHtml('a < b & c').includes('a &lt; b &amp; c'));
});

test('parseContent: frontmatter and sections', () => {
  const raw = '---\nday: 2\ndate: 2026-07-20\ntheses: 1.1, 1.11\n---\n\n## Explanation\n\nE.\n\n## Method\n\nM.\n';
  const u = parseContent('day-002.md', raw);
  assert.equal(u.day, 2);
  assert.equal(u.date, '2026-07-20');
  assert.deepEqual(u.theses, ['1.1', '1.11']);
  assert.equal(u.explanation, 'E.');
  assert.equal(u.zen, '');
  assert.equal(u.method, 'M.');
});

async function fixture(units) {
  const root = await mkdtemp(path.join(tmpdir(), 'td-'));
  await mkdir(path.join(root, 'data'));
  await mkdir(path.join(root, 'content'));
  await mkdir(path.join(root, 'site'));
  await writeFile(path.join(root, 'data/tractatus.json'), JSON.stringify([
    { num: '1', de: '<p>D1</p>', en: '<p>E1</p>' },
    { num: '1.1', de: '<p>D11</p>', en: '<p>E11</p>' },
  ]));
  await writeFile(path.join(root, 'data/preface.json'),
    JSON.stringify({ de: '<p>V</p>', en: '<p>P</p>' }));
  await writeFile(path.join(root, 'site/index.html'), '<html>');
  await writeFile(path.join(root, 'site/sw.js'), 'const V = "__BUILD__";');
  for (const [name, raw] of Object.entries(units)) {
    await writeFile(path.join(root, 'content', name), raw);
  }
  await writeFile(path.join(root, 'state.json'),
    JSON.stringify({ day: Object.keys(units).length, nextIndex: 0, updated: 'x' }));
  return root;
}

const day1 = '---\nday: 1\ndate: 2026-07-19\ntheses: 1\n---\n\n## Explanation\n\nFine.\n';

test('build: happy path produces manifest, unit files, tree, stamped sw', async () => {
  const root = await fixture({ 'day-001.md': day1 });
  const manifest = await build({ root, now: '2026-07-19T09:00:00Z' });
  assert.equal(manifest.frontier, 1);
  const unit = JSON.parse(await readFile(path.join(root, 'dist/units/day-001.json'), 'utf8'));
  assert.equal(unit.statements[0].en, '<p>E1</p>');
  assert.equal(unit.zen, null);
  assert.ok(unit.explanation.includes('<p>Fine.</p>'));
  const tree = JSON.parse(await readFile(path.join(root, 'dist/tree.json'), 'utf8'));
  assert.equal(tree.length, 2);
  const sw = await readFile(path.join(root, 'dist/sw.js'), 'utf8');
  assert.ok(!sw.includes('__BUILD__'));
  assert.ok((await readFile(path.join(root, 'dist/index.html'), 'utf8')).includes('<html>'));
});

test('build: unknown thesis fails loudly', async () => {
  const root = await fixture({ 'day-001.md': day1.replace('theses: 1', 'theses: 9.9') });
  await assert.rejects(() => build({ root }), /unknown thesis 9\.9/);
});

test('build: day gap fails loudly', async () => {
  const root = await fixture({ 'day-002.md': day1.replace('day: 1', 'day: 2') });
  await assert.rejects(() => build({ root }), /expected 1/);
});

test('build: duplicate thesis across days fails loudly', async () => {
  const day2 = day1.replace('day: 1', 'day: 2');
  const root = await fixture({ 'day-001.md': day1, 'day-002.md': day2 });
  await assert.rejects(() => build({ root }), /already authored/);
});

test('build: state.json day mismatch fails loudly', async () => {
  const root = await fixture({ 'day-001.md': day1 });
  await writeFile(path.join(root, 'state.json'), JSON.stringify({ day: 5, nextIndex: 0 }));
  await assert.rejects(() => build({ root }), /state\.json/);
});

test('build: emits preface.json', async () => {
  const root = await fixture({ 'day-001.md': day1 });
  await build({ root });
  const p = JSON.parse(await readFile(path.join(root, 'dist/preface.json'), 'utf8'));
  assert.equal(p.en, '<p>P</p>');
  assert.equal(p.de, '<p>V</p>');
});

test('build: missing preface fails loudly', async () => {
  const root = await fixture({ 'day-001.md': day1 });
  await rm(path.join(root, 'data/preface.json'));
  await assert.rejects(() => build({ root }), /preface/);
});

test('build: empty preface language fails loudly', async () => {
  const root = await fixture({ 'day-001.md': day1 });
  await writeFile(path.join(root, 'data/preface.json'),
    JSON.stringify({ de: '', en: '<p>P</p>' }));
  await assert.rejects(() => build({ root }), /non-empty/);
});

test('build: unparsable preface fails loudly', async () => {
  const root = await fixture({ 'day-001.md': day1 });
  await writeFile(path.join(root, 'data/preface.json'), 'not json {');
  await assert.rejects(() => build({ root }));
});
