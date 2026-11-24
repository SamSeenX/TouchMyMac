# Changelog - TouchMyMac

All notable changes to this project will be documented in this file.

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
