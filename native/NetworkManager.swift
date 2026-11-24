// NetworkManager.swift - Single-port HTTP and WebSocket server on port 8080

import Foundation
import Network
import CommonCrypto

public protocol NetworkManagerDelegate: AnyObject {
    func connectionStatusChanged(isConnected: Bool)
}

public final class NetworkManager {
    public static let shared = NetworkManager()
    public weak var delegate: NetworkManagerDelegate?
    public private(set) var activeIP: String = "127.0.0.1"
    public private(set) var port: UInt16 = 8080

    private var listener: NWListener?
    private var connections = [NWConnection]()
    public var webRoot: String = ""

    public func start() {
        self.activeIP = detectLocalIP()
        bindListener(startingPort: 8080)
    }

    @discardableResult
    public func refreshIP() -> String {
        self.activeIP = detectLocalIP()
        return self.activeIP
    }

    private func detectLocalIP() -> String {
        var address = "127.0.0.1"
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifaddr) == 0, let firstAddr = ifaddr else { return address }
        defer { freeifaddrs(ifaddr) }

        for ptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
            let flags = Int32(ptr.pointee.ifa_flags)
            let addr = ptr.pointee.ifa_addr.pointee
            if (flags & (IFF_UP | IFF_RUNNING | IFF_LOOPBACK)) == (IFF_UP | IFF_RUNNING) {
                if addr.sa_family == UInt8(AF_INET) {
                    var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    if getnameinfo(ptr.pointee.ifa_addr, socklen_t(addr.sa_len), &hostname, socklen_t(hostname.count), nil, 0, NI_NUMERICHOST) == 0 {
                        let ip = String(cString: hostname)
                        let name = String(cString: ptr.pointee.ifa_name)
                        if name == "en0" || name == "en1" { return ip }
                        address = ip
                    }
                }
            }
        }
        return address
    }

    private func bindListener(startingPort: UInt16) {
        var p = startingPort
        while p < startingPort + 10 {
            if let nwPort = NWEndpoint.Port(rawValue: p),
               let l = try? NWListener(using: .tcp, on: nwPort) {
                self.port = p
                self.listener = l
                l.newConnectionHandler = { [weak self] conn in self?.handleNewConnection(conn) }
                l.start(queue: .main)
                return
            }
            p += 1
        }
    }

    private func handleNewConnection(_ conn: NWConnection) {
        conn.start(queue: .main)
        readRequest(conn)
    }

    private func readRequest(_ conn: NWConnection) {
        conn.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, isComplete, _ in
            guard let self = self, let data = data, !data.isEmpty else {
                if isComplete { conn.cancel() }
                return
            }
            guard let reqStr = String(data: data, encoding: .utf8) else {
                conn.cancel()
                return
            }

            if reqStr.contains("Upgrade: websocket") || reqStr.contains("upgrade: websocket") {
                self.upgradeWebSocket(conn: conn, request: reqStr)
            } else {
                self.serveHTTP(conn: conn, request: reqStr)
            }
        }
    }

    private func serveHTTP(conn: NWConnection, request: String) {
        let lines = request.components(separatedBy: "\r\n")
        guard let first = lines.first else { conn.cancel(); return }
        let parts = first.components(separatedBy: " ")
        guard parts.count >= 2 else { conn.cancel(); return }

        var path = parts[1].components(separatedBy: "?").first ?? "/"
        if path == "/" { path = "/index.html" }

        let fileURL = URL(fileURLWithPath: self.webRoot).appendingPathComponent(path)
        let mime = path.hasSuffix(".js") ? "application/javascript" : (path.hasSuffix(".css") ? "text/css" : "text/html")

        if let fileData = try? Data(contentsOf: fileURL) {
            let header = "HTTP/1.1 200 OK\r\nContent-Type: \(mime)\r\nContent-Length: \(fileData.count)\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n"
            var response = header.data(using: .utf8)!
            response.append(fileData)
            conn.send(content: response, completion: .contentProcessed({ _ in conn.cancel() }))
        } else {
            let notFound = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n"
            conn.send(content: notFound.data(using: .utf8), completion: .contentProcessed({ _ in conn.cancel() }))
        }
    }

    private func upgradeWebSocket(conn: NWConnection, request: String) {
        var key = ""
        for line in request.components(separatedBy: "\r\n") {
            if line.lowercased().starts(with: "sec-websocket-key:") {
                key = line.components(separatedBy: ":")[1].trimmingCharacters(in: .whitespaces)
                break
            }
        }
        let accept = wsAcceptKey(for: key)
        let handshake = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: \(accept)\r\n\r\n"
        conn.send(content: handshake.data(using: .utf8), completion: .contentProcessed({ [weak self] _ in
            guard let self = self else { return }
            self.connections.append(conn)
            self.delegate?.connectionStatusChanged(isConnected: true)
            self.listenWebSocketFrames(conn: conn)
        }))
    }

    private func listenWebSocketFrames(conn: NWConnection) {
        conn.receive(minimumIncompleteLength: 2, maximumLength: 65536) { [weak self] data, _, isComplete, _ in
            guard let self = self else { return }
            if isComplete {
                self.connections.removeAll(where: { $0 === conn })
                self.delegate?.connectionStatusChanged(isConnected: !self.connections.isEmpty)
                return
            }
            if let data = data, data.count >= 6 {
                let maskOffset = (data[1] & 0x7F) == 126 ? 4 : 2
                let maskKey = [data[maskOffset], data[maskOffset+1], data[maskOffset+2], data[maskOffset+3]]
                let payloadOffset = maskOffset + 4
                var unmasked = [UInt8]()
                for i in payloadOffset..<data.count {
                    unmasked.append(data[i] ^ maskKey[(i - payloadOffset) % 4])
                }
                if let dict = try? JSONSerialization.jsonObject(with: Data(unmasked)) as? [String: Any] {
                    self.dispatchAction(dict)
                }
            }
            self.listenWebSocketFrames(conn: conn)
        }
    }

    private func dispatchAction(_ data: [String: Any]) {
        guard let action = data["action"] as? String else { return }
        switch action {
        case "move":
            InputBridge.move(dx: data["dx"] as? Double ?? 0, dy: data["dy"] as? Double ?? 0, isDragging: data["drag"] as? Bool ?? false)
        case "tap": InputBridge.leftClick()
        case "right_tap": InputBridge.rightClick()
        case "scroll": InputBridge.scroll(dx: data["dx"] as? Double ?? 0, dy: data["dy"] as? Double ?? 0)
        case "desktop": InputBridge.switchDesktop(direction: data["dir"] as? String ?? "right")
        case "type": InputBridge.typeText(data["text"] as? String ?? "")
        case "key": InputBridge.pressKey(data["key"] as? String ?? "")
        case "media": InputBridge.mediaAction(data["cmd"] as? String ?? "")
        case "yt": InputBridge.youtubeAction(data["cmd"] as? String ?? "")
        default: break
        }
    }

    private func wsAcceptKey(for key: String) -> String {
        let magic = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA1_DIGEST_LENGTH))
        let data = magic.data(using: .utf8)!
        data.withUnsafeBytes { _ = CC_SHA1($0.baseAddress, CC_LONG(data.count), &hash) }
        return Data(hash).base64EncodedString()
    }
}
