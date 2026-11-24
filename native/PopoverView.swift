// PopoverView.swift - Native macOS dropdown popover view controller

import AppKit

public final class PopoverViewController: NSViewController, NetworkManagerDelegate {
    private let statusLabel = NSTextField(labelWithString: "Ready to pair")
    private let statusDot = NSView(frame: NSRect(x: 0, y: 0, width: 8, height: 8))
    private let qrImageView = NSImageView()
    private let urlLabel = NSTextField(labelWithString: "")

    public override func loadView() {
        self.view = NSView(frame: NSRect(x: 0, y: 0, width: 280, height: 380))
        self.view.wantsLayer = true
        self.view.layer?.backgroundColor = NSColor(red: 0.07, green: 0.08, blue: 0.11, alpha: 1.0).cgColor

        setupUI()
        NetworkManager.shared.delegate = self
        updateQR()
    }

    private func setupUI() {
        let titleLabel = NSTextField(labelWithString: "TouchMyMac")
        titleLabel.font = NSFont.systemFont(ofSize: 15, weight: .bold)
        titleLabel.textColor = .white
        titleLabel.frame = NSRect(x: 20, y: 340, width: 240, height: 22)
        view.addSubview(titleLabel)

        statusDot.wantsLayer = true
        statusDot.layer?.cornerRadius = 4
        statusDot.layer?.backgroundColor = NSColor.systemOrange.cgColor
        statusDot.frame = NSRect(x: 20, y: 320, width: 8, height: 8)
        view.addSubview(statusDot)

        statusLabel.font = NSFont.systemFont(ofSize: 11, weight: .medium)
        statusLabel.textColor = NSColor(white: 0.65, alpha: 1.0)
        statusLabel.frame = NSRect(x: 34, y: 315, width: 220, height: 18)
        view.addSubview(statusLabel)

        qrImageView.frame = NSRect(x: 30, y: 95, width: 220, height: 220)
        qrImageView.imageScaling = .scaleProportionallyUpOrDown
        qrImageView.wantsLayer = true
        qrImageView.layer?.cornerRadius = 10
        qrImageView.layer?.masksToBounds = true
        view.addSubview(qrImageView)

        urlLabel.font = NSFont.monospacedSystemFont(ofSize: 11, weight: .regular)
        urlLabel.textColor = NSColor.systemBlue
        urlLabel.alignment = .center
        urlLabel.frame = NSRect(x: 10, y: 65, width: 260, height: 20)
        view.addSubview(urlLabel)

        let quitBtn = NSButton(title: "Quit TouchMyMac", target: self, action: #selector(quitApp))
        quitBtn.bezelStyle = .rounded
        quitBtn.font = NSFont.systemFont(ofSize: 11)
        quitBtn.frame = NSRect(x: 20, y: 15, width: 240, height: 28)
        view.addSubview(quitBtn)
    }

    public func updateQR() {
        _ = NetworkManager.shared.refreshIP()
        let ip = NetworkManager.shared.activeIP
        let port = NetworkManager.shared.port
        let urlStr = "http://\(ip):\(port)"
        urlLabel.stringValue = urlStr
        qrImageView.image = QRGenerator.generate(from: urlStr, size: 220)
    }

    public func connectionStatusChanged(isConnected: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.statusDot.layer?.backgroundColor = isConnected ? NSColor.systemGreen.cgColor : NSColor.systemOrange.cgColor
            self.statusLabel.stringValue = isConnected ? "Phone Connected" : "Ready to pair"
            self.statusLabel.textColor = isConnected ? NSColor.systemGreen : NSColor(white: 0.65, alpha: 1.0)
        }
    }

    @objc private func quitApp() {
        NSApplication.shared.terminate(nil)
    }
}
