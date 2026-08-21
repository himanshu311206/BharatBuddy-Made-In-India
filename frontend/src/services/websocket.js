import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.connected = false;
  }

  connect(onConnect, onError) {
    if (this.client && this.client.active) {
      if (this.connected && onConnect) onConnect();
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || '/ws';

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        this.connected = true;
        if (onConnect) onConnect(frame);
      },
      onStompError: (frame) => {
        console.error('STOMP Broker Error:', frame);
        this.connected = false;
        if (onError) onError(frame);
      },
      onWebSocketClose: () => {
        this.connected = false;
      },
    });

    this.client.activate();
  }

  subscribe(topic, callback) {
    if (!this.client || !this.connected) {
      const checkInterval = setInterval(() => {
        if (this.client && this.connected) {
          clearInterval(checkInterval);
          this.doSubscribe(topic, callback);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }

    return this.doSubscribe(topic, callback);
  }

  doSubscribe(topic, callback) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch {
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
    };
  }

  send(destination, payload) {
    if (this.client && this.connected) {
      this.client.publish({
        destination,
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      });
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.subscriptions.clear();
    }
  }
}

export const wsService = new WebSocketService();
