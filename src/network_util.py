"""network_util.py - Network utilities, LAN IP discovery, and security."""

import os
import socket
import secrets
import subprocess

def get_local_ip():
    # Strategy 1: Ask macOS network setup tools
    for iface in ("en0", "en1"):
        try:
            res = subprocess.run(
                ["ipconfig", "getifaddr", iface],
                capture_output=True,
                text=True,
                timeout=1
            )
            ip = res.stdout.strip()
            if ip and not ip.startswith("127."):
                return ip
        except Exception:
            pass

    # Strategy 2: Probe local routing table
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass

    # Strategy 3: Hostname resolution fallback
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127."):
                return ip
    except Exception:
        pass

    return "127.0.0.1"

def generate_token():
    return secrets.token_hex(4)

def get_web_dir():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, "web")
