import type {
  SubscribedMessage,
  SubscribeRequest,
  SubscriptionMeta,
} from './types';
import type { ChannelType } from '@/types/channel';

import { STALE_CHECK_INTERVAL_MS, STALE_TIMEOUT_MS } from '@/lib/constants';

import { Connection } from './connection';

type SubscriptionChangeCallback = (
  subscriptions: Map<number, SubscriptionMeta>
) => void;
type StaleChangeCallback = (chanId: number, isStale: boolean) => void;

export class SubscriptionManager {
  private subscriptions = new Map<number, SubscriptionMeta>();
  private pendingRequests: SubscribeRequest[] = [];
  private staleTimerId: ReturnType<typeof setInterval> | null = null;
  private onChangeCallback: SubscriptionChangeCallback | null = null;
  private onStaleChangeCallback: StaleChangeCallback | null = null;

  constructor(private readonly connection: Connection) {}

  getSubscriptions(): Map<number, SubscriptionMeta> {
    return this.subscriptions;
  }

  onChange(callback: SubscriptionChangeCallback): void {
    this.onChangeCallback = callback;
  }

  onStaleChange(callback: StaleChangeCallback): void {
    this.onStaleChangeCallback = callback;
  }

  subscribe(request: SubscribeRequest): void {
    this.pendingRequests.push(request);
    this.connection.send(JSON.stringify(request));
  }

  unsubscribe(chanId: number): void {
    this.connection.send(JSON.stringify({ event: 'unsubscribe', chanId }));
  }

  unsubscribeByChannel(
    channel: ChannelType,
    match?: Record<string, string>
  ): void {
    this.subscriptions.forEach((meta, chanId) => {
      if (meta.channel !== channel) {
        return;
      }

      if (match) {
        const isMatch = Object.entries(match).every(
          ([key, value]) => meta[key as keyof SubscriptionMeta] === value
        );
        if (!isMatch) {
          return;
        }
      }

      this.unsubscribe(chanId);
    });
  }

  handleSubscribed(message: SubscribedMessage): void {
    const meta: SubscriptionMeta = {
      channel: message.channel,
      symbol: message.symbol,
      key: message.key,
      prec: message.prec,
      isStale: false,
      lastUpdate: Date.now(),
    };

    this.subscriptions.set(message.chanId, meta);
    this.pendingRequests = this.pendingRequests.filter(
      (request) =>
        request.channel !== message.channel ||
        request.symbol !== message.symbol ||
        request.key !== message.key
    );
    this.onChangeCallback?.(this.subscriptions);
  }

  handleUnsubscribed(chanId: number): void {
    this.subscriptions.delete(chanId);
    this.onChangeCallback?.(this.subscriptions);
  }

  markDataReceived(chanId: number): void {
    const meta = this.subscriptions.get(chanId);
    if (!meta) {
      return;
    }

    if (meta.isStale) {
      this.subscriptions.set(chanId, {
        ...meta,
        isStale: false,
        lastUpdate: Date.now(),
      });
      this.onStaleChangeCallback?.(chanId, false);
      this.onChangeCallback?.(this.subscriptions);
    } else {
      meta.lastUpdate = Date.now();
    }
  }

  replayAll(): void {
    const requests = Array.from(this.subscriptions.values()).map(
      (meta): SubscribeRequest => ({
        event: 'subscribe',
        channel: meta.channel,
        symbol: meta.symbol,
        key: meta.key,
        prec: meta.prec,
      })
    );

    this.subscriptions.clear();
    this.onChangeCallback?.(this.subscriptions);

    requests.forEach((request) => {
      this.subscribe(request);
    });
  }

  startStaleMonitor(): void {
    this.staleTimerId = setInterval(() => {
      this.checkStale();
    }, STALE_CHECK_INTERVAL_MS);
  }

  stopStaleMonitor(): void {
    if (this.staleTimerId) {
      clearInterval(this.staleTimerId);
      this.staleTimerId = null;
    }
  }

  private checkStale(): void {
    const now = Date.now();

    this.subscriptions.forEach((meta, chanId) => {
      if (meta.isStale) {
        return;
      }

      if (now - meta.lastUpdate > STALE_TIMEOUT_MS) {
        this.subscriptions.set(chanId, { ...meta, isStale: true });
        this.onStaleChangeCallback?.(chanId, true);
        this.onChangeCallback?.(this.subscriptions);
      }
    });
  }
}
