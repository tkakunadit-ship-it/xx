import { Suspense } from "react";
import PlayerView from "./PlayerView";

export default function WatchPage({ params }: { params: { videoId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted text-sm font-mono">
          Memuat…
        </div>
      }
    >
      <PlayerView videoId={params.videoId} />
    </Suspense>
  );
}
