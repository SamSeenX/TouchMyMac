// socket.js - WebSocket client with auto-reconnect on unlock & binary audio support

import { eventBus } from "./event_bus.js";

class SocketClient {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.backoff = 1000;
    this.binaryCallbacks = [];
    this.url = "";

    this.bindVisibility();
  }

  init() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}/ws`;
    this.connect(this.url);
  }

  connect(url) {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }

    this.ws = new WebSocket(url || this.url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this.backoff = 1000;
      eventBus.emit("ws:status", { connected: true, text: "Connected" });
      this.startHeartbeat();
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
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      eventBus.emit("ws:status", { connected: false, text: "Connection error" });
    };
  }

  bindVisibility() {
    const checkResume = () => {
      if (document.visibilityState === "visible") {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connect(this.url);
        }
      }
    };
    document.addEventListener("visibilitychange", checkResume);
    window.addEventListener("focus", checkResume);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendRaw("p");
      }
    }, 4000);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.backoff = Math.min(this.backoff * 1.5, 6000);
      this.connect(this.url);
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
