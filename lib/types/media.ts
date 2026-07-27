export interface PlaylistGroup {
  id: string;
  name: string;
  createdAt: string;
  isSystem: boolean;
}

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelName?: string;
  durationSeconds?: number;
  order: number;
  addedAt: string;
  playlistGroupId: string;
}

export interface WatchHistoryEntry {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  watchedAt: string;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
}
