"use client";

export default function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-panel2/95 backdrop-blur border border-line text-xs font-mono px-3.5 py-2 rounded-full transition-all duration-300 pointer-events-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {message}
    </div>
  );
}
