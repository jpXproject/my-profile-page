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
 * Endpoint AUTH:
 *   GET  /api/auth/github            → redirect ke GitHub OAuth
 *   POST /api/auth/password          → login pakai DASH_SECRET → token 7 hari
 *   POST /api/auth/validate          → cek token valid
 *   POST /api/auth/logout            → hapus token
 *
 * Secret dibaca dari env.DASH_SECRET (dipasang via wrangler secret).
 */

const KV_KEY = 'counts';
const EVENTS_KEY = 'click_events';
const CONFIG_KEY = 'site_config';
const AUTH_KEY = 'admin_auth_tokens';
const ALLOWED_USERS_KEY = 'allowed_github_users';
const RATE_LIMIT_MAX = 30; // max requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/* Host yang boleh menerima redirect balik setelah login (cegah open-redirect / token leak) */
const REDIRECT_HOST_ALLOWLIST = [
  'jpx-admin.pages.dev',
  'jpx-dashboard-ay5.pages.dev',
  'jpxcode.pages.dev',
  'localhost',
  '127.0.0.1',
];

function safeRedirectUri(raw, fallbackOrigin) {
  if (raw) {
    try {
      const u = new URL(raw);
      const host = u.hostname.toLowerCase();
      if (host === new URL(fallbackOrigin).hostname) return u.toString();
      if (REDIRECT_HOST_ALLOWLIST.includes(host)) return u.toString();
    } catch { /* invalid → pakai default */ }
  }
  return fallbackOrigin + '/admin.html';
}

/* Sanitasi key klik: buang karakter HTML & kontrol */
function sanitizeKey(raw) {
  if (typeof raw !== 'string') return 'unknown';
  const cleaned = raw
    .replace(/[<>"']/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  return cleaned ? cleaned.slice(0, 200) : 'unknown';
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/* Buang tag HTML dari teks + batasi panjang */
function cleanText(v, max = 300) {
  if (typeof v !== 'string') return '';
  return v.replace(/[<>]/g, '').trim().slice(0, max);
}

function cleanUrl(v, max = 500) {
  if (typeof v !== 'string') return '';
  const u = v.trim().slice(0, max);
  return /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : '';
}

/* Validasi + sanitasi struktur config sebelum disimpan */
function sanitizeConfig(raw) {
  if (!isPlainObject(raw)) throw new Error('config_must_be_object');
  const str = (v, max) => cleanText(v, max);
  const cfg = {
    name: str(raw.name, 120) || 'Jpx Project',
    role: str(raw.role, 120),
    bio: str(raw.bio, 500),
    taglines: Array.isArray(raw.taglines) ? raw.taglines.slice(0, 10).map(t => str(t, 200)).filter(Boolean) : [],
    photoAvatar: Array.isArray(raw.photoAvatar) ? raw.photoAvatar.slice(0, 10).map(t => str(t, 200)).filter(Boolean) : [],
    photoBg: Array.isArray(raw.photoBg) ? raw.photoBg.slice(0, 10).map(t => str(t, 200)).filter(Boolean) : [],
    prompt: str(raw.prompt, 120),
    windowTitle: str(raw.windowTitle, 80),
    footText: str(raw.footText, 200),
    siteUrl: cleanUrl(raw.siteUrl, 200),
    clicksApi: cleanUrl(raw.clicksApi, 200),
    colors: isPlainObject(raw.colors)
      ? Object.fromEntries(Object.entries(raw.colors).slice(0, 12).map(([k, v]) => [String(k).slice(0, 30), cleanText(v, 30)]))
      : {},
    links: Array.isArray(raw.links) ? raw.links.slice(0, 25).map(l => ({
      title: str(l.title, 100),
      sub: str(l.sub, 200),
      url: cleanUrl(l.url, 500),
      icon: str(l.icon, 12),
      featured: !!l.featured,
      badge: str(l.badge, 60),
    })) : [],
    socials: Array.isArray(raw.socials) ? raw.socials.slice(0, 32).map(s => ({
      icon: str(s.icon, 20),
      label: str(s.label, 40),
      url: cleanUrl(s.url, 500),
    })) : [],
    terminal: Array.isArray(raw.terminal) ? raw.terminal.slice(0, 60).map(t => ({
      type: t.type === 'output' || t.type === 'prompt' || t.type === 'empty' ? t.type : 'output',
      text: str(t.text, 200),
      delay: Math.min(Math.max(Number(t.delay) || 300, 0), 10000),
      isFinal: !!t.isFinal,
    })) : [],
  };
  return cfg;
}

const MAX_CONFIG_BYTES = 100 * 1024; // 100 KB

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

async function readCounts(env) {
  try { return JSON.parse((await env.CLICKS.get(KV_KEY)) || '{}') || {}; }
  catch { return {}; }
}

async function readConfig(env) {
  try {
    const saved = await env.CLICKS.get(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // Return default config
  return {
    name: "Jpx Project",
    role: "Creator · Builder · AI Enthusiast",
    bio: "Halo! Selamat datang di Jpx Project — semua link penting ada di bawah.",
    taglines: ["🚀 Klik tombol paling atas — AI coding GRATIS!", "Membuat sesuatu yang berguna ✦"],
    photoAvatar: ["avatar.jpg"],
    photoBg: ["bg.jpg"],
    links: [
      { title: "🚀 AI Coding GRATIS", sub: "Build anything with AI", url: "https://freebuff.com", featured: true, badge: "⭐ Recommended" },
      { title: "GitHub", sub: "Kode & open-source", url: "https://github.com/jpXproject", icon: "gh" }
    ],
    socials: [
      { icon: "ig", url: "https://instagram.com/jepanx" },
      { icon: "wa", url: "https://wa.me/6285749409040" }
    ]
  };
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
 * Rate limiter berbasis KV (persisten lintas isolate).
 * KV eventual-consistent, jadi ada toleransi kecil — jauh lebih baik
 * daripada store in-memory yang reset per isolate.
 */
async function checkRateLimit(env, ip, limit = RATE_LIMIT_MAX, windowSec = 60) {
  const key = 'rl_' + ip;
  const now = Date.now();
  let entry = null;
  try {
    const data = await env.CLICKS.get(key);
    if (data) entry = JSON.parse(data);
  } catch { /* dianggap baru */ }
  if (!entry || now - entry.reset > windowSec * 1000) {
    await env.CLICKS.put(key, JSON.stringify({ count: 1, reset: now }), { expirationTtl: windowSec + 5 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  await env.CLICKS.put(key, JSON.stringify(entry), { expirationTtl: windowSec + 5 });
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

/* ============================================================
   OAUTH FUNCTIONS
   ============================================================ */

// Generate a random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Get allowed GitHub users from KV
async function getAllowedUsers(env) {
  try {
    const users = await env.CLICKS.get(ALLOWED_USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
}

// Save allowed users to KV
async function saveAllowedUsers(env, users) {
  await env.CLICKS.put(ALLOWED_USERS_KEY, JSON.stringify(users));
}

// Generate auth token
async function createAuthToken(env, githubUser) {
  const tokens = await readAuthTokens(env);
  const token = generateToken();
  tokens[token] = {
    user: githubUser.login,
    name: githubUser.name || githubUser.login,
    avatar: githubUser.avatar_url,
    created: Date.now(),
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  await env.CLICKS.put(AUTH_KEY, JSON.stringify(tokens));
  return token;
}

// Read auth tokens
async function readAuthTokens(env) {
  try {
    const tokens = await env.CLICKS.get(AUTH_KEY);
    return tokens ? JSON.parse(tokens) : {};
  } catch {
    return {};
  }
}

// Validate auth token
async function validateAuthToken(env, token) {
  const tokens = await readAuthTokens(env);
  const tokenData = tokens[token];
  if (!tokenData) return null;
  if (Date.now() > tokenData.expires) {
    // Token expired, remove it
    delete tokens[token];
    await env.CLICKS.put(AUTH_KEY, JSON.stringify(tokens));
    return null;
  }
  return tokenData;
}

// Exchange GitHub code for user info
async function exchangeGithubCode(code, env) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code
    })
  });
  
  const data = await response.json().catch(() => null);
  if (!data || !data.access_token) return null;
  
  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${data.access_token}`,
      'User-Agent': 'Jpx-Admin-App'
    }
  });
  
  return userResponse.json().catch(() => null);
}

// Check if user is allowed (deny-by-default)
async function isUserAllowed(env, githubUser) {
  const allowedUsers = await getAllowedUsers(env);
  if (allowedUsers.includes(githubUser.login)) return true;
  // Login pertama pemilik (env.GITHUB_OWNER) mengunci allowlist
  if (allowedUsers.length === 0 && env.GITHUB_OWNER && githubUser.login === env.GITHUB_OWNER) {
    allowedUsers.push(githubUser.login);
    await saveAllowedUsers(env, allowedUsers);
    return true;
  }
  return false;
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
        key = sanitizeKey(body.url || 'unknown');
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
      if (!(await checkRateLimit(env, clientIP))) {
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
      if (!(await checkRateLimit(env, clientIP))) {
        return json({ error: 'rate_limit_exceeded', message: 'Terlalu banyak request. Coba lagi dalam 1 menit.' }, 429);
      }
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      await env.CLICKS.put(KV_KEY, JSON.stringify({}));
      await env.CLICKS.put(EVENTS_KEY, JSON.stringify([]));
      return json({ ok: true, total: 0 });
    }

    // --- CONFIG API ---

    // GET /api/config — public config untuk halaman utama
    if (request.method === 'GET' && url.pathname === '/api/config') {
      const config = await readConfig(env);
      return json({ config });
    }

    // PUT /api/config — update config (butuh auth via DASH_SECRET atau OAuth token)
    if (request.method === 'PUT' && url.pathname === '/api/config') {
      const clientIP = getClientIP(request);
      if (!(await checkRateLimit(env, clientIP, 20))) {
        return json({ error: 'rate_limit_exceeded', message: 'Terlalu banyak request. Coba lagi dalam 1 menit.' }, 429);
      }
      const ctype = (request.headers.get('content-type') || '').toLowerCase();
      if (!ctype.includes('application/json')) {
        return json({ error: 'content_type_must_be_json' }, 415);
      }
      // Check for OAuth token first
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      
      let isAuthenticated = false;
      
      // Check if it's a valid OAuth token
      if (token && token.length > 32) {
        const tokenData = await validateAuthToken(env, token);
        if (tokenData) isAuthenticated = true;
      }
      
      // Check if it's DASH_SECRET
      if (!isAuthenticated && authorized(request, env)) {
        isAuthenticated = true;
      }
      
      if (!isAuthenticated) return json({ error: 'unauthorized' }, 401);
      
      let raw;
      try {
        raw = await request.text();
      } catch {
        return json({ error: 'invalid_body' }, 400);
      }
      if (raw.length > MAX_CONFIG_BYTES) {
        return json({ error: 'config_too_large', message: 'Config melebihi 100 KB.' }, 413);
      }
      try {
        const newConfig = sanitizeConfig(JSON.parse(raw));
        await env.CLICKS.put(CONFIG_KEY, JSON.stringify(newConfig));
        return json({ ok: true, config: newConfig });
      } catch (e) {
        return json({ error: e.message === 'config_must_be_object' ? 'config_must_be_object' : 'invalid_json' }, 400);
      }
    }

    // --- AUTH API ---

    // GET /api/auth/github — redirect ke GitHub OAuth
    if (request.method === 'GET' && url.pathname === '/api/auth/github') {
      if (!env.GITHUB_CLIENT_ID) {
        return json({ error: 'oauth_not_configured', message: 'GITHUB_CLIENT_ID belum dipasang di worker.' }, 503);
      }
      const state = generateToken(); // CSRF protection
      const redirectUri = safeRedirectUri(url.searchParams.get('redirect_uri'), url.origin);
      
      // Store state in KV for verification
      await env.CLICKS.put(`oauth_state_${state}`, JSON.stringify({
        created: Date.now(),
        redirectUri
      }), { expirationTtl: 300 }); // 5 minutes expiry
      
      const githubUrl = new URL('https://github.com/login/oauth/authorize');
      githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID || '');
      githubUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth/github/callback`);
      githubUrl.searchParams.set('scope', 'read:user');
      githubUrl.searchParams.set('state', state);
      
      return Response.redirect(githubUrl.toString(), 302);
    }

    // GET /api/auth/github/callback — handle GitHub OAuth callback
    if (request.method === 'GET' && url.pathname === '/api/auth/github/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      if (!code || !state) {
        return new Response('Missing code or state parameter', { status: 400 });
      }
      
      // Verify state (CSRF protection)
      const stateData = await env.CLICKS.get(`oauth_state_${state}`);
      if (!stateData) {
        return new Response('Invalid or expired state parameter', { status: 400 });
      }
      
      // Clean up state
      await env.CLICKS.delete(`oauth_state_${state}`);
      
      let githubUser = null;
      try {
        githubUser = await exchangeGithubCode(code, env);
      } catch {
        return new Response('Failed to authenticate with GitHub', { status: 502 });
      }
      if (!githubUser || githubUser.message) {
        return new Response('Failed to authenticate with GitHub', { status: 400 });
      }
      
      // Check if user is allowed (deny-by-default)
      const allowed = await isUserAllowed(env, githubUser);
      if (!allowed) {
        return new Response(`User ${githubUser.login} is not authorized to access admin panel.`, { status: 403 });
      }
      
      // Create auth token
      const token = await createAuthToken(env, githubUser);
      
      // Parse state data for redirect URI (re-validate host)
      let stateInfo = {};
      try { stateInfo = JSON.parse(stateData); } catch { /* pakai default */ }
      
      // Redirect back to admin with token (hanya host yang diizinkan)
      const redirectUrl = new URL(safeRedirectUri(stateInfo.redirectUri || '', url.origin));
      redirectUrl.searchParams.set('token', token);
      redirectUrl.searchParams.set('user', githubUser.login);
      redirectUrl.searchParams.set('name', githubUser.name || githubUser.login);
      redirectUrl.searchParams.set('avatar', githubUser.avatar_url);
      
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // POST /api/auth/validate — validate token
    if (request.method === 'POST' && url.pathname === '/api/auth/validate') {
      try {
        const { token } = await request.json();
        const tokenData = await validateAuthToken(env, token);
        if (!tokenData) {
          return json({ valid: false, error: 'Invalid or expired token' }, 401);
        }
        return json({ valid: true, user: tokenData });
      } catch {
        return json({ error: 'Invalid request' }, 400);
      }
    }

    // POST /api/auth/logout — logout (remove token)
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      try {
        const { token } = await request.json();
        const tokens = await readAuthTokens(env);
        if (tokens[token]) {
          delete tokens[token];
          await env.CLICKS.put(AUTH_KEY, JSON.stringify(tokens));
        }
        return json({ ok: true });
      } catch {
        return json({ error: 'Invalid request' }, 400);
      }
    }

    // POST /api/auth/password — login via password (DASH_SECRET), token 7 hari
    if (request.method === 'POST' && url.pathname === '/api/auth/password') {
      const clientIP = getClientIP(request);
      if (!(await checkRateLimit(env, clientIP))) {
        return json({ error: 'rate_limit_exceeded', message: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, 429);
      }
      try {
        const { password } = await request.json();
        if (typeof password !== 'string' || !password) {
          return json({ error: 'password_required' }, 400);
        }
        if (!env.DASH_SECRET) {
          return json({ error: 'password_not_configured', message: 'DASH_SECRET belum dipasang di worker (wrangler secret).' }, 503);
        }
        if (!safeEqual(password, env.DASH_SECRET)) {
          return json({ error: 'invalid_password' }, 401);
        }
        const token = await createAuthToken(env, { login: 'admin', name: 'Admin', avatar_url: '' });
        return json({ ok: true, token, user: { login: 'admin', name: 'Admin', avatar: '' } });
      } catch {
        return json({ error: 'invalid_request' }, 400);
      }
    }

    // GET /api/auth/users — get allowed users (admin only)
    if (request.method === 'GET' && url.pathname === '/api/auth/users') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      const users = await getAllowedUsers(env);
      return json({ users });
    }

    // POST /api/auth/users — add allowed user (admin only)
    if (request.method === 'POST' && url.pathname === '/api/auth/users') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      try {
        const { username } = await request.json();
        if (typeof username !== 'string' || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) {
          return json({ error: 'invalid_username' }, 400);
        }
        
        const users = await getAllowedUsers(env);
        if (!users.includes(username)) {
          users.push(username);
          await saveAllowedUsers(env, users);
        }
        return json({ ok: true, users });
      } catch {
        return json({ error: 'Invalid request' }, 400);
      }
    }

    // DELETE /api/auth/users — remove allowed user (admin only)
    if (request.method === 'DELETE' && url.pathname === '/api/auth/users') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401);
      try {
        const { username } = await request.json();
        if (typeof username !== 'string' || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) {
          return json({ error: 'invalid_username' }, 400);
        }
        
        let users = await getAllowedUsers(env);
        users = users.filter(u => u !== username);
        await saveAllowedUsers(env, users);
        return json({ ok: true, users });
      } catch {
        return json({ error: 'Invalid request' }, 400);
      }
    }

    return json({ ok: true, service: 'jpx-click-counter' });
  },
};
