import AVFoundation
import ExpoModulesCore

/// Longest recording kept; the app stops earlier (MAX_RECORDING_SECONDS in src/services/verseFinder.ts).
private let MAX_RECORDING_SECONDS = 60

/**
 * Speech recognition for the verse finder and memorization check, and the topic search's embedding
 * model, on iOS: the same interface as QuranSpeechModule.kt (see index.ts).
 *
 * Samples cross to JS only through the synchronous putSamples/takeSamples, since a typed array can
 * only be read on the JS thread; the async functions take or return a handle to them. Loading and
 * running each model happens on its own serial queue, which also keeps them from overlapping.
 */
public class QuranSpeechModule: Module {
  private var buffers: [Int: [Float]] = [:]
  private var nextHandle = 1
  private let buffersLock = NSLock()
  private var recorder: Recorder?
  private let recorderLock = NSLock()
  private var model: FastConformer?
  private var modelDir: String?
  private let modelQueue = DispatchQueue(label: "com.kuran360.quranspeech.model", qos: .userInitiated)
  private var embedder: E5Embedder?
  private let embedderQueue = DispatchQueue(label: "com.kuran360.quranspeech.embedder", qos: .userInitiated)

  private func store(_ samples: [Float]) -> Int {
    buffersLock.lock()
    defer { buffersLock.unlock() }
    let handle = nextHandle
    nextHandle += 1
    buffers[handle] = samples
    return handle
  }

  private func take(_ handle: Int) throws -> [Float] {
    buffersLock.lock()
    defer { buffersLock.unlock() }
    guard let samples = buffers.removeValue(forKey: handle) else { throw QuranSpeechError.message("Unknown audio handle") }
    return samples
  }

  private func samplesResult(_ samples: [Float], truncated: Bool = false) -> [String: Any] {
    ["handle": store(samples), "length": samples.count, "truncated": truncated]
  }

  private func swapRecorder(_ next: Recorder?) -> Recorder? {
    recorderLock.lock()
    defer { recorderLock.unlock() }
    let previous = recorder
    recorder = next
    return previous
  }

  /// file:// uris and plain paths, as expo-file-system and the document picker give them.
  private func fileURL(_ value: String) -> URL {
    value.hasPrefix("file:") ? (URL(string: value) ?? URL(fileURLWithPath: value)) : URL(fileURLWithPath: value)
  }

  public func definition() -> ModuleDefinition {
    Name("QuranSpeech")

    OnDestroy {
      _ = self.swapRecorder(nil)?.stop()
    }

    AsyncFunction("startRecording") { () async throws in
      let granted = await withCheckedContinuation { (continuation: CheckedContinuation<Bool, Never>) in
        AVAudioSession.sharedInstance().requestRecordPermission { continuation.resume(returning: $0) }
      }
      if !granted { throw QuranSpeechError.message("Microphone permission denied") }
      _ = self.swapRecorder(nil)?.stop()
      _ = self.swapRecorder(try Recorder(maxSeconds: MAX_RECORDING_SECONDS))
    }

    AsyncFunction("stopRecording") { () throws -> [String: Any] in
      guard let recorder = self.swapRecorder(nil) else { throw QuranSpeechError.message("Not recording") }
      return self.samplesResult(recorder.stop())
    }

    Function("cancelRecording") {
      _ = self.swapRecorder(nil)?.stop()
    }

    AsyncFunction("decodeFile") { (uri: String, maxSeconds: Int) async throws -> [String: Any] in
      let url = self.fileURL(uri)
      // Picked files outside the app's sandbox need security-scoped access
      let scoped = url.startAccessingSecurityScopedResource()
      defer { if scoped { url.stopAccessingSecurityScopedResource() } }
      let decoded = try await decodeAudioFile(url, maxSeconds: maxSeconds)
      return self.samplesResult(decoded.samples, truncated: decoded.truncated)
    }

    /// Copies samples from JS into a new handle.
    Function("putSamples") { (data: Float32Array) -> Int in
      let count = data.length
      let pointer = data.rawPointer.bindMemory(to: Float.self, capacity: count)
      return self.store(Array(UnsafeBufferPointer(start: pointer, count: count)))
    }

    /// Copies a handle's samples into `out` (sized from the handle's length) and frees it.
    Function("takeSamples") { (handle: Int, out: Float32Array) in
      let samples = try self.take(handle)
      let count = min(samples.count, out.length)
      let pointer = out.rawPointer.bindMemory(to: Float.self, capacity: out.length)
      if count > 0 { samples.withUnsafeBufferPointer { pointer.update(from: $0.baseAddress!, count: count) } }
    }

    Function("releaseSamples") { (handle: Int) in
      _ = try? self.take(handle)
    }

    AsyncFunction("play") { (handle: Int) async throws in
      try await playSamples(try self.take(handle))
    }

    /// Loads the model from a folder holding encoder.int8.onnx, decoder.int8.onnx and tokens.txt.
    AsyncFunction("loadModel") { (dir: String) throws in
      if self.model == nil || self.modelDir != dir {
        self.model = nil
        self.model = try FastConformer(dir: self.fileURL(dir))
        self.modelDir = dir
      }
    }.runOnQueue(modelQueue)

    AsyncFunction("unloadModel") {
      self.model = nil
      self.modelDir = nil
    }.runOnQueue(modelQueue)

    AsyncFunction("transcribe") { (handle: Int) throws -> [String: Any] in
      let audio = try self.take(handle)
      guard let loaded = self.model else { throw QuranSpeechError.message("Model not loaded") }
      let started = Date()
      let text = try loaded.transcribe(audio)
      return ["text": text, "ms": Int(Date().timeIntervalSince(started) * 1000)]
    }.runOnQueue(modelQueue)

    /// Loads the topic search model from a folder holding tokenizer.json and onnx/model_quantized.onnx.
    AsyncFunction("loadEmbedder") { (dir: String) throws in
      if self.embedder == nil { self.embedder = try E5Embedder(dir: self.fileURL(dir)) }
    }.runOnQueue(embedderQueue)

    AsyncFunction("unloadEmbedder") {
      self.embedder = nil
    }.runOnQueue(embedderQueue)

    AsyncFunction("embed") { (text: String) throws -> [Double] in
      guard let loaded = self.embedder else { throw QuranSpeechError.message("Embedding model not loaded") }
      return try loaded.embed(text).map { Double($0) }
    }.runOnQueue(embedderQueue)
  }
}
