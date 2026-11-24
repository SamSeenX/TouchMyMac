"""main.py - Entry point orchestrating server and GUI."""

import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.network_util import get_local_ip, generate_token
from src.server import start_services, set_connection_callback
from src.gui import AppWindow

HTTP_PORT = 8765
WS_PORT = 8766

def main():
    host_ip = get_local_ip()
    token = generate_token()
    connect_url = f"http://{host_ip}:{HTTP_PORT}/?token={token}&ws={WS_PORT}"

    # Start network server
    start_services("0.0.0.0", HTTP_PORT, WS_PORT, token)

    # Launch desktop UI
    window = AppWindow(connect_url, token, HTTP_PORT)
    set_connection_callback(window.set_connected)
    window.start()

if __name__ == "__main__":
    main()
