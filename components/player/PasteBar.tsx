"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ClipboardIcon, CheckIcon, SearchIcon } from "./icons";
import { extractVideoId } from "@/lib/utils/youtube";

export default function PasteBar({ large = false }: { large?: boolean }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justPasted, setJustPasted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit() {
    const videoId = extractVideoId(value);
    if (!videoId) {
      setError("Link YouTube tidak dikenali. Coba tempel ulang.");
      return;
    }
    setError(null);
    router.push(`/watch/${videoId}`);
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue(text);
        setError(null);
        setJustPasted(true);
        inputRef.current?.focus();
        setTimeout(() => setJustPasted(false), 1400);
      }
    } catch {
      // Izin clipboard ditolak / tidak didukung browser — biarkan user paste manual
      setError("Tidak bisa akses clipboard otomatis. Tempel manual di kolom ini.");
      inputRef.current?.focus();
    }
  }

  return (
    <div className={large ? "w-full max-w-xl" : "w-full max-w-[480px]"}>
      <div
        className={`flex items-center gap-2 bg-panel2/80 backdrop-blur border border-line rounded-full pl-4 pr-1.5 transition-all focus-within:border-amber/60 focus-within:shadow-[0_0_0_4px_rgba(232,163,61,0.12)] ${
          large ? "py-2.5" : "py-1.5"
        }`}
      >
        <SearchIcon className={`text-muted flex-shrink-0 ${large ? "w-5 h-5" : "w-4 h-4"}`} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Tempel link YouTube di sini…"
          className={`bg-transparent outline-none font-mono flex-1 min-w-0 placeholder:text-muted ${
            large ? "text-sm" : "text-sm"
          }`}
        />

        <button
          onClick={handlePasteFromClipboard}
          title="Tempel dari clipboard"
          aria-label="Tempel dari clipboard"
          className={`flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
            justPasted ? "bg-teal/20 text-teal" : "bg-white/5 text-muted hover:bg-white/10 hover:text-text"
          } ${large ? "w-9 h-9" : "w-8 h-8"}`}
        >
          {justPasted ? (
            <CheckIcon className={large ? "w-4 h-4" : "w-3.5 h-3.5"} />
          ) : (
            <ClipboardIcon className={large ? "w-4 h-4" : "w-3.5 h-3.5"} />
          )}
        </button>

        <button
          onClick={handleSubmit}
          className={`bg-amber text-[#15171C] rounded-full font-semibold hover:brightness-110 active:scale-95 transition-all flex-shrink-0 ${
            large ? "px-5 py-2 text-sm" : "px-4 py-1.5 text-sm"
          }`}
        >
          Muat
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5 font-mono px-1">{error}</p>}
    </div>
  );
}
