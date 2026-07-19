// Cloudflare Worker: Web Push for Tractatus Daily.
// POST /subscribe {subscription, startDate}; POST /unsubscribe {endpoint}.
// Daily cron: each subscriber gets *their* next thesis (their day number,
// capped at the frontier). Push failures are logged and never block others.

import { buildPushPayload } from '@block65/webcrypto-web-push';
import { computeDay, firstLine, shouldSend, todayISO } from './helpers.mjs';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...CORS } });
const kvKey = endpoint => btoa(endpoint).slice(-256);

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === '/subscribe') {
      const { subscription, startDate } = await req.json().catch(() => ({}));
      if (!subscription?.endpoint || !/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '')) {
        return json({ error: 'bad request' }, 400);
      }
      await env.SUBS.put(kvKey(subscription.endpoint), JSON.stringify({ subscription, startDate }));
      return json({ ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/unsubscribe') {
      const { endpoint } = await req.json().catch(() => ({}));
      if (!endpoint) return json({ error: 'bad request' }, 400);
      await env.SUBS.delete(kvKey(endpoint));
      return json({ ok: true });
    }
    return json({ error: 'not found' }, 404);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(pushAll(env));
  },
};

export async function pushAll(env) {
  const manifest = await (await fetch(`${env.SITE_URL}/units.json`)).json();
  const today = todayISO();
  const vapid = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  const unitCache = new Map();
  const getUnit = async day => {
    if (!unitCache.has(day)) {
      const r = await fetch(`${env.SITE_URL}/units/day-${String(day).padStart(3, '0')}.json`);
      unitCache.set(day, await r.json());
    }
    return unitCache.get(day);
  };

  let cursor;
  do {
    const page = await env.SUBS.list({ cursor });
    for (const k of page.keys) {
      try {
        const rec = JSON.parse(await env.SUBS.get(k.name));
        const day = computeDay(rec.startDate, today, manifest.frontier);
        if (!shouldSend(rec, day)) continue;
        const unit = await getUnit(day);
        const message = {
          data: JSON.stringify({
            title: `Tractatus · ${unit.statements.map(s => s.num).join(', ')}`,
            body: firstLine(unit.statements[0].en),
          }),
        };
        const payload = await buildPushPayload(message, rec.subscription, vapid);
        const res = await fetch(rec.subscription.endpoint, payload);
        if (res.status === 404 || res.status === 410) await env.SUBS.delete(k.name);
        else if (!res.ok) console.error(`push ${res.status} for ${k.name}`);
        else await env.SUBS.put(k.name, JSON.stringify({ ...rec, lastSentDay: day }));
      } catch (err) {
        console.error('push failed (non-fatal)', k.name, err.message ?? err);
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}
