// AudioStreamManager.swift - Real-time system audio capture via ScreenCaptureKit

import Foundation
import ScreenCaptureKit
import CoreMedia

@available(macOS 13.0, *)
public final class AudioStreamManager: NSObject, SCStreamOutput, SCStreamDelegate {
    public static let shared = AudioStreamManager()
    private var stream: SCStream?
    public private(set) var isStreaming = false
    public var onAudioChunk: ((Data) -> Void)?

    public func start(solo: Bool = false) {
        guard !isStreaming else { return }
        if solo { setMacMuted(true) }

        SCShareableContent.getExcludingDesktopWindows(true, onScreenWindowsOnly: false) { [weak self] content, error in
            guard let self = self, let content = content, let display = content.displays.first else { return }
            let filter = SCContentFilter(display: display, excludingWindows: [])
            let config = SCStreamConfiguration()
            config.capturesAudio = true
            config.sampleRate = 48000
            config.channelCount = 2
            config.excludesCurrentProcessAudio = true
            config.width = 2
            config.height = 2
            config.minimumFrameInterval = CMTime(value: 1, timescale: 1)

            do {
                let s = SCStream(filter: filter, configuration: config, delegate: self)
                try s.addStreamOutput(self, type: .audio, sampleHandlerQueue: DispatchQueue(label: "touchmymac.audio"))
                s.startCapture { [weak self] err in
                    if err == nil {
                        self?.stream = s
                        self?.isStreaming = true
                    }
                }
            } catch {}
        }
    }

    public func stop(unmute: Bool = true) {
        if unmute { setMacMuted(false) }
        stream?.stopCapture { [weak self] _ in
            self?.stream = nil
            self?.isStreaming = false
        }
    }

    public func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .audio, isStreaming else { return }
        guard let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else { return }
        var length = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        if CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &length, dataPointerOut: &dataPointer) == noErr,
           let ptr = dataPointer, length > 0 {
            let data = Data(bytes: ptr, count: length)
            onAudioChunk?(data)
        }
    }

    private func setMacMuted(_ muted: Bool) {
        let script = "set volume output muted \(muted)"
        let task = Process()
        task.launchPath = "/usr/bin/osascript"
        task.arguments = ["-e", script]
        try? task.run()
    }
}
