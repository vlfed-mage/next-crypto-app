'use client';

import { useConnectionStatus } from '@/hooks/use-connection-status';

const STATUS_COLORS: Record<string, string> = {
  connected: 'bg-emerald-400',
  disconnected: 'bg-red-500',
  reconnecting: 'bg-yellow-400 animate-pulse',
};

export default function Header() {
  const status = useConnectionStatus();

  const dotColor = STATUS_COLORS[status] ?? 'bg-red-500';

  return (
    <header className="flex items-center justify-between rounded-xl border border-border bg-panel px-6 py-4">
      <h1 className="text-xl font-bold tracking-tight text-white">
        Crypto Trader
      </h1>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs capitalize text-muted">{status}</span>
      </div>
    </header>
  );
}
