// keyboard.js - Virtual keyboard bridge with floating accessory bar & modifier latching

import { socket } from "./socket.js";

export class KeyboardManager {
  constructor(btnElement, inputElement, barElement) {
    this.btn = btnElement;
    this.input = inputElement;
    this.bar = barElement;
    this.isActive = false;
    this.activeModifiers = new Set();
    this.isInteractingWithBar = false;

    this.bindEvents();
  }

  bindEvents() {
    this.btn.addEventListener("click", () => this.toggleKeyboard());

    this.input.addEventListener("keydown", (e) => {
      const mods = Array.from(this.activeModifiers);
      if (e.key === "Backspace") {
        socket.send({ action: "key", key: "backspace", modifiers: mods });
      } else if (e.key === "Enter") {
        socket.send({ action: "key", key: "enter", modifiers: mods });
      } else if (e.key === "Escape") {
        socket.send({ action: "key", key: "escape", modifiers: mods });
      } else if (e.key === "Tab") {
        e.preventDefault();
        socket.send({ action: "key", key: "tab", modifiers: mods });
      }
    });

    this.input.addEventListener("input", (e) => {
      if (e.data) {
        socket.send({
          action: "type",
          text: e.data,
          modifiers: Array.from(this.activeModifiers)
        });
      }
      this.input.value = "";
    });

    this.input.addEventListener("blur", () => {
      setTimeout(() => {
        if (document.activeElement !== this.input && !this.isInteractingWithBar) {
          this.setInactive();
        }
      }, 150);
    });

    if (this.bar) {
      this.bar.addEventListener("mousedown", (e) => e.preventDefault());
      this.bar.addEventListener("touchstart", () => {
        this.isInteractingWithBar = true;
      }, { passive: true });
      this.bar.addEventListener("touchend", () => {
        setTimeout(() => { this.isInteractingWithBar = false; }, 200);
      });

      if (window.visualViewport) {
        const updatePos = () => {
          if (!this.isActive || !this.bar) return;
          const kbHeight = window.innerHeight - (window.visualViewport.offsetTop + window.visualViewport.height);
          this.bar.style.bottom = `${Math.max(0, Math.round(kbHeight))}px`;
        };
        window.visualViewport.addEventListener("resize", updatePos);
        window.visualViewport.addEventListener("scroll", updatePos);
      }

      this.bar.addEventListener("click", (e) => {
        const target = e.target.closest("button");
        if (!target) return;
        const mod = target.dataset.mod;
        const key = target.dataset.key;

        if (mod) {
          if (this.activeModifiers.has(mod)) {
            this.activeModifiers.delete(mod);
            target.classList.remove("active");
          } else {
            this.activeModifiers.add(mod);
            target.classList.add("active");
          }
          if (navigator.vibrate) navigator.vibrate(15);
        } else if (key) {
          socket.send({
            action: "key",
            key: key,
            modifiers: Array.from(this.activeModifiers)
          });
          if (navigator.vibrate) navigator.vibrate(20);
        }
        this.input.focus();
      });
    }
  }

  toggleKeyboard() {
    if (!this.isActive) {
      this.setActive();
    } else {
      this.setInactive();
    }
  }

  setActive() {
    this.isActive = true;
    this.btn.classList.add("active");
    if (this.bar) this.bar.hidden = false;
    this.input.focus();
  }

  setInactive() {
    this.isActive = false;
    this.btn.classList.remove("active");
    if (this.bar) {
      this.bar.hidden = true;
      this.bar.style.bottom = "";
    }
    this.activeModifiers.clear();
    if (this.bar) {
      this.bar.querySelectorAll(".acc-btn.mod").forEach((b) => b.classList.remove("active"));
    }
    this.input.blur();
  }
}
