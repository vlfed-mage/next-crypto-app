import { useAtomValue } from 'jotai';

import { selectedPairAtom } from '@/atoms/selection';
import { isChannelStaleAtom } from '@/atoms/subscriptions';
import { selectedPairTradesAtom } from '@/atoms/trades';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

export function useTradesData() {
  const trades = useAtomValue(selectedPairTradesAtom);
  const selectedPair = useAtomValue(selectedPairAtom);
  const getIsStale = useAtomValue(isChannelStaleAtom);

  const isStale = selectedPair
    ? getIsStale(ChannelType.TRADES, { symbol: toSymbol(selectedPair) })
    : false;

  return { trades, isStale };
}
