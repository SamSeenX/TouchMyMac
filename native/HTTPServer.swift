// HTTPServer.swift - Static web asset delivery with Private Network Access compliance

import Foundation
import Network

public final class HTTPServer {
    public static let shared = HTTPServer()

    public func serve(conn: NWConnection, request: String, webRoot: String) {
        let lines = request.components(separatedBy: "\r\n")
        guard let first = lines.first else { conn.cancel(); return }
        let parts = first.components(separatedBy: " ")
        guard parts.count >= 2 else { conn.cancel(); return }

        let pna = "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Private-Network: true\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\n"

        if parts[0] == "OPTIONS" {
            let res = "HTTP/1.1 204 No Content\r\n\(pna)Connection: close\r\n\r\n"
            conn.send(content: res.data(using: .utf8)!, completion: .contentProcessed({ _ in conn.cancel() }))
            return
        }

        var path = parts[1].components(separatedBy: "?").first ?? "/"
        if path == "/" { path = "/index.html" }

        let fileURL = URL(fileURLWithPath: webRoot).appendingPathComponent(path)
        let mime = mimeType(for: path)

        if let fileData = try? Data(contentsOf: fileURL) {
            let header = "HTTP/1.1 200 OK\r\nContent-Type: \(mime)\r\nContent-Length: \(fileData.count)\r\nCache-Control: no-cache, no-store, must-revalidate\r\nPragma: no-cache\r\nExpires: 0\r\n\(pna)Connection: close\r\n\r\n"
            var response = header.data(using: .utf8)!
            response.append(fileData)
            conn.send(content: response, completion: .contentProcessed({ _ in conn.cancel() }))
        } else {
            let notFound = "HTTP/1.1 404 Not Found\r\n\(pna)Content-Length: 0\r\nConnection: close\r\n\r\n"
            conn.send(content: notFound.data(using: .utf8), completion: .contentProcessed({ _ in conn.cancel() }))
        }
    }

    private func mimeType(for path: String) -> String {
        if path.hasSuffix(".js") { return "application/javascript" }
        if path.hasSuffix(".css") { return "text/css" }
        if path.hasSuffix(".svg") { return "image/svg+xml" }
        if path.hasSuffix(".png") { return "image/png" }
        return "text/html"
    }
}
