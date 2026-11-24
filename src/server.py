"""server.py - Unified HTTP and WebSocket server for phone controls."""

import json
import asyncio
import http.server
import socketserver
import threading
from urllib.parse import urlparse, parse_qs
import websockets
from src import mac_input
from src.network_util import get_web_dir

active_connections = set()
connection_callback = None

def set_connection_callback(cb):
    global connection_callback
    connection_callback = cb

def notify_status():
    if connection_callback:
        connection_callback(len(active_connections) > 0)

class WebHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=get_web_dir(), **kwargs)

    def log_message(self, format, *args):
        pass  # Suppress console logging

def start_http_server(host, port):
    server = socketserver.TCPServer((host, port), WebHandler)
    server.serve_forever()

async def handle_ws(websocket, path, expected_token):
    query = parse_qs(urlparse(path).query)
    token = query.get("token", [""])[0]
    if token != expected_token:
        await websocket.close(4001, "Invalid token")
        return

    active_connections.add(websocket)
    notify_status()
    try:
        async for raw_msg in websocket:
            try:
                data = json.loads(raw_msg)
                dispatch_command(data)
            except Exception:
                pass
    finally:
        active_connections.discard(websocket)
        notify_status()

def dispatch_command(data):
    action = data.get("action")
    if action == "move":
        mac_input.move_relative(
            data.get("dx", 0.0),
            data.get("dy", 0.0),
            data.get("drag", False)
        )
    elif action == "tap":
        mac_input.left_click()
    elif action == "right_tap":
        mac_input.right_click()
    elif action == "drag_start":
        mac_input.left_down()
    elif action == "drag_end":
        mac_input.left_up()
    elif action == "scroll":
        mac_input.scroll(data.get("dx", 0.0), data.get("dy", 0.0))
    elif action == "desktop":
        mac_input.switch_desktop(data.get("dir", "right"))
    elif action == "type":
        mac_input.type_text(data.get("text", ""))
    elif action == "key":
        mac_input.press_key(data.get("key", ""))
    elif action == "media":
        mac_input.media_action(data.get("cmd", ""))
    elif action == "yt":
        # YouTube shortcut keys: j (-10s), l (+10s), f (fullscreen), m (mute)
        yt_map = {
            "seek_back": "j", "seek_fwd": "l",
            "fullscreen": "f", "mute": "m", "play_pause": "k"
        }
        key = yt_map.get(data.get("cmd", ""))
        if key:
            mac_input.type_text(key)

def start_services(host, http_port, ws_port, token):
    http_thread = threading.Thread(
        target=start_http_server,
        args=(host, http_port),
        daemon=True
    )
    http_thread.start()

    def run_ws():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        bound_handler = lambda ws, path: handle_ws(ws, path, token)
        srv = websockets.serve(bound_handler, host, ws_port)
        loop.run_until_complete(srv)
        loop.run_forever()

    ws_thread = threading.Thread(target=run_ws, daemon=True)
    ws_thread.start()
