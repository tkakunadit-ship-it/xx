"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useYouTubePlayer } from "@/lib/hooks/useYouTubePlayer";
import { useFullscreen } from "@/lib/hooks/useFullscreen";
import { useHistoryTracker } from "@/lib/hooks/useHistoryTracker";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { useSleepTimer } from "@/lib/hooks/useSleepTimer";
import { usePlayerStore } from "@/lib/store/playerStore";
import ControlsOverlay from "./ControlsOverlay";
import Toast from "./Toast";
import type { VideoMetadata } from "@/lib/types/media";

const CONTROLS_IDLE_MS = 2500;

export default function PlayerShell({
  video,
  startAt = 0,
}: {
  video: VideoMetadata;
  startAt?: number;
}) {
  const [showControls, setShowControls] = useState(true);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const shellRef = useRef<HTMLDivElement>(null);
  const hasResumedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const controls = useYouTubePlayer("yt-host", video.videoId);
  const { toggleFullscreen, isFakeMode, rotateToLandscape } = useFullscreen(shellRef);
  const isFullscreen = usePlayerStore((s) => s.isFullscreen);
  const isZenMode = usePlayerStore((s) => s.isZenMode);
  const status = usePlayerStore((s) => s.status);

  useHistoryTracker({
    videoId: video.videoId,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
  });

  useKeyboardShortcuts(controls, toggleFullscreen);
  const sleepTimer = useSleepTimer(controls);

  const isPlaying = status === "playing";

  // BUG FIX (auto-hide kontrol): sebelumnya cuma pakai onMouseLeave, yang
  // TIDAK PERNAH terpicu di touchscreen — akibatnya di HP kontrol nempel
  // terus nutupin video. Sekarang dipakai idle-timer yang jalan di mouse
  // maupun touch, dan kontrol tetap tampil terus kalau video di-pause.
  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isPlaying) {
      idleTimerRef.current = setTimeout(() => setShowControls(false), CONTROLS_IDLE_MS);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // --- Fitur 1: Resume otomatis ---
  // Begitu player pertama kali mulai (ready & mulai buffer/play), seek ke
  // posisi terakhir kalau startAt dikirim dari HistoryPanel. Hanya sekali
  // per sesi (hasResumedRef) supaya tidak seek berulang tiap status berubah.
  useEffect(() => {
    if (hasResumedRef.current) return;
    if (startAt <= 0) return;
    if (status !== "playing" && status !== "buffering" && status !== "paused") return;

    controls.seekTo(startAt);
    hasResumedRef.current = true;

    const mins = Math.floor(startAt / 60);
    const secs = Math.floor(startAt % 60);
    setToast({ message: `Melanjutkan dari ${mins}:${secs.toString().padStart(2, "0")}`, visible: true });
    const t = setTimeout(() => setToast((s) => ({ ...s, visible: false })), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startAt]);

  // BUG FIX (klik video cuma bisa play, tidak bisa pause): sebelumnya klik
  // pada video selalu memanggil controls.play() tanpa mengecek status
  // sekarang. Sekarang klik benar-benar men-toggle play/pause.
  function handleVideoClick() {
    if (!controls.playerRef.current) return;
    resetIdleTimer();
    if (isPlaying) controls.pause();
    else controls.play();
  }

  return (
    <div
      ref={shellRef}
      className={`bg-black overflow-hidden group ${
        isFullscreen
          ? isFakeMode
            ? "fixed inset-0 z-[999] w-screen h-screen rounded-none"
            : "relative w-screen h-screen rounded-none"
          : "relative w-full aspect-video rounded-xl"
      }`}
      onMouseMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
    >
      <div id="yt-host" className="absolute inset-0 pointer-events-none" />

      <Toast message={toast.message} visible={toast.visible} />

      <div
        className="absolute inset-0 z-10"
        onClick={handleVideoClick}
        onDoubleClick={toggleFullscreen}
      />

      {/* BUG FIX (klik "tembus" ke elemen kontrol yang seharusnya tersembunyi):
          sebelumnya wrapper ini hanya diberi opacity-0 tanpa pointer-events-none,
          jadi tombol/slider yang "kelihatan hilang" tetap menyerap klik dan
          menghalangi klik ke video di bawahnya. Sekarang saat showControls
          false, pointer-events dimatikan total. */}
      <div
        className={`absolute inset-0 z-20 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        }`}
      >
        <ControlsOverlay
          controls={controls}
          onToggleFullscreen={toggleFullscreen}
          onRotateToLandscape={rotateToLandscape}
          isFakeFullscreen={isFakeMode}
          isZenMode={isZenMode}
          sleepTimer={sleepTimer}
        />
      </div>
    </div>
  );
}
