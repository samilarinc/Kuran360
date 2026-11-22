import AVFoundation
import Foundation
import UserNotifications

/// iOS plays at most this much of a notification sound (and falls back to the default sound for longer files).
private let MAX_SOUND_SECONDS = 30.0
/// A short silent sound for "vibrate": iOS has no vibrate-only local notification, but a silent sound still buzzes.
private let VIBRATE_SOUND = "kuran360_vibrate.caf"

/**
 * The user's own alert sounds. iOS only plays notification sounds from Library/Sounds, in aiff, wav or
 * caf (not mp3) and no longer than 30 seconds, so a picked file is converted to 16-bit PCM caf and cut
 * to its first 30 seconds. The JS side reads them back from the same folder for previews (alertSoundUri
 * in src/services/prayerTimes.ts).
 */
enum PrayerSounds {
  static func soundsDir() throws -> URL {
    let library = try FileManager.default.url(for: .libraryDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    let dir = library.appendingPathComponent("Sounds", isDirectory: true)
    try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }

  /// `name` without any path, so nothing outside the folder can be reached
  static func soundFile(_ name: String) throws -> URL {
    try soundsDir().appendingPathComponent((name as NSString).lastPathComponent)
  }

  /// Converts the picked file (a file:// uri) into the sound library; returns the name to use as a prayer's `sound`.
  static func importSound(_ uri: String) throws -> String {
    let source = uri.hasPrefix("file:") ? (URL(string: uri) ?? URL(fileURLWithPath: uri)) : URL(fileURLWithPath: uri)
    // Picked files outside the app's sandbox need security-scoped access
    let scoped = source.startAccessingSecurityScopedResource()
    defer { if scoped { source.stopAccessingSecurityScopedResource() } }

    let name = "sound_\(Int64(Date().timeIntervalSince1970 * 1000)).caf"
    let target = try soundFile(name)
    let input = try AVAudioFile(forReading: source)
    let format = input.processingFormat
    let settings: [String: Any] = [
      AVFormatIDKey: kAudioFormatLinearPCM,
      AVSampleRateKey: format.sampleRate,
      AVNumberOfChannelsKey: format.channelCount,
      AVLinearPCMBitDepthKey: 16,
      AVLinearPCMIsFloatKey: false,
      AVLinearPCMIsBigEndianKey: false,
      AVLinearPCMIsNonInterleaved: false,
    ]
    do {
      let output = try AVAudioFile(forWriting: target, settings: settings, commonFormat: format.commonFormat, interleaved: format.isInterleaved)
      var remaining = min(input.length, AVAudioFramePosition(format.sampleRate * MAX_SOUND_SECONDS))
      let chunk: AVAudioFrameCount = 32_768
      guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: chunk) else {
        throw NSError(domain: "PrayerSounds", code: 2, userInfo: [NSLocalizedDescriptionKey: "No audio buffer"])
      }
      while remaining > 0 {
        try input.read(into: buffer, frameCount: AVAudioFrameCount(min(AVAudioFramePosition(chunk), remaining)))
        if buffer.frameLength == 0 { break }
        try output.write(from: buffer)
        remaining -= AVAudioFramePosition(buffer.frameLength)
      }
    } catch {
      try? FileManager.default.removeItem(at: target)
      throw error
    }
    return name
  }

  static func delete(_ name: String) {
    guard let file = try? soundFile(name) else { return }
    try? FileManager.default.removeItem(at: file)
  }

  /// The notification sound for a prayer's `sound` setting; nil plays nothing.
  static func notificationSound(_ sound: String) -> UNNotificationSound? {
    switch sound {
    case "default":
      return .default
    case "silent":
      return nil
    case "vibrate":
      return ensureVibrateSound() ? UNNotificationSound(named: UNNotificationSoundName(VIBRATE_SOUND)) : .default
    default:
      // A sound missing from the library (deleted, or imported on Android before a restore) falls back to the default
      guard let file = try? soundFile(sound), FileManager.default.fileExists(atPath: file.path) else { return .default }
      return UNNotificationSound(named: UNNotificationSoundName(file.lastPathComponent))
    }
  }

  /// Writes half a second of silence to Library/Sounds once.
  private static func ensureVibrateSound() -> Bool {
    guard let file = try? soundFile(VIBRATE_SOUND) else { return false }
    if FileManager.default.fileExists(atPath: file.path) { return true }
    let settings: [String: Any] = [
      AVFormatIDKey: kAudioFormatLinearPCM,
      AVSampleRateKey: 8000.0,
      AVNumberOfChannelsKey: 1,
      AVLinearPCMBitDepthKey: 16,
      AVLinearPCMIsFloatKey: false,
      AVLinearPCMIsBigEndianKey: false,
      AVLinearPCMIsNonInterleaved: false,
    ]
    do {
      let output = try AVAudioFile(forWriting: file, settings: settings, commonFormat: .pcmFormatFloat32, interleaved: false)
      guard let buffer = AVAudioPCMBuffer(pcmFormat: output.processingFormat, frameCapacity: 4000) else { return false }
      buffer.frameLength = 4000 // zero-filled
      if let channel = buffer.floatChannelData?[0] { channel.update(repeating: 0, count: 4000) }
      try output.write(from: buffer)
      return true
    } catch {
      try? FileManager.default.removeItem(at: file)
      return false
    }
  }
}
