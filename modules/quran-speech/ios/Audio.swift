import AVFoundation
import Foundation

/// What the speech models expect: 16 kHz mono.
let SAMPLE_RATE = 16000

enum QuranSpeechError: LocalizedError {
  case message(String)

  var errorDescription: String? {
    switch self {
    case .message(let text): return text
    }
  }
}

/**
 * Records 16 kHz mono from the microphone (a port of Recorder in Audio.kt). AVAudioEngine taps the
 * input at the hardware rate; AVAudioConverter turns it into 16 kHz 16-bit mono, which is then read
 * as floats in -1..1 like the Android recorder's shorts, so both feed the models the same kind of data.
 */
final class Recorder {
  private let engine = AVAudioEngine()
  private let converter: AVAudioConverter
  private let inputFormat: AVAudioFormat
  private let outputFormat: AVAudioFormat
  private let maxSamples: Int
  private let lock = NSLock()
  private var samples: [Float] = []
  private var result: [Float]?

  init(maxSeconds: Int) throws {
    maxSamples = maxSeconds * SAMPLE_RATE
    samples.reserveCapacity(maxSamples)
    let session = AVAudioSession.sharedInstance()
    // The default mode keeps the device's gain control, like the MIC source on Android and autoGainControl on the web
    try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
    try session.setActive(true)

    let input = engine.inputNode
    inputFormat = input.outputFormat(forBus: 0)
    guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0,
          let output = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: Double(SAMPLE_RATE), channels: 1, interleaved: true),
          let converter = AVAudioConverter(from: inputFormat, to: output) else {
      throw QuranSpeechError.message("Microphone unavailable")
    }
    converter.downmix = true
    outputFormat = output
    self.converter = converter
    input.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, _ in
      self?.append(buffer)
    }
    engine.prepare()
    do {
      try engine.start()
    } catch {
      input.removeTap(onBus: 0)
      throw QuranSpeechError.message("Microphone unavailable")
    }
  }

  private func append(_ buffer: AVAudioPCMBuffer) {
    let capacity = AVAudioFrameCount(Double(buffer.frameLength) * Double(SAMPLE_RATE) / inputFormat.sampleRate) + 64
    guard let out = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: capacity) else { return }
    var consumed = false
    var error: NSError?
    _ = converter.convert(to: out, error: &error) { _, status in
      if consumed {
        status.pointee = .noDataNow
        return nil
      }
      consumed = true
      status.pointee = .haveData
      return buffer
    }
    guard error == nil, let data = out.int16ChannelData?[0] else { return }
    lock.lock()
    defer { lock.unlock() }
    if result != nil { return }
    let count = min(Int(out.frameLength), maxSamples - samples.count)
    for i in 0..<max(0, count) { samples.append(Float(data[i]) / 32768) }
  }

  /// Stops recording and returns the samples; later calls return the same samples.
  func stop() -> [Float] {
    lock.lock()
    if let result {
      lock.unlock()
      return result
    }
    let recorded = samples
    result = recorded
    lock.unlock()
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    return recorded
  }
}

struct DecodedAudio {
  let samples: [Float]
  let truncated: Bool
}

/**
 * Decodes the audio track of an audio or video file into 16 kHz mono samples, keeping at most its
 * first `maxSeconds` (a port of decodeAudioFile in Audio.kt): float PCM at the file's own rate,
 * averaged to mono, then the same resampling as on Android.
 */
func decodeAudioFile(_ url: URL, maxSeconds: Int) async throws -> DecodedAudio {
  let asset = AVURLAsset(url: url)
  guard let track = try await asset.loadTracks(withMediaType: .audio).first else {
    throw QuranSpeechError.message("No audio track")
  }
  let reader = try AVAssetReader(asset: asset)
  let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
    AVFormatIDKey: kAudioFormatLinearPCM,
    AVLinearPCMBitDepthKey: 32,
    AVLinearPCMIsFloatKey: true,
    AVLinearPCMIsBigEndianKey: false,
    AVLinearPCMIsNonInterleaved: false,
  ])
  output.alwaysCopiesSampleData = false
  reader.add(output)
  guard reader.startReading() else { throw reader.error ?? QuranSpeechError.message("Can't read the file") }

  var sampleRate = 0
  var channels = 0
  var mono: [Float] = []
  mono.reserveCapacity(SAMPLE_RATE * 10)
  var truncated = false
  var pcm: [Float] = []
  while let sampleBuffer = output.copyNextSampleBuffer() {
    if sampleRate == 0,
       let description = CMSampleBufferGetFormatDescription(sampleBuffer),
       let asbd = CMAudioFormatDescriptionGetStreamBasicDescription(description)?.pointee {
      sampleRate = Int(asbd.mSampleRate)
      channels = max(1, Int(asbd.mChannelsPerFrame))
    }
    guard let block = CMSampleBufferGetDataBuffer(sampleBuffer) else { continue }
    let length = CMBlockBufferGetDataLength(block)
    let count = length / MemoryLayout<Float>.size
    if pcm.count < count { pcm = [Float](repeating: 0, count: count) }
    let status = pcm.withUnsafeMutableBytes { CMBlockBufferCopyDataBytes(block, atOffset: 0, dataLength: count * MemoryLayout<Float>.size, destination: $0.baseAddress!) }
    if status != kCMBlockBufferNoErr { continue }
    // Downmix to mono
    var i = 0
    while i + channels <= count {
      var sum: Float = 0
      for c in 0..<channels { sum += pcm[i + c] }
      mono.append(sum / Float(channels))
      i += channels
    }
    if sampleRate > 0 && mono.count > maxSeconds * sampleRate {
      truncated = true
      reader.cancelReading()
      break
    }
  }
  if reader.status == .failed { throw reader.error ?? QuranSpeechError.message("Can't decode the file") }
  if sampleRate == 0 { throw QuranSpeechError.message("No audio track") }

  var samples = resample(mono, fromRate: sampleRate)
  if truncated {
    // Like Kotlin's copyOf: cut to the limit, padding with zeros if short
    let limit = maxSeconds * SAMPLE_RATE
    samples = samples.count >= limit ? Array(samples[0..<limit]) : samples + [Float](repeating: 0, count: limit - samples.count)
  }
  return DecodedAudio(samples: samples, truncated: truncated)
}

/**
 * Converts samples at `fromRate` to 16 kHz: each output sample averages the input samples it
 * covers (a simple low-pass against aliasing when downsampling) or interpolates between two.
 */
func resample(_ input: [Float], fromRate: Int) -> [Float] {
  if fromRate == SAMPLE_RATE || input.isEmpty { return input }
  let ratio = Double(fromRate) / Double(SAMPLE_RATE)
  let count = Int(Double(input.count) / ratio)
  var output = [Float](repeating: 0, count: count)
  for i in 0..<count {
    let start = Double(i) * ratio
    if ratio > 1 {
      let from = Int(start)
      let to = min(input.count, max(Int(start + ratio), from + 1))
      var sum: Float = 0
      for k in from..<to { sum += input[k] }
      output[i] = sum / Float(to - from)
    } else {
      let k = Int(start)
      let frac = Float(start - Double(k))
      output[i] = input[k] * (1 - frac) + input[min(k + 1, input.count - 1)] * frac
    }
  }
  return output
}

/// Plays 16 kHz mono samples; returns when playback ends.
func playSamples(_ samples: [Float]) async throws {
  if samples.isEmpty { return }
  let session = AVAudioSession.sharedInstance()
  try session.setCategory(.playback, mode: .spokenAudio)
  try session.setActive(true)
  let player = try AVAudioPlayer(data: wavData(samples))
  let delegate = PlaybackDelegate()
  player.delegate = delegate
  await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
    delegate.onFinish = { continuation.resume() }
    if !player.play() { delegate.finish() }
  }
  // AVAudioPlayer holds its delegate weakly: keep both alive until playback ends
  withExtendedLifetime(player) {}
  withExtendedLifetime(delegate) {}
}

private final class PlaybackDelegate: NSObject, AVAudioPlayerDelegate {
  var onFinish: (() -> Void)?

  func finish() {
    let callback = onFinish
    onFinish = nil
    callback?()
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) { finish() }

  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) { finish() }
}

/// 16-bit PCM WAV of 16 kHz mono samples, for AVAudioPlayer.
private func wavData(_ samples: [Float]) -> Data {
  var data = Data()
  func append<T: FixedWidthInteger>(_ value: T) { withUnsafeBytes(of: value.littleEndian) { data.append(contentsOf: $0) } }
  let bytes = samples.count * 2
  data.append(contentsOf: Array("RIFF".utf8))
  append(UInt32(36 + bytes))
  data.append(contentsOf: Array("WAVEfmt ".utf8))
  append(UInt32(16))
  append(UInt16(1)) // PCM
  append(UInt16(1)) // mono
  append(UInt32(SAMPLE_RATE))
  append(UInt32(SAMPLE_RATE * 2))
  append(UInt16(2))
  append(UInt16(16))
  data.append(contentsOf: Array("data".utf8))
  append(UInt32(bytes))
  data.reserveCapacity(44 + bytes)
  for sample in samples { append(Int16(max(-1, min(1, sample)) * 32767)) }
  return data
}
