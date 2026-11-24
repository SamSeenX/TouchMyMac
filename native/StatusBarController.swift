// StatusBarController.swift - Menu bar status item and popover coordinator

import AppKit

public final class StatusBarController {
    private var statusItem: NSStatusItem!
    private var popover: NSPopover!
    private let popoverVC = PopoverViewController()

    public init() {
        setupStatusItem()
        setupPopover()
    }

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem.button {
            if let img = NSImage(systemSymbolName: "computermouse.fill", accessibilityDescription: "TouchMyMac") {
                img.isTemplate = true
                button.image = img
            } else {
                button.title = "🖱️"
            }
            button.action = #selector(togglePopover)
            button.target = self
        }
    }

    private func setupPopover() {
        popover = NSPopover()
        popover.contentSize = NSSize(width: 280, height: 380)
        popover.behavior = .transient
        popover.animates = true
        popover.contentViewController = popoverVC
    }

    @objc public func togglePopover() {
        guard let button = statusItem.button else { return }
        if popover.isShown {
            popover.performClose(nil)
        } else {
            popoverVC.updateQR()
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            popover.contentViewController?.view.window?.makeKey()
        }
    }

    public func showOnLaunch() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            guard let self = self, let button = self.statusItem.button else { return }
            self.popoverVC.updateQR()
            self.popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        }
    }
}
