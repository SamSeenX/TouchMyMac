// InputBridge.swift - CoreGraphics event synthesis for macOS

import Foundation
import CoreGraphics

public final class InputBridge {
    private static let keyCodes: [String: CGKeyCode] = [
        "enter": 36, "return": 36, "tab": 48, "space": 49,
        "backspace": 51, "delete": 117, "escape": 53,
        "left": 123, "right": 124, "down": 125, "up": 126
    ]

    public static func getMouseLocation() -> CGPoint {
        guard let event = CGEvent(source: nil) else { return .zero }
        return event.location
    }

    public static func move(dx: Double, dy: Double, isDragging: Bool = false) {
        let current = getMouseLocation()
        let target = CGPoint(x: current.x + dx, y: current.y + dy)
        let type: CGEventType = isDragging ? .leftMouseDragged : .mouseMoved
        let button: CGMouseButton = isDragging ? .left : .left
        if let event = CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: target, mouseButton: button) {
            event.post(tap: .cghidEventTap)
        }
    }

    public static func leftDown() {
        let loc = getMouseLocation()
        if let event = CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, mouseCursorPosition: loc, mouseButton: .left) {
            event.post(tap: .cghidEventTap)
        }
    }

    public static func leftUp() {
        let loc = getMouseLocation()
        if let event = CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: loc, mouseButton: .left) {
            event.post(tap: .cghidEventTap)
        }
    }

    public static func leftClick() {
        leftDown()
        leftUp()
    }

    public static func rightClick() {
        let loc = getMouseLocation()
        if let down = CGEvent(mouseEventSource: nil, mouseType: .rightMouseDown, mouseCursorPosition: loc, mouseButton: .right),
           let up = CGEvent(mouseEventSource: nil, mouseType: .rightMouseUp, mouseCursorPosition: loc, mouseButton: .right) {
            down.post(tap: .cghidEventTap)
            up.post(tap: .cghidEventTap)
        }
    }

    public static func scroll(dx: Double, dy: Double) {
        if let event = CGEvent(scrollWheelEvent2Source: nil, units: .pixel, wheelCount: 2, wheel1: Int32(dy), wheel2: Int32(dx), wheel3: 0) {
            event.post(tap: .cghidEventTap)
        }
    }

    public static func switchDesktop(direction: String) {
        let code = (direction == "left") ? keyCodes["left"]! : keyCodes["right"]!
        if let down = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: true),
           let up = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: false) {
            down.flags = .maskControl
            up.flags = .maskControl
            down.post(tap: .cghidEventTap)
            up.post(tap: .cghidEventTap)
        }
    }

    public static func typeText(_ text: String) {
        for char in text.utf16 {
            var code = char
            if let down = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: true),
               let up = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: false) {
                down.keyboardSetUnicodeString(stringLength: 1, unicodeString: &code)
                up.keyboardSetUnicodeString(stringLength: 1, unicodeString: &code)
                down.post(tap: .cghidEventTap)
                up.post(tap: .cghidEventTap)
            }
        }
    }

    public static func pressKey(_ name: String) {
        guard let code = keyCodes[name.lowercased()] else { return }
        if let down = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: true),
           let up = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: false) {
            down.post(tap: .cghidEventTap)
            up.post(tap: .cghidEventTap)
        }
    }

    public static func mediaAction(_ cmd: String) {
        let scriptMap: [String: String] = [
            "play_pause": "tell application \"System Events\" to key code 49 using {command down}",
            "vol_up": "set volume output volume ((output volume of (get volume settings)) + 6)",
            "vol_down": "set volume output volume ((output volume of (get volume settings)) - 6)",
            "mute": "set volume output muted (not (output muted of (get volume settings)))"
        ]
        if let script = scriptMap[cmd] {
            let task = Process()
            task.launchPath = "/usr/bin/osascript"
            task.arguments = ["-e", script]
            try? task.run()
        }
    }

    public static func youtubeAction(_ cmd: String) {
        let ytKeyMap: [String: String] = [
            "seek_back": "j", "seek_fwd": "l",
            "fullscreen": "f", "mute": "m", "play_pause": "k"
        ]
        if let key = ytKeyMap[cmd] {
            typeText(key)
        }
    }
}
