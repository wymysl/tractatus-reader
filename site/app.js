import { todayISO, currentDay } from './progress.js';

const PUSH = {
  workerUrl: 'https://tractatus-push.ekpc.workers.dev',
  publicKey: 'BOLrek2B0KhSZfwJMIRBNiSy1BuQ9w28OTGp-4gPsEDzZVHbKD5BCRm516jfvwfcVhKCk42rGDEs55jXwz2kgOI',
};

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(3, '0');
const state = { manifest: null, unlocked: 0, tree: null, preface: null, firstVisit: false };

// ---- theme: auto (system) → light → dark; the head script applied any
// stored override before first paint, this wires the toggle and keeps the
// browser-chrome colour in sync ----

const THEMES = ['auto', 'light', 'dark'];
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark' || (theme === 'auto' && darkQuery.matches);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#14130f' : '#faf8f4';
  $('theme-toggle').textContent = theme;
}

function initTheme() {
  applyTheme(localStorage.getItem('td.theme') ?? 'auto');
  $('theme-toggle').addEventListener('click', () => {
    const current = localStorage.getItem('td.theme') ?? 'auto';
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    if (next === 'auto') localStorage.removeItem('td.theme');
    else localStorage.setItem('td.theme', next);
    applyTheme(next);
  });
  darkQuery.addEventListener('change', () => {
    if (!localStorage.getItem('td.theme')) applyTheme('auto');
  });
}

async function boot() {
  initTheme();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  state.manifest = await (await fetch('units.json')).json();
  let start = localStorage.getItem('td.start');
  if (!start) {
    start = todayISO();
    localStorage.setItem('td.start', start); // first visit: the walk begins today…
    state.firstVisit = true;                 // …and it begins at the doorstep
  }
  state.unlocked = currentDay(start, todayISO(), state.manifest.frontier);
  window.addEventListener('hashchange', route);
  route();
}

function setActive(name) {
  for (const v of ['preface', 'today', 'tree', 'about']) {
    $(`${v}-view`).hidden = v !== name;
    $(`nav-${v}`).classList.toggle('active', v === name);
  }
}

function route() {
  const h = location.hash || (state.firstVisit ? '#preface' : '#today');
  if (h === '#preface') { setActive('preface'); renderPreface(); return; }
  if (h === '#tree') { setActive('tree'); renderTree(); return; }
  if (h === '#about') { setActive('about'); renderAbout(); return; }
  const m = h.match(/^#day\/(\d+)$/);
  const day = m ? Math.max(1, Math.min(Number(m[1]), state.unlocked)) : state.unlocked;
  setActive('today');
  renderDay(day);
}

async function renderDay(day) {
  const unit = await (await fetch(`units/day-${pad(day)}.json`)).json();
  const box = $('statements');
  box.innerHTML = '';
  for (const st of unit.statements) {
    const art = document.createElement('article');
    art.className = 'statement';
    art.innerHTML = `<div class="num">${st.num}</div>
      <div class="en">${st.en}</div>
      <button class="de-toggle" aria-expanded="false">de</button>
      <div class="de" lang="de" hidden>${st.de}</div>`;
    const btn = art.querySelector('.de-toggle');
    const de = art.querySelector('.de');
    btn.addEventListener('click', () => {
      de.hidden = !de.hidden;
      btn.setAttribute('aria-expanded', String(!de.hidden));
    });
    box.appendChild(art);
  }
  $('explanation').innerHTML = unit.explanation;
  $('zen').hidden = !unit.zen;
  $('zen').innerHTML = unit.zen ?? '';
  $('method-row').hidden = !unit.method;
  $('method').hidden = true;
  $('method').innerHTML = unit.method ?? '';
  $('method-toggle').onclick = () => { $('method').hidden = !$('method').hidden; };

  $('day-label').textContent = `day ${day}`;
  const prev = $('prev'), next = $('next'), locked = $('next-locked');
  prev.hidden = day <= 1;
  prev.href = `#day/${day - 1}`;
  if (day < state.unlocked) {
    next.hidden = false;
    locked.hidden = true;
    next.href = `#day/${day + 1}`;
  } else {
    next.hidden = true;
    locked.hidden = false;
    locked.textContent = day < state.manifest.frontier ? 'tomorrow' : 'not yet written';
  }
}

async function renderPreface() {
  if (!state.preface) state.preface = await (await fetch('preface.json')).json();
  $('preface-en').innerHTML = state.preface.en;
  $('preface-de').innerHTML = state.preface.de;
  const btn = $('preface-de-toggle'), de = $('preface-de');
  de.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  btn.onclick = () => {
    de.hidden = !de.hidden;
    btn.setAttribute('aria-expanded', String(!de.hidden));
  };
  $('begin-link').textContent =
    state.unlocked <= 1 ? 'begin — day 1' : `continue — day ${state.unlocked}`;
}

async function renderTree() {
  if (!state.tree) state.tree = await (await fetch('tree.json')).json();
  const dayOf = new Map();
  for (const u of state.manifest.units) {
    if (u.day > state.unlocked) break;
    for (const t of u.theses) dayOf.set(t, u.day);
  }
  const box = $('tree');
  box.innerHTML = '';
  for (const st of state.tree) {
    const depth = st.num.includes('.') ? st.num.split('.')[1].length : 0;
    const row = document.createElement('div');
    row.className = 'tree-row';
    row.style.setProperty('--d', depth);
    if (dayOf.has(st.num)) {
      row.innerHTML = `<a href="#day/${dayOf.get(st.num)}"><span class="num">${st.num}</span><span class="txt">${st.en}</span></a>`;
    } else {
      row.className += ' dim';
      row.innerHTML = `<span class="num">${st.num}</span>·`;
    }
    box.appendChild(row);
  }
}

// ---- push subscription (only active once PUSH is configured) ----

function urlB64ToUint8Array(s) {
  const padding = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function renderAbout() {
  if (!PUSH.workerUrl || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const row = $('push-row'), btn = $('push-btn'), status = $('push-status');
  row.hidden = false;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  btn.textContent = existing ? 'stop the daily bell' : 'a daily bell';
  status.textContent = '';
  btn.onclick = async () => {
    try {
      if (existing) {
        await fetch(`${PUSH.workerUrl}/unsubscribe`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        await existing.unsubscribe();
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(PUSH.publicKey),
        });
        await fetch(`${PUSH.workerUrl}/subscribe`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), startDate: localStorage.getItem('td.start') }),
        });
      }
      renderAbout();
    } catch {
      status.textContent = 'could not subscribe';
    }
  };
}

boot();
