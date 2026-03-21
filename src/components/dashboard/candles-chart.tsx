'use client';

import type { Timeframe } from '@/lib/constants';

import { memo, useMemo } from 'react';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useCandlesData } from '@/hooks/use-candles-data';
import { useContainerSize } from '@/hooks/use-container-size';
import { TIMEFRAME_LABELS, TIMEFRAMES } from '@/lib/constants';
import { formatCurrencyPair } from '@/lib/currency-pair';
import { formatPrice, formatTime } from '@/lib/formatters';

import Loading from '../ui/loading';
import StaleIndicator from '../ui/stale-indicator';

const CANDLE_UP_COLOR = '#10b981';
const CANDLE_DOWN_COLOR = '#ef4444';
const VOLUME_COLOR = '#334155';
const GRID_COLOR = '#1e293b';

export default memo(function CandlesChart() {
  const { candles, currencyPair, timeframe, isStale, changeTimeframe } =
    useCandlesData();
  const [containerRef, containerSize] = useContainerSize();

  const chartData = useMemo(() => {
    return candles.slice(-60).map((candle) => {
      const isUp = candle.close >= candle.open;
      return {
        time: formatTime(candle.timestamp),
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
        fill: isUp ? CANDLE_UP_COLOR : CANDLE_DOWN_COLOR,
        body: isUp ? [candle.open, candle.close] : [candle.close, candle.open],
      };
    });
  }, [candles]);

  return (
    <div className="relative h-full">
      {isStale && <StaleIndicator />}
      {chartData.length === 0 && <Loading />}
      {chartData.length > 0 && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                {currencyPair ? formatCurrencyPair(currencyPair) : ''}
              </span>
              {chartData.length > 0 &&
                (() => {
                  const lastCandle = chartData[chartData.length - 1]!;
                  const isUp = lastCandle.close >= lastCandle.open;
                  return (
                    <span
                      className={`font-mono text-sm font-bold ${isUp ? 'text-bid' : 'text-ask'}`}
                    >
                      ${formatPrice(lastCandle.close)}
                    </span>
                  );
                })()}
            </div>
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => changeTimeframe(tf as Timeframe)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    tf === timeframe
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {TIMEFRAME_LABELS[tf]}
                </button>
              ))}
            </div>
          </div>
          <div ref={containerRef} className="min-h-0 flex-1">
            {containerSize.width > 0 && containerSize.height > 0 && (
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
                  dataKey="time"
                  stroke="#475569"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  tickMargin={8}
                  minTickGap={40}
                />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  stroke="#475569"
                  tick={{
                    fill: '#475569',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                  tickFormatter={(v: number) => `$${formatPrice(v)}`}
                  domain={['auto', 'auto']}
                  width={80}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  hide
                  domain={[0, 'dataMax * 4']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload as {
                      open: number;
                      high: number;
                      low: number;
                      close: number;
                      volume: number;
                    };
                    if (!data) return null;
                    return (
                      <div
                        style={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: '#ffffff',
                          fontFamily: 'monospace',
                        }}
                      >
                        <div style={{ color: '#94a3b8', marginBottom: 4 }}>
                          {label}
                        </div>
                        <div>O: ${formatPrice(data.open)}</div>
                        <div>H: ${formatPrice(data.high)}</div>
                        <div>L: ${formatPrice(data.low)}</div>
                        <div>C: ${formatPrice(data.close)}</div>
                        <div style={{ color: '#64748b', marginTop: 4 }}>
                          Vol: {data.volume.toFixed(4)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill={VOLUME_COLOR}
                  opacity={0.3}
                  barSize={6}
                  isAnimationActive={false}
                />
                <Bar
                  yAxisId="price"
                  dataKey="body"
                  isAnimationActive={false}
                  barSize={6}
                  shape={(props) => {
                    const x = Number(props.x);
                    const y = Number(props.y);
                    const width = Number(props.width);
                    const height = Number(props.height);
                    const payload = (
                      props as unknown as {
                        payload: {
                          high: number;
                          low: number;
                          fill: string;
                        };
                      }
                    ).payload;
                    const yScale =
                      height !== 0
                        ? (payload.high - payload.low) / Math.abs(height)
                        : 0;
                    return (
                      <g>
                        <line
                          x1={x + width / 2}
                          y1={
                            y -
                            (payload.high - payload.low) *
                              (yScale > 0 ? 1 / yScale : 0)
                          }
                          x2={x + width / 2}
                          y2={y + Math.abs(height)}
                          stroke={payload.fill}
                          strokeWidth={1}
                        />
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={Math.max(Math.abs(height), 1)}
                          fill={payload.fill}
                        />
                      </g>
                    );
                  }}
                />
              </ComposedChart>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
