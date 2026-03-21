import type { Timeframe } from '@/lib/constants';
import type { Candle } from '@/types/candle';

import { atom } from 'jotai';

import { DEFAULT_TIMEFRAME } from '@/lib/constants';

import { selectedPairAtom } from './selection';

export const candlesAtom = atom<Map<string, Candle[]>>(new Map());

export const selectedTimeframeAtom = atom<Timeframe>(DEFAULT_TIMEFRAME);

const EMPTY_CANDLES: Candle[] = [];

export const selectedPairCandlesAtom = atom((get) => {
  const candles = get(candlesAtom);
  const selectedPair = get(selectedPairAtom);
  const timeframe = get(selectedTimeframeAtom);

  if (!selectedPair) {
    return EMPTY_CANDLES;
  }

  const lookupKey = `trade:${timeframe}:t${selectedPair}`;
  return candles.get(lookupKey) ?? EMPTY_CANDLES;
});
