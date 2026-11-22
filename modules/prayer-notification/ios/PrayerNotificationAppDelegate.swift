import ExpoModulesCore
import UIKit
import UserNotifications

/**
 * Sets the notification center's delegate at launch (also when iOS launches the app in the background
 * for a "Kıldım" / "Kılmadım" button), and tops up the scheduled alerts whenever the app becomes active.
 */
public class PrayerNotificationAppDelegate: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    PrayerNotificationCenterDelegate.shared.install()
    return true
  }

  public func applicationDidBecomeActive(_ application: UIApplication) {
    PrayerNotificationCenterDelegate.shared.install()
    PrayerNotifier.shared.refresh()
  }
}

/// Handles this module's notifications and passes everything else on to the delegate that was there before.
final class PrayerNotificationCenterDelegate: NSObject, UNUserNotificationCenterDelegate {
  static let shared = PrayerNotificationCenterDelegate()

  private weak var previous: UNUserNotificationCenterDelegate?

  func install() {
    let center = UNUserNotificationCenter.current()
    guard center.delegate !== self else { return }
    previous = center.delegate
    center.delegate = self
  }

  /// Alerts show as banners with their sound while the app is open too, as on Android.
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if PrayerNotifier.isOurs(notification.request) {
      completionHandler([.banner, .list, .sound])
      return
    }
    if previous?.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler) == nil {
      completionHandler([])
    }
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    if PrayerNotifier.isOurs(response.notification.request) {
      Task {
        await PrayerNotifier.shared.handle(response)
        completionHandler()
      }
      return
    }
    if previous?.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler) == nil {
      completionHandler()
    }
  }
}
