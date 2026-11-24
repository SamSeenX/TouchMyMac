# BRAIN.md - TouchMyMac Architectural Blueprint

## 1. Vision & Core Philosophy
TouchMyMac turns any modern smartphone (Android, iPhone, iPad) into a low-latency remote touchpad, virtual keyboard, and media deck for macOS.
It runs as a native macOS `.app` bundle, requires zero mobile store installations, and operates entirely over the local Wi-Fi network with zero cloud or third-party dependencies.

## 2. Technical Architecture

### 2.1 Native macOS Host (`TouchMyMac.app`)
- Packaged as a standard macOS menu bar application bundle (`LSUIElement = true`) with compiled ARM64 Swift binary and signed `Info.plist`.
- Zero third-party runtime dependencies: built entirely using Apple Foundation, AppKit, Network framework, CoreImage, and CoreGraphics.
- Local Network Privacy compliance: Declares `NSLocalNetworkUsageDescription` and seals bundle resources with code-signing for macOS Sequoia support.
- Native Input Bridge: Directly binds to macOS `CoreGraphics` (`CGEvent`, `CGEventPost`, scroll events, ANSI hardware keycodes, media key dispatch) using `CGEventSource(stateID: .hidSystemState)`.
- Native GUI: Menu bar status item (`NSStatusItem`) resident with an interactive dropdown `NSPopover` rendering live QR codes generated via `CIQRCodeGenerator`. Dynamic IP refresh ensures the QR code always reflects the latest Wi-Fi address.

### 2.2 Low-Latency Communications Layer
- Local HTTP Server: Serves the static web client assets (Vanilla HTML/CSS/JS).
- WebSocket Server: Receives real-time touch deltas, gestures, keystrokes, and media actions with sub-10ms response times. Configured with `NWProtocolTCP.Options.noDelay = true` to disable Nagle buffering.
- Security: One-time session tokens prevent unauthorized LAN devices from controlling the cursor.

### 2.3 Mobile Web Client (Vanilla JS & CSS)
- Touchpad Area: Full-screen touch capture with touch delta calculation and smooth continuous acceleration curve.
- Floating Accessory Toolbar: Mobile keyboard accessory dock providing `Esc`, `Tab`, `Ctrl`, `Opt`, `Cmd`, `Enter`, and arrow keys with modifier latching.
- Physical Click Bar: Dedicated tactile Left Click and Right Click buttons at the bottom of the trackpad surface.
- Gestures:
  - 1 finger pan: Mouse cursor move.
  - 1 finger tap: Mouse left click.
  - 2 finger tap: Mouse right click.
  - 2 finger pan: Smooth vertical and horizontal scrolling.
  - 3 finger swipe: Switch macOS Spaces (Control + Left/Right Arrow).
- Virtual Typing: Hidden input bridge to open the native mobile software keyboard with hardware key mapping for shell/terminal compatibility.
- Media Deck: System volume control, Play/Pause, Track Skip, and YouTube shortcuts (Seek 10s, Fullscreen, Mute).

### 2.4 Future Virtual Audio Streaming Architecture
- Low-latency audio streaming directly from Mac to phone:
  - Virtual CoreAudio HAL Driver (`AudioServerPlugin`) or `ScreenCaptureKit` system audio tap.
  - Audio encoded in sub-50ms Opus or raw low-latency PCM chunks over WebSocket or WebRTC datachannel.
  - Client decodes and streams into HTML5 Web Audio API (`AudioContext`) with jitter buffering for synchronized movie listening over phone headphones.

## 3. Storage & State Management
- Host remembers the preferred port and window positions in `~/.touchmymac/config.json`.
- Client runs completely stateless or caches personal layout preferences in `localStorage`.
