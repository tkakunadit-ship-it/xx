import { create } from "zustand";

export type PlayerStatus = "unstarted" | "buffering" | "playing" | "paused" | "ended";

interface PlayerState {
  status: PlayerStatus;
  volume: number;
  muted: boolean;
  playbackRate: number;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  isNativeFullscreen: boolean;
  isZenMode: boolean;
  sleepTimerEndAt: number | null; // timestamp ms, null = tidak aktif

  setStatus: (s: PlayerStatus) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (r: number) => void;
  setTime: (current: number, duration: number) => void;
  setFullscreen: (v: boolean) => void;
  setNativeFullscreen: (v: boolean) => void;
  toggleZenMode: () => void;
  setSleepTimer: (endAt: number | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  status: "unstarted",
  volume: 100,
  muted: false,
  playbackRate: 1,
  currentTime: 0,
  duration: 0,
  isFullscreen: false,
  isNativeFullscreen: false,
  isZenMode: false,
  sleepTimerEndAt: null,

  setStatus: (status) => set({ status }),
  setVolume: (volume) => set({ volume, muted: volume === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setTime: (currentTime, duration) => set({ currentTime, duration }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setNativeFullscreen: (isNativeFullscreen) => set({ isNativeFullscreen }),
  toggleZenMode: () => set((s) => ({ isZenMode: !s.isZenMode })),
  setSleepTimer: (sleepTimerEndAt) => set({ sleepTimerEndAt }),
}));
