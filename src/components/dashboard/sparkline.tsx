'use client';

import { memo } from 'react';

interface SparklineProps {
  prices: number[];
  width?: number;
  height?: number;
}

const STROKE_COLOR_UP = '#10b981';
const STROKE_COLOR_DOWN = '#ef4444';

export default memo(function Sparkline({
  prices,
  width = 80,
  height = 30,
}: SparklineProps) {
  if (prices.length < 2) {
    return <svg width={width} height={height} />;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = prices.map((price, index) => {
    const x = padding + (index / (prices.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((price - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const firstPrice = prices[0]!;
  const lastPrice = prices[prices.length - 1]!;
  const color = lastPrice >= firstPrice ? STROKE_COLOR_UP : STROKE_COLOR_DOWN;

  return (
    <svg width={width} height={height}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
