'use client';

import type { Order } from '@/types/order';

import { memo } from 'react';

import { useBookData } from '@/hooks/use-book-data';
import { formatAmount, formatPrice } from '@/lib/formatters';

import Loading from '../ui/loading';
import StaleIndicator from '../ui/stale-indicator';

const BookRow = memo(function BookRow({
  bid,
  ask,
}: {
  bid: Order;
  ask: Order;
}) {
  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-white/5">
      <td className="px-3 py-1.5 text-right font-mono text-xs text-foreground">
        {formatAmount(bid.amount)}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-xs font-medium text-bid">
        {formatPrice(bid.price)}
      </td>
      <td className="px-3 py-1.5 font-mono text-xs font-medium text-ask">
        {formatPrice(ask.price)}
      </td>
      <td className="px-3 py-1.5 font-mono text-xs text-foreground">
        {formatAmount(Math.abs(ask.amount))}
      </td>
    </tr>
  );
});

export default function BookTable() {
  const { orders, isStale } = useBookData();

  return (
    <div className="relative h-full">
      {isStale && <StaleIndicator />}
      {orders.length === 0 && <Loading />}
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-panel">
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-right text-xs font-semibold text-muted">
              Bid Amt
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-bid">
              Bid
            </th>
            <th className="px-3 py-2 text-xs font-semibold text-ask">Ask</th>
            <th className="px-3 py-2 text-xs font-semibold text-muted">
              Ask Amt
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 20).map((row, index) => (
            <BookRow key={index} bid={row.bid} ask={row.ask} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
