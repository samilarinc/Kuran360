import ExpoModulesCore
import UserNotifications

/**
 * The iOS side of modules/prayer-notification (see index.ts): prayer alerts as scheduled local
 * notifications (PrayerNotifier), the user's alert sounds (PrayerSounds) and the home screen widgets'
 * data (PrayerWidgetStore). There is no ongoing countdown notification on iOS, so isActive is always
 * false, and alarms need no permission, so canScheduleExactAlarms is always true.
 */
public class PrayerNotificationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PrayerNotification")

    OnCreate {
      PrayerNotificationCenterDelegate.shared.install()
    }

    /// Stores the times and settings (JSON, see PrayerNotificationConfig in index.ts) and schedules the nearest alerts.
    AsyncFunction("start") { (configJson: String) async throws in
      try await PrayerNotifier.shared.start(configJson)
    }

    AsyncFunction("stop") { () async in
      await PrayerNotifier.shared.stop()
    }

    AsyncFunction("setWidgetData") { (json: String) throws in
      try PrayerWidgetStore.setData(json)
    }

    AsyncFunction("setWidgetVerses") { (json: String) throws in
      try PrayerWidgetStore.setVerses(json)
    }

    Function("isActive") { () -> Bool in
      false
    }

    /// Converts a picked sound into Library/Sounds (caf, at most 30 seconds); `extension` isn't needed on iOS.
    AsyncFunction("importSound") { (uri: String, _: String) throws -> String in
      try PrayerSounds.importSound(uri)
    }

    Function("deleteSound") { (name: String) in
      PrayerSounds.delete(name)
    }

    Function("getMissedPrayers") { () -> [String] in
      PrayerNotifier.shared.missedPrayers()
    }

    Function("makeUpPrayer") { (date: String, index: Int) in
      PrayerNotifier.shared.makeUp(date, index)
      PrayerNotifier.shared.refresh()
    }

    Function("canScheduleExactAlarms") { () -> Bool in
      true
    }

    Function("openExactAlarmSettings") {}

    /// iOS only: asks for permission to show alerts (the system asks once; later calls return the answer).
    AsyncFunction("requestPermission") { () async throws -> Bool in
      try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
    }

    /// iOS only: whether alerts may be shown.
    AsyncFunction("hasPermission") { () async -> Bool in
      let status = await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
      return status == .authorized || status == .provisional || status == .ephemeral
    }
  }
}
