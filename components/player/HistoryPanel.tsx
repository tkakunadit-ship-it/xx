"use client";

import Link from "next/link";
import Image from "next/image";
import { useMediaStore } from "@/lib/store/mediaStore";
import { useMediaService } from "@/lib/services/useMediaService";

function fmt(s: number) {
  const secs = Math.floor(s || 0);
  const m = Math.floor(secs / 60);
  const sec = secs % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function HistoryPanel() {
  const history = useMediaStore((s) => s.history);
  const isLoading = useMediaStore((s) => s.isHistoryLoading);
  const { clearAllHistory } = useMediaService();

  if (isLoading) {
    return <p className="text-xs text-muted p-4 font-mono">Memuat riwayat…</p>;
  }

  if (history.length === 0) {
    return (
      <p className="text-xs text-muted p-4 leading-relaxed">
        Belum ada riwayat tontonan. Video yang kamu tonton lebih dari 5 detik akan muncul di sini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      <div className="flex justify-end px-2 py-2">
        <button
          onClick={clearAllHistory}
          className="text-[11px] text-muted hover:text-red-400 font-mono min-h-[36px] px-2"
        >
          Hapus semua riwayat
        </button>
      </div>
      {history.map((entry) => {
        const progressPct = entry.durationSeconds
          ? Math.min(100, (entry.progressSeconds / entry.durationSeconds) * 100)
          : 0;
        const remaining = Math.max(0, entry.durationSeconds - entry.progressSeconds);

        return (
          <Link
            key={entry.id}
            href={
              entry.completed
                ? `/watch/${entry.videoId}`
                : `/watch/${entry.videoId}?t=${Math.floor(entry.progressSeconds)}`
            }
            className="flex gap-3 p-2 rounded-lg hover:bg-panel2 transition-colors"
          >
            <div className="relative w-[100px] h-[58px] flex-shrink-0 rounded overflow-hidden bg-panel2">
              <Image src={entry.thumbnailUrl} alt={entry.title} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/20">
                <div className="h-full bg-amber" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium leading-snug line-clamp-2">{entry.title}</p>
              <p className="text-[11px] text-muted font-mono mt-1">
                {entry.completed ? "Selesai ditonton" : `${fmt(remaining)} tersisa`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
