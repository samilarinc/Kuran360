import Foundation
import onnxruntime_objc

/**
 * The FastConformer Quran model (voidwaveDev/fastconformer-quran, CC-BY-4.0) on ONNX Runtime.
 * A Swift port of FastConformer.kt (itself a port of public/workers/fastconformer-core.js): keep
 * the three in step, so a recording gets the same transcript on every platform.
 *
 * Features match NeMo's AudioToMelSpectrogramPreprocessor: 0.97 pre-emphasis, 25 ms Hann
 * window / 10 ms hop, n_fft 512, 80 slaney mel filters, log(x + 2^-24), then per-feature
 * normalisation (required: without it the model emits nothing).
 */
final class FastConformer {
  private static let sampleRate = 16000
  private static let nFft = 512
  private static let win = 400
  private static let hop = 160
  private static let nMels = 80
  private static let preemph: Float = 0.97
  private static let logGuard = pow(2.0, -24.0)
  private static let blank: Int32 = 1024
  private static let predHidden = 640
  private static let maxSymbolsPerFrame = 5

  private let encoder: ORTSession
  private let decoder: ORTSession
  private let tokens: [String?]

  init(dir: URL) throws {
    let env = try OrtEnvironment.shared()
    let options = try ORTSessionOptions()
    encoder = try ORTSession(env: env, modelPath: dir.appendingPathComponent("encoder.int8.onnx").path, sessionOptions: options)
    decoder = try ORTSession(env: env, modelPath: dir.appendingPathComponent("decoder.int8.onnx").path, sessionOptions: options)
    tokens = FastConformer.parseTokens(try String(contentsOf: dir.appendingPathComponent("tokens.txt"), encoding: .utf8))
  }

  /// Runs the encoder, then greedy transducer decoding with the fused decoder+joint network.
  func transcribe(_ audio: [Float]) throws -> String {
    let (features, frames) = FastConformer.computeFeatures(audio)
    var ids: [Int32] = []

    let signal = try ortTensor(features, shape: [1, FastConformer.nMels, frames])
    let length = try ortTensor([Int64(frames)], shape: [1])
    let encoded = try encoder.run(withInputs: ["audio_signal": signal, "length": length],
                                  outputNames: ["outputs", "encoded_lengths"], runOptions: nil)
    guard let out = encoded["outputs"], let lengths = encoded["encoded_lengths"] else {
      throw QuranSpeechError.message("Encoder output missing")
    }
    let shape = try out.tensorTypeAndShapeInfo().shape.map(\.intValue)
    let dim = shape[1]
    let total = shape[2]
    let steps = Int((try ortArray(lengths, Int64.self)).first ?? 0)
    let data: [Float] = try ortArray(out, Float.self)

    var state1 = [Float](repeating: 0, count: FastConformer.predHidden)
    var state2 = [Float](repeating: 0, count: FastConformer.predHidden)
    var previous = FastConformer.blank
    let stateShape = [1, 1, FastConformer.predHidden]
    let targetLength = try ortTensor([Int32(1)], shape: [1])
    var frame = [Float](repeating: 0, count: dim)

    for t in 0..<min(steps, total) {
      for c in 0..<dim { frame[c] = data[c * total + t] }
      let frameTensor = try ortTensor(frame, shape: [1, dim, 1])
      for _ in 0..<FastConformer.maxSymbolsPerFrame {
        let result = try decoder.run(
          withInputs: [
            "encoder_outputs": frameTensor,
            "targets": try ortTensor([previous], shape: [1, 1]),
            "target_length": targetLength,
            "input_states_1": try ortTensor(state1, shape: stateShape),
            "input_states_2": try ortTensor(state2, shape: stateShape),
          ],
          outputNames: ["outputs", "output_states_1", "output_states_2"],
          runOptions: nil)
        guard let logitsValue = result["outputs"] else { throw QuranSpeechError.message("Decoder output missing") }
        let logits: [Float] = try ortArray(logitsValue, Float.self)
        var best = 0
        for k in 1..<logits.count where logits[k] > logits[best] { best = k }
        if Int32(best) == FastConformer.blank { break }
        // The returned states are the predictor's state after consuming `previous`
        ids.append(Int32(best))
        previous = Int32(best)
        guard let s1 = result["output_states_1"], let s2 = result["output_states_2"] else {
          throw QuranSpeechError.message("Decoder states missing")
        }
        state1 = try ortArray(s1, Float.self)
        state2 = try ortArray(s2, Float.self)
      }
    }

    let text = ids
      .compactMap { Int($0) < tokens.count ? tokens[Int($0)] : nil }
      .filter { !$0.isEmpty && $0 != "<unk>" }
      .joined()
      .replacingOccurrences(of: "\u{2581}", with: " ")
    return text.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  // MARK: - Features

  private static func hzToMel(_ hz: Double) -> Double { hz < 1000 ? 3 * hz / 200 : 15 + log(hz / 1000) / (log(6.4) / 27) }
  private static func melToHz(_ mel: Double) -> Double { mel < 15 ? 200 * mel / 3 : 1000 * exp((log(6.4) / 27) * (mel - 15)) }

  // librosa.filters.mel(sr=16000, n_fft=512, n_mels=80, fmin=0, fmax=8000, norm='slaney')
  private static let melFilters: [[Float]] = {
    let bins = nFft / 2 + 1
    let maxMel = hzToMel(Double(sampleRate) / 2)
    let melF = (0..<(nMels + 2)).map { melToHz(maxMel * Double($0) / Double(nMels + 1)) }
    return (0..<nMels).map { m in
      let enorm = 2 / (melF[m + 2] - melF[m])
      return (0..<bins).map { k in
        let f = Double(k) * Double(sampleRate) / Double(nFft)
        let lower = (f - melF[m]) / (melF[m + 1] - melF[m])
        let upper = (melF[m + 2] - f) / (melF[m + 2] - melF[m + 1])
        return Float(max(0.0, min(lower, upper)) * enorm)
      }
    }
  }()

  // Symmetric Hann window (torch.hann_window(400, periodic=False)), centred in the 512-point frame
  private static let hannWindow: [Float] = {
    var window = [Float](repeating: 0, count: nFft)
    let offset = (nFft - win) / 2
    for i in 0..<win { window[offset + i] = Float(0.5 - 0.5 * cos(2 * Double.pi * Double(i) / Double(win - 1))) }
    return window
  }()

  /// Parses tokens.txt ("<token> <id>" per line) into an id-indexed array.
  private static func parseTokens(_ text: String) -> [String?] {
    var entries: [(Int, String)] = []
    for raw in text.split(separator: "\n", omittingEmptySubsequences: false) {
      let line = raw.hasSuffix("\r") ? String(raw.dropLast()) : String(raw)
      guard let space = line.lastIndex(of: " "), space > line.startIndex,
            let id = Int(line[line.index(after: space)...]) else { continue }
      entries.append((id, String(line[..<space])))
    }
    var tokens = [String?](repeating: nil, count: (entries.map(\.0).max() ?? -1) + 1)
    for (id, token) in entries where id >= 0 { tokens[id] = token }
    return tokens
  }

  /// In-place iterative radix-2 FFT.
  private static func fft(_ re: inout [Double], _ im: inout [Double]) {
    let n = re.count
    var j = 0
    for i in 1..<n {
      var bit = n >> 1
      while j & bit != 0 {
        j ^= bit
        bit >>= 1
      }
      j ^= bit
      if i < j {
        re.swapAt(i, j)
        im.swapAt(i, j)
      }
    }
    var len = 2
    while len <= n {
      let angle = -2 * Double.pi / Double(len)
      for i in stride(from: 0, to: n, by: len) {
        for k in 0..<(len / 2) {
          let wr = cos(angle * Double(k))
          let wi = sin(angle * Double(k))
          let a = i + k
          let b = a + len / 2
          let tr = re[b] * wr - im[b] * wi
          let ti = re[b] * wi + im[b] * wr
          re[b] = re[a] - tr
          im[b] = im[a] - ti
          re[a] += tr
          im[a] += ti
        }
      }
      len <<= 1
    }
  }

  /// 16 kHz mono samples → normalised log-mel features, laid out [80, frames] row-major.
  private static func computeFeatures(_ audio: [Float]) -> ([Float], Int) {
    // center=True with zero padding of n_fft/2 on both sides
    let pad = nFft / 2
    var padded = [Float](repeating: 0, count: audio.count + 2 * pad)
    if !audio.isEmpty { padded[pad] = audio[0] }
    if audio.count > 1 {
      for i in 1..<audio.count { padded[pad + i] = audio[i] - preemph * audio[i - 1] }
    }
    let frames = 1 + audio.count / hop
    let bins = nFft / 2 + 1

    var features = [Float](repeating: 0, count: nMels * frames)
    var re = [Double](repeating: 0, count: nFft)
    var im = [Double](repeating: 0, count: nFft)
    var power = [Double](repeating: 0, count: bins)
    for t in 0..<frames {
      let start = t * hop
      for i in 0..<nFft {
        let index = start + i
        re[i] = Double(index < padded.count ? padded[index] : 0) * Double(hannWindow[i])
        im[i] = 0
      }
      fft(&re, &im)
      for k in 0..<bins { power[k] = re[k] * re[k] + im[k] * im[k] }
      for m in 0..<nMels {
        let filter = melFilters[m]
        var sum = 0.0
        for k in 0..<bins { sum += Double(filter[k]) * power[k] }
        features[m * frames + t] = Float(log(sum + logGuard))
      }
    }

    // Per-feature normalisation: zero mean, unit (unbiased) std per mel bin
    for m in 0..<nMels {
      let offset = m * frames
      var mean = 0.0
      for i in 0..<frames { mean += Double(features[offset + i]) }
      mean /= Double(frames)
      var variance = 0.0
      for i in 0..<frames { variance += pow(Double(features[offset + i]) - mean, 2) }
      let std = (variance / Double(max(1, frames - 1))).squareRoot() + 1e-5
      for i in 0..<frames { features[offset + i] = Float((Double(features[offset + i]) - mean) / std) }
    }
    return (features, frames)
  }
}

// MARK: - ONNX Runtime helpers (shared with E5Embedder)

/// One ORTEnv for the app, like OrtEnvironment.getEnvironment() on Android.
enum OrtEnvironment {
  private static var env: ORTEnv?
  private static let lock = NSLock()

  static func shared() throws -> ORTEnv {
    lock.lock()
    defer { lock.unlock() }
    if let env { return env }
    let created = try ORTEnv(loggingLevel: ORTLoggingLevel.warning)
    env = created
    return created
  }
}

private func elementType<T>(_: T.Type) -> ORTTensorElementDataType {
  if T.self == Float.self { return .float }
  if T.self == Int32.self { return .int32 }
  return .int64
}

/// A tensor holding a copy of `values` (Float, Int32 or Int64).
func ortTensor<T>(_ values: [T], shape: [Int]) throws -> ORTValue {
  let data = values.withUnsafeBytes { NSMutableData(bytes: $0.baseAddress!, length: $0.count) }
  return try ORTValue(tensorData: data, elementType: elementType(T.self), shape: shape.map { NSNumber(value: $0) })
}

/// A tensor's contents as an array.
func ortArray<T>(_ value: ORTValue, _: T.Type) throws -> [T] {
  let data = try value.tensorData() as Data
  return data.withUnsafeBytes { Array($0.bindMemory(to: T.self)) }
}
