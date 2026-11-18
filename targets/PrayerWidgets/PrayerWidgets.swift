import AppIntents
import SwiftUI
import WidgetKit

// The home screen widgets on iOS: a SwiftUI port of PrayerWidgets.kt and its layouts. The times and
// verses come from the app through the App Group (see PrayerWidgetStore in modules/prayer-notification/ios);
// countdowns are timer texts the system ticks on its own, and the timeline has an entry at each prayer
// time, kerahat edge and midnight, which is also when the verse moves on.

// MARK: - Texts (the widget gallery and empty states; everything else comes translated from the app)

private enum WidgetText {
  static var turkish: Bool { Locale.preferredLanguages.first?.hasPrefix("tr") ?? false }

  static var noData: String { turkish ? "Vakitler için Kuran360'ı açın" : "Open Kuran360 to load the prayer times" }
  static var noVerse: String { turkish ? "Ayetler için Kuran360'ı açın" : "Open Kuran360 to load the verses" }
  static var countdownLabel: String { turkish ? "Vakit sayacı" : "Prayer countdown" }
  static var countdownDescription: String { turkish ? "Sıradaki vakit ve ona kalan süre" : "The next prayer and the time left until it" }
  static var timesLabel: String { turkish ? "Vakitler" : "Prayer times" }
  static var timesDescription: String { turkish ? "Bugünün altı vakti ve sıradakine kalan süre" : "Today's six prayer times and the time left until the next" }
  static var verseLabel: String { turkish ? "Ayet" : "Verse" }
  static var verseDescription: String {
    turkish ? "Arapçası ve mealiyle bir ayet; her vakitte, dokununca ya da sabit" : "A verse in Arabic with its translation; each prayer time, on tap or fixed"
  }
  static var combinedLabel: String { turkish ? "Vakitler ve ayet" : "Prayer times and verse" }
  static var combinedDescription: String { turkish ? "Üstte vakitler ve geri sayım, altta bir ayet" : "The prayer times and countdown on top, a verse below" }
  static var nextVerse: String { turkish ? "Yeni ayet" : "New verse" }

  /// Shown in the widget gallery before the app has sent anything
  static var previewLabels: [String] {
    turkish ? ["İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"] : ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
  }
  static var previewUntil: String { turkish ? "%s vaktine" : "Until %s" }
  static var previewMeal: String { turkish ? "Rahmân ve Rahîm olan Allah'ın adıyla." : "In the name of Allah, the Most Gracious, the Most Merciful." }
  static var previewRef: String { turkish ? "Fatiha, 1" : "Al-Fatiha, 1" }
}

// MARK: - Colors (as in res/values/colors.xml and values-night)

private struct WidgetColors {
  let background: Color
  let text: Color
  let secondary: Color
  let meal: Color
  let hint: Color
  let divider: Color
  let current: Color

  static func of(_ scheme: ColorScheme) -> WidgetColors {
    scheme == .dark
      ? WidgetColors(
        background: Color(red: 0x1B / 255, green: 0x21 / 255, blue: 0x1C / 255),
        text: Color(red: 0xF1 / 255, green: 0xF5 / 255, blue: 0xF1 / 255),
        secondary: Color(red: 0xB5 / 255, green: 0xC7 / 255, blue: 0xB6 / 255),
        meal: Color(red: 0xDC / 255, green: 0xE5 / 255, blue: 0xDC / 255),
        hint: Color(red: 0x8F / 255, green: 0xA3 / 255, blue: 0x91 / 255),
        divider: Color.white.opacity(0.2),
        current: Color(red: 0x2E / 255, green: 0x7D / 255, blue: 0x32 / 255).opacity(0.55))
      : WidgetColors(
        background: Color(red: 0x2E / 255, green: 0x7D / 255, blue: 0x32 / 255),
        text: .white,
        secondary: Color.white.opacity(0.8),
        meal: Color.white.opacity(0.9),
        hint: Color.white.opacity(0.6),
        divider: Color.white.opacity(0.2),
        current: Color.white.opacity(0.2))
  }
}

// MARK: - Data

private var sharedDefaults: UserDefaults { UserDefaults(suiteName: PRAYER_APP_GROUP) ?? .standard }

/// Today's times at an entry's moment; nil when the app hasn't sent them or the year's data ran out.
struct WidgetTimes {
  let config: PrayerConfig
  let state: PrayerState
}

struct PrayerEntry: TimelineEntry {
  let date: Date
  let times: WidgetTimes?
  let verseData: PrayerVerseData?
  let verse: PrayerWidgetVerse?
}

private func loadConfig() -> PrayerConfig? {
  sharedDefaults.string(forKey: PrayerWidgetKeys.data).flatMap { try? parsePrayerConfig($0) }
}

private func loadVerses() -> PrayerVerseData? {
  sharedDefaults.string(forKey: PrayerWidgetKeys.verses).flatMap { try? parsePrayerVerses($0) }
}

private func period(_ state: PrayerState) -> String { "\(state.currentDate):\(state.currentIndex)" }

/// Sample data for the widget gallery.
private func previewEntry() -> PrayerEntry {
  let today = PrayerTime.dateKey(PrayerTime.startOfDay(PrayerTime.nowMillis()))
  let times = ["05:30", "07:01", "13:05", "16:12", "18:44", "20:08"]
  let json: [String: Any] = [
    "location": "İstanbul",
    "labels": WidgetText.previewLabels,
    "untilFormat": WidgetText.previewUntil,
    "days": [["date": today, "times": times, "info": ""]],
  ]
  let data = (try? JSONSerialization.data(withJSONObject: json)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
  let now = Date()
  let config = try? parsePrayerConfig(data)
  let state = config.flatMap { computePrayerState($0, PrayerTime.millis(now)) }
  let verse = PrayerWidgetVerse(surah: 1, verse: 1, ref: WidgetText.previewRef, arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", meal: WidgetText.previewMeal)
  return PrayerEntry(
    date: now,
    times: config.flatMap { c in state.map { WidgetTimes(config: c, state: $0) } },
    verseData: PrayerVerseData(mode: .fixed, poolId: "", hint: "", verses: [verse]),
    verse: verse)
}

struct PrayerProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerEntry { previewEntry() }

  func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
    if context.isPreview {
      completion(previewEntry())
    } else {
      completion(buildEntries(save: false).first ?? previewEntry())
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
    let entries = buildEntries(save: true)
    // Without times the app has to send new ones; it reloads the widgets when it does
    completion(Timeline(entries: entries, policy: entries.count > 1 ? .atEnd : .never))
  }

  /**
   * An entry now and at each later change (prayer time, kerahat edge, midnight) for about a day. In
   * prayer mode the verse moves on once each time a new prayer time comes in, counted from the last
   * stored check, so every reload continues where the shown entries left off.
   */
  private func buildEntries(save: Bool) -> [PrayerEntry] {
    let defaults = sharedDefaults
    let now = PrayerTime.nowMillis()
    let config = loadConfig()
    let verseData = loadVerses()
    var index = defaults.integer(forKey: PrayerWidgetKeys.verseIndex)
    var lastPeriod = defaults.string(forKey: PrayerWidgetKeys.versePeriod)

    if verseData?.mode == .prayer, let config {
      // Catch up on the prayer times passed since the last check
      let storedAt = defaults.object(forKey: PrayerWidgetKeys.versePeriodAt) as? NSNumber
      var t = min(storedAt?.int64Value ?? now, now)
      var steps = 0
      while steps < 500, let state = computePrayerState(config, t) {
        let p = period(state)
        if p != lastPeriod {
          // The first check after a new pool only notes the prayer time; the pool starts from its first verse
          if lastPeriod != nil { index += 1 }
          lastPeriod = p
        }
        if state.refreshAt > now { break }
        t = state.refreshAt
        steps += 1
      }
      if steps >= 500, let state = computePrayerState(config, now) { lastPeriod = period(state) }
      if save {
        defaults.set(index, forKey: PrayerWidgetKeys.verseIndex)
        defaults.set(lastPeriod, forKey: PrayerWidgetKeys.versePeriod)
        defaults.set(NSNumber(value: now), forKey: PrayerWidgetKeys.versePeriodAt)
      }
    }

    func verse(_ i: Int) -> PrayerWidgetVerse? {
      guard let verses = verseData?.verses, !verses.isEmpty else { return nil }
      return verses[prayerFloorMod(i, verses.count)]
    }

    var entries: [PrayerEntry] = []
    var t = now
    while entries.count < 40 {
      let state = config.flatMap { computePrayerState($0, t) }
      if verseData?.mode == .prayer, let state, period(state) != lastPeriod {
        if lastPeriod != nil { index += 1 }
        lastPeriod = period(state)
      }
      let times = config.flatMap { c in state.map { WidgetTimes(config: c, state: $0) } }
      entries.append(PrayerEntry(date: PrayerTime.date(t), times: times, verseData: verseData, verse: verse(index)))
      guard let state, t - now < 26 * 3_600_000 else { break }
      t = state.refreshAt
    }
    return entries
  }
}

/// The verse widgets' "new verse" button (tap mode): moves the pool on; WidgetKit reloads the widgets after it.
struct NextVerseIntent: AppIntent {
  static let title: LocalizedStringResource = "New verse"

  func perform() async throws -> some IntentResult {
    let defaults = sharedDefaults
    defaults.set(defaults.integer(forKey: PrayerWidgetKeys.verseIndex) + 1, forKey: PrayerWidgetKeys.verseIndex)
    return .result()
  }
}

// MARK: - Views

/// Opens the app at `path` ("prayer-times", "surah/2/verse/255"), which React Native hands to JS as a link.
private func appURL(_ path: String) -> URL { URL(string: "kuran360://\(path)")! }

private struct Countdown: View {
  let entry: PrayerEntry
  let state: PrayerState

  var body: some View {
    let end = max(PrayerTime.date(state.nextAt), entry.date)
    Text(timerInterval: entry.date...end, countsDown: true)
      .monospacedDigit()
  }
}

private struct CountdownView: View {
  let entry: PrayerEntry
  @Environment(\.colorScheme) private var scheme

  var body: some View {
    let colors = WidgetColors.of(scheme)
    VStack(spacing: 4) {
      if let times = entry.times {
        Text(times.config.labels[times.state.nextIndex])
          .font(.subheadline.weight(.medium))
          .foregroundStyle(colors.secondary)
          .lineLimit(1)
        Countdown(entry: entry, state: times.state)
          .font(.system(size: 26, weight: .bold))
          .foregroundStyle(colors.text)
          .multilineTextAlignment(.center)
          .minimumScaleFactor(0.6)
          .lineLimit(1)
      } else {
        Text(WidgetText.noData).font(.caption).foregroundStyle(colors.text).multilineTextAlignment(.center)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .containerBackground(colors.background, for: .widget)
    .widgetURL(appURL("prayer-times"))
  }
}

/// The times part (widget_times_part.xml): the countdown to the next prayer and today's six times, the current one marked.
private struct TimesPart: View {
  let entry: PrayerEntry
  let colors: WidgetColors

  var body: some View {
    if let times = entry.times {
      let config = times.config
      let state = times.state
      VStack(spacing: 8) {
        HStack(alignment: .firstTextBaseline) {
          Text(config.untilFormat.replacingOccurrences(of: "%s", with: config.labels[state.nextIndex]))
            .font(.subheadline)
            .foregroundStyle(colors.secondary)
            .lineLimit(1)
          Spacer(minLength: 8)
          Countdown(entry: entry, state: state)
            .font(.title3.weight(.bold))
            .foregroundStyle(colors.text)
            .multilineTextAlignment(.trailing)
            .lineLimit(1)
        }
        HStack(spacing: 2) {
          ForEach(0..<PRAYER_COUNT, id: \.self) { i in
            VStack(spacing: 2) {
              Text(config.labels[i]).font(.caption2).foregroundStyle(colors.secondary).lineLimit(1).minimumScaleFactor(0.7)
              Text(state.day.times[i]).font(.footnote.weight(.semibold)).foregroundStyle(colors.text).monospacedDigit().lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
            .background(RoundedRectangle(cornerRadius: 6).fill(i == state.currentIndex ? colors.current : .clear))
          }
        }
      }
    } else {
      Text(WidgetText.noData).font(.caption).foregroundStyle(colors.text).frame(maxWidth: .infinity)
    }
  }
}

/// The verse part (widget_verse_part.xml). In tap mode the verse is a button for a new one and the
/// reference line opens it; otherwise the whole part opens the verse in the app.
private struct VersePart: View {
  let entry: PrayerEntry
  let colors: WidgetColors

  var body: some View {
    if let data = entry.verseData, let verse = entry.verse {
      let open = appURL("surah/\(verse.surah)/verse/\(verse.verse)")
      let content = VStack(spacing: 6) {
        Text(verse.arabic)
          .font(.system(size: 18))
          .foregroundStyle(colors.text)
          .multilineTextAlignment(.center)
          .environment(\.layoutDirection, .rightToLeft)
          .minimumScaleFactor(0.6)
        Text(verse.meal)
          .font(.footnote)
          .foregroundStyle(colors.meal)
          .multilineTextAlignment(.center)
          .minimumScaleFactor(0.6)
        Spacer(minLength: 0)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)

      VStack(spacing: 4) {
        if data.mode == .tap {
          Button(intent: NextVerseIntent()) { content }.buttonStyle(.plain)
        } else {
          Link(destination: open) { content }
        }
        HStack {
          if data.mode == .tap && !data.hint.isEmpty {
            Text(data.hint).font(.caption2).foregroundStyle(colors.hint).lineLimit(1)
          }
          Spacer(minLength: 4)
          Link(destination: open) {
            Text(verse.ref).font(.caption.weight(.medium)).foregroundStyle(colors.secondary).lineLimit(1)
          }
        }
      }
    } else {
      Link(destination: appURL("")) {
        Text(WidgetText.noVerse).font(.caption).foregroundStyle(colors.text).frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    }
  }
}

private struct TimesView: View {
  let entry: PrayerEntry
  @Environment(\.colorScheme) private var scheme

  var body: some View {
    let colors = WidgetColors.of(scheme)
    TimesPart(entry: entry, colors: colors)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .containerBackground(colors.background, for: .widget)
      .widgetURL(appURL("prayer-times"))
  }
}

private struct VerseView: View {
  let entry: PrayerEntry
  @Environment(\.colorScheme) private var scheme

  var body: some View {
    let colors = WidgetColors.of(scheme)
    VersePart(entry: entry, colors: colors)
      .containerBackground(colors.background, for: .widget)
  }
}

private struct CombinedView: View {
  let entry: PrayerEntry
  @Environment(\.colorScheme) private var scheme

  var body: some View {
    let colors = WidgetColors.of(scheme)
    VStack(spacing: 10) {
      Link(destination: appURL("prayer-times")) { TimesPart(entry: entry, colors: colors) }
      Rectangle().fill(colors.divider).frame(height: 1)
      VersePart(entry: entry, colors: colors)
    }
    .containerBackground(colors.background, for: .widget)
  }
}

// MARK: - Widgets

struct CountdownWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "CountdownWidget", provider: PrayerProvider()) { CountdownView(entry: $0) }
      .configurationDisplayName(WidgetText.countdownLabel)
      .description(WidgetText.countdownDescription)
      .supportedFamilies([.systemSmall])
  }
}

struct TimesWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TimesWidget", provider: PrayerProvider()) { TimesView(entry: $0) }
      .configurationDisplayName(WidgetText.timesLabel)
      .description(WidgetText.timesDescription)
      .supportedFamilies([.systemMedium])
  }
}

struct VerseWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "VerseWidget", provider: PrayerProvider()) { VerseView(entry: $0) }
      .configurationDisplayName(WidgetText.verseLabel)
      .description(WidgetText.verseDescription)
      .supportedFamilies([.systemMedium, .systemLarge])
  }
}

struct CombinedWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "CombinedWidget", provider: PrayerProvider()) { CombinedView(entry: $0) }
      .configurationDisplayName(WidgetText.combinedLabel)
      .description(WidgetText.combinedDescription)
      .supportedFamilies([.systemLarge])
  }
}

@main
struct PrayerWidgetsBundle: WidgetBundle {
  var body: some Widget {
    CountdownWidget()
    TimesWidget()
    VerseWidget()
    CombinedWidget()
  }
}
