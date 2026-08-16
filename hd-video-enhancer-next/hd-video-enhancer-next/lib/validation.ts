// Batas ukuran file didasarkan pada keterbatasan nyata ffmpeg.wasm: seluruh video
// dimuat ke memory (WASM linear memory, hard-capped ~4GB oleh spesifikasi WASM32,
// dan jauh lebih rendah lagi di HP karena batas memory per-tab browser Android
// umumnya di kisaran 1.5–4GB tergantung RAM perangkat). 512MB dipilih sebagai
// batas aman yang menyisakan ruang untuk buffer input+output+overhead decoder.
export const MAX_FILE_SIZE_BYTES = 512 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ACCEPTED_EXTENSIONS = ['mp4', 'mov', 'webm'];

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateVideoFile(file: File, extension: string): ValidationResult {
  const typeOk =
    ACCEPTED_MIME_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
  // beberapa browser (terutama di Android untuk .mov) tidak mengisi file.type,
  // jadi ekstensi dipakai sebagai fallback validasi, bukan satu-satunya sumber kebenaran MIME.

  if (!typeOk) {
    return {
      valid: false,
      reason: `Format "${extension || 'tidak dikenal'}" tidak didukung. Gunakan MP4, MOV, atau WEBM.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, reason: 'File kosong (0 byte). Pilih file video yang valid.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `Ukuran file ${(file.size / (1024 * 1024)).toFixed(0)}MB melebihi batas 512MB. Pemrosesan berjalan di memory browser, file yang lebih besar berisiko membuat tab crash, terutama di HP.`,
    };
  }

  return { valid: true };
}
