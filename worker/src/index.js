/**
 * jpx-click-counter — Global online click counter
 *
 * Endpoints PUBLIK (buat halaman utama):
 *   GET  /api/clicks  → { counts: { url: jumlah, ... }, total }
 *   POST /api/click   → body { url } → tambah 1, balas { url, count, total }
 *
 * Endpoint RAHASIA (buat dashboard, butuh Authorization: Bearer <secret>):
 *   GET    /api/stats → { counts, total, ts }      (401 kalau token salah)
 *   DELETE /api/stats → reset semua hitungan ke 0
 *
 * Secret dibaca dari env.DASH_SECRET (dipasang via wrangler secret).
 */

const KV_KEY = 'counts';
const EVENTS_KEY = 'click_events';
const RATE_LIMIT_MAX = 30; // max requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

async function readCounts(env) {
  try { return JSON.parse((await env.CLICKS.get(KV_KEY)) || '{}') || {}; }
  catch { return {}; }
}

async function readEvents(env) {
  try { return JSON.parse((await env.CLICKS.get(EVENTS_KEY)) || '[]') || []; }
  catch { return []; }
}

async function writeEvents(env, events) {
  // Keep only last 7 days of events (max ~1000 events)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const filtered = events.filter(e => e.ts > sevenDaysAgo);
  await env.CLICKS.put(EVENTS_KEY, JSON.stringify(filtered));
}

/* perbandingan token yang aman dari timing attack */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '');
  return safeEqual(token, env.DASH_SECRET || '');
}

/* 
 * Simple rate limiter using in-memory store.
 * NOTE: This is per-Worker-instance. Cloudflare Workers are stateless,
 * so this won't persist across different Worker invocations.
 * For production, consider using Cloudflare's built-in rate limiting
 * or a KV-based approach for distributed rate limiting.
 */
const rateLimitStore = {};

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = [];
  }
  // Remove old entries
  rateLimitStore[ip] = rateLimitStore[ip].filter(t => now - t < RATE_LIMIT_WINDOW);
  if (rateLimitStore[ip].length >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }
  rateLimitStore[ip].push(now);
  return true;
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

function detectDevice(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // --- PUBLIK ---

    // GET /api/clicks — semua hitungan (untuk badge di halaman utama)
    if (request.method === 'GET' && url.pathname === '/api/clicks') {
      const counts = await readCounts(env);
      return json({ counts, total: sum(counts) });
    }

    // POST /api/click — tambah 1 untuk sebuah url + simpan event
    if (request.method === 'POST' && url.pathname === '/api/click') {
      let key = 'unknown';
      try {
        const body = await request.json();
        key = String(body.url || 'unknown').slice(0, 300);
      } catch { /* body tidak valid → pakai 'unknown' */ }

      const counts = await readCounts(env);
      counts[key] = (counts[key] || 0) + 1;
      await env.CLICKS.put(KV_KEY, JSON.stringify(counts));

      // Store event with timestamp and device info
      const events = await readEvents(env);
      const device = detectDevice(request.headers.get('User-Agent'));
      events.push({
        url: key,
        ts: Date.now(),
        device: device,
        ip: getClientIP(request)
      });
      await writeEvents(env, events);

      return json({ url: key, count: counts[key], total: sum(counts) });
    }

    // --- RAHASIA (dashboard) ---

    // GET /api/stats — data lengkap, butuh token + rate limit
    if (request.method === 'GET' && url.pathname === '/api/stats') {
      const clientIP = getClientIP(request);
      if (!checkRateLimit(clientIP)) {
        return json({ error: 'rate_limit_exceeded', message: 'Terlalu banyak request. Coba lagi dalam 1 menit.' }, 429);
      }
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      const counts = await readCounts(env);
      const events = await readEvents(env);
      
      // Calculate time-based stats (clicks per hour for last 24 hours)
      const now = Date.now();
      const hourlyStats = {};
      const deviceStats = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
      
      events.forEach(event => {
        // Hourly stats (last 24 hours)
        if (now - event.ts < 24 * 60 * 60 * 1000) {
          const hour = new Date(event.ts).getHours();
          hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
        }
        // Device stats (all events)
        deviceStats[event.device] = (deviceStats[event.device] || 0) + 1;
      });
      
      return json({ 
        counts, 
        total: sum(counts), 
        ts: Date.now(),
        hourlyStats,
        deviceStats,
        recentEvents: events.slice(-50) // Last 50 events
      });
    }

    // DELETE /api/stats — reset semua hitungan, butuh token + rate limit
    if (request.method === 'DELETE' && url.pathname === '/api/stats') {
      const clientIP = getClientIP(request);
      if (!checkRateLimit(clientIP)) {
        return json({ error: 'rate_limit_exceeded', message: 'Terlalu banyak request. Coba lagi dalam 1 menit.' }, 429);
      }
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      await env.CLICKS.put(KV_KEY, JSON.stringify({}));
      await env.CLICKS.put(EVENTS_KEY, JSON.stringify([]));
      return json({ ok: true, total: 0 });
    }

    return json({ ok: true, service: 'jpx-click-counter' });
  },
};
