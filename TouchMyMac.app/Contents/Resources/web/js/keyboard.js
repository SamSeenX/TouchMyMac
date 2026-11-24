// keyboard.js - Virtual keyboard bridge to send mobile text input

import { socket } from "./socket.js";

export class KeyboardManager {
  constructor(btnElement, inputElement) {
    this.btn = btnElement;
    this.input = inputElement;
    this.isActive = false;

    this.bindEvents();
  }

  bindEvents() {
    this.btn.addEventListener("click", () => this.toggleKeyboard());

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        socket.send({ action: "key", key: "backspace" });
      } else if (e.key === "Enter") {
        socket.send({ action: "key", key: "enter" });
      } else if (e.key === "Escape") {
        socket.send({ action: "key", key: "escape" });
      }
    });

    this.input.addEventListener("input", (e) => {
      if (e.data) {
        socket.send({ action: "type", text: e.data });
      }
      // Reset input buffer
      this.input.value = "";
    });

    this.input.addEventListener("blur", () => {
      this.isActive = false;
      this.btn.classList.remove("active");
    });
  }

  toggleKeyboard() {
    if (!this.isActive) {
      this.input.focus();
      this.isActive = true;
      this.btn.classList.add("active");
    } else {
      this.input.blur();
      this.isActive = false;
      this.btn.classList.remove("active");
    }
  }
}
