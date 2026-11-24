// audio.js - Real-time low-latency audio streaming receiver using Web Audio API

import { socket } from "./socket.js";

export class AudioManager {
  constructor(btnElement) {
    this.btn = btnElement;
    this.ctx = null;
    this.processor = null;
    this.isPlaying = false;

    // 1-second circular buffer for stereo audio (48000 frames)
    this.bufferSize = 48000;
    this.ringL = new Float32Array(this.bufferSize);
    this.ringR = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
    this.readIndex = 0;
    this.bufferedSamples = 0;
    this.isPrebuffered = false;

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

    this.resetBuffer();
    this.isPlaying = true;

    if (!this.processor) {
      this.processor = this.ctx.createScriptProcessor(2048, 0, 2);
      this.processor.onaudioprocess = (e) => this.processAudio(e);
      this.processor.connect(this.ctx.destination);
    }

    if (this.btn) {
      this.btn.classList.add("active");
      this.btn.title = "Audio Streaming (Mac Muted) - Click to Stop";
    }
    if (navigator.vibrate) navigator.vibrate(25);
    socket.send({ action: "audio_start", solo: true });
  }

  stopAudio() {
    this.isPlaying = false;
    this.resetBuffer();
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.btn) {
      this.btn.classList.remove("active");
      this.btn.title = "Listen to Mac Audio on Phone";
    }
    if (navigator.vibrate) navigator.vibrate(15);
    socket.send({ action: "audio_stop" });
  }

  resetBuffer() {
    this.writeIndex = 0;
    this.readIndex = 0;
    this.bufferedSamples = 0;
    this.isPrebuffered = false;
  }

  handleAudioChunk(arrayBuffer) {
    if (!this.isPlaying) return;
    const int16 = new Int16Array(arrayBuffer);
    const numFrames = Math.floor(int16.length / 2);
    if (numFrames === 0) return;

    for (let i = 0; i < numFrames; i++) {
      this.ringL[this.writeIndex] = int16[i * 2] / 32768.0;
      this.ringR[this.writeIndex] = int16[i * 2 + 1] / 32768.0;
      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
    }
    this.bufferedSamples += numFrames;

    if (!this.isPrebuffered && this.bufferedSamples >= 2160) {
      this.isPrebuffered = true;
    }
  }

  processAudio(e) {
    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);
    const len = outL.length;

    if (!this.isPlaying || !this.isPrebuffered || this.bufferedSamples < len) {
      outL.fill(0);
      outR.fill(0);
      return;
    }

    for (let i = 0; i < len; i++) {
      outL[i] = this.ringL[this.readIndex];
      outR[i] = this.ringR[this.readIndex];
      this.readIndex = (this.readIndex + 1) % this.bufferSize;
    }
    this.bufferedSamples -= len;
  }
}
