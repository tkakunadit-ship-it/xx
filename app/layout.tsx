import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reel — Custom YouTube Media Hub",
  description: "Pemutar YouTube kustom dengan kontrol profesional, playlist, dan history lokal.",
};

// Eksplisit izinkan pinch-zoom & jangan kunci scale — banyak template mobile
// secara tidak sengaja mematikan zoom lewat maximum-scale=1/user-scalable=no.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" />
      </body>
    </html>
  );
}
