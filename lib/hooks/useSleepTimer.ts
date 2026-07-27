"use client";

import { useEffect, useCallback } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { useYouTubePlayer } from "./useYouTubePlayer";

export function useSleepTimer(controls: ReturnType<typeof useYouTubePlayer>) {
  const sleepTimerEndAt = usePlayerStore((s) => s.sleepTimerEndAt);
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);

  // Cek tiap detik apakah waktu sudah habis — dibanding setTimeout tunggal,
  // ini lebih aman terhadap perubahan tab/sleep device karena selalu
  // dibandingkan dengan timestamp absolut (endAt), bukan durasi relatif.
  useEffect(() => {
    if (!sleepTimerEndAt) return;

    const intervalId = setInterval(() => {
      if (Date.now() >= sleepTimerEndAt) {
        controls.pause();
        setSleepTimer(null);
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepTimerEndAt]);

  const startSleepTimer = useCallback(
    (minutes: number) => {
      setSleepTimer(Date.now() + minutes * 60 * 1000);
    },
    [setSleepTimer]
  );

  const cancelSleepTimer = useCallback(() => {
    setSleepTimer(null);
  }, [setSleepTimer]);

  const remainingMinutes = sleepTimerEndAt
    ? Math.max(0, Math.ceil((sleepTimerEndAt - Date.now()) / 60000))
    : null;

  return { startSleepTimer, cancelSleepTimer, remainingMinutes, isActive: !!sleepTimerEndAt };
}
