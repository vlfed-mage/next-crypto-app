import type { BookSide, Order } from '@/types/order';

import { atom } from 'jotai';

import { selectedPairAtom } from './selection';

export const bookAtom = atom<Map<string, BookSide>>(new Map());

const EMPTY_BOOK: BookSide = { bids: [], asks: [] };

export const selectedPairBookAtom = atom((get) => {
  const book = get(bookAtom);
  const selectedPair = get(selectedPairAtom);

  if (!selectedPair) {
    return EMPTY_BOOK;
  }

  return book.get(selectedPair) ?? EMPTY_BOOK;
});

export const processedBookAtom = atom((get) => {
  const { bids, asks } = get(selectedPairBookAtom);

  const validBids = bids.filter((order) => order.price > 0);
  const validAsks = asks.filter((order) => order.price > 0);

  const paired: { bid: Order; ask: Order }[] = [];
  const maxLength = Math.max(validBids.length, validAsks.length);

  for (let i = 0; i < maxLength; i++) {
    const bid = validBids[i];
    const ask = validAsks[i];
    if (bid && ask) {
      paired.push({ bid, ask });
    }
  }

  return paired;
});

export const depthAtom = atom((get) => {
  const { bids, asks } = get(selectedPairBookAtom);

  const topBids = bids.filter((o) => o.price > 0).slice(0, 15);
  const topAsks = asks.filter((o) => o.price > 0).slice(0, 15);

  let bidDepth = 0;
  const bidDepthData = topBids.map((order) => {
    bidDepth += Math.abs(order.amount);
    return { price: order.price, depth: bidDepth };
  });

  let askDepth = 0;
  const askDepthData = topAsks.map((order) => {
    askDepth += Math.abs(order.amount);
    return { price: order.price, depth: askDepth };
  });

  return { bids: bidDepthData, asks: askDepthData };
});
