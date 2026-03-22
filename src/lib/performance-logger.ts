interface PerformanceEntry {
  timestamp: string;
  fps: number;
  memoryMb: number;
  health: string;
  messagesPerMinute: number;
  flushesPerSecond: number;
  channels: Record<string, number>;
  latencies: Record<string, number>;
}

const MAX_ENTRIES = 600;

class PerformanceLogger {
  private entries: PerformanceEntry[] = [];

  log(entry: PerformanceEntry): void {
    this.entries.push(entry);

    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
  }

  getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }

  downloadAsJson(): void {
    const data = JSON.stringify(this.entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perf-log-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  downloadAsCsv(): void {
    if (this.entries.length === 0) return;

    const headers = [
      'timestamp',
      'fps',
      'memoryMb',
      'health',
      'messagesPerMinute',
    ];

    const allChannels = new Set<string>();
    const allLatencies = new Set<string>();

    this.entries.forEach((entry) => {
      Object.keys(entry.channels).forEach((key) => allChannels.add(key));
      Object.keys(entry.latencies).forEach((key) => allLatencies.add(key));
    });

    const channelHeaders = Array.from(allChannels).map(
      (channel) => `channel:${channel}`
    );
    const latencyHeaders = Array.from(allLatencies).map(
      (key) => `latency:${key}`
    );
    const allHeaders = [...headers, ...channelHeaders, ...latencyHeaders];

    const rows = this.entries.map((entry) => {
      const base = [
        entry.timestamp,
        entry.fps,
        entry.memoryMb.toFixed(1),
        entry.health,
        entry.messagesPerMinute,
      ];

      const channelValues = Array.from(allChannels).map(
        (channel) => entry.channels[channel] ?? 0
      );
      const latencyValues = Array.from(allLatencies).map((key) =>
        (entry.latencies[key] ?? 0).toFixed(3)
      );

      return [...base, ...channelValues, ...latencyValues].join(',');
    });

    const csv = [allHeaders.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perf-log-${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  clear(): void {
    this.entries = [];
  }
}

export type { PerformanceEntry };
export const performanceLogger = new PerformanceLogger();
