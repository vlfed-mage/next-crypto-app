'use client';

import { useEffect, useRef, useState } from 'react';

import { useConnectionStatus } from '@/hooks/use-connection-status';
import { usePerformanceMetrics } from '@/hooks/use-performance-metrics';
import { performanceLogger } from '@/lib/performance-logger';

const HEALTH_COLORS = {
  good: '#10b981',
  warning: '#f59e0b',
  poor: '#ef4444',
};

function getHealth(fps: number, memoryMb: number): keyof typeof HEALTH_COLORS {
  if (fps < 10 || memoryMb > 500) return 'poor';
  if (fps < 30 || memoryMb > 200) return 'warning';
  return 'good';
}

function mapToRecord(map: Map<string, number>): Record<string, number> {
  const record: Record<string, number> = {};
  map.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export default function PerformanceDashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLogging, setIsLogging] = useState(true);
  const [entryCount, setEntryCount] = useState(0);
  const metrics = usePerformanceMetrics();
  const connectionStatus = useConnectionStatus();

  const health = getHealth(metrics.fps, metrics.memoryMb);
  const healthColor = HEALTH_COLORS[health];

  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const healthRef = useRef(health);
  healthRef.current = health;

  useEffect(() => {
    if (!isLogging) return;

    const interval = setInterval(() => {
      const currentMetrics = metricsRef.current;
      performanceLogger.log({
        timestamp: new Date().toISOString(),
        fps: currentMetrics.fps,
        memoryMb: currentMetrics.memoryMb,
        health: healthRef.current,
        messagesPerMinute: currentMetrics.messagesPerMinute,
        channels: mapToRecord(currentMetrics.channelCounts),
        latencies: mapToRecord(currentMetrics.latencies),
      });
      setEntryCount(performanceLogger.getEntries().length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLogging]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-3 right-3 z-50 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-muted hover:text-foreground"
      >
        Perf
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 w-56 rounded-lg border border-border bg-panel p-3 text-xs shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-foreground">Performance</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="border-b border-border pb-2">
          <div className="flex justify-between">
            <span className="text-muted">FPS</span>
            <span className="font-mono">{metrics.fps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Memory</span>
            <span className="font-mono">{metrics.memoryMb.toFixed(1)} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Health</span>
            <span className="font-mono" style={{ color: healthColor }}>
              {health}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Connection</span>
            <span className="font-mono capitalize">{connectionStatus}</span>
          </div>
        </div>

        <div className="border-b border-border pb-2">
          <div className="mb-1 text-muted">Messages/min</div>
          <div className="flex justify-between">
            <span className="text-muted">Total</span>
            <span className="font-mono">{metrics.messagesPerMinute}</span>
          </div>
          {Array.from(metrics.channelCounts.entries()).map(
            ([channel, count]) => (
              <div key={channel} className="flex justify-between">
                <span className="text-muted">{channel}</span>
                <span className="font-mono">{count}</span>
              </div>
            )
          )}
        </div>

        <div className="border-b border-border pb-2">
          <div className="mb-1 text-muted">Latency (ms)</div>
          {Array.from(metrics.latencies.entries()).map(([channel, latency]) => (
            <div key={channel} className="flex justify-between">
              <span className="text-muted">{channel}</span>
              <span className="font-mono">{latency.toFixed(1)}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted">Log ({entryCount} entries)</span>
            <button
              onClick={() => setIsLogging(!isLogging)}
              className={`rounded px-1.5 py-0.5 ${
                isLogging ? 'bg-bid/20 text-bid' : 'bg-ask/20 text-ask'
              }`}
            >
              {isLogging ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => performanceLogger.downloadAsCsv()}
              className="flex-1 rounded border border-border px-2 py-1 text-muted hover:text-foreground"
            >
              CSV
            </button>
            <button
              onClick={() => performanceLogger.downloadAsJson()}
              className="flex-1 rounded border border-border px-2 py-1 text-muted hover:text-foreground"
            >
              JSON
            </button>
            <button
              onClick={() => {
                performanceLogger.clear();
                setEntryCount(0);
              }}
              className="rounded border border-border px-2 py-1 text-muted hover:text-ask"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
