import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, parseDuration } from "@/lib/utils/youtube";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Parameter 'url' wajib diisi" }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "URL tidak dikenali sebagai link video YouTube yang valid" },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Variabel ini dibaca langsung dari process.env — sumbernya bisa .env.local (dev lokal),
    // `export` di shell (mis. Termux), ATAU Environment Variables di dashboard Vercel.
    // Kalau ini muncul di production, artinya key belum ditambahkan di dashboard Vercel,
    // bukan soal file .env.local (yang memang sengaja tidak ikut ke-deploy).
    const hint =
      process.env.VERCEL === "1"
        ? "Tambahkan di Vercel: Project Settings → Environment Variables, lalu redeploy."
        : "Set sebagai environment variable (export YOUTUBE_API_KEY=... atau isi di .env.local).";
    return NextResponse.json(
      { error: `YOUTUBE_API_KEY belum dikonfigurasi di server. ${hint}` },
      { status: 500 }
    );
  }

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } }); // cache 1 jam

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil data dari YouTube Data API" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const item = data.items?.[0];

    if (!item) {
      return NextResponse.json({ error: "Video tidak ditemukan atau bersifat privat" }, { status: 404 });
    }

    return NextResponse.json({
      videoId,
      title: item.snippet.title as string,
      channelName: item.snippet.channelTitle as string,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url as string,
      durationSeconds: parseDuration(item.contentDetails.duration as string),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan tak terduga di server" }, { status: 500 });
  }
}
