export function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAmount(value: number): string {
  return Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  });
}

export function formatVolume(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000_000) {
    return `${(absoluteValue / 1_000_000_000).toFixed(1)}B`;
  }
  if (absoluteValue >= 1_000_000) {
    return `${(absoluteValue / 1_000_000).toFixed(1)}M`;
  }
  if (absoluteValue >= 1_000) {
    return `${(absoluteValue / 1_000).toFixed(1)}K`;
  }
  return absoluteValue.toFixed(2);
}

export function formatTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatPercent(value: number): string {
  const percent = value * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}
