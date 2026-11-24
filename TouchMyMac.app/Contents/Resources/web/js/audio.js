// audio.js - Real-time low-latency audio streaming receiver using Web Audio API

import { socket } from "./socket.js";

export class AudioManager {
  constructor(btnElement) {
    this.btn = btnElement;
    this.ctx = null;
    this.isPlaying = false;
    this.nextTime = 0;

    this.bindEvents();
  }

  bindEvents() {
    if (this.btn) {
      this.btn.addEventListener("click", () => this.toggleAudio());
    }

    socket.onBinary((arrayBuffer) => {
      this.handleAudioChunk(arrayBuffer);
    });
  }

  async toggleAudio() {
    if (!this.isPlaying) {
      await this.startAudio();
    } else {
      this.stopAudio();
    }
  }

  async startAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 48000 });
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    this.isPlaying = true;
    this.nextTime = this.ctx.currentTime + 0.05;
    if (this.btn) {
      this.btn.classList.add("active");
      this.btn.title = "Audio Streaming (Mac Muted) - Click to Stop";
    }
    if (navigator.vibrate) navigator.vibrate(25);
    socket.send({ action: "audio_start", solo: true });
  }

  stopAudio() {
    this.isPlaying = false;
    if (this.btn) {
      this.btn.classList.remove("active");
      this.btn.title = "Listen to Mac Audio on Phone";
    }
    if (navigator.vibrate) navigator.vibrate(15);
    socket.send({ action: "audio_stop" });
  }

  handleAudioChunk(arrayBuffer) {
    if (!this.isPlaying || !this.ctx) return;
    const floatData = new Float32Array(arrayBuffer);
    const numChannels = 2;
    const numFrames = Math.floor(floatData.length / numChannels);
    if (numFrames === 0) return;

    const audioBuf = this.ctx.createBuffer(numChannels, numFrames, 48000);
    const ch0 = audioBuf.getChannelData(0);
    const ch1 = audioBuf.getChannelData(1);

    for (let i = 0; i < numFrames; i++) {
      ch0[i] = floatData[i * 2];
      ch1[i] = floatData[i * 2 + 1];
    }

    const src = this.ctx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    if (this.nextTime < now) {
      this.nextTime = now + 0.005;
    }
    src.start(this.nextTime);
    this.nextTime += audioBuf.duration;
  }
}
