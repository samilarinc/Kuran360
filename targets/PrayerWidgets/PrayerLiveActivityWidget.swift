import ActivityKit
import SwiftUI
import WidgetKit

// The countdown Live Activity (see PrayerActivityAttributes): the next prayer and the time left until
// it, on the lock screen and in the Dynamic Island. Once the next prayer time has come (`isStale`), it
// counts down to the one after; the app sends fresh times whenever it is opened.

private let green = Color(red: 0x2E / 255, green: 0x7D / 255, blue: 0x32 / 255)

private extension ActivityViewContext where Attributes == PrayerActivityAttributes {
  /// The prayer counted down to now
  var target: PrayerActivityTime { isStale ? state.after : state.next }

  var title: String { state.untilFormat.replacingOccurrences(of: "%s", with: target.label) }
}

/// Counts down to `target`; timer texts tick on their own, without updates from the app.
private struct ActivityCountdown: View {
  let target: Date

  var body: some View {
    let now = Date()
    Text(timerInterval: now...max(target, now), countsDown: true)
      .monospacedDigit()
  }
}

private struct LockScreenView: View {
  let context: ActivityViewContext<PrayerActivityAttributes>

  var body: some View {
    HStack(alignment: .center, spacing: 12) {
      VStack(alignment: .leading, spacing: 2) {
        Text(context.title)
          .font(.subheadline.weight(.medium))
          .foregroundStyle(.white.opacity(0.85))
          .lineLimit(1)
        Text("\(context.target.time) · \(context.state.location)")
          .font(.caption)
          .foregroundStyle(.white.opacity(0.7))
          .lineLimit(1)
      }
      Spacer(minLength: 8)
      ActivityCountdown(target: context.target.at)
        .font(.system(size: 30, weight: .bold))
        .foregroundStyle(.white)
        .multilineTextAlignment(.trailing)
        .frame(maxWidth: 140, alignment: .trailing)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 14)
    .activityBackgroundTint(green)
    .activitySystemActionForegroundColor(.white)
    .widgetURL(URL(string: "kuran360://prayer-times"))
  }
}

struct PrayerLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PrayerActivityAttributes.self) { context in
      LockScreenView(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Text(context.target.label).font(.headline).lineLimit(1)
            Text(context.target.time).font(.caption).foregroundStyle(.secondary)
          }
          .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          ActivityCountdown(target: context.target.at)
            .font(.title2.weight(.bold))
            .multilineTextAlignment(.trailing)
            .frame(maxWidth: 110, alignment: .trailing)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text(context.state.location).font(.caption).foregroundStyle(.secondary).lineLimit(1)
        }
      } compactLeading: {
        Text(context.target.label)
          .font(.caption.weight(.semibold))
          .foregroundStyle(green)
          .lineLimit(1)
          .frame(maxWidth: 56)
      } compactTrailing: {
        ActivityCountdown(target: context.target.at)
          .font(.caption.weight(.semibold))
          .multilineTextAlignment(.trailing)
          .frame(maxWidth: 52)
      } minimal: {
        Image(systemName: "moon.stars.fill").foregroundStyle(green)
      }
      .widgetURL(URL(string: "kuran360://prayer-times"))
      .keylineTint(green)
    }
  }
}
