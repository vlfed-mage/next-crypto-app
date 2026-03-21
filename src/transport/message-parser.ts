import type { BitfinexMessage, SubscriptionMeta } from './types';
import type { TickerTuple } from '@/types/ticker';

import { ChannelType } from '@/types/channel';

export function parseMessage(
  raw: string,
  subscriptions: Map<number, SubscriptionMeta>
): BitfinexMessage | null {
  const parsed: unknown = JSON.parse(raw);

  if (isEventMessage(parsed)) {
    return parseEventMessage(parsed);
  }

  if (Array.isArray(parsed)) {
    return parseDataMessage(parsed, subscriptions);
  }

  return null;
}

function isEventMessage(
  data: unknown
): data is { event: string; [key: string]: unknown } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'event' in data &&
    typeof (data as { event: unknown }).event === 'string'
  );
}

function parseEventMessage(data: {
  event: string;
  [key: string]: unknown;
}): BitfinexMessage | null {
  switch (data.event) {
    case 'subscribed':
      return {
        type: 'subscribed',
        chanId: data.chanId as number,
        channel: data.channel as ChannelType,
        symbol: data.symbol as string | undefined,
        key: data.key as string | undefined,
        prec: data.prec as string | undefined,
      };

    case 'unsubscribed':
      return {
        type: 'unsubscribed',
        chanId: data.chanId as number,
      };

    case 'error':
      return {
        type: 'error',
        msg: data.msg as string,
        code: data.code as number,
      };

    default:
      return null;
  }
}

function parseDataMessage(
  data: unknown[],
  subscriptions: Map<number, SubscriptionMeta>
): BitfinexMessage | null {
  const chanId = data[0] as number;

  if (data[1] === 'hb') {
    return { type: 'heartbeat', chanId };
  }

  const subscription = subscriptions.get(chanId);
  if (!subscription) {
    return null;
  }

  switch (subscription.channel) {
    case ChannelType.TICKER:
      return parseTickerMessage(chanId, data);

    case ChannelType.TRADES:
      return parseTradesMessage(chanId, data);

    case ChannelType.CANDLES:
      return parseCandlesMessage(chanId, data);

    case ChannelType.BOOK:
      return parseBookMessage(chanId, data);

    default:
      return null;
  }
}

function parseTickerMessage(chanId: number, data: unknown[]): BitfinexMessage {
  const payload = data[1] as TickerTuple;
  return { type: 'ticker-update', chanId, data: payload };
}

function parseTradesMessage(chanId: number, data: unknown[]): BitfinexMessage {
  const payload = data[1];

  if (typeof payload === 'string') {
    const tradeTuple = data[2] as [number, number, number, number];
    return { type: 'trade-update', chanId, data: tradeTuple };
  }

  if (Array.isArray(payload) && Array.isArray(payload[0])) {
    return {
      type: 'trades-snapshot',
      chanId,
      data: payload as [number, number, number, number][],
    };
  }

  return {
    type: 'trade-update',
    chanId,
    data: payload as [number, number, number, number],
  };
}

function parseCandlesMessage(chanId: number, data: unknown[]): BitfinexMessage {
  const payload = data[1];

  if (Array.isArray(payload) && Array.isArray(payload[0])) {
    return {
      type: 'candles-snapshot',
      chanId,
      data: payload as [number, number, number, number, number, number][],
    };
  }

  return {
    type: 'candle-update',
    chanId,
    data: payload as [number, number, number, number, number, number],
  };
}

function parseBookMessage(chanId: number, data: unknown[]): BitfinexMessage {
  const payload = data[1];

  if (Array.isArray(payload) && Array.isArray(payload[0])) {
    return {
      type: 'book-snapshot',
      chanId,
      data: payload as [number, number, number][],
    };
  }

  return {
    type: 'book-update',
    chanId,
    data: payload as [number, number, number],
  };
}
