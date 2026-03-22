'use client';

import type { ConnectionStatus } from '@/transport/types';

import { useEffect, useRef } from 'react';

import { useSetAtom, useStore } from 'jotai';

import { connectionStatusAtom } from '@/atoms/connection';
import { currencyPairsAtom } from '@/atoms/currency-pairs';
import { selectedPairAtom } from '@/atoms/selection';
import { initializeWebSocketAtom } from '@/atoms/websocket';
import { DEFAULT_TIMEFRAME, SUBSCRIPTION_DELAY_MS } from '@/lib/constants';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

import Widget from '../ui/widget';
import BookTable from './book-table';
import CandlesChart from './candles-chart';
import DepthChart from './depth-chart';
import Header from './header';
import MarketTable from './market-table';
import PerformanceDashboard from './performance-dashboard';
import TickerStrip from './ticker-strip';
import TradesTable from './trades-table';

export default function Dashboard() {
  const store = useStore();
  const initializeWebSocket = useSetAtom(initializeWebSocketAtom);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const manager = initializeWebSocket(store);
    manager.connect();

    const waitForConnection = (): Promise<void> => {
      return new Promise((resolve) => {
        const check = () => {
          const status: ConnectionStatus = store.get(connectionStatusAtom);
          if (status === 'connected') {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    waitForConnection().then(() => {
      const subscriptionManager = manager.getSubscriptionManager();
      const pairs = store.get(currencyPairsAtom);
      const defaultPair = pairs[0] ?? 'BTCUSD';

      store.set(selectedPairAtom, defaultPair);

      subscriptionManager.subscribe({
        event: 'subscribe',
        channel: ChannelType.TRADES,
        symbol: toSymbol(defaultPair),
      });

      subscriptionManager.subscribe({
        event: 'subscribe',
        channel: ChannelType.BOOK,
        symbol: toSymbol(defaultPair),
        prec: 'R0',
      });

      setTimeout(() => {
        pairs.forEach((pair) => {
          subscriptionManager.subscribe({
            event: 'subscribe',
            channel: ChannelType.TICKER,
            symbol: toSymbol(pair),
          });

          subscriptionManager.subscribe({
            event: 'subscribe',
            channel: ChannelType.CANDLES,
            key: `trade:${DEFAULT_TIMEFRAME}:${toSymbol(pair)}`,
          });
        });
      }, SUBSCRIPTION_DELAY_MS);
    });

    return () => {
      manager.disconnect();
      initializedRef.current = false;
    };
  }, [store, initializeWebSocket]);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-background p-4 text-foreground">
      <Header />

      <TickerStrip />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-[404px]">
          <Widget title="Market">
            <MarketTable />
          </Widget>
        </div>

        <div className="h-[404px]">
          <Widget title="Trades">
            <TradesTable />
          </Widget>
        </div>

        <div className="h-[404px]">
          <Widget title="Order Book">
            <BookTable />
          </Widget>
        </div>
      </div>

      <div className="grid h-[400px] grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Widget title="Chart">
            <CandlesChart />
          </Widget>
        </div>

        <div>
          <Widget title="Depth">
            <DepthChart />
          </Widget>
        </div>
      </div>

      <PerformanceDashboard />
    </div>
  );
}
