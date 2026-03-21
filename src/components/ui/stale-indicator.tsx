'use client';

export default function StaleIndicator() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-panel/60 backdrop-blur-sm">
      <span className="rounded bg-yellow-600/20 px-3 py-1 text-xs font-medium text-yellow-400">
        Stale Data
      </span>
    </div>
  );
}
