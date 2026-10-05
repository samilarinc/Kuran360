package expo.modules.prayernotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

private val HANDLED_ACTIONS = setOf(
  ACTION_REFRESH,
  Intent.ACTION_BOOT_COMPLETED,
  Intent.ACTION_MY_PACKAGE_REPLACED,
  Intent.ACTION_TIME_CHANGED,
  Intent.ACTION_TIMEZONE_CHANGED,
  "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED",
)

/**
 * Rebuilds the ongoing prayer times notification at each prayer time, after a reboot or update, and
 * when the clock or time zone changes; schedules it back when the user swipes it away; shows alerts
 * and handles their "Kıldım" / "Kılmadım" / "Kaza kıldım" buttons.
 */
class PrayerAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_DISMISSED -> PrayerNotifier.onDismissed(context)
      ACTION_ALERT -> PrayerNotifier.onAlert(context, intent)
      ACTION_PRAYED, ACTION_MISSED, ACTION_MADE_UP -> PrayerNotifier.onAnswer(context, intent)
      in HANDLED_ACTIONS -> PrayerNotifier.refresh(context)
    }
  }
}
