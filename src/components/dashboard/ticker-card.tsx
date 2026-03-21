'use client';

import { memo } from 'react';

import { formatCurrencyPair } from '@/lib/currency-pair';
import { formatPercent, formatPrice } from '@/lib/formatters';

interface TickerCardProps {
  currencyPair: string;
  lastPrice: number;
  dailyChange: number;
  dailyChangeRelative: number;
  isActive: boolean;
  isStale: boolean;
  onClick: () => void;
}

export default memo(function TickerCard({
  currencyPair,
  lastPrice,
  dailyChange,
  dailyChangeRelative,
  isActive,
  isStale,
  onClick,
}: TickerCardProps) {
  const isPositive = dailyChange >= 0;
  const changeColor = isPositive ? 'text-bid' : 'text-ask';

  return (
    <button
      onClick={onClick}
      className={`flex min-w-[160px] flex-col rounded-lg border px-4 py-3 text-left transition-colors ${
        isActive
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-border bg-panel hover:border-muted'
      } ${isStale ? 'opacity-50' : ''}`}
    >
      <span className="text-xs text-muted">
        {formatCurrencyPair(currencyPair)}
      </span>
      <span className="font-mono text-sm font-bold text-white">
        ${formatPrice(lastPrice)}
      </span>
      <span className={`font-mono text-xs ${changeColor}`}>
        {formatPercent(dailyChangeRelative)}
      </span>
    </button>
  );
});
