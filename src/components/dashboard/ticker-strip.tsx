'use client';

import { useCallback } from 'react';

import { useAtomValue } from 'jotai';

import { currencyPairsAtom } from '@/atoms/currency-pairs';
import { selectedPairAtom } from '@/atoms/selection';
import { useSelectPair } from '@/hooks/use-select-pair';
import { useTickerData } from '@/hooks/use-ticker-data';

import TickerCard from './ticker-card';

function TickerSlot({ currencyPair }: { currencyPair: string }) {
  const { ticker, isStale } = useTickerData(currencyPair);
  const selectedPair = useAtomValue(selectedPairAtom);
  const selectPair = useSelectPair();

  const handleClick = useCallback(() => {
    selectPair(currencyPair);
  }, [selectPair, currencyPair]);

  if (!ticker) {
    return (
      <div className="flex min-w-[160px] items-center justify-center rounded-lg border border-border bg-panel px-4 py-3">
        <span className="text-xs text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <TickerCard
      currencyPair={currencyPair}
      lastPrice={ticker.lastPrice}
      dailyChange={ticker.dailyChange}
      dailyChangeRelative={ticker.dailyChangeRelative}
      isActive={selectedPair === currencyPair}
      isStale={isStale}
      onClick={handleClick}
    />
  );
}

export default function TickerStrip() {
  const currencyPairs = useAtomValue(currencyPairsAtom);

  return (
    <div className="flex gap-3 overflow-x-auto">
      {currencyPairs.map((pair) => (
        <TickerSlot key={pair} currencyPair={pair} />
      ))}
    </div>
  );
}
