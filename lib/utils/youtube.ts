// Satu-satunya tempat untuk parsing hal-hal terkait YouTube.
// Sebelumnya extractVideoId ada 2 salinan berbeda (PasteBar.tsx & api/resolve/route.ts) —
// disatukan di sini supaya kalau perlu nambah format URL baru, cukup edit 1 tempat.

const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
];

/** Ekstrak videoId (11 karakter) dari berbagai format URL YouTube, atau dari ID polos. */
export function extractVideoId(input: string): string | null {
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  if (/^[\w-]{11}$/.test(input.trim())) return input.trim();
  return null;
}

/** Konversi ISO 8601 duration (contoh: PT4M13S) ke total detik. */
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
