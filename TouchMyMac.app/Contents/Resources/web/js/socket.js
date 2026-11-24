// socket.js - WebSocket communication client supporting JSON, raw string, and binary audio frames

import { eventBus } from "./event_bus.js";

class SocketClient {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.backoff = 1000;
    this.binaryCallbacks = [];
  }

  init() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.connect(wsUrl);
  }

  connect(url) {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }

    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this.backoff = 1000;
      eventBus.emit("ws:status", { connected: true, text: "Connected" });
    };

    this.ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        for (const cb of this.binaryCallbacks) {
          cb(e.data);
        }
      }
    };

    this.ws.onclose = () => {
      eventBus.emit("ws:status", { connected: false, text: "Disconnected" });
      this.scheduleReconnect(url);
    };

    this.ws.onerror = () => {
      eventBus.emit("ws:status", { connected: false, text: "Connection error" });
    };
  }

  scheduleReconnect(url) {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.backoff = Math.min(this.backoff * 1.5, 8000);
      this.connect(url);
    }, this.backoff);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendRaw(str) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(str);
    }
  }

  onBinary(callback) {
    this.binaryCallbacks.push(callback);
  }
}

export const socket = new SocketClient();
