import { useAtomValue } from 'jotai';

import { selectedPairCandlesAtom } from '@/atoms/candles';
import { selectedPairAtom } from '@/atoms/selection';
import { isChannelStaleAtom } from '@/atoms/subscriptions';
import { DEFAULT_TIMEFRAME } from '@/lib/constants';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

export function useCandlesData() {
  const candles = useAtomValue(selectedPairCandlesAtom);
  const selectedPair = useAtomValue(selectedPairAtom);
  const getIsStale = useAtomValue(isChannelStaleAtom);

  const isStale = selectedPair
    ? getIsStale(ChannelType.CANDLES, {
        key: `trade:${DEFAULT_TIMEFRAME}:${toSymbol(selectedPair)}`,
      })
    : false;

  return { candles, currencyPair: selectedPair, isStale };
}
