# 📋 Panduan Setup GitHub OAuth App

## Langkah 1: Buat GitHub OAuth App

1. Buka https://github.com/settings/developers
2. Klik **"New OAuth App"**
3. Isi form berikut:

| Field | Value |
|-------|-------|
| **Application name** | `Jpx Admin Panel` |
| **Homepage URL** | `https://jpx-admin.pages.dev` |
| **Authorization callback URL** | `https://jpx-click-counter.panx-je.workers.dev/api/auth/github/callback` |

4. Klik **"Register application"**
5. Copy **Client ID** yang muncul
6. Klik **"Generate a new client secret"**
7. Copy **Client Secret** (hanya muncul sekali!)

---

## Langkah 2: Set Environment Variables di Cloudflare Worker

Buka terminal dan jalankan perintah berikut:

```bash
# Set Client ID
cd worker
npx wrangler secret put GITHUB_CLIENT_ID
# Paste Client ID dari GitHub

# Set Client Secret
npx wrangler secret put GITHUB_CLIENT_SECRET
# Paste Client Secret dari GitHub
```

---

## Langkah 3: Update Admin Panel

Update URL Worker di `admin.html`:

```javascript
const workerUrl = 'https://jpx-click-counter.panx-je.workers.dev';
```

---

## Langkah 4: Deploy Ulang

```bash
cd worker && npx wrangler deploy
```

---

## 🔒 Keamanan

- **First User = Admin**: User pertama yang login akan menjadi admin
- **User Whitelist**: Admin bisa menambah user lain yang diizinkan
- **Token Expiry**: Token valid selama 7 hari
- **CSRF Protection**: Setiap login menggunakan state parameter unik

---

## 🧪 Testing

1. Buka https://jpx-admin.pages.dev/admin
2. Klik **"Masuk dengan GitHub"**
3. Login ke GitHub
4. Akan di-redirect ke admin panel

---

## ⚠️ Troubleshooting

### Error "User not authorized"
- Pastikan kamu adalah user pertama yang login
- Atau minta admin menambahkan username kamu

### Error "Invalid state parameter"
- Coba login ulang
- Pastikan URL callback benar

### Token expired
- Login ulang menggunakan GitHub
