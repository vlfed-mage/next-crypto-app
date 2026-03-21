import { useCallback } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';

import { selectedPairAtom } from '@/atoms/selection';
import { websocketManagerAtom } from '@/atoms/websocket';
import { SUBSCRIPTION_DELAY_MS } from '@/lib/constants';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

export function useSelectPair() {
  const setSelectedPair = useSetAtom(selectedPairAtom);
  const manager = useAtomValue(websocketManagerAtom);

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

      setTimeout(() => {
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
      }, SUBSCRIPTION_DELAY_MS);
    },
    [manager, setSelectedPair]
  );

  return selectPair;
}
