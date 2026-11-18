import Foundation
import UserNotifications

private let KEY_CONFIG = "prayer_notification.config"
/// Prayers answered with "Kıldım" or "Kılmadım", as "yyyy-MM-dd:index" (kept a week)
private let KEY_ANSWERED = "prayer_notification.answered"
/// Prayers answered with "Kılmadım" and not made up yet: the kaza list
private let KEY_MISSED = "prayer_notification.missed"
/// Answers older than this are dropped; the questions are only asked for today and the night before.
private let ANSWERED_KEEP_DAYS = 7

/// Every pending request of this module starts with this, so other notifications are left alone.
let PRAYER_ID_PREFIX = "kuran360.prayer."
private let QUESTION_CATEGORY = "kuran360.prayer.question"
private let KAZA_CATEGORY = "kuran360.prayer.kaza"
private let ACTION_PRAYED = "kuran360.prayer.prayed"
private let ACTION_MISSED = "kuran360.prayer.missed"
private let ACTION_MADE_UP = "kuran360.prayer.madeUp"
private let INFO_DATE = "prayerDate"
private let INFO_INDEX = "prayerIndex"

/// iOS keeps at most 64 pending local notifications per app; a few are left for anything else.
private let MAX_PENDING = 60

private enum AlertKind: String {
  case prayer, cuma, sahur, iftar, kazaCheck, special
}

/// One alert, due `at` (epoch millis), about prayer `index` at `time` ("HH:mm") on `date`.
private struct Alert {
  let at: Int64
  let kind: AlertKind
  let index: Int
  let minutesBefore: Int
  let time: String
  let date: String
  /// Special alerts carry their own texts
  var title: String = ""
  var text: String = ""
}

/**
 * Prayer time alerts on iOS: a port of the alert half of PrayerNotifier.kt. Android fires one alarm
 * at a time and builds each alert when it is due; iOS can't run code at a set time, so the nearest
 * MAX_PENDING alerts are scheduled ahead as local notifications and topped up whenever the config
 * changes, a kaza button is answered or the app becomes active. The ongoing countdown notification
 * has no iOS equivalent (the home screen widgets show the countdown instead).
 */
final class PrayerNotifier {
  static let shared = PrayerNotifier()

  private let defaults = UserDefaults.standard
  private let lock = NSLock()
  private var lastRefresh: Task<Void, Never>?

  // MARK: - Config

  func start(_ configJson: String) async throws {
    _ = try parsePrayerConfig(configJson) // reject a bad config before replacing the stored one
    defaults.set(configJson, forKey: KEY_CONFIG)
    await refresh().value
  }

  func stop() async {
    defaults.removeObject(forKey: KEY_CONFIG)
    await refresh().value
  }

  private func loadConfig() -> PrayerConfig? {
    guard let json = defaults.string(forKey: KEY_CONFIG) else { return nil }
    do {
      return try parsePrayerConfig(json)
    } catch {
      defaults.removeObject(forKey: KEY_CONFIG)
      return nil
    }
  }

  // MARK: - Scheduling

  /// Replaces the pending alerts with the nearest ones for the stored config; runs one at a time.
  @discardableResult
  func refresh() -> Task<Void, Never> {
    lock.lock()
    defer { lock.unlock() }
    let previous = lastRefresh
    let task = Task {
      await previous?.value
      await self.reschedule()
    }
    lastRefresh = task
    return task
  }

  private func reschedule() async {
    let center = UNUserNotificationCenter.current()
    let pending = await center.pendingNotificationRequests()
    let ours = pending.map(\.identifier).filter { $0.hasPrefix(PRAYER_ID_PREFIX) }
    if !ours.isEmpty { center.removePendingNotificationRequests(withIdentifiers: ours) }
    guard let config = loadConfig() else { return }
    await registerCategories(config, center)
    let now = PrayerTime.nowMillis()
    for alert in upcomingAlerts(config, now) {
      guard let request = makeRequest(config, alert) else { continue }
      do {
        try await center.add(request)
      } catch {
        NSLog("PrayerNotifier: couldn't schedule \(request.identifier): \(error)")
      }
    }
  }

  /// The buttons' titles come from the config, so the categories are set again with it; other categories are kept.
  private func registerCategories(_ config: PrayerConfig, _ center: UNUserNotificationCenter) async {
    let question = UNNotificationCategory(
      identifier: QUESTION_CATEGORY,
      actions: [
        UNNotificationAction(identifier: ACTION_PRAYED, title: config.texts.prayed, options: []),
        UNNotificationAction(identifier: ACTION_MISSED, title: config.texts.notPrayed, options: []),
      ],
      intentIdentifiers: [],
      options: []
    )
    let kaza = UNNotificationCategory(
      identifier: KAZA_CATEGORY,
      actions: [UNNotificationAction(identifier: ACTION_MADE_UP, title: config.texts.madeUp, options: [])],
      intentIdentifiers: [],
      options: []
    )
    let others = await center.notificationCategories().filter { $0.identifier != QUESTION_CATEGORY && $0.identifier != KAZA_CATEGORY }
    center.setNotificationCategories(others.union([question, kaza]))
  }

  /// Güneş isn't a prayer, so it is never asked about
  private func tracksKaza(_ config: PrayerConfig, _ index: Int) -> Bool { config.kaza && index != PRAYER_GUNES }

  /// Every alert of the day starting at `dayStart`, unordered (same as alertsOf in PrayerNotifier.kt).
  private func alertsOf(_ config: PrayerConfig, _ dayStart: Date, _ day: PrayerDay, _ missed: Set<String>) -> [Alert] {
    var result: [Alert] = []
    let times = day.times.map { PrayerTime.timeOn(dayStart, $0) }
    let yesterday = PrayerTime.dateKey(PrayerTime.startOfDay(PrayerTime.millis(dayStart), -1))
    for i in 0..<PRAYER_COUNT {
      if config.alertAt[i] {
        result.append(Alert(at: times[i], kind: .prayer, index: i, minutesBefore: 0, time: day.times[i], date: day.date))
      }
      if config.alertBefore[i] > 0 {
        result.append(Alert(at: times[i] - Int64(config.alertBefore[i]) * 60_000, kind: .prayer, index: i,
                            minutesBefore: config.alertBefore[i], time: day.times[i], date: day.date))
      }
      // At each prayer time, remind of the same prayer of the day before if it was answered "Kılmadım"
      if tracksKaza(config, i) && missed.contains(prayerKey(yesterday, i)) {
        result.append(Alert(at: times[i], kind: .kazaCheck, index: i, minutesBefore: 0, time: day.times[i], date: yesterday))
      }
    }
    if config.cumaBefore > 0 && PrayerTime.calendar.component(.weekday, from: dayStart) == 6 /* Friday */ {
      result.append(Alert(at: times[PRAYER_OGLE] - Int64(config.cumaBefore) * 60_000, kind: .cuma, index: PRAYER_OGLE,
                          minutesBefore: config.cumaBefore, time: day.times[PRAYER_OGLE], date: day.date))
    }
    if (day.ramadan && config.fastingRamadan) || config.fastingMode {
      if config.sahurBefore > 0 {
        result.append(Alert(at: times[PRAYER_IMSAK] - Int64(config.sahurBefore) * 60_000, kind: .sahur, index: PRAYER_IMSAK,
                            minutesBefore: config.sahurBefore, time: day.times[PRAYER_IMSAK], date: day.date))
      }
      if config.iftar {
        result.append(Alert(at: times[PRAYER_AKSAM], kind: .iftar, index: PRAYER_AKSAM, minutesBefore: 0,
                            time: day.times[PRAYER_AKSAM], date: day.date))
      }
    }
    // On Fridays the Cuma reminder replaces an öğle reminder set to the same time
    let cumaTimes = Set(result.filter { $0.kind == .cuma }.map(\.at))
    return result.filter { !($0.kind == .prayer && $0.index == PRAYER_OGLE && $0.minutesBefore > 0 && cumaTimes.contains($0.at)) }
  }

  /// The nearest MAX_PENDING alerts after `now`: prayer alerts day by day, and kandil / blessed-day reminders.
  private func upcomingAlerts(_ config: PrayerConfig, _ now: Int64) -> [Alert] {
    let missed = Set(marks(KEY_MISSED))
    var alerts: [Alert] = []
    var missingDays = 0
    var offset = 0
    // The days run to the end of the year's data; stop once enough alerts are found, as later ones wouldn't fit
    while alerts.count < MAX_PENDING && missingDays < 3 && offset < 400 {
      let dayStart = PrayerTime.startOfDay(now, offset)
      offset += 1
      guard let day = config.days[PrayerTime.dateKey(dayStart)] else {
        missingDays += 1
        continue
      }
      missingDays = 0
      alerts += alertsOf(config, dayStart, day, missed).filter { $0.at > now }
    }
    alerts += config.reminders.filter { $0.at > now }.map {
      Alert(at: $0.at, kind: .special, index: 0, minutesBefore: 0, time: "", date: "", title: $0.title, text: $0.text)
    }
    return Array(alerts.sorted { $0.at < $1.at }.prefix(MAX_PENDING))
  }

  private func makeRequest(_ config: PrayerConfig, _ alert: Alert) -> UNNotificationRequest? {
    let content = UNMutableNotificationContent()
    let texts = config.texts
    let label = config.labels[alert.index]
    func format(_ template: String, _ name: String? = nil) -> String {
      template.replacingOccurrences(of: "%1", with: name ?? label).replacingOccurrences(of: "%2", with: String(alert.minutesBefore))
    }
    switch alert.kind {
    case .prayer: content.title = alert.minutesBefore > 0 ? format(texts.alertBefore) : format(texts.alertAt)
    case .cuma: content.title = format(texts.cuma)
    case .sahur: content.title = format(texts.sahur)
    case .iftar: content.title = format(texts.iftar)
    case .kazaCheck: content.title = format(texts.kaza, texts.kazaLabels[alert.index])
    case .special: content.title = alert.title
    }
    content.threadIdentifier = "kuran360.prayer"
    if alert.kind == .special {
      // A kandil or blessed-day reminder: the default sound, whatever the prayers are set to
      content.body = alert.text
      content.sound = .default
    } else {
      content.body = "\(config.location) · \(alert.time)"
      // Cuma, sahur and iftar sound like öğle, imsak and akşam
      content.sound = PrayerSounds.notificationSound(config.alertSound[alert.index])
      // Shown during Focus too (com.apple.developer.usernotifications.time-sensitive in app.config.js)
      content.interruptionLevel = .timeSensitive
      content.userInfo = [INFO_DATE: alert.date, INFO_INDEX: alert.index]
      if alert.kind == .kazaCheck {
        content.categoryIdentifier = KAZA_CATEGORY
      } else if alert.kind == .prayer && alert.minutesBefore == 0 && tracksKaza(config, alert.index) && !isAnswered(alert.date, alert.index) {
        content.categoryIdentifier = QUESTION_CATEGORY
      }
    }
    // Wall-clock time, so the alert keeps to the prayer time if the clock or time zone is changed
    // (the components carry the Gregorian calendar, but not the time zone, so they are read in the current one)
    let components = PrayerTime.calendar.dateComponents([.calendar, .year, .month, .day, .hour, .minute, .second], from: PrayerTime.date(alert.at))
    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
    let key = alert.kind == .special ? String(UInt32(truncatingIfNeeded: alert.title.hashValue)) : "\(alert.index).\(alert.minutesBefore)"
    return UNNotificationRequest(identifier: "\(PRAYER_ID_PREFIX)\(alert.at).\(alert.kind.rawValue).\(key)", content: content, trigger: trigger)
  }

  // MARK: - Kaza tracking (same storage format as PrayerNotifier.kt: "yyyy-MM-dd:index" sets)

  private func prayerKey(_ date: String, _ index: Int) -> String { "\(date):\(index)" }

  private func marks(_ key: String) -> [String] { defaults.stringArray(forKey: key) ?? [] }

  private func isAnswered(_ date: String, _ index: Int) -> Bool { marks(KEY_ANSWERED).contains(prayerKey(date, index)) }

  private func answer(_ date: String, _ index: Int, prayed: Bool) {
    let oldest = PrayerTime.dateKey(PrayerTime.startOfDay(PrayerTime.nowMillis(), -ANSWERED_KEEP_DAYS))
    var answered = Set(marks(KEY_ANSWERED).filter { String($0.split(separator: ":").first ?? "") >= oldest })
    answered.insert(prayerKey(date, index))
    var missed = Set(marks(KEY_MISSED))
    if prayed { missed.remove(prayerKey(date, index)) } else { missed.insert(prayerKey(date, index)) }
    defaults.set(Array(answered), forKey: KEY_ANSWERED)
    defaults.set(Array(missed), forKey: KEY_MISSED)
  }

  /// The kaza list: prayers answered "Kılmadım" and not made up, as "yyyy-MM-dd:index"
  func missedPrayers() -> [String] { marks(KEY_MISSED).sorted() }

  func makeUp(_ date: String, _ index: Int) {
    var missed = Set(marks(KEY_MISSED))
    missed.remove(prayerKey(date, index))
    defaults.set(Array(missed), forKey: KEY_MISSED)
  }

  /// Whether a notification response belongs to this module.
  static func isOurs(_ request: UNNotificationRequest) -> Bool { request.identifier.hasPrefix(PRAYER_ID_PREFIX) }

  /// The "Kıldım" / "Kılmadım" / "Kaza kıldım" buttons: records the answer and reschedules (kaza reminders depend on it).
  func handle(_ response: UNNotificationResponse) async {
    let info = response.notification.request.content.userInfo
    guard let date = info[INFO_DATE] as? String,
          let index = (info[INFO_INDEX] as? NSNumber)?.intValue, (0..<PRAYER_COUNT).contains(index) else { return }
    switch response.actionIdentifier {
    case ACTION_PRAYED: answer(date, index, prayed: true)
    case ACTION_MISSED: answer(date, index, prayed: false)
    case ACTION_MADE_UP: makeUp(date, index)
    default: return
    }
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [response.notification.request.identifier])
    await refresh().value
  }
}
