import type { BitfinexMessage } from './types';

type FlushCallback = (messages: BitfinexMessage[]) => void;

export class MessageBuffer {
  private buffer: BitfinexMessage[] = [];
  private frameId: number | null = null;
  private onFlush: FlushCallback | null = null;

  start(onFlush: FlushCallback): void {
    this.onFlush = onFlush;
    this.scheduleFlush();
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.onFlush = null;
    this.buffer = [];
  }

  add(message: BitfinexMessage): void {
    this.buffer.push(message);
  }

  private scheduleFlush(): void {
    this.frameId = requestAnimationFrame(() => {
      this.flush();
      this.scheduleFlush();
    });
  }

  private flush(): void {
    if (this.buffer.length === 0 || !this.onFlush) {
      return;
    }

    const messages = this.buffer;
    this.buffer = [];
    this.onFlush(messages);
  }
}
