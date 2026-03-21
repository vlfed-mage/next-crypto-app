'use client';

import { memo, useCallback } from 'react';

import { useMarketData } from '@/hooks/use-market-data';
import { useSelectPair } from '@/hooks/use-select-pair';
import { useSparklinePrices } from '@/hooks/use-sparkline-prices';
import { useTickerData } from '@/hooks/use-ticker-data';
import { formatCurrencyPair } from '@/lib/currency-pair';
import { formatPercent, formatPrice, formatVolume } from '@/lib/formatters';

import Loading from '../ui/loading';
import Sparkline from './sparkline';

interface MarketRowProps {
  currencyPair: string;
  onSelect: (pair: string) => void;
}

const MarketRow = memo(function MarketRow({
  currencyPair,
  onSelect,
}: MarketRowProps) {
  const { ticker } = useTickerData(currencyPair);
  const prices = useSparklinePrices(currencyPair);

  const handleClick = useCallback(() => {
    onSelect(currencyPair);
  }, [onSelect, currencyPair]);

  if (!ticker) {
    return null;
  }

  const isPositive = ticker.dailyChange >= 0;
  const changeColor = isPositive ? 'text-bid' : 'text-ask';

  return (
    <tr
      onClick={handleClick}
      className="cursor-pointer border-b border-border/50 transition-colors hover:bg-white/5"
    >
      <td className="px-4 py-2 text-xs font-medium text-white">
        {formatCurrencyPair(currencyPair)}
      </td>
      <td className="px-4 py-2 text-right font-mono text-xs text-foreground">
        ${formatPrice(ticker.lastPrice)}
      </td>
      <td className={`px-4 py-2 text-right font-mono text-xs ${changeColor}`}>
        {formatPercent(ticker.dailyChangeRelative)}
      </td>
      <td className="px-4 py-2 text-right font-mono text-xs text-muted">
        {formatVolume(ticker.volume)}
      </td>
      <td className="px-4 py-2 text-right">
        <Sparkline prices={prices} />
      </td>
    </tr>
  );
});

export default function MarketTable() {
  const tickers = useMarketData();
  const selectPair = useSelectPair();

  if (tickers.length === 0) {
    return (
      <div className="relative h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-panel">
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-xs font-semibold text-muted">Pair</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
              Price
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
              Change
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
              Volume
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-muted">
              Chart
            </th>
          </tr>
        </thead>
        <tbody>
          {tickers.map((ticker) => (
            <MarketRow
              key={ticker.currencyPair}
              currencyPair={ticker.currencyPair}
              onSelect={selectPair}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
