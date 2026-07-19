// One-time setup: extract Wittgenstein's preface (English + German Vorwort)
// from the Project Gutenberg LaTeX source into data/preface.json.
//
//   node scripts/extract-preface.mjs
//
// The signature block ("L. W. / Wien, 1918.") is omitted: the English
// preface in this edition carries none, so the two languages stay symmetric.

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { latexToHtml } from './parse.mjs';

const TEX = new URL('../data/5740-t.tex', import.meta.url);
const OUT = new URL('../data/preface.json', import.meta.url);

export async function readTex() {
  const buf = await readFile(TEX);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return buf.toString('latin1');
  }
}

function between(tex, startMarker, endMarker) {
  const at = tex.indexOf(startMarker);
  if (at === -1) throw new Error(`marker not found: ${startMarker}`);
  const from = at + startMarker.length;
  const end = tex.indexOf(endMarker, from);
  if (end === -1) throw new Error(`marker not found after preface: ${endMarker}`);
  return tex.slice(from, end);
}

export function extractPreface(tex) {
  // \- discretionary hyphens (glau\-be) are print-era line-breaking hints.
  const clean = s => latexToHtml(s.replace(/\\-/g, ''));
  return {
    de: clean(between(tex,
      '\\Preface{Logisch-Philosophische Abhandlung}{Vorwort}', '\\begin{minipage}')),
    en: clean(between(tex,
      '\\Preface{Tractatus Logico-Philosophicus}{Preface}', '\\MainMatter{')),
  };
}

async function main() {
  const preface = extractPreface(await readTex());
  for (const [lang, opening] of [['en', 'This book will perhaps'], ['de', 'Dieses Buch wird vielleicht']]) {
    if (!preface[lang].includes(opening)) throw new Error(`spot check failed: ${lang} opening`);
    if (/\\[a-zA-Z]/.test(preface[lang])) throw new Error(`residual LaTeX in ${lang}`);
  }
  await writeFile(OUT, JSON.stringify(preface, null, 1) + '\n');
  console.log('Wrote data/preface.json');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
