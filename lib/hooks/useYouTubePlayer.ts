"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

const STATE_MAP: Record<number, "unstarted" | "buffering" | "playing" | "paused" | "ended"> = {
  [-1]: "unstarted",
  0: "ended",
  1: "playing",
  2: "paused",
  3: "buffering",
};

export function useYouTubePlayer(containerId: string, videoId: string) {
  const playerRef = useRef<YT.Player | null>(null);
  const pollRef = useRef<number | null>(null);

  const setStatus = usePlayerStore((s) => s.setStatus);
  const setTime = usePlayerStore((s) => s.setTime);
  const setStoreVolume = usePlayerStore((s) => s.setVolume);

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (cancelled || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: () => startPolling(),
          onStateChange: (e: YT.OnStateChangeEvent) => {
            setStatus(STATE_MAP[e.data] ?? "unstarted");
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    function startPolling() {
      pollRef.current = window.setInterval(() => {
        const p = playerRef.current;
        if (!p || typeof p.getCurrentTime !== "function") return;
        setTime(p.getCurrentTime(), p.getDuration());
      }, 250);
    }

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, videoId]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const seekTo = useCallback((sec: number) => playerRef.current?.seekTo(sec, true), []);
  // BUG FIX (slider volume "nolak digeser"): sebelumnya fungsi ini cuma
  // memanggil player.setVolume() tanpa menyentuh usePlayerStore, jadi input
  // <range> yang controlled oleh store.volume gak pernah ikut update — efeknya
  // slider kelihatan melawan saat digeser. Sekarang satu pemanggilan ini
  // otomatis sinkron ke player DAN ke store, jadi semua caller (slider di
  // ControlsOverlay, shortcut keyboard, dll) otomatis konsisten.
  const setVolume = useCallback(
    (v: number) => {
      playerRef.current?.setVolume(v);
      setStoreVolume(v);
    },
    [setStoreVolume]
  );
  const mute = useCallback(() => playerRef.current?.mute(), []);
  const unMute = useCallback(() => playerRef.current?.unMute(), []);
  const setPlaybackRate = useCallback((r: number) => playerRef.current?.setPlaybackRate(r), []);

  return { play, pause, seekTo, setVolume, mute, unMute, setPlaybackRate, playerRef };
}
