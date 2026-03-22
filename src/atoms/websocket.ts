import { atom } from 'jotai';

import { MAX_BOOK_ORDERS, MAX_CANDLES, MAX_TRADES } from '@/lib/constants';
import { WebSocketManager } from '@/transport/websocket-manager';

import { bookAtom } from './book';
import { candlesAtom } from './candles';
import { connectionStatusAtom } from './connection';
import { subscriptionsAtom } from './subscriptions';
import { tickersAtom } from './tickers';
import { tradesAtom } from './trades';

export const websocketManagerAtom = atom<WebSocketManager | null>(null);

export const initializeWebSocketAtom = atom(
  null,
  (_get, set, store: ConstructorParameters<typeof WebSocketManager>[0]) => {
    const manager = new WebSocketManager(
      store,
      {
        connectionStatus: connectionStatusAtom,
        tickers: tickersAtom,
        trades: tradesAtom,
        candles: candlesAtom,
        book: bookAtom,
        subscriptions: subscriptionsAtom,
      },
      {
        trades: MAX_TRADES,
        candles: MAX_CANDLES,
        bookOrders: MAX_BOOK_ORDERS,
      }
    );

    set(websocketManagerAtom, manager);
    return manager;
  }
);
