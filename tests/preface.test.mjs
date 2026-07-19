import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPreface, readTex } from '../scripts/extract-preface.mjs';

test('extractPreface: both languages, clean HTML, correct boundaries', async () => {
  const p = extractPreface(await readTex());
  assert.ok(p.en.startsWith('<p>This book will perhaps'));
  assert.ok(p.en.includes('must be silent'));
  assert.ok(p.de.startsWith('<p>Dieses Buch wird vielleicht'));
  assert.ok(p.de.includes('schweigen'));
  assert.ok(p.de.includes('Missverständnis'));      // umlauts survive decoding
  assert.ok(p.de.includes('vielmehr'));             // \- discretionary hyphens stripped
  assert.ok(!p.en.includes('MainMatter'));          // stopped before the main text
  assert.ok(!p.de.includes('L. W.'));               // signature block omitted
  assert.ok(!/\\[a-zA-Z]/.test(p.en) && !/\\[a-zA-Z]/.test(p.de)); // no residual LaTeX
  assert.ok(!p.en.includes('\\-') && !p.de.includes('\\-'));
});
