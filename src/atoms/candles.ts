import type { Candle } from '@/types/candle';

import { atom } from 'jotai';

import { DEFAULT_TIMEFRAME } from '@/lib/constants';

import { selectedPairAtom } from './selection';

export const candlesAtom = atom<Map<string, Candle[]>>(new Map());

const EMPTY_CANDLES: Candle[] = [];

export const selectedPairCandlesAtom = atom((get) => {
  const candles = get(candlesAtom);
  const selectedPair = get(selectedPairAtom);

  if (!selectedPair) {
    return EMPTY_CANDLES;
  }

  const lookupKey = `trade:${DEFAULT_TIMEFRAME}:t${selectedPair}`;
  return candles.get(lookupKey) ?? EMPTY_CANDLES;
});
