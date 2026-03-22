type LatencyCallback = (channel: string, latencyMs: number) => void;

class PerformanceTracker {
  private messageCounts = new Map<string, number>();
  private latencies = new Map<string, number>();
  private totalMessages = 0;
  private totalFlushes = 0;
  private windowStart = Date.now();
  private listeners: LatencyCallback[] = [];

  trackMessage(channel: string): void {
    this.totalMessages += 1;
    this.messageCounts.set(channel, (this.messageCounts.get(channel) ?? 0) + 1);
  }

  trackLatency(channel: string, latencyMs: number): void {
    this.latencies.set(channel, latencyMs);
    this.listeners.forEach((listener) => listener(channel, latencyMs));
  }

  onLatency(callback: LatencyCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  trackFlush(): void {
    this.totalFlushes += 1;
  }

  getFlushesPerSecond(): number {
    const elapsed = (Date.now() - this.windowStart) / 1000;
    if (elapsed < 1) return 0;
    return Math.round(this.totalFlushes / elapsed);
  }

  getMessagesPerMinute(): number {
    const elapsed = (Date.now() - this.windowStart) / 1000;
    if (elapsed < 1) return 0;
    return Math.round((this.totalMessages / elapsed) * 60);
  }

  getChannelCounts(): Map<string, number> {
    return new Map(this.messageCounts);
  }

  getLatencies(): Map<string, number> {
    return new Map(this.latencies);
  }

  reset(): void {
    this.messageCounts.clear();
    this.totalMessages = 0;
    this.totalFlushes = 0;
    this.windowStart = Date.now();
  }
}

export const performanceTracker = new PerformanceTracker();
