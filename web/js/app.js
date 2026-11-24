// app.js - Client application bootstrap

import { eventBus } from "./event_bus.js";
import { socket } from "./socket.js";
import { Touchpad } from "./touchpad.js";
import { KeyboardManager } from "./keyboard.js";
import { DeckManager } from "./decks.js";

function bootstrap() {
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const trackpadEl = document.getElementById("trackpad");
  const keyboardBtn = document.getElementById("keyboardBtn");
  const hiddenInput = document.getElementById("hiddenInput");

  // Subscribe to connection telemetry
  eventBus.on("ws:status", ({ connected, text }) => {
    statusDot.classList.toggle("connected", connected);
    statusText.textContent = text;
  });

  // Initialize modules
  new Touchpad(trackpadEl);
  new KeyboardManager(keyboardBtn, hiddenInput);
  new DeckManager();

  // Connect socket
  socket.init();
}

window.addEventListener("DOMContentLoaded", bootstrap);
