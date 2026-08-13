# MASTER TASK — REDESIGN JPX ADMIN PANEL
# ROLE: Senior UI/UX Designer + Front-End Engineer + Responsive Web Engineer

Anda bertugas memperbaiki dan merombak TOTAL tampilan ADMIN PANEL yang sudah ada.

PENTING:
- YANG DIUBAH HANYA ADMIN PANEL.
- JANGAN mengubah desain website/public profile secara langsung.
- Website publik tetap menggunakan struktur dan fungsi yang sudah ada.
- Admin Panel harus menjadi pusat pengelolaan data website.
- Jangan membuat mockup statis. Semua elemen harus benar-benar bekerja dengan data/state aplikasi yang sudah ada.
- Jangan menghapus fitur existing yang masih berfungsi.
- Jangan mengganti framework/project architecture tanpa alasan teknis yang kuat.
- Sebelum mengedit, AUDIT project yang ada terlebih dahulu.

==================================================
1. REFERENSI VISUAL UTAMA
==================================================

Gunakan screenshot referensi yang saya berikan sebagai acuan visual:

STYLE:
Dark Professional Admin Dashboard
Charcoal / near-black background
Red accent utama
Minimalist
Clean
Professional
Modern SaaS Dashboard
High readability
Compact but spacious
Tidak terlalu neon
Tidak cyberpunk
Tidak menggunakan gradient warna-warni berlebihan

WARNA UTAMA:

--bg:
#08090D

--sidebar:
#11131A

--topbar:
#171A22

--card:
#191C24

--card-secondary:
#151820

--input:
#101218

--border:
#252933

--text:
#F5F5F7

--muted:
#737C96

--accent-red:
#FF2028

--accent-red-dark:
#B51219

--accent-red-soft:
rgba(255,32,40,.12)

--success:
#27D17F

Gunakan RED sebagai accent utama:
- active navigation
- primary button
- important statistic
- chart
- notification
- CTA
- focus state
- hover accent

JANGAN:
- membuat seluruh UI merah
- menggunakan neon glow berlebihan
- menggunakan cyberpunk style
- menggunakan glassmorphism berat
- menggunakan background putih
- menggunakan card terlalu bulat
- menggunakan shadow berlebihan

==================================================
2. STRUKTUR ADMIN PANEL
==================================================

Pertahankan fungsi/tab existing jika sudah tersedia.

Struktur utama:

SIDEBAR:

JPX ADMIN

User:
jpXCode
Administrator

Navigation:

Dashboard
Profil
Links
Social Media
Konten
Analytics

----------------

System

Pengaturan
Logout

Gunakan icon yang konsisten.

Navigation active:
background near-black
accent red
red indicator di sisi kiri
text putih

==================================================
3. TOPBAR
==================================================

Topbar:

LEFT:
Hamburger / sidebar toggle
Search

RIGHT:
Message
Notification
User Avatar
jpXCode
Dropdown

Topbar harus sticky.

Desktop:
sidebar fixed

Tablet:
sidebar dapat collapse

Mobile:
sidebar berubah menjadi drawer/off-canvas

==================================================
4. DASHBOARD
==================================================

Buat dashboard utama profesional.

Header:

Dashboard

Ringkasan aktivitas website dan performa link Anda.

Date / period selector di kanan.

STATISTIC CARDS:

1. Today Clicks
2. Total Clicks
3. Today Views
4. Total Views

Setiap card memiliki:

icon
label
angka utama
percentage/change
indikator trend

Contoh:

Today Clicks
1,234
↑ 12.5% vs yesterday

Jangan menggunakan data hardcoded jika project sudah mempunyai data asli.

Gunakan data/state existing.

Jika data backend belum tersedia:
buat data layer/service abstraction yang mudah diganti dengan API/database nantinya.

==================================================
5. CHART
==================================================

Buat dua chart:

A. Worldwide / Link Clicks

B. Clicks & Views

Chart harus responsive.

Chart tidak boleh overflow pada mobile.

Gunakan library chart yang SUDAH ada di project jika tersedia.

Jika belum ada:
gunakan library ringan yang sesuai dengan framework project.

Jangan menambahkan dependency besar tanpa alasan.

Chart harus mengikuti theme:

background:
#191C24

grid:
#252933

primary:
#FF2028

secondary:
#8F1A20

text:
#737C96

==================================================
6. RECENT ACTIVITY
==================================================

Buat section:

Recent Links Activity

Kolom:

Link
Category
Clicks
Last Click
Status
Action

Desktop:
gunakan table.

Tablet/mobile:
ubah menjadi responsive card/list.

JANGAN membuat horizontal overflow pada halaman utama hanya karena table.

==================================================
7. RESPONSIVE — WAJIB
==================================================

INI SANGAT PENTING.

ADMIN PANEL HARUS AUTO SCALE.

Jangan hanya menggunakan:

@media(max-width:768px)

Buat responsive system yang benar.

Target:

320px
360px
375px
390px
414px
480px
600px
768px
820px
1024px
1280px
1366px
1440px
1600px
1920px
2560px+

Layout harus tetap proporsional.

Gunakan:

CSS Grid
Flexbox
clamp()
minmax()
max-width
fluid spacing
fluid typography

Contoh:

font-size:
clamp()

padding:
clamp()

gap:
clamp()

card grid:
repeat(auto-fit, minmax(...))

CONTENT HARUS AUTO SCALE.

JANGAN:
- fixed width yang menyebabkan overflow
- fixed height untuk container utama
- hardcoded desktop dimensions
- horizontal scrolling pada body
- elemen keluar viewport
- chart terpotong
- table menghancurkan layout

==================================================
8. AUTO SCALE SIDEBAR
==================================================

Desktop > 1200px:

Sidebar:
240–260px

Tablet:

Sidebar dapat collapse menjadi icon sidebar.

Mobile:

Sidebar menjadi drawer.

Saat drawer terbuka:
overlay background.

Klik overlay:
drawer tertutup.

Klik menu:
drawer toggle.

State sidebar harus tersimpan jika memungkinkan.

==================================================
9. MOBILE UI
==================================================

Pada mobile:

Topbar:
hamburger
search icon
notification
avatar

Dashboard cards:

1 column

Charts:

1 column

Activity:

responsive cards

Tidak boleh ada:

horizontal page scroll.

Gunakan:

width: 100%
max-width: 100%
min-width: 0

untuk container yang diperlukan.

==================================================
10. AUTO SAVE — WAJIB
==================================================

Semua form Admin Panel harus memiliki AUTO SAVE.

Contoh:

Profil
Nama
Role
Bio
Tagline
Avatar
Background

Links
Social Media
Settings
Tampilan
dll.

Ketika user mengubah field:

JANGAN langsung melakukan request pada setiap keystroke.

Gunakan debounce sekitar:

500–1000ms

Flow:

User mengetik
↓
State berubah
↓
Debounce
↓
Auto Save
↓
Persist data
↓
Update preview
↓
Tampilkan status

Status UI:

Saving...

Saved ✓

Unsaved changes

Save failed

Contoh indikator:

● Saving...

✓ Saved just now

Jika user menutup/reload browser setelah data berhasil disimpan:
data tetap tersedia.

==================================================
11. AUTO SAVE ARCHITECTURE
==================================================

Gunakan single source of truth.

Semua perubahan Admin Panel harus masuk ke global state/config.

Contoh struktur:

siteConfig

{
  profile: {},
  links: [],
  social: {},
  appearance: {},
  settings: {}
}

Jangan membuat state terpisah yang saling tidak sinkron.

Perubahan:

Admin Form
↓
Global State
↓
Persistence
↓
Preview

==================================================
12. LIVE PREVIEW
==================================================

WAJIB.

Admin Panel harus dapat menampilkan LIVE PREVIEW.

Ketika admin mengubah:

Nama
Bio
Tagline
Avatar
Background
Links
Social
Theme

preview langsung berubah.

TIDAK perlu refresh browser.

Flow:

ADMIN FORM
      ↓
GLOBAL STATE
      ↓
LIVE PREVIEW

Preview harus menggunakan data/state yang sama dengan website publik.

JANGAN membuat duplicate data khusus preview.

==================================================
13. PREVIEW MODE
==================================================

Buat tombol:

Preview

atau:

Live Preview

Saat diklik, admin dapat melihat hasil perubahan.

Idealnya sediakan:

Desktop
Tablet
Mobile

preview switch:

[ Desktop ] [ Tablet ] [ Mobile ]

Preview harus auto scale sesuai viewport.

Jika project sudah memiliki halaman public:
gunakan renderer/component public yang sama.

JANGAN membuat desain public kedua yang berbeda.

==================================================
14. AUTOSAVE + PREVIEW
==================================================

Behavior yang diinginkan:

User mengubah:

Nama:
"Jpx Project"

menjadi:

"Jpx Project Labs"

↓

Admin state update

↓

Preview langsung berubah:

"Jpx Project Labs"

↓

Debounce 700ms

↓

Auto Save

↓

Status:

✓ Saved

Tanpa reload.

==================================================
15. UNSAVED CHANGE PROTECTION
==================================================

Jika ada perubahan yang belum tersimpan:

tampilkan:

Unsaved changes

Jika user mencoba:

refresh
close
navigate

dan browser mendukung:

gunakan beforeunload warning.

Jangan mengganggu jika semua sudah saved.

==================================================
16. ERROR HANDLING
==================================================

Auto save harus memiliki:

loading state
success state
error state
retry

Contoh:

Saving...

✓ Saved

⚠ Failed to save

[Retry]

Jangan membuat error diam-diam.

==================================================
17. LOADING STATE
==================================================

Gunakan skeleton loading untuk:

stat cards
charts
table
profile data

Hindari blank screen.

==================================================
18. ACCESSIBILITY
==================================================

Pastikan:

button mempunyai accessible label
input mempunyai label
keyboard navigation bekerja
focus state terlihat
contrast cukup
tooltip untuk icon-only button
aria-label jika diperlukan

==================================================
19. UI CONSISTENCY
==================================================

Gunakan design tokens.

Jangan hardcode warna di banyak file.

Buat central theme:

colors
spacing
radius
typography
border
shadow

Contoh:

--color-bg
--color-surface
--color-border
--color-text
--color-muted
--color-primary
--color-success

==================================================
20. COMPONENT ARCHITECTURE
==================================================

Jangan membuat satu file dashboard raksasa.

Pisahkan komponen sesuai kebutuhan.

Contoh:

AdminLayout
Sidebar
Topbar
Dashboard
StatCard
ChartCard
ActivityTable
ProfileForm
LinksManager
SocialManager
SettingsPanel
LivePreview
SaveStatus
ResponsivePreview

Jika project menggunakan React/Next.js:

gunakan component architecture yang clean.

Jika project menggunakan framework lain:
ikuti architecture existing.

==================================================
21. DATA FLOW
==================================================

Gunakan:

Single Source of Truth

Contoh:

siteConfig
      ↓
Admin State
      ↓
Persistence
      ↓
Public Website
      ↓
Live Preview

Admin dan Public Website TIDAK BOLEH memiliki konfigurasi yang berbeda.

==================================================
22. PERFORMANCE
==================================================

Jangan membuat dashboard berat.

Optimalkan:

images
charts
components
re-render
state updates

Gunakan memoization jika memang diperlukan.

Jangan over-engineering.

==================================================
23. AUTO SCALE PREVIEW
==================================================

Jika Live Preview menggunakan iframe atau preview container:

preview harus mengikuti ukuran:

Desktop:
100%

Tablet:
768px simulation

Mobile:
390px simulation

Tetapi container harus AUTO SCALE agar preview tidak menyebabkan overflow.

Contoh konsep:

Preview viewport
↓
calculate available width
↓
scale()
↓
center

Jangan membuat user harus scroll horizontal.

==================================================
24. IMPLEMENTATION RULE
==================================================

SEBELUM CODING:

1. Audit struktur project.
2. Identifikasi framework.
3. Identifikasi existing state management.
4. Identifikasi database/API.
5. Identifikasi komponen Admin existing.
6. Identifikasi bagaimana public website mengambil konfigurasi.
7. Identifikasi sistem authentication.
8. Identifikasi persistence existing.

JANGAN mengganti architecture yang sudah benar.

Kemudian:

1. Buat design system.
2. Redesign AdminLayout.
3. Redesign Sidebar.
4. Redesign Topbar.
5. Redesign Dashboard.
6. Redesign Forms.
7. Implement responsive.
8. Implement autosave.
9. Implement live state.
10. Implement preview.
11. Integrasikan persistence.
12. Test semua breakpoint.

==================================================
25. JANGAN MERUSAK EXISTING FUNCTION
==================================================

Sebelum menghapus/mengubah kode:

cek dependency.

Jangan menghapus:

authentication
database connection
API
existing CRUD
existing routes
existing public page
existing image upload
existing configuration system

kecuali memang diperlukan.

Jika menemukan fungsi existing:
REUSE.

Jangan membuat sistem duplicate.

==================================================
26. ACCEPTANCE TEST
==================================================

SEBELUM MENYATAKAN SELESAI:

TEST:

[ ] Desktop 1920px
[ ] Desktop 1440px
[ ] Desktop 1366px
[ ] Laptop 1280px
[ ] Tablet 1024px
[ ] Tablet 768px
[ ] Mobile 414px
[ ] Mobile 390px
[ ] Mobile 375px
[ ] Mobile 360px
[ ] Mobile 320px

TEST:

[ ] Tidak ada horizontal overflow
[ ] Sidebar responsive
[ ] Mobile drawer bekerja
[ ] Topbar responsive
[ ] Statistic cards responsive
[ ] Chart responsive
[ ] Table responsive
[ ] Form responsive
[ ] Preview responsive
[ ] Autosave bekerja
[ ] Save status bekerja
[ ] Error handling bekerja
[ ] Reload mempertahankan data
[ ] Live preview update tanpa reload
[ ] Existing public website tetap bekerja
[ ] Existing authentication tetap bekerja
[ ] Existing CRUD tetap bekerja

==================================================
27. VISUAL QUALITY CHECK
==================================================

Hasil akhir harus terlihat seperti:

Professional SaaS Admin Dashboard

bukan:

template HTML biasa
prototype kasar
dashboard bootstrap default
UI generator generic

Prioritaskan:

visual hierarchy
spacing
alignment
typography
contrast
consistency
responsive behavior
micro-interaction

==================================================
28. FINAL RULE
==================================================

JANGAN berhenti hanya setelah membuat UI.

Saya membutuhkan:

FUNCTIONAL ADMIN PANEL

yang:

✓ Responsive
✓ Auto Scale
✓ Auto Save
✓ Live Preview
✓ Persistent Data
✓ Error Handling
✓ Mobile Friendly
✓ Desktop Friendly
✓ Tidak merusak website existing
✓ Tidak merusak backend existing
✓ Tidak membuat duplicate data system

SETELAH IMPLEMENTASI:

1. Jalankan project.
2. Pastikan tidak ada compile error.
3. Pastikan tidak ada runtime error.
4. Pastikan console tidak menghasilkan error baru.
5. Test perubahan data.
6. Test autosave.
7. Reload browser.
8. Pastikan data tetap tersimpan.
9. Test live preview.
10. Test responsive.
11. Test mobile.
12. Test desktop.

Jika ada error:
PERBAIKI, jangan hanya laporkan error.

Jangan mengatakan "selesai" sebelum acceptance test di atas dilakukan.

==================================================
OUTPUT YANG SAYA INGINKAN
==================================================

Setelah selesai, tampilkan ringkasan:

1. File yang diubah
2. Komponen yang dibuat
3. Sistem autosave
4. Sistem live preview
5. Responsive breakpoint
6. Persistence/database yang digunakan
7. Test yang berhasil
8. Error yang ditemukan dan diperbaiki

Kemudian jalankan project agar saya bisa LANGSUNG PREVIEW hasilnya.

JANGAN hanya memberikan screenshot/mockup.

HASIL HARUS BERUPA ADMIN PANEL YANG BENAR-BENAR BERFUNGSI.