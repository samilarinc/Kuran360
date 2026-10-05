package expo.modules.prayernotification

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews

private const val PREFS = "prayer_widgets"
/** The times the widgets show (location, labels and days, as in the notification config); kept even when notifications are off */
private const val KEY_DATA = "data"
const val ACTION_WIDGET_REFRESH = "expo.modules.prayernotification.WIDGET_REFRESH"

/** 1x1: the next prayer's name and the countdown to it. */
class CountdownWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = PrayerWidgets.updateAll(context)

  override fun onDisabled(context: Context) = PrayerWidgets.updateAll(context)
}

/**
 * Home screen widgets. The times come from JS (see syncPrayerWidgets in src/services/prayerTimes.ts)
 * and are kept in SharedPreferences, like the notification config. Countdowns are Chronometers the
 * launcher ticks on its own; one alarm at the next prayer time (or midnight) rebuilds the widgets.
 */
object PrayerWidgets {
  fun setData(context: Context, json: String) {
    PrayerNotifier.parseConfig(json) // reject bad data before replacing the stored one
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_DATA, json).apply()
    updateAll(context)
  }

  /** Rebuilds every widget for this moment and schedules the next rebuild; cancels it when there are no widgets. */
  fun updateAll(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val countdownIds = manager.getAppWidgetIds(ComponentName(context, CountdownWidget::class.java))
    if (countdownIds.isEmpty()) {
      cancelRefresh(context)
      return
    }
    val config = loadData(context)
    val now = System.currentTimeMillis()
    // No times for today: the app hasn't sent them yet, or the year's data ran out
    val state = config?.let { PrayerNotifier.computeState(it, now) }
    if (config == null || state == null) {
      manager.updateAppWidget(countdownIds, countdownViews(context, null, null, now))
      cancelRefresh(context)
      return
    }
    manager.updateAppWidget(countdownIds, countdownViews(context, config, state, now))
    PrayerNotifier.scheduleScreenUpdate(context, state.refreshAt, refreshIntent(context))
  }

  private fun countdownViews(context: Context, config: Config?, state: State?, now: Long) =
    RemoteViews(context.packageName, R.layout.widget_countdown).apply {
      if (config == null || state == null) {
        setViewVisibility(R.id.widget_label, View.GONE)
        setViewVisibility(R.id.widget_countdown, View.GONE)
        setViewVisibility(R.id.widget_empty, View.VISIBLE)
      } else {
        setViewVisibility(R.id.widget_label, View.VISIBLE)
        setViewVisibility(R.id.widget_countdown, View.VISIBLE)
        setViewVisibility(R.id.widget_empty, View.GONE)
        setTextViewText(R.id.widget_label, config.labels[state.nextIndex])
        setChronometer(R.id.widget_countdown, SystemClock.elapsedRealtime() + (state.nextAt - now), null, true)
        setChronometerCountDown(R.id.widget_countdown, true)
      }
      setOnClickPendingIntent(R.id.widget_root, openAppIntent(context, "prayer-times"))
    }

  private fun loadData(context: Context): Config? {
    val json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DATA, null) ?: return null
    return try {
      PrayerNotifier.parseConfig(json)
    } catch (e: Exception) {
      null
    }
  }

  /**
   * Opens the app at `path` ("prayer-times"): a VIEW intent, which React Native hands to JS as a
   * link (Linking), sent straight to the app's own activity.
   */
  private fun openAppIntent(context: Context, path: String): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("kuran360://$path"))
      .setComponent(launch.component)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun refreshIntent(context: Context): PendingIntent {
    val intent = Intent(context, PrayerAlarmReceiver::class.java).setAction(ACTION_WIDGET_REFRESH)
    return PendingIntent.getBroadcast(context, 3, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun cancelRefresh(context: Context) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(refreshIntent(context))
  }
}
