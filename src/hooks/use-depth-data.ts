import { useAtomValue } from 'jotai';

import { depthAtom } from '@/atoms/book';
import { selectedPairAtom } from '@/atoms/selection';
import { isChannelStaleAtom } from '@/atoms/subscriptions';
import { toSymbol } from '@/lib/currency-pair';
import { ChannelType } from '@/types/channel';

export function useDepthData() {
  const depth = useAtomValue(depthAtom);
  const selectedPair = useAtomValue(selectedPairAtom);
  const getIsStale = useAtomValue(isChannelStaleAtom);

  const isStale = selectedPair
    ? getIsStale(ChannelType.BOOK, {
        symbol: toSymbol(selectedPair),
      })
    : false;

  return { depth, isStale };
}
