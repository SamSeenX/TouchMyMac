# BRAIN.md - TouchMyMac Architectural Blueprint

## 1. Vision & Core Philosophy
TouchMyMac turns any modern smartphone (Android, iPhone, iPad) into a low-latency remote touchpad, virtual keyboard, and media deck for macOS.
It runs as a native macOS `.app` bundle, requires zero mobile store installations, and operates entirely over the local Wi-Fi network with zero cloud or third-party dependencies.

## 2. Technical Architecture

### 2.1 Native macOS Host (`TouchMyMac.app`)
- Packaged as a standard macOS application bundle with `Contents/MacOS/TouchMyMac` launcher and `Info.plist`.
- Host engine built in Python 3 using standard library plus pre-installed `websockets`.
- Native Input Bridge: Directly binds to macOS `ApplicationServices.framework` via `ctypes` (`CGEventCreateMouseEvent`, `CGEventPost`, `CGEventCreateScrollWheelEvent`, `CGEventKeyboardSetUnicodeString`).
- Native GUI: Lightweight Cocoa/Tkinter window that renders the connection QR code and live connection telemetry.

### 2.2 Low-Latency Communications Layer
- Local HTTP Server: Serves the static web client assets (Vanilla HTML/CSS/JS).
- WebSocket Server: Receives real-time touch deltas, gestures, keystrokes, and media actions with sub-10ms response times.
- Security: One-time session tokens prevent unauthorized LAN devices from controlling the cursor.

### 2.3 Mobile Web Client (Vanilla JS & CSS)
- Touchpad Area: Full-screen touch capture with touch delta calculation and acceleration curve.
- Gestures:
  - 1 finger pan: Mouse cursor move.
  - 1 finger tap: Mouse left click.
  - 2 finger tap: Mouse right click.
  - 2 finger pan: Smooth vertical and horizontal scrolling.
  - 3 finger swipe: Switch macOS Spaces (Control + Left/Right Arrow).
- Virtual Typing: Hidden input bridge to open the native mobile software keyboard.
- Media Deck: System volume control, Play/Pause, Track Skip, and YouTube shortcuts (Seek 10s, Fullscreen, Mute).

## 3. Storage & State Management
- Host remembers the preferred port and window positions in `~/.touchmymac/config.json`.
- Client runs completely stateless or caches personal layout preferences in `localStorage`.
