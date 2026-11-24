// InputBridge.swift - CoreGraphics event synthesis for macOS

import Foundation
import CoreGraphics

public final class InputBridge {
    private static let source = CGEventSource(stateID: .hidSystemState)

    private static var currentPos: CGPoint = .zero
    private static var lastMoveTimestamp: TimeInterval = 0

    public static func getMouseLocation() -> CGPoint {
        guard let event = CGEvent(source: source) else { return .zero }
        return event.location
    }

    public static func fastMove(dx: Double, dy: Double) {
        let now = ProcessInfo.processInfo.systemUptime
        if now - lastMoveTimestamp > 0.12 || currentPos == .zero {
            currentPos = CGEvent(source: source)?.location ?? .zero
        }
        lastMoveTimestamp = now
        let dist = hypot(dx, dy)
        let steps = min(max(Int(dist / 6.0), 1), 3)
        let stepX = dx / Double(steps)
        let stepY = dy / Double(steps)
        for i in 0..<steps {
            currentPos.x += stepX
            currentPos.y += stepY
            if let event = CGEvent(mouseEventSource: source, mouseType: .mouseMoved, mouseCursorPosition: currentPos, mouseButton: .left) {
                event.post(tap: .cghidEventTap)
            }
            if steps > 1 && i < steps - 1 {
                usleep(1_200)
            }
        }
    }

    public static func move(dx: Double, dy: Double, isDragging: Bool = false) {
        let current = getMouseLocation()
        currentPos = CGPoint(x: current.x + dx, y: current.y + dy)
        let type: CGEventType = isDragging ? .leftMouseDragged : .mouseMoved
        let button: CGMouseButton = isDragging ? .left : .left
        if let event = CGEvent(mouseEventSource: source, mouseType: type, mouseCursorPosition: currentPos, mouseButton: button) {
            event.post(tap: .cghidEventTap)
        }
    }

    public static func leftDown() {
        let loc = getMouseLocation()
        if let event = CGEvent(mouseEventSource: source, mouseType: .leftMouseDown, mouseCursorPosition: loc, mouseButton: .left) {
            event.setIntegerValueField(.mouseEventClickState, value: 1)
            event.post(tap: .cghidEventTap)
        }
    }

    public static func leftUp() {
        let loc = getMouseLocation()
        if let event = CGEvent(mouseEventSource: source, mouseType: .leftMouseUp, mouseCursorPosition: loc, mouseButton: .left) {
            event.setIntegerValueField(.mouseEventClickState, value: 1)
            event.post(tap: .cghidEventTap)
        }
    }

    public static func leftClick() {
        let loc = getMouseLocation()
        if let down = CGEvent(mouseEventSource: source, mouseType: .leftMouseDown, mouseCursorPosition: loc, mouseButton: .left),
           let up = CGEvent(mouseEventSource: source, mouseType: .leftMouseUp, mouseCursorPosition: loc, mouseButton: .left) {
            down.setIntegerValueField(.mouseEventClickState, value: 1)
            up.setIntegerValueField(.mouseEventClickState, value: 1)
            down.post(tap: .cghidEventTap)
            usleep(25_000)
            up.post(tap: .cghidEventTap)
        }
    }

    public static func rightClick() {
        let loc = getMouseLocation()
        if let down = CGEvent(mouseEventSource: source, mouseType: .rightMouseDown, mouseCursorPosition: loc, mouseButton: .right),
           let up = CGEvent(mouseEventSource: source, mouseType: .rightMouseUp, mouseCursorPosition: loc, mouseButton: .right) {
            down.setIntegerValueField(.mouseEventClickState, value: 1)
            up.setIntegerValueField(.mouseEventClickState, value: 1)
            down.post(tap: .cghidEventTap)
            usleep(25_000)
            up.post(tap: .cghidEventTap)
        }
    }

    public static func scroll(dx: Double, dy: Double) {
        if let event = CGEvent(scrollWheelEvent2Source: source, units: .pixel, wheelCount: 2, wheel1: Int32(dy), wheel2: Int32(dx), wheel3: 0) {
            event.post(tap: .cghidEventTap)
        }
    }

    public static func switchDesktop(direction: String) {
        let code: CGKeyCode = (direction == "left") ? 123 : 124
        postKey(code: code, flags: [.maskControl])
    }

    public static func typeText(_ text: String, modifiers: [String] = []) {
        let flags = parseModifiers(modifiers)
        for char in text {
            if let (code, shift) = KeyMap.charMap[char] {
                var charFlags = flags
                if shift { charFlags.insert(.maskShift) }
                postKey(code: code, flags: charFlags)
            } else {
                for unit in String(char).utf16 {
                    var code = unit
                    if let down = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: true),
                       let up = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: false) {
                        down.keyboardSetUnicodeString(stringLength: 1, unicodeString: &code)
                        up.keyboardSetUnicodeString(stringLength: 1, unicodeString: &code)
                        down.post(tap: .cghidEventTap)
                        usleep(5_000)
                        up.post(tap: .cghidEventTap)
                    }
                }
            }
        }
    }

    public static func pressKey(_ name: String, modifiers: [String] = []) {
        let lower = name.lowercased()
        let flags = parseModifiers(modifiers)
        if let code = KeyMap.namedKeys[lower] {
            postKey(code: code, flags: flags)
        } else if lower.count == 1, let char = lower.first, let (c, _) = KeyMap.charMap[char] {
            postKey(code: c, flags: flags)
        }
    }

    private static func parseModifiers(_ list: [String]) -> CGEventFlags {
        var flags: CGEventFlags = []
        for m in list {
            switch m.lowercased() {
            case "ctrl", "control": flags.insert(.maskControl)
            case "cmd", "command": flags.insert(.maskCommand)
            case "opt", "option", "alt": flags.insert(.maskAlternate)
            case "shift": flags.insert(.maskShift)
            default: break
            }
        }
        return flags
    }

    private static func postKey(code: CGKeyCode, flags: CGEventFlags = []) {
        if let down = CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: true),
           let up = CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: false) {
            if !flags.isEmpty {
                down.flags = flags
                up.flags = flags
            }
            down.post(tap: .cghidEventTap)
            usleep(10_000)
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
