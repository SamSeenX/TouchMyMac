// PopoverView.swift - Native macOS dropdown popover view controller in teal & beige

import AppKit
import ApplicationServices

public final class PopoverViewController: NSViewController, NetworkManagerDelegate {
    private let statusLabel = NSTextField(labelWithString: "Ready to pair")
    private let statusDot = NSView(frame: NSRect(x: 0, y: 0, width: 8, height: 8))
    private let permDot = NSView(frame: NSRect(x: 0, y: 0, width: 8, height: 8))
    private let permLabel = NSTextField(labelWithString: "Checking permission...")
    private let permBtn = NSButton(title: "Enable Mouse Control", target: nil, action: nil)
    private let qrImageView = NSImageView()
    private let urlLabel = NSTextField(labelWithString: "")
    private var checkTimer: Timer?

    private let tealColor = NSColor(red: 0.06, green: 0.46, blue: 0.43, alpha: 1.0)
    private let darkSlate = NSColor(red: 0.10, green: 0.14, blue: 0.13, alpha: 1.0)
    private let mutedSlate = NSColor(red: 0.35, green: 0.42, blue: 0.40, alpha: 1.0)
    private let sandBeige = NSColor(red: 0.96, green: 0.94, blue: 0.92, alpha: 1.0)
    private let sandBorder = NSColor(red: 0.86, green: 0.81, blue: 0.75, alpha: 1.0)

    public override func loadView() {
        self.view = NSView(frame: NSRect(x: 0, y: 0, width: 280, height: 420))
        self.view.wantsLayer = true
        self.view.layer?.backgroundColor = sandBeige.cgColor

        setupUI()
        NetworkManager.shared.delegate = self
        updateQR()
        startPermissionMonitor()
    }

    private func setupUI() {
        let titleLabel = NSTextField(labelWithString: "TouchMyMac")
        titleLabel.font = NSFont.systemFont(ofSize: 15, weight: .bold)
        titleLabel.textColor = darkSlate
        titleLabel.frame = NSRect(x: 20, y: 385, width: 240, height: 22)
        view.addSubview(titleLabel)

        permDot.wantsLayer = true
        permDot.layer?.cornerRadius = 4
        permDot.layer?.backgroundColor = NSColor.systemOrange.cgColor
        permDot.frame = NSRect(x: 20, y: 365, width: 8, height: 8)
        view.addSubview(permDot)

        permLabel.font = NSFont.systemFont(ofSize: 11, weight: .medium)
        permLabel.textColor = mutedSlate
        permLabel.frame = NSRect(x: 34, y: 360, width: 220, height: 18)
        view.addSubview(permLabel)

        permBtn.target = self
        permBtn.action = #selector(requestAccessibility)
        permBtn.bezelStyle = .rounded
        permBtn.font = NSFont.systemFont(ofSize: 11, weight: .semibold)
        permBtn.frame = NSRect(x: 20, y: 325, width: 240, height: 28)
        view.addSubview(permBtn)

        statusDot.wantsLayer = true
        statusDot.layer?.cornerRadius = 4
        statusDot.layer?.backgroundColor = NSColor.systemOrange.cgColor
        statusDot.frame = NSRect(x: 20, y: 300, width: 8, height: 8)
        view.addSubview(statusDot)

        statusLabel.font = NSFont.systemFont(ofSize: 11, weight: .medium)
        statusLabel.textColor = mutedSlate
        statusLabel.frame = NSRect(x: 34, y: 295, width: 220, height: 18)
        view.addSubview(statusLabel)

        qrImageView.frame = NSRect(x: 40, y: 85, width: 200, height: 200)
        qrImageView.imageScaling = .scaleProportionallyUpOrDown
        qrImageView.wantsLayer = true
        qrImageView.layer?.cornerRadius = 10
        qrImageView.layer?.masksToBounds = true
        qrImageView.layer?.borderColor = sandBorder.cgColor
        qrImageView.layer?.borderWidth = 1.5
        view.addSubview(qrImageView)

        urlLabel.font = NSFont.monospacedSystemFont(ofSize: 11, weight: .semibold)
        urlLabel.textColor = tealColor
        urlLabel.alignment = .center
        urlLabel.frame = NSRect(x: 10, y: 55, width: 260, height: 20)
        view.addSubview(urlLabel)

        let quitBtn = NSButton(title: "Quit TouchMyMac", target: self, action: #selector(quitApp))
        quitBtn.bezelStyle = .rounded
        quitBtn.font = NSFont.systemFont(ofSize: 11)
        quitBtn.frame = NSRect(x: 20, y: 15, width: 240, height: 28)
        view.addSubview(quitBtn)
    }

    private func startPermissionMonitor() {
        updatePermissionState()
        checkTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.updatePermissionState()
        }
    }

    private func updatePermissionState() {
        let isTrusted = AXIsProcessTrusted()
        permDot.layer?.backgroundColor = isTrusted ? tealColor.cgColor : NSColor.systemOrange.cgColor
        permLabel.stringValue = isTrusted ? "Mouse Control: Active" : "Mouse Control: Permission Needed"
        permLabel.textColor = isTrusted ? tealColor : NSColor.systemOrange
        permBtn.isHidden = isTrusted
    }

    @objc private func requestAccessibility() {
        let promptKey = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        let options = [promptKey: true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
            NSWorkspace.shared.open(url)
        }
    }

    public func updateQR() {
        _ = NetworkManager.shared.refreshIP()
        let ip = NetworkManager.shared.activeIP
        let port = NetworkManager.shared.port
        let urlStr = "http://\(ip):\(port)"
        urlLabel.stringValue = urlStr
        qrImageView.image = QRGenerator.generate(from: urlStr, size: 200)
        updatePermissionState()
    }

    public func connectionStatusChanged(isConnected: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.statusDot.layer?.backgroundColor = isConnected ? self.tealColor.cgColor : NSColor.systemOrange.cgColor
            self.statusLabel.stringValue = isConnected ? "Phone Connected" : "Ready to pair"
            self.statusLabel.textColor = isConnected ? self.tealColor : self.mutedSlate
        }
    }

    @objc private func quitApp() {
        NSApplication.shared.terminate(nil)
    }
}
