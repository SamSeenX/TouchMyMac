// decks.js - Bottom deck tab switching, media controls, and screen wake lock

import { socket } from "./socket.js";

export class DeckManager {
  constructor() {
    this.tabs = document.querySelectorAll(".deck-tab");
    this.panels = document.querySelectorAll(".panel");
    this.wakeBtn = document.getElementById("wakeLockBtn");
    this.wakeLock = null;

    this.bindEvents();
  }

  bindEvents() {
    // Tab switching
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });

    // Event delegation for deck action buttons
    document.querySelector(".bottom-deck-container").addEventListener("click", (e) => {
      const btn = e.target.closest(".deck-btn");
      if (!btn) return;

      const action = btn.dataset.action;
      if (navigator.vibrate) navigator.vibrate(20);

      if (action === "media") {
        socket.send({ action: "media", cmd: btn.dataset.cmd });
      } else if (action === "yt") {
        socket.send({ action: "yt", cmd: btn.dataset.cmd });
      } else if (action === "desktop") {
        socket.send({ action: "desktop", dir: btn.dataset.dir });
      } else if (action === "key") {
        socket.send({ action: "key", key: btn.dataset.key });
      }
    });

    // Wake lock toggle
    if (this.wakeBtn) {
      this.wakeBtn.addEventListener("click", () => this.toggleWakeLock());
    }
  }

  switchTab(tabName) {
    this.tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
    this.panels.forEach((p) => p.classList.toggle("active", p.id === `panel-${tabName}`));
  }

  async toggleWakeLock() {
    if (!("wakeLock" in navigator)) return;

    try {
      if (!this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request("screen");
        this.wakeBtn.classList.add("active");
        this.wakeLock.addEventListener("release", () => {
          this.wakeLock = null;
          this.wakeBtn.classList.remove("active");
        });
      } else {
        await this.wakeLock.release();
        this.wakeLock = null;
        this.wakeBtn.classList.remove("active");
      }
    } catch (err) {
      console.warn("WakeLock error:", err);
    }
  }
}
