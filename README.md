# Reel — Custom YouTube Media Hub (MVP Pilar 1 + 2)

Proyek ini adalah implementasi nyata dari blueprint "Custom YouTube Viewer & Media Hub" yang sudah
dirancang: custom player shell (kontrol playback, fullscreen native + fallback iOS, scroll lock),
serta data layer untuk Playlist & History tersimpan lokal (IndexedDB via Dexie).

## Yang sudah terimplementasi

- **Player Shell kustom** — kontrol play/pause, volume, speed, progress bar, semuanya menggantikan
  tampilan bawaan YouTube (`components/player/PlayerShell.tsx`, `ControlsOverlay.tsx`)
- **Fullscreen native + fallback iOS** (`lib/hooks/useFullscreen.ts`) — termasuk scroll lock dan
  safe-area handling
- **Ambil metadata via YouTube Data API v3** (`app/api/resolve/route.ts`) — bukan scraping
- **Playlist & History tersimpan lokal** tanpa login (`lib/store/mediaStore.ts`,
  `lib/services/useMediaService.ts`, IndexedDB via Dexie)
- **History tracker otomatis** (`lib/hooks/useHistoryTracker.ts`) — checkpoint interval + event-driven

## Batasan yang perlu dipahami (bukan bug)

Video tetap diputar lewat **YouTube IFrame Player API resmi** — ini satu-satunya cara legal untuk
memutar video YouTube. Konsekuensinya:
- Ada logo kecil YouTube yang tetap muncul di pojok video (wajib ada sesuai Terms of Service YouTube,
  tidak bisa dihilangkan tanpa melanggar ToS)
- Kontrol native YouTube (tombol play besar, progress bar merah, dll) sudah disembunyikan dan diganti
  penuh dengan kontrol kustom kita

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Dapatkan YouTube Data API Key**
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Buat project baru (atau pakai yang sudah ada)
   - Aktifkan **"YouTube Data API v3"** di API Library
   - Buat credential baru: **API Key**
   - Copy key tersebut

3. **Konfigurasi environment**

   `.env.local` cuma salah satu cara — dipakai kalau mau simpan key di file biar gak perlu
   export ulang tiap buka terminal baru:
   ```bash
   cp .env.example .env.local
   ```
   Isi `YOUTUBE_API_KEY` di `.env.local` dengan key yang tadi didapat.

   Kalau lebih suka set langsung lewat shell (misal di Termux), itu juga jalan tanpa perlu
   `.env.local` sama sekali, karena kodenya baca langsung dari `process.env`:
   ```bash
   export YOUTUBE_API_KEY=xxxxx
   npm run dev
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000)

5. **Coba paste link YouTube apapun** di halaman utama, contoh:
   `https://www.youtube.com/watch?v=aqz-KE-bpKQ`

## Deploy ke Vercel

```bash
npm install -g vercel
vercel
```
Saat deploy, tambahkan `YOUTUBE_API_KEY` sebagai Environment Variable di dashboard Vercel
(Project Settings → Environment Variables) — jangan commit `.env.local` ke git.

## Struktur folder penting

```
app/
  page.tsx                     — halaman utama (paste link)
  watch/[videoId]/page.tsx     — halaman menonton
  watch/[videoId]/PlayerView.tsx — client wrapper, fetch metadata
  api/resolve/route.ts         — API route resolve metadata YouTube
lib/
  store/playerStore.ts         — Zustand: state pemutaran real-time
  store/mediaStore.ts          — Zustand: state playlist & history
  hooks/useYouTubePlayer.ts    — integrasi IFrame Player API
  hooks/useFullscreen.ts       — fullscreen native + fallback iOS
  hooks/useHistoryTracker.ts   — auto-record history saat menonton
  services/useMediaService.ts  — persistence layer (Dexie/IndexedDB)
components/player/
  PlayerShell.tsx              — container utama + layering
  ControlsOverlay.tsx          — UI kontrol kustom
  PlaylistPanel.tsx            — panel playlist
  HistoryPanel.tsx             — panel riwayat tontonan
```

## Belum diimplementasikan (di luar scope MVP saat ini)

- Fitur "tambah ke playlist" dari halaman watch (tombol UI-nya belum ada, tapi service layer
  `addToPlaylist` sudah siap dipakai)
- Dual Video Playback
- Gesture control (swipe untuk volume/brightness)
- Mini-player floating

Semua ini sudah dirancang di blueprint arsitektur awal dan bisa dibangun di atas fondasi yang sudah
ada di sini.
