import {
  MAX_RECONNECT_ATTEMPTS,
  RECONNECT_BASE_DELAY_MS,
} from '@/lib/constants';

type MessageCallback = (data: string) => void;
type StatusCallback = () => void;

export class Connection {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = true;
  private onMessageCallback: MessageCallback | null = null;
  private onConnectCallback: StatusCallback | null = null;
  private onCloseCallback: StatusCallback | null = null;
  private onReconnectingCallback: StatusCallback | null = null;

  constructor(private readonly url: string) {}

  connect(): void {
    this.shouldReconnect = true;
    this.createSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  onMessage(callback: MessageCallback): void {
    this.onMessageCallback = callback;
  }

  onConnect(callback: StatusCallback): void {
    this.onConnectCallback = callback;
  }

  onClose(callback: StatusCallback): void {
    this.onCloseCallback = callback;
  }

  onReconnecting(callback: StatusCallback): void {
    this.onReconnectingCallback = callback;
  }

  private createSocket(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onConnectCallback?.();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.onMessageCallback?.(event.data as string);
    };

    this.ws.onclose = () => {
      this.onCloseCallback?.();

      if (this.shouldReconnect) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    this.onReconnectingCallback?.();
    this.reconnectAttempts += 1;

    const delay =
      RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.createSocket();
    }, delay);
  }
}
