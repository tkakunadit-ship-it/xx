"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlayerShell from "@/components/player/PlayerShell";
import Sidebar from "@/components/player/Sidebar";
import PasteBar from "@/components/player/PasteBar";
import { StarIcon } from "@/components/player/icons";
import { useMediaService } from "@/lib/services/useMediaService";
import { useMediaStore } from "@/lib/store/mediaStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { VideoMetadata } from "@/lib/types/media";

export default function PlayerView({ videoId }: { videoId: string }) {
  // Inisialisasi service layer sekali di titik masuk utama aplikasi
  const { addToPlaylist, removeFromPlaylist } = useMediaService();
  const playlistItems = useMediaStore((s) => s.playlistItems);
  const isZenMode = usePlayerStore((s) => s.isZenMode);

  const searchParams = useSearchParams();
  const startAt = Number(searchParams.get("t") || 0);

  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/resolve?url=${encodeURIComponent(videoId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat metadata video");
        if (!cancelled) setVideo(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const existingItem = playlistItems.find(
    (i) => i.videoId === videoId && i.playlistGroupId === "watch-later"
  );

  function handleToggleWatchLater() {
    if (!video) return;
    if (existingItem) {
      removeFromPlaylist(existingItem.id);
    } else {
      addToPlaylist({
        id: crypto.randomUUID(),
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        channelName: video.channelName,
        durationSeconds: video.durationSeconds,
        order: playlistItems.length,
        addedAt: new Date().toISOString(),
        playlistGroupId: "watch-later",
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-7 py-4.5 border-b border-line flex-shrink-0 gap-4">
        <a href="/" className="flex items-center gap-2 font-display font-bold text-xl flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber shadow-[0_0_10px_#E8A33D]" />
          Reel
        </a>
        <PasteBar />
      </header>

      <div className="flex flex-1 flex-col md:flex-row min-h-0">
        <main className="flex-1 p-7 flex flex-col gap-4.5 min-w-0">
          {loading && (
            <div className="w-full aspect-video rounded-xl bg-panel animate-pulse flex items-center justify-center text-muted text-sm font-mono">
              Memuat video…
            </div>
          )}

          {error && !loading && (
            <div className="w-full aspect-video rounded-xl bg-panel border border-red-900/40 flex items-center justify-center text-red-400 text-sm px-6 text-center">
              {error}
            </div>
          )}

          {video && !loading && !error && (
            <>
              <PlayerShell video={video} startAt={startAt} />
              <div className="flex justify-between items-start gap-5">
                <div className="min-w-0">
                  <h1 className="font-display font-semibold text-lg tracking-tight mb-1">
                    {video.title}
                  </h1>
                  <p className="text-sm text-muted">{video.channelName}</p>
                </div>
                <button
                  onClick={handleToggleWatchLater}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium flex-shrink-0 transition-colors border ${
                    existingItem
                      ? "bg-amber/15 border-amber/40 text-amber"
                      : "bg-panel2 border-line hover:border-amber/40 text-text"
                  }`}
                >
                  <StarIcon className="w-4 h-4" filled={!!existingItem} />
                  {existingItem ? "Tersimpan" : "Simpan"}
                </button>
              </div>
            </>
          )}
        </main>

        {!isZenMode && <Sidebar />}
      </div>
    </div>
  );
}
