"""gui.py - Native macOS Tkinter window displaying QR code and status."""

import subprocess
import tkinter as tk
from tkinter import ttk
from src.qr_codec import generate_qr_matrix

BG_COLOR = "#12141A"
CARD_COLOR = "#1C202B"
TEXT_COLOR = "#F0F2F5"
MUTED_COLOR = "#8E9AA8"
ACCENT_COLOR = "#007AFF"
SUCCESS_COLOR = "#34C759"

class AppWindow:
    def __init__(self, connect_url, token, port):
        self.connect_url = connect_url
        self.token = token
        self.port = port

        self.root = tk.Tk()
        self.root.title("TouchMyMac")
        self.root.geometry("380x560")
        self.root.resizable(False, False)
        self.root.configure(bg=BG_COLOR)

        self._build_ui()

    def _build_ui(self):
        container = tk.Frame(self.root, bg=BG_COLOR, padx=24, pady=20)
        container.pack(fill="both", expand=True)

        header = tk.Label(
            container, text="TouchMyMac", font=("SF Pro Display", 20, "bold"),
            fg=TEXT_COLOR, bg=BG_COLOR
        )
        header.pack(pady=(0, 4))

        subtitle = tk.Label(
            container, text="Scan with your phone to start",
            font=("SF Pro Text", 12), fg=MUTED_COLOR, bg=BG_COLOR
        )
        subtitle.pack(pady=(0, 16))

        # QR Card
        qr_card = tk.Frame(container, bg="#FFFFFF", padx=14, pady=14, relief="flat")
        qr_card.pack(pady=4)

        matrix = generate_qr_matrix(self.connect_url)
        grid_size = len(matrix)
        mod_size = 6
        dim = grid_size * mod_size

        self.canvas = tk.Canvas(
            qr_card, width=dim, height=dim, bg="#FFFFFF",
            highlightthickness=0
        )
        self.canvas.pack()

        for r in range(grid_size):
            for c in range(grid_size):
                if matrix[r][c]:
                    x0, y0 = c * mod_size, r * mod_size
                    x1, y1 = x0 + mod_size, y0 + mod_size
                    self.canvas.create_rectangle(
                        x0, y0, x1, y1, fill="#000000", outline=""
                    )

        # Connection status badge
        self.status_frame = tk.Frame(container, bg=CARD_COLOR, padx=12, pady=8)
        self.status_frame.pack(fill="x", pady=16)

        self.status_dot = tk.Canvas(
            self.status_frame, width=10, height=10, bg=CARD_COLOR,
            highlightthickness=0
        )
        self.status_dot.pack(side="left", padx=(0, 8))
        self.dot_item = self.status_dot.create_oval(
            1, 1, 9, 9, fill="#FF9500", outline=""
        )

        self.status_label = tk.Label(
            self.status_frame, text="Waiting for phone...",
            font=("SF Pro Text", 11, "bold"), fg=TEXT_COLOR, bg=CARD_COLOR
        )
        self.status_label.pack(side="left")

        # URL label
        url_lbl = tk.Label(
            container, text=self.connect_url, font=("SF Mono", 9),
            fg=ACCENT_COLOR, bg=BG_COLOR, wraplength=330
        )
        url_lbl.pack(pady=(0, 12))

        # Accessibility button
        perm_btn = tk.Button(
            container, text="Check Accessibility Settings",
            command=self._open_accessibility,
            font=("SF Pro Text", 11), bg=CARD_COLOR, fg=TEXT_COLOR,
            relief="groove", pady=6, cursor="pointinghand"
        )
        perm_btn.pack(fill="x")

    def _open_accessibility(self):
        cmd = "open 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'"
        subprocess.run(cmd, shell=True)

    def set_connected(self, is_connected):
        def _update():
            if is_connected:
                self.status_dot.itemconfig(self.dot_item, fill=SUCCESS_COLOR)
                self.status_label.config(text="Phone Connected", fg=SUCCESS_COLOR)
            else:
                self.status_dot.itemconfig(self.dot_item, fill="#FF9500")
                self.status_label.config(text="Waiting for phone...", fg=TEXT_COLOR)
        self.root.after(0, _update)

    def start(self):
        self.root.mainloop()
