'use client';

import type { ReactNode } from 'react';

interface WidgetProps {
  title: string;
  children: ReactNode;
}

export default function Widget({ title, children }: WidgetProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-panel">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
          {title}
        </h3>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
