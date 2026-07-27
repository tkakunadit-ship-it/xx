"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { useYouTubePlayer } from "@/lib/hooks/useYouTubePlayer";
import type { useSleepTimer } from "@/lib/hooks/useSleepTimer";
import {
  PlayIcon,
  PauseIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  FullscreenIcon,
  FullscreenExitIcon,
  CloseIcon,
  ClockIcon,
  TheaterIcon,
  RotateIcon,
} from "./icons";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SLEEP_OPTIONS = [15, 30, 45, 60];

export default function ControlsOverlay({
  controls,
  onToggleFullscreen,
  onRotateToLandscape,
  isFakeFullscreen,
  isZenMode,
  sleepTimer,
}: {
  controls: ReturnType<typeof useYouTubePlayer>;
  onToggleFullscreen: () => void;
  onRotateToLandscape: () => void;
  isFakeFullscreen: boolean;
  isZenMode: boolean;
  sleepTimer: ReturnType<typeof useSleepTimer>;
}) {
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const sleepMenuRef = useRef<HTMLDivElement>(null);

  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const isFullscreen = usePlayerStore((s) => s.isFullscreen);
  const toggleZenMode = usePlayerStore((s) => s.toggleZenMode);

  const isPlaying = status === "playing";

  // BUG FIX: sebelumnya dropdown sleep timer tidak pernah tertutup kalau
  // user klik di luar area menu — sekarang ditutup otomatis.
  useEffect(() => {
    if (!showSleepMenu) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(e.target as Node)) {
        setShowSleepMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showSleepMenu]);

  function fmt(s: number) {
    const secs = Math.floor(s || 0);
    const m = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className={`flex h-full flex-col justify-between text-white ${isFullscreen ? "p-4 sm:p-8" : "p-3 sm:p-4"}`}>
      {isFakeFullscreen && (
        <div className="flex justify-start">
          <button
            onClick={onToggleFullscreen}
            className="bg-black/50 rounded-full p-2.5 sm:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Tutup mode fullscreen"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-end flex-1 bg-gradient-to-t from-black/70 via-transparent to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] sm:text-xs font-mono text-white/70 min-w-[36px] sm:min-w-[40px]">
            {fmt(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => controls.seekTo(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-[11px] sm:text-xs font-mono text-white/70 min-w-[36px] sm:min-w-[40px] text-right">
            {fmt(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1 gap-1">
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => (isPlaying ? controls.pause() : controls.play())}
              className="hover:scale-110 transition-transform min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>

            <button
              onClick={() => {
                toggleMute();
                muted ? controls.unMute() : controls.mute();
              }}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
              aria-label="Toggle mute"
            >
              {muted || volume === 0 ? (
                <VolumeMuteIcon className="w-5 h-5" />
              ) : (
                <VolumeHighIcon className="w-5 h-5" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => controls.setVolume(Number(e.target.value))}
              className="w-14 sm:w-20 flex-shrink-0"
            />
          </div>

          <div className="flex items-center gap-0.5 sm:gap-2.5">
            {/* Sleep Timer */}
            <div className="relative" ref={sleepMenuRef}>
              <button
                onClick={() => setShowSleepMenu((s) => !s)}
                className={`flex items-center gap-1 rounded-full px-2 min-w-[40px] min-h-[40px] justify-center transition-colors ${
                  sleepTimer.isActive ? "bg-amber/20 text-amber" : "hover:bg-white/10"
                }`}
                aria-label="Sleep timer"
              >
                <ClockIcon className="w-4 h-4" />
                {sleepTimer.isActive && (
                  <span className="text-[11px] font-mono">{sleepTimer.remainingMinutes}m</span>
                )}
              </button>

              {showSleepMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-panel2 border border-line rounded-lg overflow-hidden text-sm min-w-[150px] shadow-xl">
                  {sleepTimer.isActive && (
                    <button
                      onClick={() => {
                        sleepTimer.cancelSleepTimer();
                        setShowSleepMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-white/10 text-red-400 border-b border-line"
                    >
                      Batalkan timer
                    </button>
                  )}
                  {SLEEP_OPTIONS.map((min) => (
                    <button
                      key={min}
                      onClick={() => {
                        sleepTimer.startSleepTimer(min);
                        setShowSleepMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-white/10 font-mono text-xs"
                    >
                      {min} menit
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Zen Mode */}
            <button
              onClick={toggleZenMode}
              className={`rounded-full transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
                isZenMode ? "bg-teal/20 text-teal" : "hover:bg-white/10"
              }`}
              aria-label="Toggle zen mode"
              title="Zen mode — sembunyikan sidebar"
            >
              <TheaterIcon className="w-[18px] h-[18px]" />
            </button>

            {/* Rotate ke landscape — sebelumnya tombol ini TIDAK ADA sama sekali */}
            <button
              onClick={onRotateToLandscape}
              className="rounded-full transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-white/10 sm:hidden"
              aria-label="Putar ke mode landscape"
              title="Putar ke mode landscape"
            >
              <RotateIcon className="w-[18px] h-[18px]" />
            </button>

            <select
              value={playbackRate}
              onChange={(e) => {
                const r = Number(e.target.value);
                controls.setPlaybackRate(r);
                setPlaybackRate(r);
              }}
              className="bg-white/10 text-xs sm:text-sm rounded px-1.5 sm:px-2 py-2 sm:py-1 border border-white/15 min-h-[40px]"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s} className="text-black">
                  {s}x
                </option>
              ))}
            </select>

            <button
              onClick={onToggleFullscreen}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <FullscreenExitIcon className="w-5 h-5" />
              ) : (
                <FullscreenIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
