// touchpad.js - Multi-touch tracking, pointer acceleration, and click engine

import { socket } from "./socket.js";

export class Touchpad {
  constructor(element) {
    this.el = element;
    this.touches = new Map();
    this.startTime = 0;
    this.maxTouchCount = 0;
    this.totalMoveDist = 0;
    this.lastSendTime = 0;
    this.pendingDelta = { dx: 0, dy: 0 };
    this.sendTimer = null;

    this.bindEvents();
  }

  bindEvents() {
    this.el.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
    this.el.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    this.el.addEventListener("touchend", (e) => this.onTouchEnd(e), { passive: false });
    this.el.addEventListener("touchcancel", (e) => this.onTouchEnd(e), { passive: false });

    // Physical click bar buttons
    const leftBtn = document.getElementById("leftClickBtn");
    const rightBtn = document.getElementById("rightClickBtn");
    if (leftBtn) {
      leftBtn.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        socket.send({ action: "tap" });
        this.haptic(20);
      });
    }
    if (rightBtn) {
      rightBtn.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        socket.send({ action: "right_tap" });
        this.haptic(35);
      });
    }
  }

  haptic(ms = 15) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  onTouchStart(e) {
    e.preventDefault();
    const count = e.touches.length;
    this.maxTouchCount = Math.max(this.maxTouchCount, count);

    if (this.touches.size === 0) {
      this.startTime = performance.now();
      this.totalMoveDist = 0;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      this.touches.set(t.identifier, { x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY });
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    const count = e.touches.length;

    if (count === 1) {
      const t = e.touches[0];
      const prev = this.touches.get(t.identifier);
      if (prev) {
        const rawDx = t.clientX - prev.x;
        const rawDy = t.clientY - prev.y;
        const speed = Math.hypot(rawDx, rawDy);
        this.totalMoveDist += speed;

        // Continuous acceleration curve for smooth 60/120fps tracking
        const factor = Math.min(Math.max(1.0 + speed * 0.05, 1.0), 2.6);
        this.queueMove(rawDx * factor, rawDy * factor);
        this.touches.set(t.identifier, { ...prev, x: t.clientX, y: t.clientY });
      }
    } else if (count === 2) {
      // 2-finger scroll
      const t1 = e.touches[0];
      const prev1 = this.touches.get(t1.identifier);
      if (prev1) {
        const dy = (t1.clientY - prev1.y) * 1.5;
        const dx = (t1.clientX - prev1.x) * 1.5;
        this.totalMoveDist += Math.hypot(dx, dy);
        socket.send({ action: "scroll", dx: -dx, dy: dy });
        this.touches.set(t1.identifier, { ...prev1, x: t1.clientX, y: t1.clientY });
      }
    }
  }

  onTouchEnd(e) {
    e.preventDefault();
    const duration = performance.now() - this.startTime;

    if (e.touches.length === 0) {
      // Human tap detection (generous 350ms duration, 25px displacement)
      if (duration < 350 && this.totalMoveDist < 25) {
        if (this.maxTouchCount === 1) {
          socket.send({ action: "tap" });
          this.haptic(20);
        } else if (this.maxTouchCount === 2) {
          socket.send({ action: "right_tap" });
          this.haptic(35);
        }
      } else if (this.maxTouchCount === 3) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const start = this.touches.get(t.identifier);
          if (start) {
            const dx = t.clientX - start.startX;
            if (Math.abs(dx) > 40) {
              socket.send({ action: "desktop", dir: dx > 0 ? "left" : "right" });
              this.haptic(40);
              break;
            }
          }
        }
      }

      this.touches.clear();
      this.maxTouchCount = 0;
    } else {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.touches.delete(e.changedTouches[i].identifier);
      }
    }
  }

  queueMove(dx, dy) {
    this.pendingDelta.dx += dx;
    this.pendingDelta.dy += dy;
    const now = performance.now();

    if (now - this.lastSendTime >= 8) {
      this.flushMove();
      this.lastSendTime = now;
    } else if (!this.sendTimer) {
      this.sendTimer = setTimeout(() => {
        this.flushMove();
        this.lastSendTime = performance.now();
        this.sendTimer = null;
      }, 8);
    }
  }

  flushMove() {
    if (this.pendingDelta.dx !== 0 || this.pendingDelta.dy !== 0) {
      socket.send({
        action: "move",
        dx: this.pendingDelta.dx,
        dy: this.pendingDelta.dy
      });
      this.pendingDelta.dx = 0;
      this.pendingDelta.dy = 0;
    }
  }
}
