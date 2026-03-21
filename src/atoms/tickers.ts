import type { Ticker } from '@/types/ticker';

import { atom } from 'jotai';

import {
  DEFAULT_TIMEFRAME,
  VISIBLE_TICKERS_COUNT,
  VISIBLE_TICKERS_OFFSET,
} from '@/lib/constants';

import { candlesAtom } from './candles';
import { currencyPairsAtom } from './currency-pairs';
import { selectedPairAtom } from './selection';

export const tickersAtom = atom<Map<string, Ticker>>(new Map());

export const tickerBySymbolAtom = atom((get) => {
  const tickers = get(tickersAtom);
  return (symbol: string): Ticker | undefined => tickers.get(symbol);
});

export const enrichedTickersAtom = atom((get) => {
  const currencyPairs = get(currencyPairsAtom);
  const tickers = get(tickersAtom);

  return currencyPairs
    .map((currencyPair) => {
      const ticker = tickers.get(currencyPair);
      if (!ticker) {
        return null;
      }
      return { ...ticker, currencyPair };
    })
    .filter((ticker): ticker is Ticker => ticker !== null);
});

export const visibleTickersAtom = atom((get) => {
  const currencyPairs = get(currencyPairsAtom);
  const selectedPair = get(selectedPairAtom);

  const selectedIndex = currencyPairs.indexOf(selectedPair);

  if (selectedIndex < 0) {
    return {
      currencyPairs: currencyPairs.slice(0, VISIBLE_TICKERS_COUNT),
      selectedIndex: 0,
    };
  }

  const start = Math.max(0, selectedIndex - VISIBLE_TICKERS_OFFSET);
  const end = Math.min(currencyPairs.length, start + VISIBLE_TICKERS_COUNT);

  return {
    currencyPairs: currencyPairs.slice(start, end),
    selectedIndex,
  };
});

const EMPTY_PRICES: number[] = [];

export const sparklinePricesAtom = atom((get) => {
  const candles = get(candlesAtom);
  const pairs = get(currencyPairsAtom);

  const prices = new Map<string, number[]>();
  pairs.forEach((pair) => {
    const key = `trade:${DEFAULT_TIMEFRAME}:t${pair}`;
    const data = candles.get(key);
    if (data && data.length > 1) {
      prices.set(
        pair,
        data.slice(-21, -1).map((candle) => candle.close)
      );
    }
  });
  return prices;
});

export const sparklinePricesByPairAtom = atom((get) => {
  const prices = get(sparklinePricesAtom);
  return (pair: string): number[] => prices.get(pair) ?? EMPTY_PRICES;
});
