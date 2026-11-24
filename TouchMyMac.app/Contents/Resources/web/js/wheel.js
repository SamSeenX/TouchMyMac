// wheel.js - Dedicated right-edge thumb scroll wheel with mechanical haptic ticks

import { socket } from "./socket.js";

export class ScrollWheel {
  constructor(element) {
    this.el = element;
    this.lastY = 0;
    this.accumulatedDist = 0;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.el) return;

    this.el.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.lastY = e.touches[0].clientY;
      this.accumulatedDist = 0;
      this.el.classList.add("active");
    }, { passive: false });

    this.el.addEventListener("touchmove", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentY = e.touches[0].clientY;
      const rawDy = this.lastY - currentY;
      this.lastY = currentY;

      // Natural scroll direction scaled for fluid browsing
      const dy = rawDy * 2.2;
      socket.sendRaw(`s:0:${dy.toFixed(1)}`);

      this.accumulatedDist += Math.abs(rawDy);
      if (this.accumulatedDist >= 18) {
        if (navigator.vibrate) navigator.vibrate(8);
        this.accumulatedDist = 0;
      }
    }, { passive: false });

    const onEnd = (e) => {
      e.preventDefault();
      this.el.classList.remove("active");
    };

    this.el.addEventListener("touchend", onEnd, { passive: false });
    this.el.addEventListener("touchcancel", onEnd, { passive: false });
  }
}
