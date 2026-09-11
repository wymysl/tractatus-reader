// Depth of each proposition in Wittgenstein's own nesting rule: n.m1, n.m2,
// etc. are comments on n.m, and so on (his footnote to proposition 1).
// Counting digits after the decimal point matches this almost everywhere,
// but the book pads several first-level batches with a leading zero or
// zeros — 2.01-2.06, 3.001, 3.01-3.05, 4.001-4.003, 4.01-4.06, 5.01-5.02,
// 6.001-6.002, 6.01-6.03, and the same trick one level down at e.g.
// 2.201-2.203 — so a padded number's digit count overstates its real
// depth by however many zeros it carries. Rather than special-case the
// padding, walk back through shorter prefixes of the same number and stop
// at the nearest one that actually exists in the book; that proposition
// is the true parent, at any level, with any amount of padding. Pure and
// side-effect-free; used by app.js and tested directly. See
// journal/day-009.md (the wrinkle, found and left unfixed) and
// journal/day-050.md (this fix, and why today is the day it was due).
export function computeDepths(nums) {
  const set = new Set(nums);
  const depths = new Map();
  function depthOf(num) {
    if (depths.has(num)) return depths.get(num);
    const dot = num.indexOf('.');
    if (dot === -1) {
      depths.set(num, 0);
      return 0;
    }
    const intPart = num.slice(0, dot);
    let dec = num.slice(dot + 1);
    while (dec.length > 0) {
      dec = dec.slice(0, -1);
      if (dec.length === 0) break;
      const candidate = `${intPart}.${dec}`;
      if (set.has(candidate)) {
        const d = depthOf(candidate) + 1;
        depths.set(num, d);
        return d;
      }
    }
    depths.set(num, 1);
    return 1;
  }
  for (const n of nums) depthOf(n);
  return depths;
}
