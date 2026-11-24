// QRGenerator.swift - Native CoreImage QR code generation

import AppKit
import CoreImage

public final class QRGenerator {
    public static func generate(from string: String, size: CGFloat = 220) -> NSImage? {
        guard let data = string.data(using: .utf8),
              let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }

        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")

        guard let outputCI = filter.outputImage else { return nil }

        let scale = size / outputCI.extent.width
        let transformed = outputCI.transformed(by: CGAffineTransform(scaleX: scale, y: scale))

        let rep = NSCIImageRep(ciImage: transformed)
        let nsImage = NSImage(size: NSSize(width: size, height: size))
        nsImage.addRepresentation(rep)
        return nsImage
    }
}
