// Per-visitor progression. Pure functions; used by app.js and by node --test.

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(aISO, bISO) {
  const [a, b] = [aISO, bISO].map(s => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}

// A visitor's position: min(days since their start, global frontier), never < 1.
export function currentDay(startISO, today, frontier) {
  return Math.max(1, Math.min(daysBetween(startISO, today) + 1, frontier));
}

export function addDaysISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

// The start date that makes today `day` — inverse of currentDay below the frontier.
export function startForDay(day, today) {
  return addDaysISO(today, -(day - 1));
}
