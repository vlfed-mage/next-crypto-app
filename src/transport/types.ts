import type { CandleTuple } from '@/types/candle';
import type { ChannelType } from '@/types/channel';
import type { OrderTuple } from '@/types/order';
import type { TickerTuple } from '@/types/ticker';
import type { TradeTuple } from '@/types/trade';

export type BitfinexMessage =
  | SubscribedMessage
  | UnsubscribedMessage
  | ErrorMessage
  | HeartbeatMessage
  | TickerUpdateMessage
  | TradesSnapshotMessage
  | TradeUpdateMessage
  | CandlesSnapshotMessage
  | CandleUpdateMessage
  | BookSnapshotMessage
  | BookUpdateMessage;

export interface SubscribedMessage {
  type: 'subscribed';
  chanId: number;
  channel: ChannelType;
  symbol?: string;
  key?: string;
  prec?: string;
}

export interface UnsubscribedMessage {
  type: 'unsubscribed';
  chanId: number;
}

export interface ErrorMessage {
  type: 'error';
  msg: string;
  code: number;
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  chanId: number;
}

export interface TickerUpdateMessage {
  type: 'ticker-update';
  chanId: number;
  data: TickerTuple;
}

export interface TradesSnapshotMessage {
  type: 'trades-snapshot';
  chanId: number;
  data: TradeTuple[];
}

export interface TradeUpdateMessage {
  type: 'trade-update';
  chanId: number;
  data: TradeTuple;
}

export interface CandlesSnapshotMessage {
  type: 'candles-snapshot';
  chanId: number;
  data: CandleTuple[];
}

export interface CandleUpdateMessage {
  type: 'candle-update';
  chanId: number;
  data: CandleTuple;
}

export interface BookSnapshotMessage {
  type: 'book-snapshot';
  chanId: number;
  data: OrderTuple[];
}

export interface BookUpdateMessage {
  type: 'book-update';
  chanId: number;
  data: OrderTuple;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface SubscriptionMeta {
  channel: ChannelType;
  symbol?: string;
  key?: string;
  prec?: string;
  isStale: boolean;
  lastUpdate: number;
}

export interface SubscribeRequest {
  event: 'subscribe';
  channel: ChannelType;
  symbol?: string;
  key?: string;
  prec?: string;
}

export interface UnsubscribeRequest {
  event: 'unsubscribe';
  chanId: number;
}
