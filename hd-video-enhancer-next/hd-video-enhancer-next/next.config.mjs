/** @type {import('next').NextConfig} */
const nextConfig = {
  // Target deploy: Vercel. Tidak pakai output:'export' karena tidak diperlukan —
  // Vercel menjalankan Next.js secara native (build & hosting otomatis terdeteksi
  // dari package.json, zero config). Seluruh logika app tetap 100% client-side
  // (tidak ada API route, tidak ada server component dinamis, tidak ada database),
  // jadi tidak ada resource server yang benar-benar dipakai saat runtime — hanya
  // memakai jalur deploy standar Vercel untuk Next.js.
  reactStrictMode: true,
};

export default nextConfig;
