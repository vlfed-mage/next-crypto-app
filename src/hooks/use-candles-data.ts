import type { Timeframe } from '@/lib/constants';

import { useCallback } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';

import {
  selectedPairCandlesAtom,
  selectedTimeframeAtom,
} from '@/atoms/candles';
import { selectedPairAtom } from '@/atoms/selection';
import { isChannelStaleAtom } from '@/atoms/subscriptions';
import { websocketManagerAtom } from '@/atoms/websocket';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

export function useCandlesData() {
  const candles = useAtomValue(selectedPairCandlesAtom);
  const selectedPair = useAtomValue(selectedPairAtom);
  const timeframe = useAtomValue(selectedTimeframeAtom);
  const setTimeframe = useSetAtom(selectedTimeframeAtom);
  const getIsStale = useAtomValue(isChannelStaleAtom);
  const manager = useAtomValue(websocketManagerAtom);

  const isStale = selectedPair
    ? getIsStale(ChannelType.CANDLES, {
        key: `trade:${timeframe}:${toSymbol(selectedPair)}`,
      })
    : false;

  const changeTimeframe = useCallback(
    (newTimeframe: Timeframe) => {
      if (!manager || !selectedPair || newTimeframe === timeframe) {
        return;
      }

      const subscriptionManager = manager.getSubscriptionManager();
      const symbol = toSymbol(selectedPair);

      subscriptionManager.unsubscribeByChannel(ChannelType.CANDLES, {
        key: `trade:${timeframe}:${symbol}`,
      });

      setTimeframe(newTimeframe);

      subscriptionManager.subscribe({
        event: 'subscribe',
        channel: ChannelType.CANDLES,
        key: `trade:${newTimeframe}:${symbol}`,
      });
    },
    [manager, selectedPair, timeframe, setTimeframe]
  );

  return {
    candles,
    currencyPair: selectedPair,
    timeframe,
    isStale,
    changeTimeframe,
  };
}
