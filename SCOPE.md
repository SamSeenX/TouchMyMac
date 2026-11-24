# Project Scope - TouchMyMac

## In Scope
- macOS Host application (`TouchMyMac.app`).
- Native mouse pointer movement, click, scroll, and desktop switching.
- Mobile responsive web interface (touchpad, virtual keyboard, media deck).
- QR code pairing over local network Wi-Fi.
- Token-authenticated WebSocket channel.
- System volume and media control hotkeys.

## Backlog / Future Enhancements
- WebRTC DataChannel fallback if WebSocket latency on congested Wi-Fi degrades.
- Dedicated presentation mode (Laser pointer simulation, slide clicker).
- Dark/Light theme sync between Mac and mobile client.
- Bluetooth Low Energy (BLE) pairing mode.

## Out of Scope
- Native iOS App Store / Google Play binary releases (Web PWA suffices).
- Internet relay / WAN remote access outside local network.
