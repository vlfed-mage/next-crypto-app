import type {
  BitfinexMessage,
  ConnectionStatus,
  SubscriptionMeta,
} from './types';
import type { Candle } from '@/types/candle';
import type { BookSide, Order } from '@/types/order';
import type { Ticker } from '@/types/ticker';
import type { Trade } from '@/types/trade';
import type { WritableAtom } from 'jotai';

import { BITFINEX_WS_URL } from '@/lib/constants';
import { fromSymbol } from '@/lib/currency-pair';

import { Connection } from './connection';
import { MessageBuffer } from './message-buffer';
import { parseMessage } from './message-parser';
import { SubscriptionManager } from './subscription-manager';

type JotaiStore = {
  get: <V>(atom: WritableAtom<V, [V], void>) => V;
  set: <V>(atom: WritableAtom<V, [V], void>, value: V) => void;
};

interface AtomRefs {
  connectionStatus: WritableAtom<ConnectionStatus, [ConnectionStatus], void>;
  tickers: WritableAtom<Map<string, Ticker>, [Map<string, Ticker>], void>;
  trades: WritableAtom<Map<string, Trade[]>, [Map<string, Trade[]>], void>;
  candles: WritableAtom<Map<string, Candle[]>, [Map<string, Candle[]>], void>;
  book: WritableAtom<Map<string, BookSide>, [Map<string, BookSide>], void>;
  subscriptions: WritableAtom<
    Map<number, SubscriptionMeta>,
    [Map<number, SubscriptionMeta>],
    void
  >;
}

interface MaxLimits {
  trades: number;
  candles: number;
  bookOrders: number;
}

export class WebSocketManager {
  private readonly connection: Connection;
  private readonly subscriptionManager: SubscriptionManager;
  private readonly buffer: MessageBuffer;

  constructor(
    private readonly store: JotaiStore,
    private readonly atoms: AtomRefs,
    private readonly limits: MaxLimits
  ) {
    this.connection = new Connection(BITFINEX_WS_URL);
    this.subscriptionManager = new SubscriptionManager(this.connection);
    this.buffer = new MessageBuffer();

    this.setupConnectionCallbacks();
    this.setupSubscriptionCallbacks();
    this.setupMessageHandling();
  }

  connect(): void {
    this.connection.connect();
    this.buffer.start((messages) => {
      this.handleBufferedMessages(messages);
    });
    this.subscriptionManager.startStaleMonitor();
  }

  disconnect(): void {
    this.buffer.stop();
    this.subscriptionManager.stopStaleMonitor();
    this.connection.disconnect();
  }

  getSubscriptionManager(): SubscriptionManager {
    return this.subscriptionManager;
  }

  private setupConnectionCallbacks(): void {
    this.connection.onConnect(() => {
      this.store.set(this.atoms.connectionStatus, 'connected');
    });

    this.connection.onClose(() => {
      this.store.set(this.atoms.connectionStatus, 'disconnected');
    });

    this.connection.onReconnecting(() => {
      this.store.set(this.atoms.connectionStatus, 'reconnecting');
    });
  }

  private setupSubscriptionCallbacks(): void {
    this.subscriptionManager.onChange((subscriptions) => {
      this.store.set(this.atoms.subscriptions, new Map(subscriptions));
    });
  }

  private setupMessageHandling(): void {
    this.connection.onMessage((raw) => {
      const message = parseMessage(
        raw,
        this.subscriptionManager.getSubscriptions()
      );
      if (!message) {
        return;
      }

      this.routeMessage(message);
    });
  }

  private routeMessage(message: BitfinexMessage): void {
    switch (message.type) {
      case 'subscribed':
        this.subscriptionManager.handleSubscribed(message);
        return;

      case 'unsubscribed':
        this.subscriptionManager.handleUnsubscribed(message.chanId);
        return;

      case 'error':
        return;

      case 'heartbeat':
        this.subscriptionManager.markDataReceived(message.chanId);
        return;

      case 'trades-snapshot':
      case 'candles-snapshot':
      case 'book-snapshot':
        this.subscriptionManager.markDataReceived(message.chanId);
        this.handleSnapshot(message);
        return;

      case 'ticker-update':
      case 'trade-update':
      case 'candle-update':
      case 'book-update':
        this.subscriptionManager.markDataReceived(message.chanId);
        this.buffer.add(message);
        return;
    }
  }

  private handleSnapshot(message: BitfinexMessage): void {
    switch (message.type) {
      case 'trades-snapshot': {
        const meta = this.subscriptionManager
          .getSubscriptions()
          .get(message.chanId);
        if (!meta?.symbol) return;

        const currencyPair = fromSymbol(meta.symbol);
        const trades: Trade[] = message.data
          .map(([id, timestamp, amount, price]) => ({
            id,
            timestamp,
            amount,
            price,
          }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.limits.trades);

        const current = this.store.get(this.atoms.trades);
        const updated = new Map(current);
        updated.set(currencyPair, trades);
        this.store.set(this.atoms.trades, updated);
        return;
      }

      case 'candles-snapshot': {
        const meta = this.subscriptionManager
          .getSubscriptions()
          .get(message.chanId);
        if (!meta?.key) return;

        const candles: Candle[] = message.data
          .map(([timestamp, open, close, high, low, volume]) => ({
            timestamp,
            open,
            close,
            high,
            low,
            volume,
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-this.limits.candles);

        const current = this.store.get(this.atoms.candles);
        const updated = new Map(current);
        updated.set(meta.key, candles);
        this.store.set(this.atoms.candles, updated);
        return;
      }

      case 'book-snapshot': {
        const meta = this.subscriptionManager
          .getSubscriptions()
          .get(message.chanId);
        if (!meta?.symbol) return;

        const currencyPair = fromSymbol(meta.symbol);
        const bids: Order[] = [];
        const asks: Order[] = [];

        message.data.forEach(([id, price, amount]) => {
          if (price === 0) return;
          const order: Order = { id, price, amount };

          if (amount > 0) {
            bids.push(order);
          } else {
            asks.push(order);
          }
        });

        const current = this.store.get(this.atoms.book);
        const updated = new Map(current);
        updated.set(currencyPair, {
          bids: bids.slice(0, this.limits.bookOrders),
          asks: asks.slice(0, this.limits.bookOrders),
        });
        this.store.set(this.atoms.book, updated);
        return;
      }
    }
  }

  private handleBufferedMessages(messages: BitfinexMessage[]): void {
    messages.forEach((message) => {
      this.handleUpdate(message);
    });
  }

  private handleUpdate(message: BitfinexMessage): void {
    switch (message.type) {
      case 'ticker-update': {
        const meta = this.subscriptionManager
          .getSubscriptions()
          .get(message.chanId);
        if (!meta?.symbol) return;

        const currencyPair = fromSymbol(meta.symbol);
        const [
          bid,
          bidSize,
          ask,
          askSize,
          dailyChange,
          dailyChangeRelative,
          lastPrice,
          volume,
          high,
          low,
        ] = message.data;

        const ticker: Ticker = {
          currencyPair,
          bid,
          bidSize,
          ask,
          askSize,
          dailyChange,
          dailyChangeRelative,
          lastPrice,
          volume,
          high,
          low,
        };

        const current = this.store.get(this.atoms.tickers);
        const updated = new Map(current);
        updated.set(currencyPair, ticker);
        this.store.set(this.atoms.tickers, updated);
        return;
      }

      case 'trade-update': {
        const meta = this.subscriptionManager
          .getSubscriptions()
          .get(message.chanId);
        if (!meta?.symbol) return;

        const currencyPair = fromSymbol(meta.symbol);
        const [id, timestamp, amount, price] = message.data;
        const trade: Trade = { id, timestamp, amount, price };

        const current = this.store.get(this.atoms.trades);
        const existing = current.get(currencyPair) ?? [];
        const tradeIndex = existing.findIndex((t) => t.id === id);

        let updatedTrades: Trade[];
        if (tradeIndex >= 0) {
          updatedTrades = [...existing];
          updatedTrades[tradeIndex] = trade;
        } else {
          updatedTrades = [trade, ...existing].slice(0, this.limits.trades);
        }

        const updated = new Map(current);
        updated.set(currencyPair, updatedTrades);
        this.store.set(this.atoms.trades, updated);
        return;
      }

      case 'candle-update': {
        const meta = this.subscriptionManager
          .getSubscriptions()
          .get(message.chanId);
        if (!meta?.key) return;

        const [timestamp, open, close, high, low, volume] = message.data;
        const candle: Candle = {
          timestamp,
          open,
          close,
          high,
          low,
          volume,
        };

        const current = this.store.get(this.atoms.candles);
        const existing = current.get(meta.key) ?? [];
        const candleIndex = existing.findIndex(
          (c) => c.timestamp === timestamp
        );

        let updatedCandles: Candle[];
        if (candleIndex >= 0) {
          updatedCandles = [...existing];
          updatedCandles[candleIndex] = candle;
        } else {
          updatedCandles = [...existing, candle]
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-this.limits.candles);
        }

        const updated = new Map(current);
        updated.set(meta.key, updatedCandles);
        this.store.set(this.atoms.candles, updated);
        return;
      }

      case 'book-update': {
        const meta = this.subscriptionManager
          .getSubscriptions()
          .get(message.chanId);
        if (!meta?.symbol) return;

        const currencyPair = fromSymbol(meta.symbol);
        const [id, price, amount] = message.data;

        const current = this.store.get(this.atoms.book);
        const existing = current.get(currencyPair) ?? {
          bids: [],
          asks: [],
        };

        const updatedBook = updateBookSide(
          existing,
          { id, price, amount },
          this.limits.bookOrders
        );

        const updated = new Map(current);
        updated.set(currencyPair, updatedBook);
        this.store.set(this.atoms.book, updated);
        return;
      }
    }
  }
}

function updateBookSide(
  book: BookSide,
  order: Order,
  maxOrders: number
): BookSide {
  const isBid = order.amount > 0;
  const side = isBid ? book.bids : book.asks;
  const otherSide = isBid ? book.asks : book.bids;

  if (order.price === 0) {
    const filtered = side.filter((o) => o.id !== order.id);
    return isBid
      ? { bids: filtered, asks: otherSide }
      : { bids: otherSide, asks: filtered };
  }

  const existingIndex = side.findIndex((o) => o.id === order.id);

  let updatedSide: Order[];
  if (existingIndex >= 0) {
    updatedSide = [...side];
    updatedSide[existingIndex] = order;
  } else {
    updatedSide = [...side, order].slice(-maxOrders);
  }

  return isBid
    ? { bids: updatedSide, asks: otherSide }
    : { bids: otherSide, asks: updatedSide };
}
