"use client";

import Link from "next/link";
import Image from "next/image";
import { useMediaStore } from "@/lib/store/mediaStore";
import { useMediaService } from "@/lib/services/useMediaService";

export default function PlaylistPanel() {
  const playlistGroups = useMediaStore((s) => s.playlistGroups);
  const playlistItems = useMediaStore((s) => s.playlistItems);
  const isLoading = useMediaStore((s) => s.isPlaylistLoading);
  const { removeFromPlaylist } = useMediaService();

  if (isLoading) {
    return <p className="text-xs text-muted p-4 font-mono">Memuat playlist…</p>;
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      {playlistGroups.map((group) => {
        const items = playlistItems
          .filter((i) => i.playlistGroupId === group.id)
          .sort((a, b) => a.order - b.order);

        return (
          <div key={group.id}>
            <div className="text-[10px] uppercase tracking-wider text-muted font-mono px-2 py-2">
              {group.name} · {items.length} video
            </div>
            {items.length === 0 && (
              <p className="text-xs text-muted px-2 pb-4 leading-relaxed">
                Belum ada video di grup ini.
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-panel2 transition-colors group"
              >
                <Link href={`/watch/${item.videoId}`} className="flex gap-3 flex-1 min-w-0">
                  <div className="relative w-[100px] h-[58px] flex-shrink-0 rounded overflow-hidden bg-panel2">
                    <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium leading-snug line-clamp-2">{item.title}</p>
                    <p className="text-[11px] text-muted font-mono mt-1">{item.channelName}</p>
                  </div>
                </Link>
                <button
                  onClick={() => removeFromPlaylist(item.id)}
                  className="text-muted hover:text-red-400 text-sm sm:text-xs opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                  aria-label="Hapus dari playlist"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
