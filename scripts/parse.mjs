// One-time setup: parse the Project Gutenberg LaTeX source (ebook #5740,
// German original + Ogden translation) into data/tractatus.json.
//
//   node scripts/parse.mjs
//
// Residual LaTeX the converter does not understand is left in place and
// reported on stdout — the daily agent improves rendering when the walk
// reaches those statements.

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const TEX = new URL('../data/5740-t.tex', import.meta.url);
const OUT = new URL('../data/tractatus.json', import.meta.url);

export function readBraceGroup(s, i) {
  if (s[i] !== '{') throw new Error(`expected { at index ${i}`);
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  throw new Error('unbalanced braces');
}

export function extractPropositions(tex, macro) {
  const out = [];
  const marker = `\\${macro}`;
  let i = 0;
  while ((i = tex.indexOf(marker, i)) !== -1) {
    let j = i + marker.length;
    if (tex[j] !== '{') { i = j; continue; } // \newcommand{\PropositionE}…
    const [num, afterNum] = readBraceGroup(tex, j);
    j = afterNum;
    while (j < tex.length && /\s/.test(tex[j])) j++;
    const [body, end] = readBraceGroup(tex, j);
    out.push({ num, body });
    i = end;
  }
  return out;
}

export function replaceMacro(s, name, arity, fn) {
  let out = '', i = 0;
  for (;;) {
    const at = s.indexOf(name, i);
    if (at === -1) return out + s.slice(i);
    const next = s[at + name.length];
    if (next && /[a-zA-Z]/.test(next)) { // \emph must not match \emphatic
      out += s.slice(i, at + name.length);
      i = at + name.length;
      continue;
    }
    out += s.slice(i, at);
    let j = at + name.length;
    if (s[j] === '[') { j = s.indexOf(']', j) + 1; } // skip optional arg
    const args = [];
    for (let a = 0; a < arity; a++) {
      while (/\s/.test(s[j])) j++;
      const [arg, after] = readBraceGroup(s, j);
      args.push(arg);
      j = after;
    }
    out += fn(...args);
    i = j;
  }
}

const SYMBOLS = [
  ['Implies', ' ⊃ '], ['DotOp', ' . '], ['BarOp', ' | '],
  ['thicksim', '∼'], ['sim', '∼'], ['vee', ' ∨ '], ['wedge', ' ∧ '],
  ['equiv', ' ≡ '], ['supset', ' ⊃ '], ['subset', ' ⊂ '],
  ['exists', '∃'], ['forall', '∀'], ['in', ' ∈ '], ['infty', '∞'],
  ['times', ' × '], ['neq', ' ≠ '], ['ldots', '…'], ['dots', '…'], ['cdot', '·'],
  ['xi', 'ξ'], ['eta', 'η'], ['zeta', 'ζ'], ['mu', 'μ'], ['nu', 'ν'],
  ['phi', 'φ'], ['psi', 'ψ'], ['chi', 'χ'], ['omega', 'ω'], ['Omega', 'Ω'],
  ['sigma', 'σ'], ['pi', 'π'], ['tau', 'τ'], ['lambda', 'λ'],
  ['alpha', 'α'], ['beta', 'β'], ['gamma', 'γ'], ['kappa', 'κ'],
  ['quad', ' '], ['qquad', '  '], ['left', ''], ['right', ''],
  // German quotes and edition conveniences (defined in the 5740 preamble)
  ['glqq', '„'], ['grqq', '“'], ['glq', '‚'], ['grq', '‘'], ['quotedblbase', '„'],
  ['lor', ' ∨ '], ['vdash', ' ⊢ '], ['sum', 'Σ'], ['limits', ''],
  ['sharp', '♯'], ['flat', '♭'], ['aleph', 'ℵ'],
  ['Wahr', 'W'], ['False', 'F'],
  ['DittoInWords', '„'], ['DittoInWorten', '„'],
  ['fourdots', '….'], ['fivedots', '…..'],
  ['zumBeispiel', 'z. B.'], ['ZumBeispiel', 'Z. B.'], ['dasHeiszt', 'd. h.'],
  ['undSoFort', 'u. s. f.'], ['UndSoWeiter', 'U. s. w.'], ['undAndere', 'u. a.'],
  ['exempliGratia', 'e.g.'], ['ExempliGratia', 'E.g.'], ['idEst', 'i.e.'], ['IdEst', 'I.e.'],
  ['hline', ''], ['AllowBreak', ''], ['stretchyspace', ''], ['verystretchyspace', ''],
  ['footnotesize', ''], ['noindent', ''], ['centering', ''], ['baselineskip', ''],
];

const SYM_MAP = new Map(SYMBOLS);
const SYM_RE = new RegExp(`\\\\(${SYMBOLS.map(([n]) => n).join('|')})(?![a-zA-Z])`, 'g');

function convertInline(input) {
  let s = input, prev;
  do {
    prev = s;
    s = replaceMacro(s, '\\DPtypo', 2, (a, b) => b);
    s = replaceMacro(s, '\\emph', 1, t => `<em>${t}</em>`);
    s = replaceMacro(s, '\\Emph', 1, t => `<em>${t}</em>`);
    s = replaceMacro(s, '\\EmphPart', 1, t => `<em>${t}</em>`);
    s = replaceMacro(s, '\\textit', 1, t => `<em>${t}</em>`);
    s = replaceMacro(s, '\\textbf', 1, t => `<strong>${t}</strong>`);
    s = replaceMacro(s, '\\textrm', 1, t => t);
    s = replaceMacro(s, '\\textup', 1, t => t);
    s = replaceMacro(s, '\\text', 1, t => t);
    s = replaceMacro(s, '\\mathrm', 1, t => t);
    s = replaceMacro(s, '\\mbox', 1, t => t);
    s = replaceMacro(s, '\\German', 1, t => `<em lang="de">${t}</em>`);
    s = replaceMacro(s, '\\BookTitle', 1, t => `<cite>${t}</cite>`);
    s = replaceMacro(s, '\\Not', 1, t => `∼${t}`);
    s = replaceMacro(s, '\\overline', 1, t => `<span class="ovl">${t}</span>`);
    s = replaceMacro(s, '\\bar', 1, t => `<span class="ovl">${t}</span>`);
    s = replaceMacro(s, '\\Illustration', 1,
      () => '<span class="figure">[diagram — see the printed edition]</span>');
    s = replaceMacro(s, '\\PropERef', 1, t => t);
    s = replaceMacro(s, '\\PropGRef', 1, t => t);
    s = replaceMacro(s, '\\enlargethispage', 1, () => '');
    s = replaceMacro(s, '\\phantom', 1, () => '');
    s = replaceMacro(s, '\\hspace', 1, () => ' ');
    s = replaceMacro(s, '\\smash', 1, t => t);
    s = replaceMacro(s, '\\raisebox', 2, (off, t) => t);
    s = replaceMacro(s, '\\binom', 2, (a, b) => `(<sup>${a}</sup><sub>${b}</sub>)`);
    s = replaceMacro(s, '\\frac', 2, (a, b) => `${a}⁄${b}`);
    s = replaceMacro(s, '\\discretionary', 3, (a, b, c) => c);
    s = replaceMacro(s, '\\Strut', 0, () => '');
  } while (s !== prev);
  // One combined pass so adjacent macros (\False\Wahr) can't glue together.
  s = s.replace(SYM_RE, (_, n) => SYM_MAP.get(n));
  s = s.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>').replace(/\^([^\s{])/g, '<sup>$1</sup>');
  s = s.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>').replace(/_([A-Za-z0-9])/g, '<sub>$1</sub>');
  s = s.replace(/\$\s*([^$]*?)\s*\$/g, (_, m) => `<span class="math">${m}</span>`);
  s = s.replace(/---/g, '—').replace(/--/g, '–');
  s = s.replace(/``/g, '“').replace(/''/g, '”');
  s = s.replace(/(^|[\s(])`/g, '$1‘');
  s = s.replace(/~/g, ' ');
  s = s.replace(/\\[;,:]/g, ' ').replace(/\\ /g, ' ');
  s = s.replace(/\\\\(\[[^\]]*\])?/g, '<br>');
  s = s.replace(/\\&/g, '&amp;').replace(/\\%/g, '%').replace(/\\_/g, '_')
       .replace(/\\\{/g, '{').replace(/\\\}/g, '}').replace(/\\\$/g, '$');
  return s;
}

// Pull \begin{env}…\end{env} blocks out into tokens so paragraph-splitting
// leaves them intact; they come back as <pre> blocks (tables, schemata).
function extractEnvs(s, store) {
  const re = /\\begin\{([a-z*]+)\}/;
  let m;
  while ((m = re.exec(s))) {
    const end = s.indexOf(`\\end{${m[1]}}`, m.index);
    if (end === -1) break;
    let inner = s.slice(m.index + m[0].length, end);
    // strip optional [pos] and the column-spec brace group (may nest @{})
    inner = inner.replace(/^\s*(\[[^\]]*\])?\s*(\{(?:[^{}]|\{[^{}]*\})*\})?/, '');
    const token = `@ENV${store.length}@`;
    store.push(inner);
    s = s.slice(0, m.index) + token + s.slice(end + `\\end{${m[1]}}`.length);
  }
  return s;
}

function envToText(inner, store) {
  let t = extractEnvs(inner, store); // nested environments
  t = convertInline(t);
  t = t.replace(/@ENV(\d+)@/g, (_, n) => `\n${envToText(store[Number(n)], store)}\n`);
  return t
    .replace(/\s*&amp;\s*/g, '   ') // column separators
    .replace(/<br>/g, '\n')
    .split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function envToPre(inner, store) {
  return `<pre>${envToText(inner, store)}</pre>`;
}

export function latexToHtml(input) {
  let s = input.replace(/\r/g, '');
  s = s.replace(/&/g, '&amp;');
  s = s.replace(/(^|[^\\])%[^\n]*/g, '$1'); // comments
  const footnotes = [];
  s = replaceMacro(s, '\\footnote', 1, t => { footnotes.push(t); return ''; });
  const envs = [];
  s = extractEnvs(s, envs);
  s = convertInline(s);
  const paras = s.split(/\n\s*\n/).map(p => p.trim().replace(/\s*\n\s*/g, ' ')).filter(Boolean);
  let html = paras.map(p => `<p>${p}</p>`).join('\n');
  for (const f of footnotes) {
    html += `\n<p class="footnote">${convertInline(f).replace(/\s*\n\s*/g, ' ').trim()}</p>`;
  }
  // reinsert environments (nested ones are consumed inside their parent)
  for (let i = 0; i < envs.length; i++) {
    if (!html.includes(`@ENV${i}@`)) continue;
    const pre = envToPre(envs[i], envs);
    html = html
      .replace(new RegExp(`<p>\\s*@ENV${i}@\\s*</p>`), pre)
      .replace(`@ENV${i}@`, pre);
  }
  return html;
}

async function main() {
  const buf = await readFile(TEX);
  let tex;
  try {
    tex = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    tex = buf.toString('latin1');
  }
  const en = extractPropositions(tex, 'PropositionE');
  const de = extractPropositions(tex, 'PropositionG');
  if (en.length !== 526 || de.length !== 526) {
    throw new Error(`expected 526+526 propositions, got ${en.length} EN / ${de.length} DE`);
  }
  for (let i = 0; i < en.length; i++) {
    if (en[i].num !== de[i].num) throw new Error(`sequence mismatch at ${i}: ${en[i].num} vs ${de[i].num}`);
    if (i > 0 && parseFloat(en[i].num) <= parseFloat(en[i - 1].num)) {
      throw new Error(`numbering not increasing: ${en[i - 1].num} → ${en[i].num}`);
    }
  }
  const statements = en.map((e, i) => ({
    num: e.num,
    de: latexToHtml(de[i].body),
    en: latexToHtml(e.body),
  }));
  if (!statements[0].en.includes('The world is everything that is the case')) {
    throw new Error('spot check failed: statement 1 EN');
  }
  if (!/silent/.test(statements[525].en)) throw new Error('spot check failed: statement 7 EN');
  await writeFile(OUT, JSON.stringify(statements, null, 1) + '\n');
  console.log(`Wrote ${statements.length} statements to data/tractatus.json`);
  const rough = statements.filter(s => /\\[a-zA-Z]/.test(s.en) || /\\[a-zA-Z]/.test(s.de));
  if (rough.length) {
    console.log(`Residual LaTeX in ${rough.length} statements: ${rough.map(r => r.num).join(', ')}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
