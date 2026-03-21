'use client';

import type { Trade } from '@/types/trade';

import { memo } from 'react';

import { useTradesData } from '@/hooks/use-trades-data';
import { formatAmount, formatPrice, formatTime } from '@/lib/formatters';

import Loading from '../ui/loading';
import StaleIndicator from '../ui/stale-indicator';

const TradeRow = memo(function TradeRow({ trade }: { trade: Trade }) {
  const isBuy = trade.amount > 0;

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-white/5">
      <td className="px-4 py-2 font-mono text-xs text-muted">
        {formatTime(trade.timestamp)}
      </td>
      <td
        className={`px-4 py-2 text-right font-mono text-xs font-medium ${isBuy ? 'text-bid' : 'text-ask'}`}
      >
        {formatPrice(trade.price)}
      </td>
      <td className="px-4 py-2 text-right font-mono text-xs text-foreground">
        {formatAmount(trade.amount)}
      </td>
    </tr>
  );
});

export default function TradesTable() {
  const { trades, isStale } = useTradesData();

  return (
    <div className="relative h-full">
      {isStale && <StaleIndicator />}
      {trades.length === 0 && <Loading />}
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-panel">
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-xs font-semibold text-muted">Time</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
              Price
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 50).map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
