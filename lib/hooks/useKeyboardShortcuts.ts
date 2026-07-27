"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { useYouTubePlayer } from "./useYouTubePlayer";

/**
 * Shortcut standar player profesional:
 * Space  → play/pause
 * ←/→    → mundur/maju 5 detik
 * ↑/↓    → volume +5/-5
 * M      → mute/unmute
 * F      → toggle fullscreen
 *
 * Semua shortcut di-skip kalau fokus sedang ada di elemen input/textarea,
 * supaya tidak bentrok waktu user ngetik di kolom paste link atau kolom lain.
 */
export function useKeyboardShortcuts(
  controls: ReturnType<typeof useYouTubePlayer>,
  onToggleFullscreen: () => void
) {
  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const muted = usePlayerStore((s) => s.muted);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isTyping) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          status === "playing" ? controls.pause() : controls.play();
          break;
        case "ArrowLeft":
          e.preventDefault();
          controls.seekTo(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          controls.seekTo(currentTime + 5);
          break;
        case "ArrowUp":
          e.preventDefault();
          controls.setVolume(Math.min(100, volume + 5));
          break;
        case "ArrowDown":
          e.preventDefault();
          controls.setVolume(Math.max(0, volume - 5));
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          muted ? controls.unMute() : controls.mute();
          break;
        case "f":
          e.preventDefault();
          onToggleFullscreen();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [status, volume, currentTime, muted, controls, toggleMute, onToggleFullscreen]);
}
