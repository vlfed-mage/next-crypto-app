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

import { sortedInsert } from '@/lib/binary-search';
import { BITFINEX_WS_URL } from '@/lib/constants';
import { fromSymbol } from '@/lib/currency-pair';
import { performanceTracker } from '@/lib/performance-tracker';

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
      case 'book-snapshot': {
        this.subscriptionManager.markDataReceived(message.chanId);
        const start = performance.now();
        this.handleSnapshot(message);
        const processingMs = performance.now() - start;
        performanceTracker.trackLatency(message.type, processingMs);
        performanceTracker.trackMessage(message.type);
        return;
      }

      case 'ticker-update':
      case 'trade-update':
      case 'candle-update':
      case 'book-update':
        this.subscriptionManager.markDataReceived(message.chanId);
        performanceTracker.trackMessage(message.type);
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

        bids.sort((a, b) => b.price - a.price);
        asks.sort((a, b) => a.price - b.price);

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
    const start = performance.now();
    const subs = this.subscriptionManager.getSubscriptions();

    const tickerUpdates = new Map<string, Ticker>();
    const tradeUpdates = new Map<string, Map<number, Trade>>();
    const candleUpdates = new Map<string, Map<number, Candle>>();
    const bookUpdates = new Map<string, Map<number, Order>>();

    messages.forEach((message) => {
      switch (message.type) {
        case 'ticker-update': {
          const meta = subs.get(message.chanId);
          if (!meta?.symbol) return;
          const pair = fromSymbol(meta.symbol);
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
          tickerUpdates.set(pair, {
            currencyPair: pair,
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
          });
          return;
        }

        case 'trade-update': {
          const meta = subs.get(message.chanId);
          if (!meta?.symbol) return;
          const pair = fromSymbol(meta.symbol);
          const [id, timestamp, amount, price] = message.data;
          if (!tradeUpdates.has(pair)) {
            tradeUpdates.set(pair, new Map());
          }
          tradeUpdates.get(pair)!.set(id, { id, timestamp, amount, price });
          return;
        }

        case 'candle-update': {
          const meta = subs.get(message.chanId);
          if (!meta?.key) return;
          const [timestamp, open, close, high, low, volume] = message.data;
          if (!candleUpdates.has(meta.key)) {
            candleUpdates.set(meta.key, new Map());
          }
          candleUpdates.get(meta.key)!.set(timestamp, {
            timestamp,
            open,
            close,
            high,
            low,
            volume,
          });
          return;
        }

        case 'book-update': {
          const meta = subs.get(message.chanId);
          if (!meta?.symbol) return;
          const pair = fromSymbol(meta.symbol);
          const [id, price, amount] = message.data;
          if (!bookUpdates.has(pair)) {
            bookUpdates.set(pair, new Map());
          }
          bookUpdates.get(pair)!.set(id, { id, price, amount });
          return;
        }
      }
    });

    if (tickerUpdates.size > 0) {
      const current = this.store.get(this.atoms.tickers);
      const updated = new Map(current);
      tickerUpdates.forEach((ticker, pair) => {
        updated.set(pair, ticker);
      });
      this.store.set(this.atoms.tickers, updated);
    }

    if (tradeUpdates.size > 0) {
      const current = this.store.get(this.atoms.trades);
      const updated = new Map(current);
      tradeUpdates.forEach((newTrades, pair) => {
        const existing = current.get(pair) ?? [];
        const uniqueNew = Array.from(newTrades.values());
        const newIds = new Set(uniqueNew.map((t) => t.id));
        const merged = [
          ...uniqueNew,
          ...existing.filter((t) => !newIds.has(t.id)),
        ];
        if (merged.length > this.limits.trades) {
          merged.length = this.limits.trades;
        }
        updated.set(pair, merged);
      });
      this.store.set(this.atoms.trades, updated);
    }

    if (candleUpdates.size > 0) {
      const current = this.store.get(this.atoms.candles);
      const updated = new Map(current);

      candleUpdates.forEach((newCandles, key) => {
        const existing = [...(current.get(key) ?? [])];
        const sorted = Array.from(newCandles.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        sorted.forEach((candle) => {
          const last = existing[existing.length - 1];
          if (last && last.timestamp === candle.timestamp) {
            existing[existing.length - 1] = candle;
          } else if (!last || candle.timestamp > last.timestamp) {
            existing.push(candle);
          }
        });
        if (existing.length > this.limits.candles) {
          updated.set(key, existing.slice(-this.limits.candles));
        } else {
          updated.set(key, existing);
        }
      });
      this.store.set(this.atoms.candles, updated);
    }

    if (bookUpdates.size > 0) {
      const current = this.store.get(this.atoms.book);
      const updated = new Map(current);
      const bidPrice = (o: Order) => -o.price;
      const askPrice = (o: Order) => o.price;

      bookUpdates.forEach((coalescedOrders, pair) => {
        const existing = current.get(pair) ?? { bids: [], asks: [] };
        const bids = [...existing.bids];
        const asks = [...existing.asks];

        coalescedOrders.forEach((order) => {
          const isBid = order.amount > 0;
          const side = isBid ? bids : asks;
          const getKey = isBid ? bidPrice : askPrice;

          if (order.price === 0) {
            const removeIndex = side.findIndex((o) => o.id === order.id);
            if (removeIndex >= 0) {
              side.splice(removeIndex, 1);
            }
            return;
          }

          const existingIndex = side.findIndex((o) => o.id === order.id);
          if (existingIndex >= 0) {
            side[existingIndex] = order;
          } else {
            sortedInsert(side, order, getKey(order), getKey);
          }
        });

        if (bids.length > this.limits.bookOrders) {
          bids.length = this.limits.bookOrders;
        }
        if (asks.length > this.limits.bookOrders) {
          asks.length = this.limits.bookOrders;
        }

        updated.set(pair, { bids, asks });
      });
      this.store.set(this.atoms.book, updated);
    }

    const latency = performance.now() - start;
    performanceTracker.trackFlush();
    performanceTracker.trackLatency('buffer-flush', latency);
  }
}
