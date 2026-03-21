import { useEffect, useState } from 'react';

import { performanceTracker } from '@/lib/performance-tracker';

interface PerformanceMetrics {
  fps: number;
  memoryMb: number;
  messagesPerMinute: number;
  channelCounts: Map<string, number>;
  latencies: Map<string, number>;
}

const POLL_INTERVAL_MS = 1000;

export function usePerformanceMetrics(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryMb: 0,
    messagesPerMinute: 0,
    channelCounts: new Map(),
    latencies: new Map(),
  });

  useEffect(() => {
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let animationId: number;

    const countFrame = () => {
      frameCount += 1;
      animationId = requestAnimationFrame(countFrame);
    };
    animationId = requestAnimationFrame(countFrame);

    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastFpsTime) / 1000;
      const currentFps = elapsed > 0 ? Math.round(frameCount / elapsed) : 0;
      frameCount = 0;
      lastFpsTime = now;

      let memoryMb = 0;
      if ('memory' in performance) {
        const memoryInfo = (
          performance as unknown as { memory: { usedJSHeapSize: number } }
        ).memory;
        memoryMb = memoryInfo.usedJSHeapSize / 1024 / 1024;
      }

      setMetrics({
        fps: currentFps,
        memoryMb,
        messagesPerMinute: performanceTracker.getMessagesPerMinute(),
        channelCounts: performanceTracker.getChannelCounts(),
        latencies: performanceTracker.getLatencies(),
      });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(interval);
    };
  }, []);

  return metrics;
}
