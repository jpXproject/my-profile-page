# 🔒 PANDUAN LENGKAP: WEB SECURITY & CODE PROTECTION

> **Panduan ini untuk:** Developer pemula-menengah yang ingin memahami cara melindungi website dari inspeksi dan pencurian kode.

---

## 📋 DAFTAR ISI

1. [Pengertian Dasar](#1-pengertian-dasar)
2. [Level Keamanan](#2-level-keamanan)
3. [Teknik Proteksi Client-Side](#3-teknik-proteksi-client-side)
4. [Teknik Proteksi Server-Side](#4-teknik-proteksi-server-side)
5. [Tools & Libraries](#5-tools--libraries)
6. [Best Practices](#6-best-practices)
7. [Contoh Implementasi](#7-contoh-implementasi)
8. [Testing & Verification](#8-testing--verification)
9. [Limitasi & Realita](#9-limitasi--realita)
10. [Checklist Keamanan](#10-checklist-keamanan)

---

## 1. PENGERTIAN DASAR

### 🤔 Kenapa Perlu Proteksi?

```
┌─────────────────────────────────────────────────────────────┐
│  USER BROWSER                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HTML + CSS + JavaScript = SOURCE CODE               │   │
│  │  ↓                                                   │   │
│  │  Browser DOWNLOAD semua kode ke komputer user        │   │
│  │  ↓                                                   │   │
│  │  User bisa INSPECT, COPY, MODIFY kode               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ FAKTA: Apapun yang dikirim ke browser,                │
│     BISA dilihat oleh user!                                 │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Yang Ingin Kita Lindungi:

| Target | Contoh | Prioritas |
|--------|--------|-----------|
| **Source Code** | HTML, CSS, JavaScript | ⭐⭐⭐ |
| **Logic/Alogritma** | Formula bisnis, algoritma | ⭐⭐⭐⭐ |
| **API Keys** | Token akses, secrets | ⭐⭐⭐⭐⭐ |
| **Data Sensitif** | Password, email, API | ⭐⭐⭐⭐⭐ |
| **Desain/UI** | Tampilan, animasi | ⭐⭐ |

---

## 2. LEVEL KEAMANAN

### 🎚️ Security Level Matrix

```
Level 1: BASIC (Mudah diterapkan)
├── Disable right-click
├── Disable keyboard shortcuts
└── Basic CSS protection

Level 2: INTERMEDIATE (Perlu effort)
├── JavaScript obfuscation
├── Code minification
├── Anti-debug tools
└── Content Security Policy

Level 3: ADVANCED (Butuh expertise)
├── Server-side rendering
├── WebAssembly for critical logic
├── API gateway protection
└── Rate limiting

Level 4: MAXIMUM (Enterprise grade)
├── All above combined
├── Custom encryption
├── Hardware security modules
└── Professional security audit
```

---

## 3. TEKNIK PROTEKSI CLIENT-SIDE

### 3.1 🚫 Disable Right-Click

**Kegunaan:** Mencegah user klik kanan → Inspect Element

```javascript
// Cara 1: Basic
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Cara 2: Dengan pesan
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    alert('Right-click is disabled for security reasons');
    return false;
});

// Cara 3: Custom context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    // Tampilkan custom menu kamu sendiri
    showCustomMenu(e.pageX, e.pageY);
});
```

**Efektivitas:** ⭐⭐ (Mudah di-bypass)

---

### 3.2 ⌨️ Block Keyboard Shortcuts

**Kegunaan:** Mencegah F12, Ctrl+Shift+I, Ctrl+U, dll

```javascript
document.addEventListener('keydown', function(e) {
    // Block F12 (DevTools)
    if (e.keyCode === 123) {
        return false;
    }
    
    // Block Ctrl+Shift+I (Inspect)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        return false;
    }
    
    // Block Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        return false;
    }
    
    // Block Ctrl+Shift+C (Element Picker)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        return false;
    }
    
    // Block Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode === 85) {
        return false;
    }
    
    // Block Ctrl+S (Save Page)
    if (e.ctrlKey && e.keyCode === 83) {
        return false;
    }
    
    // Block Ctrl+A (Select All)
    if (e.ctrlKey && e.keyCode === 65) {
        return false;
    }
    
    // Block Ctrl+P (Print)
    if (e.ctrlKey && e.keyCode === 80) {
        return false;
    }
});
```

**Efektivitas:** ⭐⭐ (Mudah di-bypass via menu browser)

---

### 3.3 🔍 DevTools Detection

**Kegunaan:** Mendeteksi jika DevTools dibuka

```javascript
// Method 1: Console Table Detection
(function() {
    var element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            // DevTools terbuka jika console.log menampilkan element
            throw new Error('DevTools detected');
        }
    });
    
    console.log(element);
})();

// Method 2: Size Detection
(function() {
    var threshold = 160;
    var devToolsOpen = false;
    
    function check() {
        var widthThreshold = window.outerWidth - window.innerWidth > threshold;
        var heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                onDevToolsOpen();
            }
        } else {
            devToolsOpen = false;
        }
    }
    
    function onDevToolsOpen() {
        console.clear();
        console.log('%c⚠️ WARNING: DevTools Detected!', 'color: red; font-size: 20px');
        // Optional: Redirect atau show warning
    }
    
    setInterval(check, 1000);
})();

// Method 3: Debugger Statement
(function() {
    function detectDevTools() {
        var startTime = new Date();
        debugger; // Ini akan pause jika DevTools terbuka
        var endTime = new Date();
        
        if (endTime - startTime > 100) {
            // DevTools terbuka
            alert('DevTools detected!');
        }
    }
    
    setInterval(detectDevTools, 1000);
})();
```

**Efektivitas:** ⭐⭐⭐ (Deteksi delayed, tapi bisa di-bypass)

---

### 3.4 🗜️ JavaScript Obfuscation

**Kegunaan:** Mengubah kode jadi sulit dibaca

#### Manual Obfuscation:

```javascript
// SEBELUM (Clean code):
const name = "Jpx Project";
const links = ["github", "threads", "tiktok"];

function getLink(index) {
    return links[index];
}

// SESUDAH (Obfuscated):
var _0x4a2f = ['Jpx Project', 'github', 'threads', 'tiktok'];
var _0x8c1e = function(_0x2d3a) {
    return _0x4a2f[_0x2d3a];
};
```

#### Menggunakan Tools:

**JavaScript Obfuscator** (https://obfuscator.io/)

```bash
# Install
npm install javascript-obfuscator

# Obfuscate file
javascript-obfuscator input.js --output output.js --compact true --controlFlowFlattening true
```

**Opsi obfuscation:**
- `--compact true` → Kompres jadi 1 baris
- `--controlFlowFlattening true` → Ubah flow control
- `--deadCodeInjection true` → Suntik kode mati
- `--stringArray true` → Encode semua string
- `--rotateStringArray true` → Acak string array

**Efektivitas:** ⭐⭐⭐ (Sulit dibaca, tapi bukan mustahil)

---

### 3.5 📦 Code Minification

**Kegunaan:** Kompres kode agar lebih kecil & sulit dibaca

```bash
# HTML Minification
npm install html-minifier
html-minifier --collapse-whitespace index.html -o index.min.html

# CSS Minification
npm install cssnano
cssnano styles.css styles.min.css

# JavaScript Minification (sudah termasuk di obfuscator)
terser input.js -o output.js -c -m
```

**Efektivitas:** ⭐⭐ (Hanya kompres, bukan enkripsi)

---

### 3.6 🛡️ CSS Protection

```css
/* Disable text selection */
.no-select {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

/* Disable copy */
.no-copy {
    -webkit-user-select: none;
    user-select: none;
    pointer-events: none;
}

/* Hide scrollbar (opsional) */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Prevent image drag */
img {
    -webkit-user-drag: none;
    user-select: none;
}
```

---

### 3.7 🔐 Content Security Policy (CSP)

**Kegunaan:** Mencegah injeksi kode malicious

```html
<!-- Tambahkan di <head> -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https://jpx-click-counter.panx-je.workers.dev;">
```

**Efektivitas:** ⭐⭐⭐⭐ (Melindugi dari injection, bukan dari inspection)

---

## 4. TEKNIK PROTEKSI SERVER-SIDE

### 4.1 🖥️ Server-Side Rendering (SSR)

**Kegunaan:** Generate HTML di server, user hanya dapat hasil jadi

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │     │   Server     │     │   Database   │
│   Request    │────▶│   Process    │────▶│   Data       │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                     ┌──────────────┐
                     │   Generated  │
                     │   HTML       │
                     └──────────────┘
                           │
                           ▼
                     ┌──────────────┐
                     │   User       │
                     │   Browser    │
                     │   (no source)│
                     └──────────────┘
```

**Contoh dengan Cloudflare Workers:**

```javascript
// worker.js
export default {
    async fetch(request) {
        const data = await getDataFromDB();
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head><title>${data.title}</title></head>
        <body>
            <h1>${data.name}</h1>
            <p>${data.bio}</p>
            <!-- Tidak ada source code yang dikirim ke client -->
        </body>
        </html>
        `;
        
        return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
};
```

**Efektivitas:** ⭐⭐⭐⭐⭐ (Paling efektif!)

---

### 4.2 🔌 API Gateway Protection

```javascript
// Rate limiting
const rateLimit = {};

function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 menit
    const maxRequests = 100;
    
    if (!rateLimit[ip]) {
        rateLimit[ip] = [];
    }
    
    // Hapus request lama
    rateLimit[ip] = rateLimit[ip].filter(t => now - t < windowMs);
    
    if (rateLimit[ip].length >= maxRequests) {
        return false; // Rate limit exceeded
    }
    
    rateLimit[ip].push(now);
    return true;
}

// Authentication
function authenticate(request) {
    const token = request.headers.get('Authorization');
    
    if (!token || !isValidToken(token)) {
        throw new Error('Unauthorized');
    }
    
    return true;
}

// Input validation
function validateInput(data) {
    // Sanitize semua input
    const sanitized = {
        name: escapeHtml(data.name),
        email: validateEmail(data.email),
        // ...
    };
    
    return sanitized;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

---

### 4.3 🔑 Secret Management

```javascript
// ❌ JANGAN LAKUKAN INI!
const API_KEY = 'sk-1234567890abcdef'; // Di-hardcode di client-side
const SECRET = 'my-secret-key'; // Di-source code

// ✅ LAKUKAN INI!
// Simpan secrets di environment variables (server-side only)
// Cloudflare Workers: gunakan wrangler secret

// Di server:
const API_KEY = process.env.API_KEY; // Atau env.API_KEY di Workers

// Di client-side:
// JANGAN pernah taruh API key!
// Panggil API endpoint kamu sendiri:
const response = await fetch('https://your-api.com/data', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'data' })
});
```

---

## 5. TOOLS & LIBRARIES

### 📦 Proteksi Client-Side

| Tool | Fungsi | Install |
|------|--------|---------|
| **javascript-obfuscator** | JS Obfuscation | `npm i javascript-obfuscator` |
| **terser** | JS Minification | `npm i terser` |
| **html-minifier** | HTML Minification | `npm i html-minifier` |
| **cssnano** | CSS Minification | `npm i cssnano` |
| **UglifyJS** | JS Obfuscation | `npm i uglify-js` |

### 📦 Proteksi Server-Side

| Tool | Fungsi | Install |
|------|--------|---------|
| **helmet** | Security Headers | `npm i helmet` |
| **express-rate-limit** | Rate Limiting | `npm i express-rate-limit` |
| **csurf** | CSRF Protection | `npm i csurf` |
| **xss** | XSS Sanitization | `npm i xss` |
| **dotenv** | Env Variables | `npm i dotenv` |

---

## 6. BEST PRACTICES

### ✅ DO's (Yang Harus Dilakukan)

```javascript
// 1. Selalu validasi input di server
function validateInput(data) {
    if (typeof data.name !== 'string') throw new Error('Invalid name');
    if (data.name.length > 100) throw new Error('Name too long');
    // ...
}

// 2. Gunakan HTTPS
// Selalu redirect HTTP ke HTTPS

// 3. Implement CSP
// Seperti contoh di section 3.7

// 4. Log semua akses
function logAccess(request) {
    console.log({
        ip: request.headers.get('CF-Connecting-IP'),
        url: request.url,
        time: new Date().toISOString()
    });
}

// 5. Update dependencies regularly
// npm audit
// npm update
```

### ❌ DON'Ts (Yang Tidak Boleh Dilakukan)

```javascript
// 1. JANGAN taruh secrets di client-side
const API_KEY = 'sk-xxx'; // ❌

// 2. JANGAN trust client-side validation saja
if (clientSideValid) { // ❌ Harus validate di server juga
    saveData();
}

// 3. JANGAN gunakan eval()
eval(userInput); // ❌ Sangat berbahaya!

// 4. JANGAN expose error detail ke user
catch (error) {
    return error.message; // ❌ Bisa leak info
}

// 5. JANGAN gunakan default credentials
const password = 'admin'; // ❌
```

---

## 7. CONTOH IMPLEMENTASI

### 🎯 Full Protection Setup

```javascript
// ===== server.js =====
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const express = require('express');
const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100 // 100 request per IP
});
app.use(limiter);

// 3. CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://yourdomain.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// 4. Input Sanitization
app.use(express.json({ limit: '10kb' }));

// 5. Routes
app.post('/api/config', authenticate, (req, res) => {
    const sanitized = sanitizeInput(req.body);
    saveConfig(sanitized);
    res.json({ success: true });
});

// ===== client.html =====
<!-- 
1. Obfuscated JavaScript
2. No sensitive data in source
3. CSP meta tag
4. Disable right-click
5. Block keyboard shortcuts
-->

<script>
// Obfuscated code here
var _0x1234 = ['data', 'more', 'data'];
// ...
</script>
```

---

## 8. TESTING & VERIFICATION

### 🧪 Cara Test Proteksi

```bash
# 1. Test Right-Click
# Buka website → Klik kanan → Harus diblock

# 2. Test Keyboard Shortcuts
# Tekan F12 → Harus tidak terjadi apapun
# Tekan Ctrl+U → Harus tidak terjadi apapun

# 3. Test DevTools
# Buka DevTools via menu browser
# Cek console → Harus ada warning

# 4. Test Source Code
# View Source → Harus tidak ada/terbaca sulit

# 5. Test API Security
curl -X POST https://your-api.com/config \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
# Harus return 401 Unauthorized
```

### 🔍 Browser DevTools Test

```
1. Buka Chrome DevTools (F12 atau menu)
2. Tab Elements → Cek apakah bisa inspect
3. Tab Console → Cek apakah ada error/warning
4. Tab Sources → Cek apakah source code terlihat
5. Tab Network → Cek API calls
```

---

## 9. LIMITASI & REALITA

### ⚠️ Kenapa 100% Security TIDAK Mungkin

```
┌─────────────────────────────────────────────────────────────┐
│                    REALITA KEAMANAN                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ Yang TIDAK bisa dilakukan:                              │
│  • 100% hide source code dari browser                       │
│  • Mencegah semua cara inspect                              │
│  • Membuat kode tidak bisa di-decrypt                       │
│                                                             │
│  ✅ Yang BISA dilakukan:                                    │
│  • Membuat kode SULIT dibaca                                │
│  • Mencegah casual user                                     │
│  • Mendeteksi unauthorized access                           │
│  • Melindungi data sensitif di server                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Analogi Sederhana

```
Seperti rumah:

🔒 Pintu terkunci → Mencegah orang masuk sembarangan
🔒 Alarm → Mendeteksi intrusi
🔒 CCTV → Monitoring
❌ TIDAK ada rumah yang 100% aman dari perampok profesional

Sama dengan website:
🔒 Proteksi client-side → Mencegah casual user
🔒 API protection → Mendeteksi unauthorized access
❌ TIDAK ada website yang 100% aman dari hacker profesional
```

---

## 10. CHECKLIST KEAMANAN

### 📋 Pre-Deployment Checklist

```
□ Client-Side Protection
  □ Disable right-click
  □ Block keyboard shortcuts
  □ DevTools detection
  □ JavaScript obfuscation
  □ CSS minification
  □ CSP meta tag

□ Server-Side Protection
  □ HTTPS enabled
  □ Rate limiting
  □ Input validation
  □ Authentication
  □ CORS configured
  □ Error handling (no leak)

□ Data Protection
  □ No secrets in client-side
  □ API keys in environment variables
  □ Sensitive data encrypted
  □ Database access secured

□ Monitoring
  □ Access logging
  □ Error tracking
  □ Rate limit alerts
  □ Security audits scheduled
```

---

## 📚 REFERENSI TAMBAHAN

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Cloudflare Security](https://developers.cloudflare.com/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🎓 KESIMPULAN

```
┌─────────────────────────────────────────────────────────────┐
│                    PESAN UTAMA                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. TIDAK ada 100% security untuk client-side               │
│                                                             │
│  2. Gunakan LAYERED SECURITY (berlapis):                    │
│     • Layer 1: Client-side protection (obfuscation)         │
│     • Layer 2: Server-side protection (validation)          │
│     • Layer 3: Network protection (HTTPS, CSP)              │
│     • Layer 4: Monitoring & logging                         │
│                                                             │
│  3. Yang PALING PENTING:                                    │
│     • Jangan taruh secrets di client-side                   │
│     • Selalu validate di server                             │
│     • Gunakan HTTPS                                         │
│     • Monitor semua akses                                   │
│                                                             │
│  4. Proteksi yang cukup untuk website seperti linktree:     │
│     • Obfuscation + Anti-debug = SUDAH CUKUP               │
│     • Untuk high-security app, gunakan SSR                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. HASIL AUDIT KEAMANAN — 13 Agustus 2026

> Audit menyeluruh dilakukan oleh Buffy (Freebuff AI) pada stack: Cloudflare Pages (jpxcode, jpx-admin, jpx-dashboard) + Worker `jpx-click-counter` + KV.

### 🔴 Temuan Kritis (sudah diperbaiki)

| # | Temuan | Risiko | Perbaikan |
|---|--------|--------|-----------|
| 1 | **OAuth open-redirect → token bocor** — `redirect_uri` di `/api/auth/github` diterima apa adanya; setelah login, token dikirim ke URL itu | Attacker bisa curi token admin via link jebakan | Whitelist host redirect (`jpx-admin.pages.dev`, `jpx-dashboard-ay5.pages.dev`, `jpxcode.pages.dev`, `localhost`) + validasi ulang di callback |
| 2 | **Allow-anyone saat allowlist kosong** — siapa pun pengguna GitHub bisa login jadi admin kalau `ALLOWED_USERS` belum diisi | Takeover admin panel | **Deny-by-default**: hanya `env.GITHUB_OWNER` yang bisa login pertama & mengunci allowlist; user lain → 403 |

### 🟠 Temuan Tinggi (sudah diperbaiki)

| # | Temuan | Perbaikan |
|---|--------|-----------|
| 3 | `/api/click` menerima key HTML (`<img onerror=...>`) → tersimpan & dirender dashboard | `sanitizeKey()`: buang karakter HTML/kontrol, batasi 200 karakter |
| 4 | `PUT /api/config` tanpa batas: tanpa rate limit, tanpa batas ukuran, tanpa validasi | Rate limit 20/menit/IP (KV), `Content-Type` wajib JSON → 415, body > 100 KB → 413, `sanitizeConfig()` validasi struktur + buang HTML + clamp panjang + URL hanya http/https/mailto/tel |
| 5 | Rate limiter in-memory (per-isolate, mudah di-bypass) | **Rate limiter berbasis KV** (persisten lintas isolate) untuk password, stats, config PUT |
| 6 | XSS class di `dist/index.html` — tagline, judul/sub/badge link dari config di-render via innerHTML tanpa escape; URL bisa `javascript:` | `esc()` untuk semua teks config + `safeUrl()` (hanya http/https) untuk href |

### 🟡 Temuan Rendah (sudah diperbaiki)

- Username `/api/auth/users` tidak divalidasi → wajib regex GitHub (`^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$`) → 400
- Avatar admin di-render tanpa escape → di-escape atribut
- Belum ada security headers → ditambahkan ke semua respons worker: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Strict-Transport-Security`
- Halaman Pages belum punya headers → file `_headers` di 3 proyek (CSP + X-Frame-Options DENY untuk admin/dashboard)
- `exchangeGithubCode` bisa throw (network error) → di-wrapper jadi 502 generik

### ✅ Yang Sudah Aman Sebelumnya

- Secret hanya di `wrangler secret` (`DASH_SECRET`, `GITHUB_CLIENT_ID/SECRET`) — tidak pernah di kode klien
- KV hanya bisa diakses worker (tidak ada API publik)
- Perbandingan token/password pakai timing-safe (`safeEqual`)
- CSRF state di OAuth (5 menit kedaluwarsa)
- Dashboard analytics sudah `escapeHtml` sebelum innerHTML
- Terminal animasi & prompt pakai `textContent` (aman)

### 📋 Hasil Verifikasi (22 test worker + 14 test XSS browser)

Semua lolos: security headers, preflight PUT, sanitasi key klik, batas config, open-redirect diblokir, deny-by-default OAuth, rate limit KV (password & PUT), validasi username, dan regresi endpoint lama. Halaman publik standalone tetap normal (5 link, counter, reset, tanpa error).

### ⚠️ Batasan yang Perlu Diketahui

1. **Kode klien tetap bisa dibaca** — obfuscation/anti-inspect hanya memperlambat, tidak menghentikan. Yang benar-benar dilindungi: server, data, dan akses.
2. **KV rate limit eventual-consistent** — toleransi kecil (beberapa request lolos di burst), masih jauh lebih baik dari in-memory.
3. **CSP pakai `'unsafe-inline'`** (karena semua JS inline) — tetap memblokir script eksternal tak dikenal, `object-src`, `base-uri`, `form-action`. Untuk CSP penuh, JS harus dipindah ke file eksternal + hash.
4. **`frame-src https:` di admin** — preview iframe boleh memuat domain apa pun via https (kebutuhan custom siteUrl).
5. **Cloudflare Access (Zero Trust)** & **WAF/Turnstile** belum dipasang — itu lapisan berikutnya (lihat menu di bagian 10).

---

**Dibuat oleh:** Buffy (Freebuff AI)  
**Tanggal:** 13 Agustus 2026 (audit keamanan v2)  
**Versi:** 2.0

> 💡 **Tips:** Simpan panduan ini dan referensikan saat development. Keamanan adalah proses berkelanjutan, bukan sekali set-up!
