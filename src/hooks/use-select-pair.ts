import { useCallback } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';

import { selectedTimeframeAtom } from '@/atoms/candles';
import { selectedPairAtom } from '@/atoms/selection';
import { websocketManagerAtom } from '@/atoms/websocket';
import { DEFAULT_TIMEFRAME } from '@/lib/constants';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

export function useSelectPair() {
  const setSelectedPair = useSetAtom(selectedPairAtom);
  const manager = useAtomValue(websocketManagerAtom);
  const timeframe = useAtomValue(selectedTimeframeAtom);

  const selectPair = useCallback(
    (currencyPair: string) => {
      if (!manager) {
        return;
      }

      const subscriptionManager = manager.getSubscriptionManager();
      const currentSymbol = toSymbol(currencyPair);

      subscriptionManager.unsubscribeByChannel(ChannelType.TRADES);
      subscriptionManager.unsubscribeByChannel(ChannelType.BOOK);

      setSelectedPair(currencyPair);

      subscriptionManager.subscribe({
        event: 'subscribe',
        channel: ChannelType.TRADES,
        symbol: currentSymbol,
      });

      subscriptionManager.subscribe({
        event: 'subscribe',
        channel: ChannelType.BOOK,
        symbol: currentSymbol,
        prec: 'R0',
      });

      if (timeframe !== DEFAULT_TIMEFRAME) {
        subscriptionManager.subscribe({
          event: 'subscribe',
          channel: ChannelType.CANDLES,
          key: `trade:${timeframe}:${currentSymbol}`,
        });
      }
    },
    [manager, setSelectedPair, timeframe]
  );

  return selectPair;
}
