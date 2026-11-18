import Foundation

// Shared by the PrayerNotification module and the PrayerWidgets extension (targets/prayer-widgets links
// this same file), so both read the stored times the same way. A Swift port of the parsing and state
// parts of PrayerNotifier.kt / PrayerWidgets.kt: keep them in step.

/// Number of prayer times in a day: imsak, güneş, öğle, ikindi, akşam, yatsı.
let PRAYER_COUNT = 6
let PRAYER_IMSAK = 0
let PRAYER_GUNES = 1
let PRAYER_OGLE = 2
let PRAYER_AKSAM = 4

/// The App Group shared by the app and the widget extension (see app.config.js and targets/prayer-widgets).
let PRAYER_APP_GROUP = "group.com.kuran360"

/// Keys in the App Group's UserDefaults, read by the widgets.
enum PrayerWidgetKeys {
  /// The times the widgets show (location, labels and days, as in the notification config)
  static let data = "prayer_widgets.data"
  /// The verses the verse widgets show (see syncVerseWidget in src/services/widgets.ts)
  static let verses = "prayer_widgets.verses"
  /// Position in the verse pool; grows by one per prayer time or tap and wraps around the pool
  static let verseIndex = "prayer_widgets.verse_index"
  /// The prayer time ("yyyy-MM-dd:index") the verse was last changed for
  static let versePeriod = "prayer_widgets.verse_period"
  /// When the verse period was last checked (epoch millis); the widget counts the prayer times passed since then
  static let versePeriodAt = "prayer_widgets.verse_period_at"
}

enum PrayerCoreError: Error {
  case invalid(String)
}

/// One day of the config: "yyyy-MM-dd", six "HH:mm" times, the date line shown under them and whether it is in Ramadan.
struct PrayerDay {
  let date: String
  let times: [String]
  let info: String
  let ramadan: Bool
}

/// A kandil or blessed-day reminder, due at epoch millis `at`, with its translated title and text.
struct PrayerReminder {
  let at: Int64
  let title: String
  let text: String
}

/// Texts from JS, already translated; `%1` is replaced with a prayer's name, `%2` with minutes.
struct PrayerTexts {
  let alertAt: String
  let alertBefore: String
  let cuma: String
  let kaza: String
  let sahur: String
  let iftar: String
  let prayed: String
  let notPrayed: String
  let madeUp: String
  let kerahat: String
  /// Prayer names in kaza texts ("Sabah" instead of "İmsak")
  let kazaLabels: [String]
}

struct PrayerConfig {
  let location: String
  let labels: [String]
  let untilFormat: String
  let ongoing: Bool
  let collapsedTimes: Bool
  /// Per prayer: alert when its time begins
  let alertAt: [Bool]
  /// Per prayer: also alert this many minutes before (0 = no)
  let alertBefore: [Int]
  /// Per prayer: "default", "vibrate", "silent" or a file name in Library/Sounds
  let alertSound: [String]
  /// Fridays: remind this many minutes before öğle (0 = off)
  let cumaBefore: Int
  let kaza: Bool
  let fastingRamadan: Bool
  let fastingMode: Bool
  let sahurBefore: Int
  let iftar: Bool
  let kerahatAfterSunrise: Int
  let kerahatBeforeOgle: Int
  let kerahatBeforeAksam: Int
  let texts: PrayerTexts
  let days: [String: PrayerDay]
  /// Kandil nights and blessed days, soonest first; not tied to the prayer times
  let reminders: [PrayerReminder]
}

/// What the countdown shows at a given moment.
struct PrayerState {
  let day: PrayerDay
  /// Date the current prayer belongs to: before imsak it is still the previous night's yatsı
  let currentDate: String
  let currentIndex: Int
  let nextIndex: Int
  /// Epoch millis
  let nextAt: Int64
  let inKerahat: Bool
  /// When the display has to change: the next prayer time, kerahat boundary or midnight (epoch millis).
  let refreshAt: Int64
}

// MARK: - JSON helpers mirroring org.json's opt* defaults

private func optBool(_ obj: [String: Any]?, _ key: String, _ fallback: Bool = false) -> Bool {
  (obj?[key] as? NSNumber)?.boolValue ?? fallback
}

private func optInt(_ obj: [String: Any]?, _ key: String) -> Int {
  (obj?[key] as? NSNumber)?.intValue ?? 0
}

private func optString(_ obj: [String: Any]?, _ key: String, _ fallback: String = "") -> String {
  if let value = obj?[key] as? String { return value }
  if let value = obj?[key], !(value is NSNull) { return "\(value)" }
  return fallback
}

private func stringArray(_ value: Any?) -> [String]? {
  guard let array = value as? [Any] else { return nil }
  return array.map { ($0 as? String) ?? "\($0)" }
}

func parseJsonObject(_ json: String) throws -> [String: Any] {
  guard let data = json.data(using: .utf8),
        let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
    throw PrayerCoreError.invalid("Not a JSON object")
  }
  return obj
}

/// Parses the notification config, or the widgets' times part of it (the rest is optional).
func parsePrayerConfig(_ json: String) throws -> PrayerConfig {
  let obj = try parseJsonObject(json)
  guard let labels = stringArray(obj["labels"]), labels.count == PRAYER_COUNT else {
    throw PrayerCoreError.invalid("Expected \(PRAYER_COUNT) labels")
  }
  guard let daysArr = obj["days"] as? [[String: Any]] else { throw PrayerCoreError.invalid("No days") }
  var days: [String: PrayerDay] = [:]
  for d in daysArr {
    guard let date = d["date"] as? String, let times = stringArray(d["times"]), times.count == PRAYER_COUNT else {
      throw PrayerCoreError.invalid("Expected \(PRAYER_COUNT) times")
    }
    days[date] = PrayerDay(date: date, times: times, info: optString(d, "info"), ramadan: optBool(d, "ramadan"))
  }
  guard let location = obj["location"] as? String, let untilFormat = obj["untilFormat"] as? String else {
    throw PrayerCoreError.invalid("No location")
  }
  let alerts = obj["alerts"] as? [Any]
  func alert(_ i: Int) -> [String: Any]? { (alerts != nil && i < alerts!.count) ? alerts![i] as? [String: Any] : nil }
  let texts = obj["texts"] as? [String: Any]
  let kazaLabels = stringArray(texts?["kazaLabels"])
  let cuma = obj["cuma"] as? [String: Any]
  let kaza = obj["kaza"] as? [String: Any]
  let fasting = obj["fasting"] as? [String: Any]
  let kerahat = obj["kerahat"] as? [String: Any]
  let reminders = ((obj["reminders"] as? [[String: Any]]) ?? []).compactMap { r -> PrayerReminder? in
    guard let at = r["at"] as? NSNumber, let title = r["title"] as? String else { return nil }
    return PrayerReminder(at: at.int64Value, title: title, text: optString(r, "text"))
  }
  return PrayerConfig(
    location: location,
    labels: labels,
    untilFormat: untilFormat,
    ongoing: optBool(obj, "ongoing", true),
    collapsedTimes: optBool(obj, "collapsedTimes"),
    alertAt: (0..<PRAYER_COUNT).map { optBool(alert($0), "atTime") },
    alertBefore: (0..<PRAYER_COUNT).map { optInt(alert($0), "before") },
    alertSound: (0..<PRAYER_COUNT).map { let s = optString(alert($0), "sound"); return s.isEmpty ? "default" : s },
    cumaBefore: optBool(cuma, "enabled") ? optInt(cuma, "before") : 0,
    kaza: optBool(kaza, "enabled"),
    fastingRamadan: optBool(fasting, "ramadan"),
    fastingMode: optBool(fasting, "mode"),
    sahurBefore: optInt(fasting, "sahurBefore"),
    iftar: optBool(fasting, "iftar"),
    kerahatAfterSunrise: optInt(kerahat, "afterSunrise"),
    kerahatBeforeOgle: optInt(kerahat, "beforeOgle"),
    kerahatBeforeAksam: optInt(kerahat, "beforeAksam"),
    texts: PrayerTexts(
      alertAt: optString(texts, "alertAt", "%1"),
      alertBefore: optString(texts, "alertBefore", "%1 (%2)"),
      cuma: optString(texts, "cuma", "%2"),
      kaza: optString(texts, "kaza", "%1"),
      sahur: optString(texts, "sahur", "%2"),
      iftar: optString(texts, "iftar", "%1"),
      prayed: optString(texts, "prayed", "OK"),
      notPrayed: optString(texts, "notPrayed", "No"),
      madeUp: optString(texts, "madeUp", "OK"),
      kerahat: optString(texts, "kerahat"),
      kazaLabels: kazaLabels?.count == PRAYER_COUNT ? kazaLabels! : labels
    ),
    days: days,
    reminders: reminders
  )
}

// MARK: - Dates (local time, epoch millis like the Kotlin code)

enum PrayerTime {
  /// Gregorian in the current time zone, like the app's "yyyy-MM-dd" dates, whatever calendar the phone is set to (Hijri, Buddhist...)
  static var calendar: Calendar {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = .current
    return calendar
  }

  static func nowMillis() -> Int64 { Int64((Date().timeIntervalSince1970 * 1000).rounded()) }

  static func date(_ millis: Int64) -> Date { Date(timeIntervalSince1970: Double(millis) / 1000) }

  static func millis(_ date: Date) -> Int64 { Int64((date.timeIntervalSince1970 * 1000).rounded()) }

  /// Local midnight of the day holding `millis`, moved by `offsetDays`.
  static func startOfDay(_ millis: Int64, _ offsetDays: Int = 0) -> Date {
    let start = calendar.startOfDay(for: date(millis))
    return offsetDays == 0 ? start : calendar.date(byAdding: .day, value: offsetDays, to: start)!
  }

  static func dateKey(_ day: Date) -> String {
    let c = calendar.dateComponents([.year, .month, .day], from: day)
    return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
  }

  /// Epoch millis of "HH:mm" on the day starting at `dayStart` (local midnight).
  static func timeOn(_ dayStart: Date, _ hhmm: String) -> Int64 {
    let parts = hhmm.split(separator: ":").map { Int($0.trimmingCharacters(in: .whitespaces)) ?? 0 }
    let h = parts.count > 0 ? parts[0] : 0
    let m = parts.count > 1 ? parts[1] : 0
    var components = calendar.dateComponents([.year, .month, .day], from: dayStart)
    components.hour = h
    components.minute = m
    components.second = 0
    return millis(calendar.date(from: components) ?? dayStart)
  }
}

/// Kerahat windows of a day as [start, end) pairs: after güneş, before öğle (istiva) and before akşam.
private func kerahatWindows(_ config: PrayerConfig, _ dayStart: Date, _ day: PrayerDay) -> [(Int64, Int64)] {
  if config.texts.kerahat.isEmpty { return [] }
  let gunes = PrayerTime.timeOn(dayStart, day.times[PRAYER_GUNES])
  let ogle = PrayerTime.timeOn(dayStart, day.times[PRAYER_OGLE])
  let aksam = PrayerTime.timeOn(dayStart, day.times[PRAYER_AKSAM])
  return [
    (gunes, gunes + Int64(config.kerahatAfterSunrise) * 60_000),
    (ogle - Int64(config.kerahatBeforeOgle) * 60_000, ogle),
    (aksam - Int64(config.kerahatBeforeAksam) * 60_000, aksam),
  ].filter { $0.1 > $0.0 }
}

/// The countdown state at `now` (epoch millis); nil when there are no times for today (or tomorrow, after yatsı).
func computePrayerState(_ config: PrayerConfig, _ now: Int64) -> PrayerState? {
  let todayStart = PrayerTime.startOfDay(now)
  let tomorrowStart = PrayerTime.startOfDay(now, 1)
  guard let today = config.days[PrayerTime.dateKey(todayStart)] else { return nil }
  let todayTimes = today.times.map { PrayerTime.timeOn(todayStart, $0) }

  let nextToday = todayTimes.firstIndex { $0 > now } ?? -1
  let nextIndex: Int
  let nextAt: Int64
  if nextToday >= 0 {
    nextIndex = nextToday
    nextAt = todayTimes[nextToday]
  } else {
    // After yatsı: count down to tomorrow's imsak
    guard let tomorrow = config.days[PrayerTime.dateKey(tomorrowStart)] else { return nil }
    nextIndex = 0
    nextAt = PrayerTime.timeOn(tomorrowStart, tomorrow.times[0])
  }
  // Before imsak it is still the previous night's yatsı
  let currentIndex = nextToday == 0 ? PRAYER_COUNT - 1 : (nextToday < 0 ? PRAYER_COUNT : nextToday) - 1
  let currentDate = nextToday == 0 ? PrayerTime.dateKey(PrayerTime.startOfDay(now, -1)) : today.date

  let kerahat = kerahatWindows(config, todayStart, today)
  let inKerahat = kerahat.contains { now >= $0.0 && now < $0.1 }
  let boundaries = kerahat.flatMap { [$0.0, $0.1] }.filter { $0 > now }
  let refreshAt = (boundaries + [nextAt, PrayerTime.millis(tomorrowStart)]).min()!
  return PrayerState(
    day: today, currentDate: currentDate, currentIndex: currentIndex, nextIndex: nextIndex,
    nextAt: nextAt, inKerahat: inKerahat, refreshAt: refreshAt
  )
}

// MARK: - Widget verses

enum PrayerVerseMode {
  case prayer, tap, fixed
}

/// A verse as the widgets show it: `ref` ("Bakara, 255") and the translation come from JS, already translated.
struct PrayerWidgetVerse {
  let surah: Int
  let verse: Int
  let ref: String
  let arabic: String
  let meal: String
}

struct PrayerVerseData {
  let mode: PrayerVerseMode
  /// Changes when JS sends a new pool, which starts from its first verse
  let poolId: String
  /// "Tap for a new verse", shown in tap mode
  let hint: String
  let verses: [PrayerWidgetVerse]
}

func parsePrayerVerses(_ json: String) throws -> PrayerVerseData {
  let obj = try parseJsonObject(json)
  guard let arr = obj["verses"] as? [[String: Any]], let modeName = obj["mode"] as? String else {
    throw PrayerCoreError.invalid("No verses")
  }
  let verses = try arr.map { v -> PrayerWidgetVerse in
    guard let surah = v["surah"] as? NSNumber, let verse = v["verse"] as? NSNumber,
          let ref = v["ref"] as? String, let arabic = v["arabic"] as? String, let meal = v["meal"] as? String else {
      throw PrayerCoreError.invalid("Bad verse")
    }
    return PrayerWidgetVerse(surah: surah.intValue, verse: verse.intValue, ref: ref, arabic: arabic, meal: meal)
  }
  let mode: PrayerVerseMode = modeName == "tap" ? .tap : (modeName == "fixed" ? .fixed : .prayer)
  return PrayerVerseData(mode: mode, poolId: optString(obj, "poolId"), hint: optString(obj, "hint"), verses: verses)
}

/// Index into the pool, wrapped like Math.floorMod.
func prayerFloorMod(_ a: Int, _ n: Int) -> Int {
  let r = a % n
  return r < 0 ? r + n : r
}
