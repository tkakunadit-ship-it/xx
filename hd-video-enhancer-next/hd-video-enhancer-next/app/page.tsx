import { VideoEnhancer } from '@/components/VideoEnhancer';
import { InstallButton } from '@/components/InstallButton';
import { FilmIcon } from '@/components/icons';

export default function Home() {
  return (
    <main className="container">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="brand-text">
            <h1>HD Video Enhancer</h1>
            <p>client-side · 720p / 1080p</p>
          </div>
        </div>
        <InstallButton />
      </header>

      <section className="hero">
        <h2>
          Naikkan resolusi video ke <em>720p atau 1080p</em>
        </h2>
        <p>
          Upload video, pilih resolusi output, proses berjalan langsung di perangkat kamu.
          File tidak pernah dikirim ke server mana pun.
        </p>
      </section>

      <VideoEnhancer />

      <footer className="footnote">
        <p>
          <strong>Cara kerja &amp; batasan.</strong> Aplikasi ini melakukan scaling resolusi
          (interpolasi Lanczos via FFmpeg, dijalankan sebagai WebAssembly di browser) — bukan
          rekonstruksi detail berbasis AI. Rasio aspek asli selalu dipertahankan sehingga video
          tidak gepeng, dan audio asli dipertahankan bila codec-nya kompatibel dengan MP4.
        </p>
        <ul>
          <li>Semua pemrosesan terjadi di memory browser; tidak ada file yang disimpan permanen di server.</li>
          <li>Kecepatan proses tergantung performa perangkat — bisa lambat di HP kelas menengah ke bawah.</li>
          <li>File di atas 512MB ditolak untuk mencegah tab browser kehabisan memory dan crash.</li>
        </ul>
        <p>
          <FilmIcon style={{ width: 13, height: 13, display: 'inline', verticalAlign: '-2px' }} />{' '}
          Format didukung: MP4, MOV, WEBM.
        </p>
      </footer>
    </main>
  );
}
