# HD Video Enhancer

Web app + PWA untuk menaikkan resolusi video (720p / 1080p) langsung di browser pengguna.
Tidak ada server processing, tidak ada database, tidak ada API key, tidak ada file pengguna
yang tersimpan permanen di mana pun.

## 1. Arsitektur

```
Browser (client)
  ├─ <input type="file"> / drag&drop  → File API
  ├─ <video> tersembunyi              → baca metadata (resolusi, durasi) via loadedmetadata
  ├─ @ffmpeg/ffmpeg (WebAssembly)     → decode-scale-encode, 100% di memory tab browser
  └─ Blob + URL.createObjectURL       → preview hasil & tombol download
```

Tidak ada request video ke server mana pun. Satu-satunya trafik jaringan saat proses
berjalan adalah mengunduh engine FFmpeg WebAssembly (~30MB, sekali per sesi browser, dari
CDN `unpkg.com`) — ini adalah *executable* pemroses video itu sendiri, bukan API pemrosesan.

### Alur fungsi utama
`Upload → Validasi format/ukuran → Baca metadata → Pilih 720p/1080p → Proses (ffmpeg.wasm)
→ Preview hasil → Download`

### Kenapa hasil tidak gepeng / stretch
Filter scaling yang dipakai adalah `scale=-2:H` (H = 720 atau 1080). Nilai `-2` membuat FFmpeg
menghitung lebar secara otomatis mengikuti rasio aspek asli video (dibulatkan ke kelipatan 2,
disyaratkan encoder H.264), bukan angka lebar tetap. Rasio aspek sumber selalu dipertahankan.

### Audio
Percobaan pertama memakai stream-copy (`-c:a copy`) sehingga audio asli tidak di-encode ulang
sama sekali. Jika kombinasi codec sumber tidak valid untuk container MP4 (mis. beberapa profil
Opus dari WEBM), sistem otomatis fallback ke re-encode AAC 160kbps — ini ditangani otomatis,
tidak butuh aksi user, dan dicatat di panel log proses.

## 2. Keterbatasan nyata (bukan disembunyikan)

- **Bukan AI super-resolution.** Ini scaling/interpolasi standar (Lanczos, via filter `scale`
  FFmpeg). Menaikkan resolusi sumber rendah ke target lebih tinggi menambah jumlah piksel,
  bukan detail baru. UI menampilkan label "UPSCALE" dengan peringatan eksplisit saat ini terjadi.
- **Performa tergantung perangkat.** Engine FFmpeg berjalan single-threaded di WebAssembly
  (sengaja dipilih varian non-multithread agar tidak butuh header `Cross-Origin-Opener-Policy` /
  `Cross-Origin-Embedder-Policy` dari hosting statis). Konsekuensinya: lebih lambat dari FFmpeg
  native, terutama untuk video panjang di HP kelas menengah ke bawah.
- **Batas ukuran file 512MB.** Seluruh video dimuat ke memory tab browser. File lebih besar
  berisiko membuat tab crash, khususnya di Android dengan RAM terbatas — karena itu divalidasi
  dan ditolak di awal dengan pesan yang jelas, bukan dibiarkan gagal di tengah proses.
- **Service worker tidak precache seluruh bundle Next.js.** Nama file build Next.js berubah
  (hash) tiap kali di-build ulang, jadi precache penuh butuh plugin build (mis. `next-pwa` /
  `Serwist`) yang tidak disertakan di sini agar dependency tetap minimal. Sebagai gantinya
  dipakai strategi *stale-while-revalidate* runtime — app tetap bisa dibuka offline setelah
  kunjungan pertama, hanya saja tidak ter-precache di awal instalasi.

## 3. Menjalankan secara lokal

Butuh Node.js 18.18+ dan koneksi internet (untuk `npm install` dan untuk memuat engine FFmpeg
dari CDN saat runtime).

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 4. Deploy ke Vercel

Tidak pakai `output: 'export'` — project ini di-deploy sebagai Next.js app native di Vercel
(Vercel mendeteksi `package.json` dan build Next.js secara otomatis, zero config). Tidak ada
environment variable, database, atau API key yang perlu diisi.

**Cara A — lewat dashboard (paling gampang):**
1. Push folder ini ke repo GitHub/GitLab/Bitbucket.
2. Buka [vercel.com/new](https://vercel.com/new), import repo tersebut.
3. Biarkan semua setting default (Framework Preset otomatis terisi "Next.js").
4. Klik **Deploy**. Selesai — dapat URL `https://<nama-project>.vercel.app`.

**Cara B — lewat Vercel CLI (tanpa push ke git dulu):**
```bash
npm install -g vercel
cd hd-video-enhancer-next
vercel        # deploy preview, ikuti prompt login
vercel --prod # promote ke production
```

Setelah live, cek dari HP Android via Chrome: buka URL-nya, akan muncul opsi "Tambahkan ke
Layar Utama" / tombol **Install App** di header (dipicu event `beforeinstallprompt` asli, bukan
tombol dekoratif) — itu tandanya manifest + service worker terbaca dengan benar oleh browser.

## 5. Struktur project

```
hd-video-enhancer/
├─ app/
│  ├─ layout.tsx        # metadata PWA, font, registrasi service worker
│  ├─ page.tsx           # halaman utama
│  └─ globals.css        # desain (dark, panel instrumen sinyal)
├─ components/
│  ├─ VideoEnhancer.tsx  # logika inti: upload → proses → preview → download
│  ├─ InstallButton.tsx  # tombol install PWA (beforeinstallprompt)
│  ├─ RegisterServiceWorker.tsx
│  └─ icons/index.tsx    # ikon SVG buatan sendiri (tanpa emoji, tanpa icon-font)
├─ lib/
│  ├─ ffmpeg.ts          # loader singleton ffmpeg.wasm
│  ├─ validation.ts      # aturan validasi format & ukuran file
│  └─ format.ts          # format bytes/durasi untuk panel data
├─ public/
│  ├─ manifest.json
│  ├─ sw.js
│  └─ icons/
├─ next.config.mjs
├─ package.json
└─ tsconfig.json
```
