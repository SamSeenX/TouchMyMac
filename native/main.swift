// main.swift - Native macOS status bar application entry point

import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusBarController: StatusBarController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Resolve web assets path
        let bundleWeb = Bundle.main.resourceURL?.appendingPathComponent("web").path ?? ""
        let localWeb = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("web").path
        let webPath = FileManager.default.fileExists(atPath: bundleWeb) ? bundleWeb : localWeb

        NetworkManager.shared.webRoot = webPath
        NetworkManager.shared.start()

        statusBarController = StatusBarController()
        statusBarController?.showOnLaunch()
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
