"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useMediaStore } from "@/lib/store/mediaStore";
import { useMediaService } from "@/lib/services/useMediaService";
import type { WatchHistoryEntry } from "@/lib/types/media";

const UPDATE_INTERVAL_MS = 8000;
const MIN_WATCH_SECONDS_BEFORE_RECORD = 5;

interface VideoMeta {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

export function useHistoryTracker(videoMeta: VideoMeta) {
  const { recordHistoryEntry, updateHistoryProgress } = useMediaService();
  const historyEntryIdRef = useRef<string | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  const status = usePlayerStore((s) => s.status);
  const isHistoryLoading = useMediaStore((s) => s.isHistoryLoading);
  const initializedVideoIdRef = useRef<string | null>(null);

  // BUG FIX #1 (stale closure): sebelumnya fungsi ini dipanggil dari dalam
  // setInterval yang dibuat di useEffect ber-dependency [status, videoId] saja.
  // Karena status tidak berubah selama video playing, effect itu tidak pernah
  // re-run, sehingga closure currentTime/duration di dalamnya BEKU di nilai
  // awal — progress history gak pernah ke-update selama nonton.
  // Fix: selalu baca nilai TERBARU langsung dari store via getState() di saat
  // fungsi ini benar-benar dieksekusi, bukan dari closure/props.
  async function persistProgress() {
    const { currentTime, duration } = usePlayerStore.getState();

    if (currentTime < MIN_WATCH_SECONDS_BEFORE_RECORD) return;
    if (Math.abs(currentTime - lastSavedTimeRef.current) < 2) return;

    const completed = duration > 0 && currentTime / duration >= 0.95;

    if (!historyEntryIdRef.current) {
      const newEntry: WatchHistoryEntry = {
        id: crypto.randomUUID(),
        videoId: videoMeta.videoId,
        title: videoMeta.title,
        thumbnailUrl: videoMeta.thumbnailUrl,
        watchedAt: new Date().toISOString(),
        progressSeconds: currentTime,
        durationSeconds: duration,
        completed,
      };
      historyEntryIdRef.current = newEntry.id;
      await recordHistoryEntry(newEntry);
    } else {
      await updateHistoryProgress(historyEntryIdRef.current, currentTime, completed);
    }
    lastSavedTimeRef.current = currentTime;
  }

  // BUG FIX #2 (history dobel): sebelumnya historyEntryIdRef selalu di-reset ke
  // null tiap ganti videoId, tanpa cek apakah video ini sudah pernah ada di
  // history. Akibatnya nonton ulang video yang sama bikin entry baru terus.
  // Fix: saat videoId berganti, cari dulu entry history yang sudah ada untuk
  // videoId ini — kalau ada, lanjutkan (update) entry itu, bukan bikin baru.
  //
  // Catatan tambahan: sengaja menunggu `isHistoryLoading === false` dulu
  // sebelum melakukan pencarian ini. Data history dari IndexedDB (via
  // useMediaService) di-load secara async saat komponen pertama mount —
  // kalau pencarian dilakukan lebih cepat dari itu, `history` masih array
  // kosong dan video yang SUDAH ADA di riwayat akan salah dianggap "belum
  // pernah ditonton", balik lagi ke bug yang sama.
  useEffect(() => {
    if (isHistoryLoading) return;
    if (initializedVideoIdRef.current === videoMeta.videoId) return;

    const existing = useMediaStore
      .getState()
      .history.find((h) => h.videoId === videoMeta.videoId);
    historyEntryIdRef.current = existing?.id ?? null;
    lastSavedTimeRef.current = existing?.progressSeconds ?? 0;
    initializedVideoIdRef.current = videoMeta.videoId;
  }, [videoMeta.videoId, isHistoryLoading]);

  useEffect(() => {
    if (status !== "playing") return;
    const intervalId = setInterval(() => {
      persistProgress();
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, videoMeta.videoId]);

  useEffect(() => {
    if (status === "paused" || status === "ended") {
      persistProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        persistProgress();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoMeta.videoId]);
}
