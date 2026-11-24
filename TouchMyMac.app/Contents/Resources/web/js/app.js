// app.js - Client application bootstrap

import { eventBus } from "./event_bus.js";
import { socket } from "./socket.js";
import { Touchpad } from "./touchpad.js";
import { KeyboardManager } from "./keyboard.js";
import { DeckManager } from "./decks.js";
import { AudioManager } from "./audio.js";

function bootstrap() {
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const trackpadEl = document.getElementById("trackpad");
  const keyboardBtn = document.getElementById("keyboardBtn");
  const audioBtn = document.getElementById("audioBtn");
  const hiddenInput = document.getElementById("hiddenInput");
  const accessoryBar = document.getElementById("accessoryBar");

  eventBus.on("ws:status", ({ connected, text }) => {
    statusDot.classList.toggle("connected", connected);
    statusText.textContent = text;
  });

  new Touchpad(trackpadEl);
  new KeyboardManager(keyboardBtn, hiddenInput, accessoryBar);
  new DeckManager();
  new AudioManager(audioBtn);

  socket.init();
}

window.addEventListener("DOMContentLoaded", bootstrap);
