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
import org.json.JSONObject

private const val PREFS = "prayer_widgets"
/** The times the widgets show (location, labels and days, as in the notification config); kept even when notifications are off */
private const val KEY_DATA = "data"
/** The verses the verse widgets show (see syncVerseWidget in src/services/widgets.ts) */
private const val KEY_VERSES = "verses"
/** Position in the verse pool; grows by one per prayer time or tap and wraps around the pool */
private const val KEY_VERSE_INDEX = "verse_index"
/** The prayer time ("yyyy-MM-dd:index") the verse was last changed for, so it changes once per prayer time */
private const val KEY_VERSE_PERIOD = "verse_period"
const val ACTION_WIDGET_REFRESH = "expo.modules.prayernotification.WIDGET_REFRESH"
const val ACTION_WIDGET_NEXT_VERSE = "expo.modules.prayernotification.WIDGET_NEXT_VERSE"

private const val PRAYER_COUNT = 6

private val WIDGET_CELL_IDS = intArrayOf(R.id.widget_cell_0, R.id.widget_cell_1, R.id.widget_cell_2, R.id.widget_cell_3, R.id.widget_cell_4, R.id.widget_cell_5)
private val WIDGET_LABEL_IDS = intArrayOf(R.id.widget_label_0, R.id.widget_label_1, R.id.widget_label_2, R.id.widget_label_3, R.id.widget_label_4, R.id.widget_label_5)
private val WIDGET_TIME_IDS = intArrayOf(R.id.widget_time_0, R.id.widget_time_1, R.id.widget_time_2, R.id.widget_time_3, R.id.widget_time_4, R.id.widget_time_5)

/** Resizable (1x1 by default): the next prayer's name and the countdown to it. */
class CountdownWidget : PrayerWidgetProvider()

/** Resizable (4x2 by default): the countdown and today's six times. */
class TimesWidget : PrayerWidgetProvider()

/** Resizable (4x2 by default): a verse in Arabic with its translation. */
class VerseWidget : PrayerWidgetProvider()

/** Resizable (4x3 by default): the times on top, a verse below. */
class CombinedWidget : PrayerWidgetProvider()

/** Every widget is rebuilt together, so the providers only differ in their class (and layout, see PrayerWidgets). */
open class PrayerWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = PrayerWidgets.updateAll(context)

  override fun onDisabled(context: Context) = PrayerWidgets.updateAll(context)
}

/** How the verse widgets pick their verse; set in the app's settings. */
private enum class VerseMode { PRAYER, TAP, FIXED }

/** A verse as the widgets show it: `ref` ("Bakara, 255") and the translation come from JS, already translated. */
private class WidgetVerse(val surah: Int, val verse: Int, val ref: String, val arabic: String, val meal: String)

private class VerseData(
  val mode: VerseMode,
  /** Changes when JS sends a new pool, which starts from its first verse */
  val poolId: String,
  /** "Tap for a new verse", shown in TAP mode */
  val hint: String,
  val verses: List<WidgetVerse>,
)

/** Today's times at this moment; null in the widgets when the app hasn't sent them or the year's data ran out. */
private class Times(val config: Config, val state: State)

/**
 * Home screen widgets. The times come from JS (see syncPrayerNotifications in src/services/prayerTimes.ts)
 * and the verses too (syncVerseWidget in src/services/widgets.ts); both are kept in SharedPreferences,
 * like the notification config. Countdowns are Chronometers the launcher ticks on its own; one alarm at
 * the next prayer time (or midnight) rebuilds the widgets, which is also when the verse changes.
 */
object PrayerWidgets {
  fun setData(context: Context, json: String) {
    PrayerNotifier.parseConfig(json) // reject bad data before replacing the stored one
    prefs(context).edit().putString(KEY_DATA, json).apply()
    updateAll(context)
  }

  /** Stores the verses for the verse widgets; a new pool (another poolId) starts from its first verse. */
  fun setVerses(context: Context, json: String) {
    val data = parseVerses(json)
    val oldPoolId = loadVerses(context)?.poolId
    val edit = prefs(context).edit().putString(KEY_VERSES, json)
    if (data.poolId != oldPoolId) edit.putInt(KEY_VERSE_INDEX, 0).remove(KEY_VERSE_PERIOD)
    edit.apply()
    updateAll(context)
  }

  /** The verse widgets' "new verse" tap */
  fun nextVerse(context: Context) {
    val prefs = prefs(context)
    prefs.edit().putInt(KEY_VERSE_INDEX, prefs.getInt(KEY_VERSE_INDEX, 0) + 1).apply()
    updateAll(context)
  }

  /** Rebuilds every widget for this moment and schedules the next rebuild; cancels it when there are no widgets. */
  fun updateAll(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val countdownIds = widgetIds(context, manager, CountdownWidget::class.java)
    val timesIds = widgetIds(context, manager, TimesWidget::class.java)
    val verseIds = widgetIds(context, manager, VerseWidget::class.java)
    val combinedIds = widgetIds(context, manager, CombinedWidget::class.java)
    if (countdownIds.isEmpty() && timesIds.isEmpty() && verseIds.isEmpty() && combinedIds.isEmpty()) {
      cancelRefresh(context)
      return
    }
    val now = System.currentTimeMillis()
    val config = loadData(context)
    val times = config?.let { PrayerNotifier.computeState(it, now) }?.let { Times(config, it) }
    val verseData = if (verseIds.isNotEmpty() || combinedIds.isNotEmpty()) loadVerses(context) else null
    val verse = verseData?.let { currentVerse(context, it, times) }

    if (countdownIds.isNotEmpty()) manager.updateAppWidget(countdownIds, countdownViews(context, times, now))
    if (timesIds.isNotEmpty()) {
      manager.updateAppWidget(timesIds, RemoteViews(context.packageName, R.layout.widget_times).apply {
        bindTimes(this, times, now)
        setOnClickPendingIntent(R.id.widget_root, openAppIntent(context, "prayer-times"))
      })
    }
    if (verseIds.isNotEmpty()) {
      manager.updateAppWidget(verseIds, RemoteViews(context.packageName, R.layout.widget_verse).apply {
        bindVerse(context, this, verseData, verse)
      })
    }
    if (combinedIds.isNotEmpty()) {
      manager.updateAppWidget(combinedIds, RemoteViews(context.packageName, R.layout.widget_combined).apply {
        bindTimes(this, times, now)
        setOnClickPendingIntent(R.id.widget_times_part, openAppIntent(context, "prayer-times"))
        bindVerse(context, this, verseData, verse)
      })
    }

    // No times for today: the app hasn't sent them yet, or the year's data ran out; JS sends new ones when the app opens
    if (times == null) cancelRefresh(context) else PrayerNotifier.scheduleScreenUpdate(context, times.state.refreshAt, refreshIntent(context))
  }

  private fun widgetIds(context: Context, manager: AppWidgetManager, provider: Class<out AppWidgetProvider>) =
    manager.getAppWidgetIds(ComponentName(context, provider))

  private fun countdownViews(context: Context, times: Times?, now: Long) =
    RemoteViews(context.packageName, R.layout.widget_countdown).apply {
      if (times == null) {
        setViewVisibility(R.id.widget_label, View.GONE)
        setViewVisibility(R.id.widget_countdown, View.GONE)
        setViewVisibility(R.id.widget_empty, View.VISIBLE)
      } else {
        setViewVisibility(R.id.widget_label, View.VISIBLE)
        setViewVisibility(R.id.widget_countdown, View.VISIBLE)
        setViewVisibility(R.id.widget_empty, View.GONE)
        setTextViewText(R.id.widget_label, times.config.labels[times.state.nextIndex])
        startCountdown(this, R.id.widget_countdown, times.state.nextAt, now)
      }
      setOnClickPendingIntent(R.id.widget_root, openAppIntent(context, "prayer-times"))
    }

  /** The times part (widget_times_part.xml): the countdown to the next prayer and today's six times, the current one marked. */
  private fun bindTimes(views: RemoteViews, times: Times?, now: Long) {
    val visibility = if (times == null) View.GONE else View.VISIBLE
    views.setViewVisibility(R.id.widget_times_header, visibility)
    views.setViewVisibility(R.id.widget_times_row, visibility)
    views.setViewVisibility(R.id.widget_times_empty, if (times == null) View.VISIBLE else View.GONE)
    if (times == null) return
    val (config, state) = times.config to times.state
    views.setTextViewText(R.id.widget_next_label, config.untilFormat.replace("%s", config.labels[state.nextIndex]))
    startCountdown(views, R.id.widget_times_countdown, state.nextAt, now)
    for (i in 0 until PRAYER_COUNT) {
      views.setTextViewText(WIDGET_LABEL_IDS[i], config.labels[i])
      views.setTextViewText(WIDGET_TIME_IDS[i], state.day.times[i])
      views.setInt(WIDGET_CELL_IDS[i], "setBackgroundResource", if (i == state.currentIndex) R.drawable.widget_cell_current else 0)
    }
  }

  /**
   * The verse part (widget_verse_part.xml). Tapping it shows a new verse in TAP mode and opens the
   * verse in the app otherwise; in TAP mode the reference line still opens it.
   */
  private fun bindVerse(context: Context, views: RemoteViews, data: VerseData?, verse: WidgetVerse?) {
    val visibility = if (verse == null) View.GONE else View.VISIBLE
    views.setViewVisibility(R.id.widget_verse_arabic, visibility)
    views.setViewVisibility(R.id.widget_verse_meal, visibility)
    views.setViewVisibility(R.id.widget_verse_footer, visibility)
    views.setViewVisibility(R.id.widget_verse_empty, if (verse == null) View.VISIBLE else View.GONE)
    if (data == null || verse == null) {
      views.setOnClickPendingIntent(R.id.widget_verse_part, openAppIntent(context, ""))
      return
    }
    views.setTextViewText(R.id.widget_verse_arabic, verse.arabic)
    views.setTextViewText(R.id.widget_verse_meal, verse.meal)
    views.setTextViewText(R.id.widget_verse_ref, verse.ref)
    val tap = data.mode == VerseMode.TAP
    views.setViewVisibility(R.id.widget_verse_hint, if (tap && data.hint.isNotEmpty()) View.VISIBLE else View.GONE)
    views.setTextViewText(R.id.widget_verse_hint, data.hint)
    val openVerse = openAppIntent(context, "surah/${verse.surah}/verse/${verse.verse}")
    views.setOnClickPendingIntent(R.id.widget_verse_part, if (tap) nextVerseIntent(context) else openVerse)
    views.setOnClickPendingIntent(R.id.widget_verse_ref, openVerse)
  }

  private fun startCountdown(views: RemoteViews, id: Int, at: Long, now: Long) {
    views.setChronometer(id, SystemClock.elapsedRealtime() + (at - now), null, true)
    views.setChronometerCountDown(id, true)
  }

  /** The verse to show; in PRAYER mode it moves on once each time a new prayer time comes in. */
  private fun currentVerse(context: Context, data: VerseData, times: Times?): WidgetVerse? {
    if (data.verses.isEmpty()) return null
    val prefs = prefs(context)
    var index = prefs.getInt(KEY_VERSE_INDEX, 0)
    if (data.mode == VerseMode.PRAYER && times != null) {
      val period = "${times.state.currentDate}:${times.state.currentIndex}"
      val last = prefs.getString(KEY_VERSE_PERIOD, null)
      if (period != last) {
        // The first rebuild after a new pool only notes the prayer time; the pool starts from its first verse
        if (last != null) index++
        prefs.edit().putString(KEY_VERSE_PERIOD, period).putInt(KEY_VERSE_INDEX, index).apply()
      }
    }
    return data.verses[Math.floorMod(index, data.verses.size)]
  }

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun loadData(context: Context): Config? {
    val json = prefs(context).getString(KEY_DATA, null) ?: return null
    return try {
      PrayerNotifier.parseConfig(json)
    } catch (e: Exception) {
      null
    }
  }

  private fun loadVerses(context: Context): VerseData? {
    val json = prefs(context).getString(KEY_VERSES, null) ?: return null
    return try {
      parseVerses(json)
    } catch (e: Exception) {
      null
    }
  }

  private fun parseVerses(json: String): VerseData {
    val obj = JSONObject(json)
    val arr = obj.getJSONArray("verses")
    val verses = List(arr.length()) {
      val v = arr.getJSONObject(it)
      WidgetVerse(v.getInt("surah"), v.getInt("verse"), v.getString("ref"), v.getString("arabic"), v.getString("meal"))
    }
    val mode = when (obj.getString("mode")) {
      "tap" -> VerseMode.TAP
      "fixed" -> VerseMode.FIXED
      else -> VerseMode.PRAYER
    }
    return VerseData(mode, obj.optString("poolId"), obj.optString("hint"), verses)
  }

  /**
   * Opens the app at `path` ("prayer-times", "surah/2/verse/255"; "" for the home screen): a VIEW
   * intent, which React Native hands to JS as a link (Linking), sent straight to the app's own activity.
   */
  private fun openAppIntent(context: Context, path: String): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("kuran360://$path"))
      .setComponent(launch.component)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun nextVerseIntent(context: Context): PendingIntent {
    val intent = Intent(context, PrayerAlarmReceiver::class.java).setAction(ACTION_WIDGET_NEXT_VERSE)
    return PendingIntent.getBroadcast(context, 4, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun refreshIntent(context: Context): PendingIntent {
    val intent = Intent(context, PrayerAlarmReceiver::class.java).setAction(ACTION_WIDGET_REFRESH)
    return PendingIntent.getBroadcast(context, 3, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun cancelRefresh(context: Context) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(refreshIntent(context))
  }
}
