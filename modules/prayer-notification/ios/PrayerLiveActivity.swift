import ActivityKit
import Foundation
import UIKit

/// When the running Live Activity was started; iOS ends one after 8 hours, so it is started anew now and then.
private let KEY_STARTED = "prayer_notification.activityStarted"
/// An activity older than this is replaced by a new one when the app is opened.
private let RESTART_AFTER: TimeInterval = 30 * 60

/**
 * The countdown Live Activity (PrayerActivityAttributes; drawn by the widget extension), shown while
 * the ongoing setting is on: the iOS stand-in for Android's ongoing notification. iOS only lets an app
 * start one while it is in the foreground and ends it after 8 hours, so each time the app is opened it
 * starts a fresh one (if the running one is older than RESTART_AFTER); in the background (a kaza
 * button) it only updates the running one.
 */
enum PrayerLiveActivity {
  static func sync(_ config: PrayerConfig?) async {
    guard #available(iOS 16.2, *) else { return }
    let activities = Activity<PrayerActivityAttributes>.activities
    guard let config, config.ongoing, ActivityAuthorizationInfo().areActivitiesEnabled,
          let state = contentState(config, PrayerTime.nowMillis()) else {
      for activity in activities { await activity.end(nil, dismissalPolicy: .immediate) }
      return
    }
    let content = ActivityContent(state: state, staleDate: state.next.at)
    let foreground = await MainActor.run { UIApplication.shared.applicationState == .active }
    let defaults = UserDefaults.standard
    let startedAt = defaults.object(forKey: KEY_STARTED) as? Date
    let recent = startedAt.map { Date().timeIntervalSince($0) < RESTART_AFTER } ?? false

    if let current = activities.first, !foreground || recent {
      for extra in activities.dropFirst() { await extra.end(nil, dismissalPolicy: .immediate) }
      await current.update(content)
      return
    }
    guard foreground else { return }
    for activity in activities { await activity.end(nil, dismissalPolicy: .immediate) }
    do {
      _ = try Activity.request(attributes: PrayerActivityAttributes(), content: content, pushType: nil)
      defaults.set(Date(), forKey: KEY_STARTED)
    } catch {
      NSLog("PrayerLiveActivity: couldn't start: \(error)")
    }
  }

  /// The next prayer and the one after it at `now`; nil when the app hasn't sent times that far ahead.
  @available(iOS 16.2, *)
  private static func contentState(_ config: PrayerConfig, _ now: Int64) -> PrayerActivityAttributes.ContentState? {
    guard let state = computePrayerState(config, now),
          let following = computePrayerState(config, state.nextAt) else { return nil }
    func time(_ index: Int, _ at: Int64) -> PrayerActivityTime {
      let c = PrayerTime.calendar.dateComponents([.hour, .minute], from: PrayerTime.date(at))
      return PrayerActivityTime(
        label: config.labels[index], time: String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0), at: PrayerTime.date(at))
    }
    return PrayerActivityAttributes.ContentState(
      location: config.location,
      untilFormat: config.untilFormat,
      next: time(state.nextIndex, state.nextAt),
      after: time(following.nextIndex, following.nextAt))
  }
}
