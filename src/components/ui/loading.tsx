'use client';

export default function Loading() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/80">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  );
}
