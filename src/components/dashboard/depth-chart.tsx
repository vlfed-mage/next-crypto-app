'use client';

import { memo, useMemo } from 'react';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useContainerSize } from '@/hooks/use-container-size';
import { useDepthData } from '@/hooks/use-depth-data';
import { formatPrice } from '@/lib/formatters';

import Loading from '../ui/loading';
import StaleIndicator from '../ui/stale-indicator';

const BID_COLOR = '#10b981';
const ASK_COLOR = '#ef4444';
const GRID_COLOR = '#1e293b';

export default memo(function DepthChart() {
  const { depth, isStale } = useDepthData();
  const [containerRef, containerSize] = useContainerSize();

  const chartData = useMemo(() => {
    const bidData = [...depth.bids].reverse().map((point) => ({
      price: point.price.toFixed(0),
      bidDepth: point.depth,
      askDepth: null as number | null,
    }));

    const askData = depth.asks.map((point) => ({
      price: point.price.toFixed(0),
      bidDepth: null as number | null,
      askDepth: point.depth,
    }));

    return [...bidData, ...askData];
  }, [depth]);

  const isEmpty = depth.bids.length === 0 && depth.asks.length === 0;

  return (
    <div ref={containerRef} className="relative h-full">
      {isStale && <StaleIndicator />}
      {isEmpty && <Loading />}
      {!isEmpty && containerSize.width > 0 && containerSize.height > 0 && (
        <ComposedChart
          width={containerSize.width}
          height={containerSize.height}
          data={chartData}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={false}
          />
          <XAxis
            dataKey="price"
            stroke="#475569"
            tick={{ fill: '#475569', fontSize: 10 }}
            tickMargin={8}
            minTickGap={50}
            tickFormatter={(v: string) => `$${formatPrice(Number(v))}`}
          />
          <YAxis
            stroke="#475569"
            tick={{ fill: '#475569', fontSize: 10 }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#ffffff',
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Area
            type="stepAfter"
            dataKey="bidDepth"
            stroke={BID_COLOR}
            fill={BID_COLOR}
            fillOpacity={0.2}
            name="Bids"
            connectNulls={false}
          />
          <Area
            type="stepAfter"
            dataKey="askDepth"
            stroke={ASK_COLOR}
            fill={ASK_COLOR}
            fillOpacity={0.2}
            name="Asks"
            connectNulls={false}
          />
        </ComposedChart>
      )}
    </div>
  );
});
