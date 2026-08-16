import type { FFmpeg } from '@ffmpeg/ffmpeg';

// Core single-threaded (bukan -mt) dipakai secara sengaja: core -mt butuh
// SharedArrayBuffer, yang hanya aktif kalau server mengirim header
// Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy. Static hosting
// (Netlify/GitHub Pages/dst) umumnya tidak mengizinkan set header itu tanpa
// konfigurasi tambahan. Core non-mt lebih lambat (single thread) tapi jalan
// di static hosting mana pun tanpa header khusus — sesuai target "zero config deploy".
const CORE_VERSION = '0.12.6';
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let instance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export type FFmpegLogHandler = (message: string) => void;

export async function getFFmpeg(onLog?: FFmpegLogHandler): Promise<FFmpeg> {
  if (instance && instance.loaded) return instance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    if (onLog) {
      ffmpeg.on('log', ({ message }: { message: string }) => onLog(message));
    }

    const coreURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');

    await ffmpeg.load({ coreURL, wasmURL });

    instance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadingPromise;
  } catch (err) {
    // reset supaya percobaan berikutnya tidak stuck di promise yang sudah gagal
    loadingPromise = null;
    throw err;
  }
}

/** Dipanggil saat user membatalkan proses atau proses gagal fatal — memaksa reload engine di run berikutnya. */
export function terminateFFmpeg() {
  if (instance) {
    try {
      instance.terminate();
    } catch {
      // instance sudah mati, aman diabaikan
    }
  }
  instance = null;
  loadingPromise = null;
}
