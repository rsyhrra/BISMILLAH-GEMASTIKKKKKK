# PILAH.ki — Design Document

**Versi:** 1.0  
**Tanggal:** 11 Agustus 2026  
**Konteks:** Prototipe GEMASTIK — PWA Pemantauan Kepatuhan Pemilahan Sampah Rumah Tangga

---

## 1. Ringkasan Produk

PILAH.ki adalah Progressive Web App (PWA) yang menghubungkan **tiga peran pengguna** — Warga, Ketua RT, dan Admin DLH — dalam ekosistem pemantauan pemilahan sampah. Aplikasi ini menangani siklus penuh mulai dari pelaporan mandiri warga, pendataan lapangan oleh RT (dengan bukti foto + GPS), deteksi anomali otomatis, hingga dashboard analitik dan intervensi oleh Dinas Lingkungan Hidup.

### Sasaran Pengguna

| Peran | Akses | Fungsi Utama |
|-------|-------|--------------|
| **Warga** | `/warga/*` | Lapor sampah mandiri, lihat poin & riwayat |
| **Ketua RT** | `/rt/*` | Pendataan mingguan + deteksi anomali |
| **Admin DLH** | `/dlh/*` | Dashboard kota, peta risiko, intervensi & ekspor |

---

## 2. Arsitektur & Tech Stack

```
┌──────────────────────────────────────────────────────┐
│                    Browser (PWA)                     │
│  React 18 + Vite + React Router v6 + Tailwind CSS   │
│  Recharts (grafik) • Leaflet (peta) • Lucide (ikon) │
│  Service Worker (Workbox — offline cache)            │
├──────────────┬───────────────────────────────────────┤
│  Mode Demo   │         Mode Produksi                 │
│  localStorage│   Supabase (PostgreSQL + Auth +       │
│  + seed data │   Realtime + Storage + RLS)           │
└──────────────┴───────────────────────────────────────┘
         │                        │
         └────── Vercel (hosting, SPA rewrite) ────────┘
```

### Dependensi Utama

| Kategori | Library | Versi |
|----------|---------|-------|
| UI Framework | `react`, `react-dom` | ^18.3 |
| Bundler | `vite` | ^5.4 |
| Styling | `tailwindcss` | ^3.4 |
| Routing | `react-router-dom` | ^6.26 |
| Backend | `@supabase/supabase-js` | ^2.45 |
| Grafik | `recharts` | ^2.12 |
| Peta | `leaflet`, `react-leaflet` | ^1.9 / ^4.2 |
| Ikon | `lucide-react` | ^0.451 |
| PDF | `jspdf`, `jspdf-autotable` | ^2.5 / ^3.8 |
| PWA | `vite-plugin-pwa` | ^0.20 |
| Testing | `vitest`, `jsdom` | ^2.1 / ^29.1 |

---

## 3. Struktur Folder

```
pilah-ki/
├── index.html                  # Entry HTML (lang="id", PWA meta)
├── vite.config.js              # Vite + VitePWA (injectManifest strategy)
├── tailwind.config.js          # Design tokens (primary green, accent amber)
├── vitest.config.js            # Test runner (jsdom environment)
├── vercel.json                 # SPA rewrite rule
├── .env / .env.example         # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│
├── public/
│   ├── manifest.json           # PWA manifest (standalone, portrait)
│   └── icons/                  # icon-48, icon-192, icon-512, maskable-512
│
├── scripts/
│   └── seed-supabase.mjs       # Seed data ke Supabase (npm run seed)
│
├── supabase/
│   └── schema.sql              # DDL + RLS + Realtime publication
│
└── src/
    ├── main.jsx                # Entry: BrowserRouter + AppProvider + ToastProvider
    ├── App.jsx                 # Route definitions (role-guarded)
    ├── sw.js                   # Service Worker (Workbox: precache, OSM tiles, Supabase API)
    │
    ├── lib/                    # Business logic & data layer
    │   ├── supabase.js         # Supabase client (conditional init)
    │   ├── db.js               # Unified data API (dual-mode: demo ↔ Supabase)
    │   ├── db.test.js          # 9 unit tests (Vitest)
    │   ├── seed.js             # Demo seed data (18 users, 5 RT, 5 kelurahan)
    │   ├── storage.js          # localStorage wrapper + utility (uid, format, timeAgo)
    │   ├── geo.js              # Geolocation API wrapper + fallback
    │   └── AppContext.jsx      # Global state (user, login, logout, notifCount)
    │
    ├── components/             # Reusable UI components
    │   ├── Layout.jsx          # App shell: header + sidebar (desktop) + bottom nav (mobile)
    │   ├── ProtectedRoute.jsx  # Auth guard + role check
    │   ├── CameraCapture.jsx   # Camera live stream / file fallback + compression
    │   ├── Modal.jsx           # Generic modal (Escape to close, backdrop blur)
    │   ├── StatCard.jsx        # Stat card (icon, label, value, tone)
    │   ├── StatusBadge.jsx     # Status pill (patuh/tidak/belum/anomali/selesai/tengah)
    │   └── Toast.jsx           # Toast notification system (context-based)
    │
    ├── pages/
    │   ├── Login.jsx           # Login + role picker + quick demo login
    │   ├── Notifikasi.jsx      # Notification feed + konflik resolution (RT)
    │   ├── warga/
    │   │   ├── Dashboard.jsx   # Poin, status, 7-day bar chart, riwayat 3 terakhir
    │   │   ├── SelfReport.jsx  # Camera → jenis sampah → kirim laporan
    │   │   └── Riwayat.jsx     # Full history list
    │   ├── rt/
    │   │   ├── SamplingInput.jsx  # Tabel warga + capture flow (foto + GPS + save)
    │   │   └── AnomalyDetect.jsx  # Anomali list + tindak lanjut modal
    │   └── dlh/
    │       ├── Overview.jsx    # Stat cards + area chart tren + skor kelurahan
    │       ├── Kelurahan.jsx   # Leaflet map (CircleMarker) + detail modal
    │       └── Intervensi.jsx  # Tabel intervensi + PDF/CSV export
    │
    ├── styles/
    │   └── index.css           # Tailwind directives + Leaflet z-index fix + scrollbar + animations
    │
    └── test/
        └── setup.js            # localStorage mock for Vitest
```

---

## 4. Design System

### 4.1 Color Palette

Didefinisikan di `tailwind.config.js`:

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `primary-50` → `primary-900` | `#f0fdf4` → `#14532d` | Green scale — brand utama |
| `primary-700` | `#15803d` | Header, theme-color, CTA buttons |
| `accent-50` → `accent-600` | `#fffbeb` → `#d97706` | Amber scale — warning/highlight |
| Gray (Tailwind default) | — | Background, border, text secondary |
| Red (Tailwind default) | — | Error, "Tidak Patuh" |
| Sky (Tailwind default) | — | Info, anorganik highlight |

### 4.2 Typography

- **Font family:** `Inter → system-ui → -apple-system → Segoe UI → Roboto → sans-serif`
- **Heading:** `font-extrabold`, `text-xl` (h1), `font-bold` (h2)
- **Body:** `text-sm` (14px), `text-xs` (12px) untuk metadata
- **Rendering:** `antialiased` (via Tailwind `@layer base`)

### 4.3 Border Radius & Shadow

| Elemen | Radius | Shadow |
|--------|--------|--------|
| Card | `rounded-2xl` (16px) | `shadow-card` (custom) |
| Button | `rounded-xl` (12px) | — |
| Badge | `rounded-full` | — |
| Input | `rounded-xl` (12px) | `focus:ring-2 ring-primary-500` |
| Modal | `rounded-2xl` | `shadow-2xl` + `backdrop-blur-sm` |

### 4.4 Spacing & Layout

- Max-width container: `max-w-6xl` (app shell), `max-w-3xl`–`max-w-5xl` (per page)
- Desktop sidebar: `w-60`, sticky `top-14`
- Mobile bottom nav: `grid-cols-4`, safe-area padding
- Consistent gap: `gap-2` → `gap-3` → `gap-5`

---

## 5. Routing & Navigation

### 5.1 Route Map

```
/login                    → Login.jsx (public)
/                         → RootRedirect → /[role]/dashboard
/notifikasi               → Notifikasi.jsx (all authenticated)

/warga/dashboard          → warga/Dashboard.jsx (role: warga)
/warga/lapor              → warga/SelfReport.jsx (role: warga)
/warga/riwayat            → warga/Riwayat.jsx (role: warga)

/rt/sampling              → rt/SamplingInput.jsx (role: rt)
/rt/anomali               → rt/AnomalyDetect.jsx (role: rt)

/dlh/overview             → dlh/Overview.jsx (role: dlh)
/dlh/peta                 → dlh/Kelurahan.jsx (role: dlh)
/dlh/intervensi           → dlh/Intervensi.jsx (role: dlh)
```

### 5.2 Guard Strategy

```
Routes
├── /login (public)
└── ProtectedRoute → Layout (authenticated)
    ├── /notifikasi (any role)
    ├── ProtectedRoute[roles=warga] → warga/*
    ├── ProtectedRoute[roles=rt] → rt/*
    └── ProtectedRoute[roles=dlh] → dlh/*
```

- Jika `loading` → spinner overlay
- Jika `!user` → redirect ke `/login` (menyimpan `from`)
- Jika role tidak cocok → redirect ke home role-nya

### 5.3 Layout Shell

| Viewport | Navigasi | Detail |
|----------|----------|--------|
| Desktop (`lg+`) | Sidebar kiri (sticky) | 60px wide, profile card + nav links |
| Mobile (`<lg`) | Bottom tab bar (fixed) | 4 tab: 3 menu utama + Notifikasi |

Header (sticky top): logo PILAH.ki + bell icon (badge count) + logout button.

---

## 6. Data Layer Architecture

### 6.1 Dual-Mode Design

`db.js` adalah **unified API** yang secara transparan switch antara:

| Kondisi | Mode | Storage | Auth |
|---------|------|---------|------|
| `.env` kosong | **Demo** | `localStorage` | Simulasi (email + password match) |
| `.env` terisi | **Supabase** | PostgreSQL | Supabase Auth |

Deteksi: `isSupabaseMode()` → `Boolean(VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY)`

### 6.2 Database Schema

7 tabel utama:

```
┌─────────┐     ┌──────────────┐     ┌──────────┐
│  users  │────→│ self_reports  │     │    rt    │
│         │←───→│              │     │         │
│  (warga,│     └──────────────┘     └────┬────┘
│   rt,   │                               │
│   dlh)  │     ┌──────────────┐          │
│         │────→│   sampling   │←─────────┘
│         │     └──────────────┘
│         │     ┌──────────────┐
│         │────→│  poin_warga  │ (1:1 unique warga_id)
│         │     └──────────────┘
│         │     ┌──────────────┐
│         │────→│   konflik    │←── rt
│         │     └──────────────┘
└─────────┘     ┌──────────────┐
                │  intervensi  │ (per kelurahan)
                └──────────────┘
```

### 6.3 Seed Data (Demo)

- **18 users:** 12 warga (5 kelurahan), 5 ketua RT, 1 admin DLH
- **5 kelurahan:** Merdeka, Bahari, Sejahtera, Hijau, Makmur (Jakarta area)
- **11 self-reports**, **4 sampling records**, **12 poin entries**, **1 konflik**, **3 intervensi**
- Password semua: `demo123`

### 6.4 Row Level Security (RLS)

| Tabel | Warga | RT | DLH |
|-------|-------|-----|-----|
| `users` | SELECT own | SELECT all | SELECT all |
| `self_reports` | CRUD own | SELECT all | SELECT all |
| `sampling` | — | INSERT (own RT) | SELECT all |
| `poin_warga` | SELECT own | SELECT all | SELECT all |
| `konflik` | SELECT own | ALL (own RT) | SELECT all |
| `intervensi` | — | SELECT all | ALL |
| `rt` | SELECT all | SELECT all | SELECT all |

### 6.5 Realtime

Tabel dengan Supabase Realtime publication: `sampling`, `self_reports`, `konflik`, `intervensi`.

---

## 7. Komponen — Detail Desain

### 7.1 `CameraCapture`

**Alur:**
1. Coba `navigator.mediaDevices.getUserMedia` (facing: environment, 1280px ideal)
2. Jika sukses → live video preview (aspect 4:3, dashed overlay border)
3. Jika gagal → fallback ke `<input type="file" accept="image/*" capture="environment">`
4. Capture → compress ke JPEG 60%, max 720px → return `dataURL`

### 7.2 `StatusBadge`

6 variant: `patuh` (green ✓), `tidak` (red ✕), `belum` (gray −), `anomali` (amber ⚠), `selesai` (green ✓), `tengah` (amber ⚠). Dua ukuran: `sm` / `lg`.

### 7.3 `StatCard`

Card statistik dengan icon, label, value, sub-text. 4 tone: `green`, `blue`, `amber`, `red`.

### 7.4 `Toast`

Context-based notification system. 4 tipe: `success`, `error`, `info`, `konflik`. Auto-dismiss 5 detik. Slide-in animation.

### 7.5 `Modal`

Backdrop blur + Escape-to-close + scroll lock. 3 ukuran: `sm`, `md`, `lg`.

---

## 8. Halaman — Detail Desain

### 8.1 Login (`/login`)

- Gradient background (`primary-700` → `emerald-700`)
- Role picker: 3 card (Warga / RT / DLH) dengan ikon
- Form: email + password
- **Demo mode:** banner kuning + quick-login buttons per role
- Post-login redirect ke home sesuai role

### 8.2 Dashboard Warga (`/warga/dashboard`)

- **Poin card:** gradient hijau, Star icon, total poin
- **Status card:** badge kepatuhan (patuh/tidak/belum) + pesan kontekstual
- **Bar chart:** 7 hari terakhir (Recharts BarChart), jumlah laporan per hari
- **CTA:** "Lapor Sampah Sekarang" (full-width green button)
- **Riwayat 3 terakhir:** thumbnail foto + jenis + status + timestamp

### 8.3 Lapor Sampah (`/warga/lapor`)

- Step 1: Ambil foto (buka CameraCapture dalam Modal)
- Step 2: Pilih jenis sampah (Organik 🍃 / Anorganik 🗑️) — 2 card toggle
- Step 3: Kirim → `submitSelfReport()` → +10 poin → redirect dashboard
- Preview foto dengan tombol hapus (retake)

### 8.4 Riwayat (`/warga/riwayat`)

- Full list semua `self_reports` milik warga
- Per item: thumbnail 64px + jenis + status + timestamp + StatusBadge

### 8.5 Pendataan Mingguan RT (`/rt/sampling`)

- Tabel responsif: Nama, Alamat (hidden mobile), Laporan Mandiri, Terakhir RT, Aksi
- Aksi: tombol **Patuh** (hijau) / **Tidak** (merah) per warga
- **Capture flow (Modal):**
  1. Camera capture
  2. GPS auto-request → jika gagal, input manual lat/lng
  3. Confirm & save → `saveSampling()` → anomaly check → toast notification
- Refresh button untuk reload data

### 8.6 Deteksi Anomali RT (`/rt/anomali`)

- Summary cards: Anomali Aktif (amber) + Telah Ditindaklanjuti (green)
- List anomali: avatar initial, nama, alamat, status RT vs Warga, selisih waktu
- **Tindak lanjut (Modal):** detail + textarea catatan → `resolveKonflik()`
- Empty state: ShieldCheck icon + "Tidak ada anomali"

### 8.7 Dashboard DLH (`/dlh/overview`)

- 4 StatCards: Total RT, Total Warga, Rata-rata Kepatuhan (%), Anomali Aktif
- **Area chart:** tren kepatuhan 8 minggu (gradient fill hijau)
- Quick actions: "Lihat Peta Risiko" + "Lihat Intervensi"
- Skor risiko per kelurahan: list sorted by risk desc, StatusBadge + skor

### 8.8 Peta Risiko DLH (`/dlh/peta`)

- **Leaflet MapContainer** (zoom 12, OSM tiles)
- **CircleMarker** per kelurahan: radius = `16 + (risk/100) * 22`
- Warna: hijau (rendah), kuning (sedang), merah (tinggi)
- **Popup:** detail kelurahan + tabel statistik + tombol "Lihat Rekomendasi"
- **Detail modal:** skor risiko (progress bar) + rekomendasi teks
- Legenda di atas peta

### 8.9 Intervensi & Ekspor DLH (`/dlh/intervensi`)

- Tabel: Kelurahan, Skor Risiko (color dot), Rekomendasi, Status, Hasil, Aksi
- **Catat Hasil (Modal):** status picker (Belum / Sedang Berjalan / Selesai) + textarea
- **Ekspor PDF:** jsPDF landscape A4, header hijau, ringkasan kota, autoTable kelurahan + intervensi
- **Ekspor CSV:** semicolon-delimited, UTF-8 BOM, data risiko kelurahan

### 8.10 Notifikasi (`/notifikasi`)

- **Konflik section:** list konflik aktif (border amber jika belum selesai)
- Per konflik: status RT vs Warga + timestamp + tombol "Tandai Selesai" (RT only)
- **Riwayat notifikasi:** feed chronologis, icon per tipe, unread dot
- **Resolusi modal:** catatan + simpan → `resolveKonflik()`

---

## 9. State Management

### 9.1 AppContext (Global)

```
AppProvider
├── user            : object | null    (profil user aktif)
├── loading         : boolean          (initial session check)
├── sessionChecked  : boolean
├── login(payload)  : async function   (signIn → setUser)
├── logout()        : async function   (signOut → clear)
├── isDemoMode      : function         (cek .env)
├── notifCount      : number           (unread notifications)
└── refreshNotif()  : async function   (re-fetch & count)
```

### 9.2 Per-Page State

Setiap halaman mengelola state lokal via `useState` + `useEffect` untuk fetch data. Tidak ada global store tambahan (Redux/Zustand) — cukup Context + local state.

---

## 10. PWA Strategy

### 10.1 Vite PWA Config

- Strategy: `injectManifest` (custom Service Worker)
- Register: `autoUpdate`, `immediate`
- Precache: semua `*.{js,css,html,svg,png,ico,woff2,json}`

### 10.2 Service Worker (`sw.js`)

| Route Pattern | Strategy | Cache Name | TTL |
|---------------|----------|------------|-----|
| Navigation (SPA) | Precache → `index.html` | — | — |
| `tile.openstreetmap.org` | CacheFirst | `osm-tiles` | 7 hari, max 200 entries |
| `*.supabase.co` | NetworkFirst | `supabase-api` | — |

### 10.3 Manifest

- Display: `standalone`, orientation: `portrait`
- Theme color: `#15803d`, background: `#f0fdf4`
- Icons: 48px, 192px, 512px, maskable 512px

---

## 11. Alur Data Utama

### 11.1 Self-Report (Warga)

```
Warga → Buka kamera → Ambil foto → Pilih jenis (organik/anorganik)
  → submitSelfReport()
    → Insert ke self_reports
    → Tambah poin (+10) ke poin_warga
    → Toast sukses → Redirect dashboard
```

### 11.2 Sampling (RT)

```
RT → Lihat tabel warga → Tap Patuh/Tidak
  → Modal: Camera capture → GPS auto-request
    → saveSampling()
      → Insert ke sampling
      → Jika status patuh: +5 poin warga
      → Cek anomali (status RT ≠ status warga terakhir)
        → Jika anomali:
          → Insert/update konflik
          → Push notifikasi ke warga & RT koordinator
          → Toast "Anomali Terdeteksi"
        → Jika cocok & ada konflik terbuka:
          → Auto-resolve konflik
```

### 11.3 Analytics (DLH)

```
getOverview()
  → computeAllKelurahanStats() per kelurahan
    → Hitung compliance rate, anomaly count, risk score
    → Risk = (100 - compliance) × 0.7 + anomalyRate × 100 × 0.5
  → lastNWeeks(8) → complianceRateForRows per minggu
  → syncIntervensi() → auto-generate intervensi jika risk ≥ 50
```

---

## 12. Keamanan & Fallback

| Aspek | Implementasi |
|-------|-------------|
| **Auth** | Supabase Auth (email/password) + session persistence |
| **RLS** | Per-tabel, per-role (lihat §6.4) |
| **Env vars** | `VITE_SUPABASE_URL` dan key — tidak di-commit |
| **HTTPS** | Enforced via Vercel |
| **Kamera fallback** | `<input type="file">` jika `getUserMedia` gagal |
| **GPS fallback** | Input manual lat/lng jika Geolocation API ditolak/gagal |
| **Offline** | Service Worker cache (SPA shell + OSM tiles) |
| **Foto compression** | Max 720px, JPEG 60% quality → mengurangi localStorage usage |

---

## 13. Testing

### 13.1 Unit Tests (Vitest + jsdom)

File: `src/lib/db.test.js` — **9 test cases:**

1. Login warga → dashboard kosong, poin 0
2. Warga melapor → poin +10, riwayat bertambah
3. Login gagal jika role salah
4. RT login → melihat warga di RT-nya
5. Sampling cocok → tidak ada anomali
6. Sampling berbeda → anomali + notifikasi
7. Resolve konflik → status selesai
8. DLH overview & kelurahan risk
9. Intervensi list + update hasil
10. CSV export output
11. Session persist & signOut

### 13.2 Test Setup

- Environment: `jsdom`
- `localStorage` mock di `src/test/setup.js`
- `beforeEach`: clear localStorage + `resetDemoDB()`

---

## 14. Deployment

| Aspek | Detail |
|-------|--------|
| **Platform** | Vercel |
| **Build** | `vite build` → output `dist/` |
| **SPA Rewrite** | `vercel.json`: `/(.*) → /index.html` |
| **Environment** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` di Vercel env |
| **Auto-deploy** | Dari GitHub (sesuai PRD) |

---

## 15. Skenario Demo (GEMASTIK)

```
1. Login Warga (warga1@test.com / demo123)
   → Dashboard: poin 0, status "Belum Lapor"
   → Lapor Sampah: foto → organik → kirim
   → Poin +10, status "Patuh", riwayat muncul

2. Login RT (rt1@test.com / demo123)
   → Tabel warga RT → tap "Patuh"/"Tidak Patuh"
   → Kamera → GPS → simpan
   → Jika berbeda → anomali terdeteksi + notifikasi
   → Halaman Anomali → Tindak Lanjut → konflik selesai

3. Login DLH (dlh@test.com / demo123)
   → Dashboard ringkasan kota (statistik + grafik tren)
   → Peta risiko (Leaflet, warna kelurahan)
   → Intervensi → catat hasil → ekspor PDF/CSV

4. Notifikasi
   → Warga & RT mendapat notifikasi konflik
   → RT bisa menyelesaikan konflik dari halaman notifikasi
```
