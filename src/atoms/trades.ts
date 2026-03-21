import type { Trade } from '@/types/trade';

import { atom } from 'jotai';

import { selectedPairAtom } from './selection';

export const tradesAtom = atom<Map<string, Trade[]>>(new Map());

const EMPTY_TRADES: Trade[] = [];

export const selectedPairTradesAtom = atom((get) => {
  const trades = get(tradesAtom);
  const selectedPair = get(selectedPairAtom);

  if (!selectedPair) {
    return EMPTY_TRADES;
  }

  return trades.get(selectedPair) ?? EMPTY_TRADES;
});
