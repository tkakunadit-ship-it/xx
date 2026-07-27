"use client";

import { useState } from "react";
import PlaylistPanel from "./PlaylistPanel";
import HistoryPanel from "./HistoryPanel";

export default function Sidebar() {
  const [tab, setTab] = useState<"playlist" | "history">("playlist");

  return (
    <aside className="border-l border-line flex flex-col min-h-0 w-full md:w-[340px] flex-shrink-0">
      <div className="flex border-b border-line flex-shrink-0">
        <button
          onClick={() => setTab("playlist")}
          className={`flex-1 py-4 min-h-[48px] text-sm font-semibold ${
            tab === "playlist" ? "text-white relative after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-[2px] after:bg-amber" : "text-muted"
          }`}
        >
          Playlist
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-4 min-h-[48px] text-sm font-semibold ${
            tab === "history" ? "text-white relative after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-[2px] after:bg-amber" : "text-muted"
          }`}
        >
          History
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "playlist" ? <PlaylistPanel /> : <HistoryPanel />}
      </div>
    </aside>
  );
}
