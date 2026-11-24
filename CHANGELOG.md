# Changelog - TouchMyMac

All notable changes to this project will be documented in this file.

## [2.9.0] - 2026-11-24
### Added
- Created product promotion landing page in `landingpage/` based on the `ssg.samseen.dev` VanillaSSG architecture, zero hydration, theme toggle, and compact 1:1 OpenGraph thumbnail.
- Rewrote root `README.md` to focus entirely on product promotion and direct GitHub release downloads, removing terminal build and cloning instructions.
- Added experimental status disclaimer for wireless audio streaming across the landing page and documentation.

## [2.8.0] - 2026-11-24
### Fixed
- Fixed audio crackle and noise by rewriting `AudioStreamManager` to correctly query `AudioBufferList` channel pointers for non-interleaved CoreAudio planar streams.
- Replaced multiple node instantiations in `web/js/audio.js` with a 48000Hz circular ring buffer and `ScriptProcessorNode` to provide gapless, smooth audio playback with zero node-recreation clicks.
- Fixed macOS Finder bundle icon caching by forcing LaunchServices registration and embedding the custom icon resource.

## [2.7.0] - 2026-11-24
### Added
- Created dedicated right-edge thumb scroll wheel (`ScrollWheel`) with mechanical haptic tick feedback for effortless single-handed scrolling.
- Converted audio capture to clean 16-bit interleaved stereo PCM to resolve planar audio static and deliver clear sound to phone headphones.
- Added automatic background reconnect on phone screen unlock using `document.visibilitychange`, window focus listeners, and a 4-second heartbeat.
- Generated native `AppIcon.icns` from `icon.svg` and bound it to `CFBundleIconFile` and `NSApplication.shared.applicationIconImage`.
- Expanded YouTube remote control deck with PiP/miniplayer (`I`), speed down (`<`), speed up (`>`), and closed captions (`C`).

## [2.6.0] - 2026-11-24
### Added
- Added `window.visualViewport` dynamic offset tracking and `interactive-widget=resizes-content` so the floating keyboard accessory bar floats above the on-screen mobile keyboard.
- Added smooth point-to-point micro-interpolation in `InputBridge.fastMove` to eliminate pointer jumps and provide gliding cursor movement.
- Added on-screen Mouse Speed sensitivity controller with live slider (0.8x to 4.0x), quick presets, and 1.35x horizontal travel scaling for widescreen displays.
- Added zero-install real-time audio streaming via `ScreenCaptureKit` with a 1-tap `🎧` Solo Phone button that automatically mutes the Mac physical speakers.
- Designed modern SVG brand icon `icon.svg` for TouchMyMac and linked it as the mobile app icon and favicon.
- Extracted `HTTPServer.swift` and `settings.css` to maintain compliance with the 200-line rule.

## [2.5.0] - 2026-11-24
### Added
- Created `KeyMap.swift` providing hardware ANSI keycodes and modifier mapping for standard ASCII characters.
- Added support for macOS Terminal and shell keystroke synthesis via `CGEventSource(stateID: .hidSystemState)`.
- Added floating mobile accessory toolbar displaying `Esc`, `Tab`, `Ctrl`, `Opt`, `Cmd`, `Enter`, and directional arrow keys (`←`, `↑`, `↓`, `→`).
- Added modifier latching support (`Ctrl`, `Opt`, `Cmd`) for terminal commands like `Ctrl+C` and shortcuts.
- Added tactile Click and Right Click buttons directly to the mobile trackpad surface.
### Fixed
- Fixed mouse click drops by synthesizing clicks with `mouseEventClickState = 1` and a 25ms delay between down and up.
- Fixed cursor jitter and lag by switching to a continuous pointer acceleration curve and 8ms delta streaming with `tcpOptions.noDelay = true`.
- Relaxed mobile tap-to-click threshold to 350ms duration and 25px displacement for reliable natural tapping.

## [2.4.0] - 2026-11-24
### Added
- Implemented guided 1-click Accessibility onboarding flow in `PopoverView.swift`.
- Added live visual permission indicator that switches to a green light when Accessibility is granted.
- Added native system permission prompt invocation on launch and 1-click routing to System Settings.

## [2.3.0] - 2026-11-24
### Added
- Implemented Google Chrome Private Network Access (PNA) compliance in `NetworkManager.swift`.
- Handled `OPTIONS` preflight requests responding with `204 No Content` and `Access-Control-Allow-Private-Network: true`.
- Injected `Access-Control-Allow-Private-Network: true` on all HTTP responses to prevent Android Chrome retry loops.

## [2.2.0] - 2026-11-24
### Fixed
- Disabled macOS AppKit Automatic Termination via `ProcessInfo.processInfo.disableAutomaticTermination` and `applicationShouldTerminateAfterLastWindowClosed -> false`.
- Added `NSSupportsAutomaticTermination` and `NSSupportsSuddenTermination` keys (`false`) in `Info.plist` to prevent macOS from killing the menu bar background server when the popover closes.

## [2.1.0] - 2026-11-24
### Added
- Added `NSLocalNetworkUsageDescription` and `NSAppTransportSecurity` to `Info.plist` for macOS Sequoia Local Network Privacy compliance.
- Added ad-hoc bundle code-signing sealing all web resources and binding `Info.plist`.
- Added dynamic local IP re-detection (`refreshIP()`) on every popover open to handle DHCP lease changes.
- Added socket cleanup and immediate connection cancellation for malformed or TLS handshake attempts.

## [2.0.0] - 2026-11-24
### Added
- Re-architected into a 100% native Swift menu bar application with zero third-party dependencies.
- Menu bar widget (`NSStatusItem`) resident with an interactive dropdown `NSPopover`.
- Single-port HTTP and WebSocket engine on standard port 8080 using Apple Network framework.
- Built-in CoreImage `CIQRCodeGenerator` with certified mobile camera scanning.
- Direct CoreGraphics `CGEvent` mouse, scroll, keyboard, and space switching dispatch.

## [1.0.4] - 2026-11-24
### Fixed
- Upgraded HTTP server to multi-threaded `ThreadingHTTPServer` to eliminate single-threaded socket blocking on concurrent mobile assets.
- Added explicit CORS and cache control headers.
- Pointed QR URL directly to `/index.html` to eliminate directory redirect loops.

## [1.0.3] - 2026-11-24
### Fixed
- Rebuilt complete applet bundle hierarchy with `applet.rsrc` and `Scripts/main.scpt` to resolve `OSStatus error -192 (resNotFound)`.
- Verified clean launch of `TouchMyMac.app` returning exit code 0.

## [1.0.2] - 2026-11-24
### Fixed
- Fixed QR column bit traversal order and format sequence mapping in `qr_codec.py`.
- Added standard 4-module quiet zone in `gui.py` for instant phone camera autofocus.
- Compiled native universal Mach-O binary for `TouchMyMac.app/Contents/MacOS/TouchMyMac` to resolve `-10827 (kLSNoExecutableErr)` on Finder double click.

## [1.0.1] - 2026-11-24
### Fixed
- Self-contained app bundle resources inside `TouchMyMac.app/Contents/Resources/`.
- Fixed launcher script path resolution so double clicking in Finder reliably launches the app.
- Added frontmost window focus and lift hooks for macOS.

## [1.0.0] - 2026-11-24
### Added
- Initial project scaffolding and modular architecture.
- Native macOS `TouchMyMac.app` launcher bundle.
- CoreGraphics event synthesis engine via Python `ctypes` without third-party dependencies.
- Local HTTP and WebSocket server engine.
- Pure Python QR code generator and native Tkinter status window.
- Mobile Web Controller with responsive touchpad, gesture engine, virtual keyboard bridge, and media control deck.
