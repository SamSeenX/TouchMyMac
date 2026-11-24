// KeyMap.swift - ANSI keycode and character definitions for macOS CoreGraphics events

import CoreGraphics

public struct KeyMap {
    public static let namedKeys: [String: CGKeyCode] = [
        "enter": 36, "return": 36, "tab": 48, "space": 49,
        "backspace": 51, "delete": 117, "escape": 53, "esc": 53,
        "left": 123, "right": 124, "down": 125, "up": 126
    ]

    public static let charMap: [Character: (CGKeyCode, Bool)] = [
        "a": (0, false), "b": (11, false), "c": (8, false), "d": (2, false),
        "e": (14, false), "f": (3, false), "g": (5, false), "h": (4, false),
        "i": (34, false), "j": (38, false), "k": (40, false), "l": (37, false),
        "m": (46, false), "n": (45, false), "o": (31, false), "p": (35, false),
        "q": (12, false), "r": (15, false), "s": (1, false), "t": (17, false),
        "u": (32, false), "v": (9, false), "w": (13, false), "x": (7, false),
        "y": (16, false), "z": (6, false),
        "A": (0, true), "B": (11, true), "C": (8, true), "D": (2, true),
        "E": (14, true), "F": (3, true), "G": (5, true), "H": (4, true),
        "I": (34, true), "J": (38, true), "K": (40, true), "L": (37, true),
        "M": (46, true), "N": (45, true), "O": (31, true), "P": (35, true),
        "Q": (12, true), "R": (15, true), "S": (1, true), "T": (17, true),
        "U": (32, true), "V": (9, true), "W": (13, true), "X": (7, true),
        "Y": (16, true), "Z": (6, true),
        "1": (18, false), "2": (19, false), "3": (20, false), "4": (21, false),
        "5": (23, false), "6": (22, false), "7": (26, false), "8": (28, false),
        "9": (25, false), "0": (29, false),
        "!": (18, true), "@": (19, true), "#": (20, true), "$": (21, true),
        "%": (23, true), "^": (22, true), "&": (26, true), "*": (28, true),
        "(": (25, true), ")": (29, true),
        "-": (27, false), "_": (27, true), "=": (24, false), "+": (24, true),
        "[": (33, false), "{": (33, true), "]": (30, false), "}": (30, true),
        "\\": (42, false), "|": (42, true), ";": (41, false), ":": (41, true),
        "'": (39, false), "\"": (39, true), ",": (43, false), "<": (43, true),
        ".": (47, false), ">": (47, true), "/": (44, false), "?": (44, true),
        "`": (50, false), "~": (50, true), " ": (49, false)
    ]
}
