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
                try s.addStreamOutput(self, type: .audio, sampleHandlerQueue: DispatchQueue(label: "touchmymac.audio", qos: .userInteractive))
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
        guard let formatDesc = CMSampleBufferGetFormatDescription(sampleBuffer),
              let asbd = CMAudioFormatDescriptionGetStreamBasicDescription(formatDesc)?.pointee else { return }
        let numSamples = CMSampleBufferGetNumSamples(sampleBuffer)
        guard numSamples > 0, let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else { return }

        var length = 0
        var dataPointer: UnsafeMutablePointer<Int8>?
        guard CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &length, dataPointerOut: &dataPointer) == noErr,
              let ptr = dataPointer, length >= numSamples * 4 else { return }

        let isNonInterleaved = (asbd.mFormatFlags & kAudioFormatFlagIsNonInterleaved) != 0
        var pcmData = Data(count: numSamples * 2 * 2)

        pcmData.withUnsafeMutableBytes { outBuf in
            let out = outBuf.bindMemory(to: Int16.self).baseAddress!
            let inFloats = ptr.withMemoryRebound(to: Float32.self, capacity: length / 4) { $0 }
            if isNonInterleaved && length >= numSamples * 8 {
                let left = inFloats
                let right = inFloats + numSamples
                for i in 0..<numSamples {
                    out[i * 2] = Int16(max(-1.0, min(1.0, left[i])) * 32767.0)
                    out[i * 2 + 1] = Int16(max(-1.0, min(1.0, right[i])) * 32767.0)
                }
            } else {
                for i in 0..<(numSamples * 2) {
                    out[i] = Int16(max(-1.0, min(1.0, inFloats[i])) * 32767.0)
                }
            }
        }
        onAudioChunk?(pcmData)
    }

    private func setMacMuted(_ muted: Bool) {
        let script = "set volume output muted \(muted)"
        let task = Process()
        task.launchPath = "/usr/bin/osascript"
        task.arguments = ["-e", script]
        try? task.run()
    }
}
