import Foundation
import onnxruntime_objc

/**
 * The topic search's embedding model (Xenova/multilingual-e5-small, MIT, ONNX q8) on ONNX Runtime.
 * A Swift port of E5Embedder.kt, which matches the web app's Transformers.js tokenizer step for step,
 * so a query gets the same vector on every platform, comparable to the precomputed verse vectors.
 */
final class E5Embedder {
  private let session: ORTSession
  private let tokenizer: UnigramTokenizer

  init(dir: URL) throws {
    let json = try String(contentsOf: dir.appendingPathComponent("tokenizer.json"), encoding: .utf8)
    tokenizer = try UnigramTokenizer(json: json)
    session = try ORTSession(env: try OrtEnvironment.shared(),
                             modelPath: dir.appendingPathComponent("onnx/model_quantized.onnx").path,
                             sessionOptions: try ORTSessionOptions())
  }

  /// Mean-pooled, L2-normalised vector of `text`.
  func embed(_ text: String) throws -> [Float] {
    let ids = tokenizer.encode(text)
    let shape = [1, ids.count]
    let result = try session.run(
      withInputs: [
        "input_ids": try ortTensor(ids, shape: shape),
        "attention_mask": try ortTensor([Int64](repeating: 1, count: ids.count), shape: shape),
        "token_type_ids": try ortTensor([Int64](repeating: 0, count: ids.count), shape: shape),
      ],
      outputNames: ["last_hidden_state"],
      runOptions: nil)
    guard let hidden = result["last_hidden_state"] else { throw QuranSpeechError.message("Embedding output missing") }
    let dim = try hidden.tensorTypeAndShapeInfo().shape[2].intValue
    let data: [Float] = try ortArray(hidden, Float.self)
    var vector = [Float](repeating: 0, count: dim)
    for t in 0..<ids.count {
      for c in 0..<dim { vector[c] += data[t * dim + c] }
    }
    var norm = 0.0
    for c in 0..<dim {
      vector[c] /= Float(ids.count)
      norm += Double(vector[c] * vector[c])
    }
    let scale = 1 / max(norm.squareRoot(), 1e-12)
    for c in 0..<dim { vector[c] = Float(Double(vector[c]) * scale) }
    return vector
  }
}

/// A string as UTF-16 code units: Swift's String compares canonically equivalent strings as equal,
/// while the Kotlin and JS tokenizers compare code units, so pieces are keyed by their code units.
typealias Utf16 = [UInt16]

/**
 * XLM-RoBERTa's SentencePiece Unigram tokenizer, read from a Hugging Face tokenizer.json. A port of
 * UnigramTokenizer in E5Embedder.kt (Precompiled + Replace normalizers, Metaspace, Unigram with fused
 * unknowns, <s> ... </s> template).
 */
final class UnigramTokenizer {
  private static let bosId: Int64 = 0
  private static let eosId: Int64 = 2
  private static let maxTokens = 512
  private static let metaspace = "\u{2581}"
  private static let fullwidthTilde = "\u{FF5E}"
  private static let controlChars = try! NSRegularExpression(pattern: "[\\u0001-\\u0008\\u000B\\u000E-\\u001F\\u007F\\u008F\\u009F]")
  private static let spaceChars = try! NSRegularExpression(
    pattern: "[\\u0009\\u000A\\u000C\\u000D\\u00A0\\u1680\\u2000-\\u200F\\u2028\\u2029\\u202F\\u205F\\u2581\\u3000\\uFEFF\\uFFFD]")
  private static let repeatedSpaces = try! NSRegularExpression(pattern: " {2,}")

  private var ids: [Utf16: Int] = [:]
  private var scores: [Double]
  private let unkId: Int
  private let unkScore: Double
  /// Longest vocabulary piece, in code points.
  private let maxPieceLength: Int

  init(json: String) throws {
    let ns = json as NSString
    let model = ns.range(of: "\"model\"").location
    guard model != NSNotFound else { throw QuranSpeechError.message("No model in tokenizer.json") }
    let afterModel = NSRange(location: model, length: ns.length - model)
    let unkRegex = try NSRegularExpression(pattern: "\"unk_id\"\\s*:\\s*(\\d+)")
    guard let unkMatch = unkRegex.firstMatch(in: json, range: afterModel),
          let unk = Int(ns.substring(with: unkMatch.range(at: 1))) else {
      throw QuranSpeechError.message("No unk_id in tokenizer.json")
    }
    unkId = unk
    let vocab = ns.range(of: "\"vocab\"", range: afterModel).location
    guard vocab != NSNotFound else { throw QuranSpeechError.message("No vocab in tokenizer.json") }

    let reader = JsonCursor(text: Array(json.utf16), pos: vocab + "\"vocab\"".utf16.count)
    try reader.expect(":")
    try reader.expect("[")
    var vocabScores: [Double] = []
    vocabScores.reserveCapacity(260_000)
    ids.reserveCapacity(260_000)
    var longest = 1
    var index = 0
    while !reader.consume("]") {
      if index > 0 { try reader.expect(",") }
      try reader.expect("[")
      let piece = try reader.string()
      try reader.expect(",")
      vocabScores.append(try reader.number())
      try reader.expect("]")
      // A repeated piece maps to its last id, like the Map Transformers.js builds
      ids[piece] = index
      index += 1
      longest = max(longest, UnigramTokenizer.codePointCount(piece))
    }
    guard !vocabScores.isEmpty, unk < vocabScores.count else { throw QuranSpeechError.message("Empty vocab in tokenizer.json") }
    scores = vocabScores
    unkScore = vocabScores.min()! - 10
    scores[unk] = unkScore
    maxPieceLength = longest
  }

  /// Token ids with <s> and </s> around them, at most maxTokens.
  func encode(_ text: String) -> [Int64] {
    let pieces = tokenize(preTokenize(normalize(text)))
    var out: [Int64] = [UnigramTokenizer.bosId]
    out.reserveCapacity(pieces.count + 2)
    var previousUnknown = false
    for piece in pieces {
      let id = ids[piece]
      // Consecutive unknown pieces become a single <unk>
      if id == nil || id == unkId {
        if !previousUnknown { out.append(Int64(unkId)) }
        previousUnknown = true
      } else {
        out.append(Int64(id!))
        previousUnknown = false
      }
    }
    if out.count > UnigramTokenizer.maxTokens - 1 { out.removeSubrange((UnigramTokenizer.maxTokens - 1)...) }
    out.append(UnigramTokenizer.eosId)
    return out
  }

  private static func replace(_ regex: NSRegularExpression, in text: String, with template: String) -> String {
    regex.stringByReplacingMatches(in: text, range: NSRange(location: 0, length: (text as NSString).length), withTemplate: template)
  }

  private func normalize(_ text: String) -> String {
    var normalized = UnigramTokenizer.replace(UnigramTokenizer.controlChars, in: text, with: "")
    normalized = UnigramTokenizer.replace(UnigramTokenizer.spaceChars, in: normalized, with: " ")
    normalized = normalized
      .components(separatedBy: UnigramTokenizer.fullwidthTilde)
      .map { ($0 as NSString).precomposedStringWithCompatibilityMapping } // NFKC
      .joined(separator: UnigramTokenizer.fullwidthTilde)
    return UnigramTokenizer.replace(UnigramTokenizer.repeatedSpaces, in: normalized, with: " ")
  }

  private func preTokenize(_ text: String) -> String {
    let replaced = text.replacingOccurrences(of: " ", with: UnigramTokenizer.metaspace)
    return replaced.hasPrefix(UnigramTokenizer.metaspace) ? replaced : UnigramTokenizer.metaspace + replaced
  }

  /// Splits UTF-16 code units into code points (a surrogate pair stays together), like String.codePoints().
  private static func codePoints(_ units: Utf16) -> [Utf16] {
    var result: [Utf16] = []
    result.reserveCapacity(units.count)
    var i = 0
    while i < units.count {
      let unit = units[i]
      if UTF16.isLeadSurrogate(unit) && i + 1 < units.count && UTF16.isTrailSurrogate(units[i + 1]) {
        result.append([unit, units[i + 1]])
        i += 2
      } else {
        result.append([unit])
        i += 1
      }
    }
    return result
  }

  private static func codePointCount(_ units: Utf16) -> Int { codePoints(units).count }

  /// Viterbi over every vocabulary piece found in `text`; a character with no piece of its own is unknown.
  private func tokenize(_ text: String) -> [Utf16] {
    let chars = UnigramTokenizer.codePoints(Array(text.utf16))
    let length = chars.count
    // Best path ending at each position: its score, and the start of the piece that ends it there
    var bestScore = [Double](repeating: -.infinity, count: length + 1)
    var bestStart = [Int](repeating: -1, count: length + 1)
    bestScore[0] = 0

    /// Keeps the first best path into `end`; paths are visited in the order of their start, so ties resolve as in Transformers.js.
    func relax(_ start: Int, _ end: Int, _ score: Double) {
      if bestStart[end] < 0 || score > bestScore[end] {
        bestScore[end] = score
        bestStart[end] = start
      }
    }

    for start in 0..<length {
      if bestStart[start] < 0 && start > 0 { continue }
      let base = bestScore[start]
      var hasSingle = false
      var piece: Utf16 = []
      let last = min(length, start + maxPieceLength)
      if start + 1 <= last {
        for end in (start + 1)...last {
          piece.append(contentsOf: chars[end - 1])
          guard let id = ids[piece] else { continue }
          if end == start + 1 { hasSingle = true }
          relax(start, end, base + scores[id])
        }
      }
      if !hasSingle { relax(start, start + 1, base + unkScore) }
    }
    var pieces: [Utf16] = []
    var end = length
    while end > 0 {
      let start = bestStart[end]
      pieces.append(chars[start..<end].flatMap { $0 })
      end = start
    }
    return pieces.reversed()
  }
}

/// Just enough of a JSON reader to stream tokenizer.json's 250k-entry vocabulary without building a tree.
private final class JsonCursor {
  private let text: Utf16
  private var pos: Int

  init(text: Utf16, pos: Int) {
    self.text = text
    self.pos = pos
  }

  private static func isSpace(_ c: UInt16) -> Bool { c == 0x20 || c == 0x09 || c == 0x0A || c == 0x0D || c == 0x0B || c == 0x0C }

  private func skipSpace() {
    while pos < text.count && JsonCursor.isSpace(text[pos]) { pos += 1 }
  }

  func consume(_ char: Character) -> Bool {
    skipSpace()
    let unit = char.utf16.first!
    if pos < text.count && text[pos] == unit {
      pos += 1
      return true
    }
    return false
  }

  func expect(_ char: Character) throws {
    if !consume(char) { throw QuranSpeechError.message("Expected '\(char)' at \(pos) in tokenizer.json") }
  }

  func string() throws -> Utf16 {
    try expect("\"")
    var out: Utf16 = []
    while pos < text.count {
      let c = text[pos]
      pos += 1
      switch c {
      case 0x22: // "
        return out
      case 0x5C: // backslash
        guard pos < text.count else { break }
        let escaped = text[pos]
        pos += 1
        switch escaped {
        case 0x6E: out.append(0x0A) // n
        case 0x74: out.append(0x09) // t
        case 0x72: out.append(0x0D) // r
        case 0x62: out.append(0x08) // b
        case 0x66: out.append(0x0C) // f
        case 0x75: // u
          guard pos + 4 <= text.count, let value = UInt16(String(decoding: text[pos..<(pos + 4)], as: UTF16.self), radix: 16) else {
            throw QuranSpeechError.message("Bad \\u escape at \(pos) in tokenizer.json")
          }
          out.append(value)
          pos += 4
        default: out.append(escaped)
        }
      default:
        out.append(c)
      }
    }
    throw QuranSpeechError.message("Unterminated string in tokenizer.json")
  }

  func number() throws -> Double {
    skipSpace()
    let start = pos
    // , ] } space \n \r \t
    let stops: Set<UInt16> = [0x2C, 0x5D, 0x7D, 0x20, 0x0A, 0x0D, 0x09]
    while pos < text.count && !stops.contains(text[pos]) { pos += 1 }
    guard let value = Double(String(decoding: text[start..<pos], as: UTF16.self)) else {
      throw QuranSpeechError.message("Bad number at \(start) in tokenizer.json")
    }
    return value
  }
}
