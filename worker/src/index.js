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

    // POST /api/click — tambah 1 untuk sebuah url
    if (request.method === 'POST' && url.pathname === '/api/click') {
      let key = 'unknown';
      try {
        const body = await request.json();
        key = String(body.url || 'unknown').slice(0, 300);
      } catch { /* body tidak valid → pakai 'unknown' */ }

      const counts = await readCounts(env);
      counts[key] = (counts[key] || 0) + 1;
      await env.CLICKS.put(KV_KEY, JSON.stringify(counts));

      return json({ url: key, count: counts[key], total: sum(counts) });
    }

    // --- RAHASIA (dashboard) ---

    // GET /api/stats — data lengkap, butuh token
    if (request.method === 'GET' && url.pathname === '/api/stats') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      const counts = await readCounts(env);
      return json({ counts, total: sum(counts), ts: Date.now() });
    }

    // DELETE /api/stats — reset semua hitungan, butuh token
    if (request.method === 'DELETE' && url.pathname === '/api/stats') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      await env.CLICKS.put(KV_KEY, JSON.stringify({}));
      return json({ ok: true, total: 0 });
    }

    return json({ ok: true, service: 'jpx-click-counter' });
  },
};
