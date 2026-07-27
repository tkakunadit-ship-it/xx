"use client";

import { useEffect, useCallback, useState, useRef, RefObject } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
}
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || isIPadOS;
}

function supportsNativeFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const testEl = document.createElement("div") as FullscreenElement;
  return !!(testEl.requestFullscreen || testEl.webkitRequestFullscreen) && !isIOS();
}

interface OriginalBodyStyle {
  overflow: string;
  paddingTop: string;
  position: string;
  top: string;
  width: string;
}

interface OrientationLockScreen extends Screen {
  orientation: ScreenOrientation & {
    lock?: (orientation: string) => Promise<void>;
    unlock?: () => void;
  };
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Coba lock ke landscape via Screen Orientation API. Gagal secara diam-diam
 * kalau tidak didukung (misal iOS Safari) — di situ user tetap bisa memutar
 * device secara manual karena video sudah fullscreen. */
async function tryLockLandscape() {
  const scr = typeof screen !== "undefined" ? (screen as OrientationLockScreen) : null;
  try {
    await scr?.orientation?.lock?.("landscape");
  } catch {
    // Tidak didukung browser ini — abaikan, bukan error fatal.
  }
}

function tryUnlockOrientation() {
  const scr = typeof screen !== "undefined" ? (screen as OrientationLockScreen) : null;
  try {
    scr?.orientation?.unlock?.();
  } catch {
    // no-op
  }
}

export function useFullscreen(shellRef: RefObject<HTMLDivElement>) {
  const setFullscreen = usePlayerStore((s) => s.setFullscreen);
  const setNativeFullscreen = usePlayerStore((s) => s.setNativeFullscreen);
  const isFullscreen = usePlayerStore((s) => s.isFullscreen);

  const [isFakeMode, setIsFakeMode] = useState(false);
  const originalBodyStyleRef = useRef<OriginalBodyStyle | null>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    function onFullscreenChange() {
      const doc = document as FullscreenDocument;
      const activeEl = doc.fullscreenElement || doc.webkitFullscreenElement;
      const isOurShellFullscreen = activeEl === shellRef.current;
      setNativeFullscreen(isOurShellFullscreen);
      if (!isFakeMode) setFullscreen(isOurShellFullscreen);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, [shellRef, setNativeFullscreen, setFullscreen, isFakeMode]);

  useEffect(() => {
    const body = document.body;
    if (isFullscreen) {
      if (!originalBodyStyleRef.current) {
        scrollPositionRef.current = window.scrollY;
        originalBodyStyleRef.current = {
          overflow: body.style.overflow || "",
          paddingTop: body.style.paddingTop || "",
          position: body.style.position || "",
          top: body.style.top || "",
          width: body.style.width || "",
        };
      }
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollPositionRef.current}px`;
      body.style.width = "100%";
      if (isFakeMode && isIOS()) {
        body.style.paddingTop = "env(safe-area-inset-top)";
      }
    } else if (originalBodyStyleRef.current) {
      const saved = originalBodyStyleRef.current;
      body.style.overflow = saved.overflow;
      body.style.position = saved.position;
      body.style.top = saved.top;
      body.style.width = saved.width;
      body.style.paddingTop = saved.paddingTop;
      originalBodyStyleRef.current = null;
      window.scrollTo(0, scrollPositionRef.current);
    }

    return () => {
      if (originalBodyStyleRef.current) {
        const saved = originalBodyStyleRef.current;
        body.style.overflow = saved.overflow;
        body.style.position = saved.position;
        body.style.top = saved.top;
        body.style.width = saved.width;
        body.style.paddingTop = saved.paddingTop;
        originalBodyStyleRef.current = null;
        window.scrollTo(0, scrollPositionRef.current);
      }
    };
  }, [isFullscreen, isFakeMode]);

  // Fitur baru: sebelumnya TIDAK ADA tombol/mekanisme rotate ke landscape
  // sama sekali di project ini. Sekarang begitu fullscreen aktif di mobile,
  // otomatis coba lock ke landscape; begitu keluar fullscreen, unlock lagi.
  useEffect(() => {
    if (!isMobile()) return;
    if (isFullscreen) {
      tryLockLandscape();
    } else {
      tryUnlockOrientation();
    }
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current as FullscreenElement | null;
    if (!el) return;

    if (isFakeMode) {
      setIsFakeMode(false);
      setFullscreen(false);
      return;
    }

    const doc = document as FullscreenDocument;
    const isCurrentlyNativeFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (isCurrentlyNativeFullscreen) {
      try {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } catch (err) {
        console.error("Gagal keluar dari native fullscreen:", err);
      }
      return;
    }

    if (supportsNativeFullscreen()) {
      try {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      } catch (err) {
        console.warn("Native fullscreen gagal, fallback ke fake fullscreen:", err);
        setIsFakeMode(true);
        setFullscreen(true);
      }
    } else {
      setIsFakeMode(true);
      setFullscreen(true);
    }
  }, [shellRef, isFakeMode, setFullscreen]);

  // Dipakai tombol "Putar ke landscape" manual di ControlsOverlay — untuk
  // browser yang butuh direct user-gesture supaya lock-nya diizinkan
  // (kebanyakan browser mobile menolak orientation.lock() kalau dipanggil
  // otomatis tanpa tap langsung dari user).
  const rotateToLandscape = useCallback(async () => {
    if (!isFullscreen) {
      await toggleFullscreen();
    }
    await tryLockLandscape();
  }, [isFullscreen, toggleFullscreen]);

  return { toggleFullscreen, isFakeMode, rotateToLandscape };
}
