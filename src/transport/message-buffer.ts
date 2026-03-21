import type { BitfinexMessage } from './types';

import { MESSAGE_BUFFER_FLUSH_MS } from '@/lib/constants';

type FlushCallback = (messages: BitfinexMessage[]) => void;

export class MessageBuffer {
  private buffer: BitfinexMessage[] = [];
  private timerId: ReturnType<typeof setInterval> | null = null;

  start(onFlush: FlushCallback): void {
    this.timerId = setInterval(() => {
      this.flush(onFlush);
    }, MESSAGE_BUFFER_FLUSH_MS);
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.buffer = [];
  }

  add(message: BitfinexMessage): void {
    this.buffer.push(message);
  }

  private flush(onFlush: FlushCallback): void {
    if (this.buffer.length === 0) {
      return;
    }

    const messages = this.buffer;
    this.buffer = [];
    onFlush(messages);
  }
}
