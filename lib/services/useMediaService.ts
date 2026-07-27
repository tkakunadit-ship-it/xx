"use client";

import { useEffect, useCallback } from "react";
import Dexie, { type Table } from "dexie";
import { useMediaStore } from "@/lib/store/mediaStore";
import type { PlaylistItem, PlaylistGroup, WatchHistoryEntry } from "@/lib/types/media";

class MediaDB extends Dexie {
  playlistGroups!: Table<PlaylistGroup, string>;
  playlistItems!: Table<PlaylistItem, string>;
  history!: Table<WatchHistoryEntry, string>;

  constructor() {
    super("reel-media-hub-db");
    this.version(1).stores({
      playlistGroups: "id, createdAt",
      playlistItems: "id, playlistGroupId, order",
      history: "id, videoId, watchedAt",
    });
  }
}

const db = new MediaDB();

// Catatan: sebelumnya ada juga grup "Favorites" di sini, tapi tidak ada
// satupun tombol di UI untuk menambah video ke grup itu — jadi grup itu
// selamanya kosong dan cuma bikin bingung. Dihapus supaya lebih simple.
// Kalau nanti mau ditambah lagi, pastikan sekaligus bikin tombol "Tambah ke
// Favorites" di PlayerView.tsx / PlaylistPanel.tsx.
const DEFAULT_GROUPS: PlaylistGroup[] = [
  { id: "watch-later", name: "Watch Later", createdAt: new Date().toISOString(), isSystem: true },
];

export function useMediaService() {
  const {
    setPlaylistGroups,
    setPlaylistItems,
    setPlaylistLoading,
    setPlaylistError,
    setHistory,
    setHistoryLoading,
    setHistoryError,
  } = useMediaStore();

  useEffect(() => {
    async function loadPlaylist() {
      setPlaylistLoading(true);
      try {
        let groups = await db.playlistGroups.toArray();
        if (groups.length === 0) {
          await db.playlistGroups.bulkPut(DEFAULT_GROUPS);
          groups = DEFAULT_GROUPS;
        }
        const items = await db.playlistItems.toArray();
        setPlaylistGroups(groups);
        setPlaylistItems(items);
      } catch (err) {
        setPlaylistError("Gagal memuat playlist dari penyimpanan lokal");
        console.error(err);
      } finally {
        setPlaylistLoading(false);
      }
    }

    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const entries = await db.history.orderBy("watchedAt").reverse().toArray();
        setHistory(entries);
      } catch (err) {
        setHistoryError("Gagal memuat history dari penyimpanan lokal");
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadPlaylist();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToPlaylist = useCallback(async (item: PlaylistItem) => {
    await db.playlistItems.put(item);
    useMediaStore.getState().addPlaylistItem(item);
  }, []);

  const removeFromPlaylist = useCallback(async (itemId: string) => {
    await db.playlistItems.delete(itemId);
    useMediaStore.getState().removePlaylistItem(itemId);
  }, []);

  const recordHistoryEntry = useCallback(async (entry: WatchHistoryEntry) => {
    await db.history.put(entry);
    useMediaStore.getState().addHistoryEntry(entry);
  }, []);

  const updateHistoryProgress = useCallback(
    async (entryId: string, progressSeconds: number, completed: boolean) => {
      await db.history.update(entryId, { progressSeconds, completed });
      useMediaStore.getState().updateHistoryProgress(entryId, progressSeconds, completed);
    },
    []
  );

  const clearAllHistory = useCallback(async () => {
    await db.history.clear();
    useMediaStore.getState().clearHistory();
  }, []);

  return { addToPlaylist, removeFromPlaylist, recordHistoryEntry, updateHistoryProgress, clearAllHistory };
}
