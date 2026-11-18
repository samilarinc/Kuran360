import Foundation
import WidgetKit

/**
 * Hands the times and verses to the home screen widgets (the PrayerWidgets extension in
 * targets/prayer-widgets) through the App Group's UserDefaults, and asks WidgetKit to rebuild them.
 * The verse index and period are kept the same way as PrayerWidgets.kt keeps them.
 */
enum PrayerWidgetStore {
  static var defaults: UserDefaults { UserDefaults(suiteName: PRAYER_APP_GROUP) ?? .standard }

  static func setData(_ json: String) throws {
    _ = try parsePrayerConfig(json) // reject bad data before replacing the stored one
    defaults.set(json, forKey: PrayerWidgetKeys.data)
    WidgetCenter.shared.reloadAllTimelines()
  }

  /// Stores the verses for the verse widgets; a new pool (another poolId) starts from its first verse.
  static func setVerses(_ json: String) throws {
    let data = try parsePrayerVerses(json)
    let oldPoolId = defaults.string(forKey: PrayerWidgetKeys.verses).flatMap { try? parsePrayerVerses($0) }?.poolId
    defaults.set(json, forKey: PrayerWidgetKeys.verses)
    if data.poolId != oldPoolId {
      defaults.set(0, forKey: PrayerWidgetKeys.verseIndex)
      defaults.removeObject(forKey: PrayerWidgetKeys.versePeriod)
      defaults.removeObject(forKey: PrayerWidgetKeys.versePeriodAt)
    }
    WidgetCenter.shared.reloadAllTimelines()
  }
}
