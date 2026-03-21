import type { SubscriptionMeta } from '@/transport/types';
import type { ChannelType } from '@/types/channel';

import { atom } from 'jotai';

export const subscriptionsAtom = atom<Map<number, SubscriptionMeta>>(new Map());

export const isChannelStaleAtom = atom((get) => {
  const subscriptions = get(subscriptionsAtom);

  return (channel: ChannelType, match?: Record<string, string>): boolean => {
    for (const meta of subscriptions.values()) {
      if (meta.channel !== channel) {
        continue;
      }

      if (match) {
        const isMatch = Object.entries(match).every(
          ([key, value]) => meta[key as keyof SubscriptionMeta] === value
        );
        if (!isMatch) {
          continue;
        }
      }

      return meta.isStale;
    }

    return false;
  };
});
