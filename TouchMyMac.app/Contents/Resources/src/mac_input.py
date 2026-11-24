"""mac_input.py - macOS CoreGraphics input synthesis bridge."""

import ctypes
import subprocess
from ctypes import c_void_p, c_uint32, c_double, Structure, c_ushort, POINTER, c_bool

class CGPoint(Structure):
    _fields_ = [("x", c_double), ("y", c_double)]

app_services = ctypes.cdll.LoadLibrary(
    "/System/Library/Frameworks/ApplicationServices.framework/ApplicationServices"
)

# Function prototypes
app_services.CGEventCreate.restype = c_void_p
app_services.CGEventCreate.argtypes = [c_void_p]

app_services.CGEventGetLocation.restype = CGPoint
app_services.CGEventGetLocation.argtypes = [c_void_p]

app_services.CGEventCreateMouseEvent.restype = c_void_p
app_services.CGEventCreateMouseEvent.argtypes = [
    c_void_p, c_uint32, CGPoint, c_uint32
]

app_services.CGEventCreateScrollWheelEvent.restype = c_void_p
app_services.CGEventCreateScrollWheelEvent.argtypes = [
    c_void_p, c_uint32, c_uint32, ctypes.c_int32, ctypes.c_int32
]

app_services.CGEventCreateKeyboardEvent.restype = c_void_p
app_services.CGEventCreateKeyboardEvent.argtypes = [c_void_p, c_ushort, c_bool]

app_services.CGEventSetFlags.restype = None
app_services.CGEventSetFlags.argtypes = [c_void_p, ctypes.c_uint64]

app_services.CGEventKeyboardSetUnicodeString.restype = None
app_services.CGEventKeyboardSetUnicodeString.argtypes = [
    c_void_p, ctypes.c_ulong, POINTER(c_ushort)
]

app_services.CGEventPost.restype = None
app_services.CGEventPost.argtypes = [c_uint32, c_void_p]

# Event constants
kCGHIDEventTap = 0
kCGEventLeftMouseDown = 1
kCGEventLeftMouseUp = 2
kCGEventRightMouseDown = 3
kCGEventRightMouseUp = 4
kCGEventMouseMoved = 5
kCGEventLeftMouseDragged = 6
kCGEventRightMouseDragged = 7
kCGEventScrollWheel = 22
kCGMouseButtonLeft = 0
kCGMouseButtonRight = 1
kCGScrollEventUnitPixel = 0
kCGEventFlagMaskControl = 0x00040000

KEY_CODES = {
    "enter": 36, "return": 36, "tab": 48, "space": 49,
    "backspace": 51, "delete": 117, "escape": 53,
    "left": 123, "right": 124, "down": 125, "up": 126
}

def get_mouse_location():
    event = app_services.CGEventCreate(None)
    if not event:
        return 0.0, 0.0
    loc = app_services.CGEventGetLocation(event)
    return loc.x, loc.y

def move_relative(dx, dy, is_dragging=False):
    curr_x, curr_y = get_mouse_location()
    target = CGPoint(curr_x + dx, curr_y + dy)
    event_type = kCGEventLeftMouseDragged if is_dragging else kCGEventMouseMoved
    button = kCGMouseButtonLeft if is_dragging else 0
    event = app_services.CGEventCreateMouseEvent(None, event_type, target, button)
    if event:
        app_services.CGEventPost(kCGHIDEventTap, event)

def left_down():
    curr_x, curr_y = get_mouse_location()
    event = app_services.CGEventCreateMouseEvent(
        None, kCGEventLeftMouseDown, CGPoint(curr_x, curr_y), kCGMouseButtonLeft
    )
    if event:
        app_services.CGEventPost(kCGHIDEventTap, event)

def left_up():
    curr_x, curr_y = get_mouse_location()
    event = app_services.CGEventCreateMouseEvent(
        None, kCGEventLeftMouseUp, CGPoint(curr_x, curr_y), kCGMouseButtonLeft
    )
    if event:
        app_services.CGEventPost(kCGHIDEventTap, event)

def left_click():
    left_down()
    left_up()

def right_click():
    curr_x, curr_y = get_mouse_location()
    pt = CGPoint(curr_x, curr_y)
    down = app_services.CGEventCreateMouseEvent(
        None, kCGEventRightMouseDown, pt, kCGMouseButtonRight
    )
    up = app_services.CGEventCreateMouseEvent(
        None, kCGEventRightMouseUp, pt, kCGMouseButtonRight
    )
    if down and up:
        app_services.CGEventPost(kCGHIDEventTap, down)
        app_services.CGEventPost(kCGHIDEventTap, up)

def scroll(dx, dy):
    # Invert dy so natural scrolling works like a trackpad
    event = app_services.CGEventCreateScrollWheelEvent(
        None, kCGScrollEventUnitPixel, 2, int(dy), int(dx)
    )
    if event:
        app_services.CGEventPost(kCGHIDEventTap, event)

def switch_desktop(direction):
    code = KEY_CODES.get("left") if direction == "left" else KEY_CODES.get("right")
    down = app_services.CGEventCreateKeyboardEvent(None, code, True)
    up = app_services.CGEventCreateKeyboardEvent(None, code, False)
    if down and up:
        app_services.CGEventSetFlags(down, kCGEventFlagMaskControl)
        app_services.CGEventSetFlags(up, kCGEventFlagMaskControl)
        app_services.CGEventPost(kCGHIDEventTap, down)
        app_services.CGEventPost(kCGHIDEventTap, up)

def type_text(text):
    for ch in text:
        unichars = (c_ushort * 1)(ord(ch))
        down = app_services.CGEventCreateKeyboardEvent(None, 0, True)
        up = app_services.CGEventCreateKeyboardEvent(None, 0, False)
        if down and up:
            app_services.CGEventKeyboardSetUnicodeString(down, 1, unichars)
            app_services.CGEventKeyboardSetUnicodeString(up, 1, unichars)
            app_services.CGEventPost(kCGHIDEventTap, down)
            app_services.CGEventPost(kCGHIDEventTap, up)

def press_key(key_name):
    code = KEY_CODES.get(key_name.lower())
    if code is not None:
        down = app_services.CGEventCreateKeyboardEvent(None, code, True)
        up = app_services.CGEventCreateKeyboardEvent(None, code, False)
        if down and up:
            app_services.CGEventPost(kCGHIDEventTap, down)
            app_services.CGEventPost(kCGHIDEventTap, up)

def media_action(action):
    scripts = {
        "play_pause": "tell application \"System Events\" to key code 49 using {command down}",
        "vol_up": "set volume output volume ((output volume of (get volume settings)) + 6)",
        "vol_down": "set volume output volume ((output volume of (get volume settings)) - 6)",
        "mute": "set volume output muted (not (output muted of (get volume settings)))"
    }
    cmd = scripts.get(action)
    if cmd:
        subprocess.run(["osascript", "-e", cmd], capture_output=True)
