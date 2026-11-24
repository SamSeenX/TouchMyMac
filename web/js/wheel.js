// wheel.js - Dedicated right-edge thumb scroll wheel with touch/release haptics

import { socket } from "./socket.js";

export class ScrollWheel {
  constructor(element) {
    this.el = element;
    this.lastY = 0;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.el) return;

    this.el.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.lastY = e.touches[0].clientY;
      this.el.classList.add("active");
      if (navigator.vibrate) navigator.vibrate(15);
    }, { passive: false });

    this.el.addEventListener("touchmove", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentY = e.touches[0].clientY;
      const rawDy = this.lastY - currentY;
      this.lastY = currentY;

      // Accelerated scroll sensitivity for effortless couch browsing
      const speed = Math.abs(rawDy);
      const boost = speed > 10 ? 1.4 : 1.0;
      const dy = rawDy * 4.8 * boost;
      socket.sendRaw(`s:0:${dy.toFixed(1)}`);
    }, { passive: false });

    const onEnd = (e) => {
      e.preventDefault();
      if (this.el.classList.contains("active")) {
        this.el.classList.remove("active");
        if (navigator.vibrate) navigator.vibrate(15);
      }
    };

    this.el.addEventListener("touchend", onEnd, { passive: false });
    this.el.addEventListener("touchcancel", onEnd, { passive: false });
  }
}
