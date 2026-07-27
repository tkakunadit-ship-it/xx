import PasteBar from "@/components/player/PasteBar";

const FEATURES = [
  { label: "Kontrol kustom", color: "bg-amber", desc: "Play, speed, volume — bukan tampilan bawaan YouTube" },
  { label: "Fullscreen di semua device", color: "bg-teal", desc: "Termasuk fallback khusus untuk iOS" },
  { label: "Playlist & History lokal", color: "bg-rose", desc: "Tersimpan di perangkatmu, tanpa akun" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-x-hidden">
      {/* Ambient background orbs — signature element halaman ini */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber/20 blur-[110px] animate-float" />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-indigo/20 blur-[130px] animate-float"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-teal/15 blur-[100px] animate-float"
        style={{ animationDelay: "-6s" }}
      />

      <div className="relative flex flex-col items-center gap-7 text-center max-w-xl">
        <div className="flex items-center gap-2.5 font-display font-bold text-3xl tracking-tight">
          <span className="relative w-3 h-3 rounded-full bg-amber">
            <span className="absolute inset-0 rounded-full bg-amber animate-glow blur-[6px]" />
          </span>
          Reel
        </div>

        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl tracking-tight leading-tight mb-3">
            Tonton YouTube dengan kontrol{" "}
            <span className="bg-gradient-to-r from-amber via-rose to-indigo bg-clip-text text-transparent">
              yang benar-benar milikmu
            </span>
          </h1>
          <p className="text-muted text-sm sm:text-[15px] leading-relaxed">
            Tempel link video untuk mulai menonton dengan player kustom, playlist, dan riwayat
            tontonan tersimpan lokal — tanpa perlu login.
          </p>
        </div>

        <PasteBar large />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-4">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-start gap-2 bg-panel/60 border border-line rounded-xl p-4 text-left"
            >
              <span className={`w-2 h-2 rounded-full ${f.color}`} />
              <p className="text-[13px] font-semibold">{f.label}</p>
              <p className="text-[11.5px] text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
