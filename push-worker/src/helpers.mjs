// Pure helpers, testable without the Workers runtime.

export function todayISO(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function computeDay(startISO, today, frontier) {
  const [a, b] = [startISO, today].map(s => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  });
  const n = Math.round((b - a) / 86400000) + 1;
  return Math.max(1, Math.min(n, frontier));
}

export function firstLine(html) {
  const text = html
    .replace(/<p class="footnote">[\s\S]*$/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 140 ? `${text.slice(0, 139)}…` : text;
}
