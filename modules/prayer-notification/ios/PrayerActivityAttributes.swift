import ActivityKit
import Foundation

// Shared by the app (PrayerLiveActivity) and the widget extension, which draws the Live Activity:
// targets/PrayerWidgets/PrayerActivityAttributes.swift is a symlink to this file, so both compile the
// same type and ActivityKit matches them up.

/// The countdown Live Activity on the lock screen and in the Dynamic Island, iOS's stand-in for
/// Android's ongoing notification. It covers the next prayer and the one after it: at the next prayer
/// time (the stale date) the system draws it again with `isStale`, and it counts down to the one after.
@available(iOS 16.1, *)
struct PrayerActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var location: String
    /// Title above the countdown, `%s` replaced with a prayer's name (e.g. "%s vaktine")
    var untilFormat: String
    var next: PrayerActivityTime
    var after: PrayerActivityTime
  }
}

struct PrayerActivityTime: Codable, Hashable {
  /// The prayer's name, translated by the app
  var label: String
  /// "HH:mm"
  var time: String
  var at: Date
}
