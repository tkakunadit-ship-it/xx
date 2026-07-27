import { create } from "zustand";
import type { PlaylistItem, PlaylistGroup, WatchHistoryEntry } from "@/lib/types/media";

interface MediaState {
  playlistGroups: PlaylistGroup[];
  playlistItems: PlaylistItem[];
  history: WatchHistoryEntry[];

  isPlaylistLoading: boolean;
  isHistoryLoading: boolean;
  playlistError: string | null;
  historyError: string | null;

  setPlaylistGroups: (groups: PlaylistGroup[]) => void;
  setPlaylistItems: (items: PlaylistItem[]) => void;
  addPlaylistItem: (item: PlaylistItem) => void;
  removePlaylistItem: (itemId: string) => void;
  setPlaylistLoading: (loading: boolean) => void;
  setPlaylistError: (error: string | null) => void;

  setHistory: (entries: WatchHistoryEntry[]) => void;
  addHistoryEntry: (entry: WatchHistoryEntry) => void;
  updateHistoryProgress: (entryId: string, progressSeconds: number, completed: boolean) => void;
  clearHistory: () => void;
  setHistoryLoading: (loading: boolean) => void;
  setHistoryError: (error: string | null) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  playlistGroups: [],
  playlistItems: [],
  history: [],

  isPlaylistLoading: false,
  isHistoryLoading: false,
  playlistError: null,
  historyError: null,

  setPlaylistGroups: (playlistGroups) => set({ playlistGroups }),
  setPlaylistItems: (playlistItems) => set({ playlistItems }),
  addPlaylistItem: (item) => set((s) => ({ playlistItems: [...s.playlistItems, item] })),
  removePlaylistItem: (itemId) =>
    set((s) => ({ playlistItems: s.playlistItems.filter((i) => i.id !== itemId) })),
  setPlaylistLoading: (isPlaylistLoading) => set({ isPlaylistLoading }),
  setPlaylistError: (playlistError) => set({ playlistError }),

  setHistory: (history) => set({ history }),
  addHistoryEntry: (entry) => set((s) => ({ history: [entry, ...s.history] })),
  updateHistoryProgress: (entryId, progressSeconds, completed) =>
    set((s) => ({
      history: s.history.map((h) => (h.id === entryId ? { ...h, progressSeconds, completed } : h)),
    })),
  clearHistory: () => set({ history: [] }),
  setHistoryLoading: (isHistoryLoading) => set({ isHistoryLoading }),
  setHistoryError: (historyError) => set({ historyError }),
}));
