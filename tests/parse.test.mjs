import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractPropositions, latexToHtml, replaceMacro } from '../scripts/parse.mjs';

test('extractPropositions finds numbered bodies, skips the macro definition', () => {
  const tex = `\\newcommand{\\PropositionE}[2]{x}\n\\PropositionE{1}\n{Hello \\emph{world}.}\n\\PropositionE{1.1}\n{Second.}`;
  const props = extractPropositions(tex, 'PropositionE');
  assert.equal(props.length, 2);
  assert.deepEqual(props[0], { num: '1', body: 'Hello \\emph{world}.' });
  assert.equal(props[1].num, '1.1');
});

test('replaceMacro handles nesting and does not match longer names', () => {
  const s = replaceMacro('\\emph{a \\emph{b}} \\emphatic', '\\emph', 1, t => `<em>${t}</em>`);
  assert.equal(s, '<em>a \\emph{b}</em> \\emphatic');
});

test('latexToHtml converts emphasis, quotes, dashes, footnotes', () => {
  const html = latexToHtml("The \\emph{world} --- ``so''\\footnote{A note.}");
  assert.ok(html.includes('<em>world</em>'));
  assert.ok(html.includes('—'));
  assert.ok(html.includes('“so”'));
  assert.ok(html.includes('<p class="footnote">A note.</p>'));
});

test('latexToHtml converts logical symbols and math', () => {
  const html = latexToHtml('$p \\Implies q$ and $\\Not{p}$');
  assert.ok(html.includes('⊃'));
  assert.ok(html.includes('∼p'));
});

test('generated tractatus.json is complete and ordered', async () => {
  const data = JSON.parse(await readFile(new URL('../data/tractatus.json', import.meta.url), 'utf8'));
  assert.equal(data.length, 526);
  assert.equal(data[0].num, '1');
  assert.ok(data[0].en.includes('The world is everything that is the case'));
  assert.ok(data[0].de.includes('Die Welt ist alles, was der Fall ist'));
  assert.equal(data[data.length - 1].num, '7');
  assert.ok(data[data.length - 1].en.match(/silent/));
  for (const s of data) {
    assert.match(s.num, /^[1-7](\.\d+)?$/);
    assert.ok(s.en.length > 0 && s.de.length > 0);
  }
  for (let i = 1; i < data.length; i++) {
    assert.ok(parseFloat(data[i].num) > parseFloat(data[i - 1].num),
      `${data[i - 1].num} !< ${data[i].num}`);
  }
});
