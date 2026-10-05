package expo.modules.prayernotification

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar

/** Number of prayer times in a day: imsak, güneş, öğle, ikindi, akşam, yatsı. */
private const val PRAYER_COUNT = 6
private const val IMSAK = 0
private const val GUNES = 1
private const val OGLE = 2
private const val AKSAM = 4

private const val PREFS = "prayer_notification"
private const val KEY_CONFIG = "config"
/** Prayers answered with "Kıldım" or "Kılmadım", as "yyyy-MM-dd:index" (kept a week) */
private const val KEY_ANSWERED = "answered"
/** Prayers answered with "Kılmadım" and not made up yet: the kaza list */
private const val KEY_MISSED = "missed"
private const val CHANNEL_ID = "prayer_times_ongoing"
/** Alert channels are per sound ("prayer_alerts_<sound>"), since a channel's sound can't change after it is created */
private const val ALERT_CHANNEL_PREFIX = "prayer_alerts_"
const val ACTION_REFRESH = "expo.modules.prayernotification.REFRESH"
const val ACTION_DISMISSED = "expo.modules.prayernotification.DISMISSED"
const val ACTION_ALERT = "expo.modules.prayernotification.ALERT"
const val ACTION_PRAYED = "expo.modules.prayernotification.PRAYED"
const val ACTION_MISSED = "expo.modules.prayernotification.MISSED"
const val ACTION_MADE_UP = "expo.modules.prayernotification.MADE_UP"
const val NOTIFICATION_ID = 36001
/** Prayer alerts use one id per prayer, so a new alert for the same prayer replaces the old one */
private const val ALERT_NOTIFICATION_ID = 37000
private const val KAZA_NOTIFICATION_ID = 37100
private const val OTHER_NOTIFICATION_ID = 37200
private const val EXTRA_AT = "at"
private const val EXTRA_INDEX = "index"
private const val EXTRA_DATE = "date"
private const val EXTRA_NOTIFICATION = "notification"

/** An alert delivered later than this (device off, inexact alarm) is dropped instead of shown out of time. */
private const val ALERT_MAX_DELAY_MS = 10 * 60_000L

/** How long after the user swipes the notification away it comes back (Android 14+ lets ongoing notifications be dismissed). */
private const val RESHOW_DELAY_MS = 60_000L

/** Answers older than this are dropped; the questions are only asked for today and the night before. */
private const val ANSWERED_KEEP_DAYS = 7

private val CELL_IDS = intArrayOf(R.id.prayer_cell_0, R.id.prayer_cell_1, R.id.prayer_cell_2, R.id.prayer_cell_3, R.id.prayer_cell_4, R.id.prayer_cell_5)
private val LABEL_IDS = intArrayOf(R.id.prayer_label_0, R.id.prayer_label_1, R.id.prayer_label_2, R.id.prayer_label_3, R.id.prayer_label_4, R.id.prayer_label_5)
private val TIME_IDS = intArrayOf(R.id.prayer_time_0, R.id.prayer_time_1, R.id.prayer_time_2, R.id.prayer_time_3, R.id.prayer_time_4, R.id.prayer_time_5)

/** One day of the config: "yyyy-MM-dd", six "HH:mm" times, the date line shown under them and whether it is in Ramadan. */
private class Day(val date: String, val times: List<String>, val info: String, val ramadan: Boolean)

/** Texts from JS, already translated; `%1` is replaced with a prayer's name, `%2` with minutes. */
private class Texts(
  val alertAt: String,
  val alertBefore: String,
  val cuma: String,
  val kaza: String,
  val sahur: String,
  val iftar: String,
  val prayed: String,
  val notPrayed: String,
  val madeUp: String,
  val kerahat: String,
  /** Prayer names in kaza texts ("Sabah" instead of "İmsak") */
  val kazaLabels: List<String>,
)

private class Config(
  val location: String,
  val labels: List<String>,
  val untilFormat: String,
  /** Whether the ongoing notification is on */
  val ongoing: Boolean,
  /** Whether the collapsed ongoing notification lists the times too, not only the countdown */
  val collapsedTimes: Boolean,
  /** Per prayer: alert when its time begins */
  val alertAt: BooleanArray,
  /** Per prayer: also alert this many minutes before (0 = no) */
  val alertBefore: IntArray,
  /** Per prayer: "default", "vibrate", "silent" or a file name in filesDir/prayer_sounds */
  val alertSound: List<String>,
  /** Fridays: remind this many minutes before öğle (0 = off) */
  val cumaBefore: Int,
  /** Kaza tracking: "Kıldım" / "Kılmadım" buttons, and a reminder the next day for prayers answered "Kılmadım" */
  val kaza: Boolean,
  /** Sahur (this many minutes before imsak, 0 = off) and iftar reminders, in Ramadan or every day in fasting mode */
  val fastingRamadan: Boolean,
  val fastingMode: Boolean,
  val sahurBefore: Int,
  val iftar: Boolean,
  /** Minutes of the kerahat windows: after güneş, before öğle (istiva) and before akşam */
  val kerahatAfterSunrise: Int,
  val kerahatBeforeOgle: Int,
  val kerahatBeforeAksam: Int,
  val texts: Texts,
  val days: Map<String, Day>,
)

private enum class AlertKind { PRAYER, CUMA, SAHUR, IFTAR, KAZA_CHECK }

/** One scheduled alert, due `at`, about prayer `index` at `time` ("HH:mm") on `date`. */
private class Alert(val at: Long, val kind: AlertKind, val index: Int, val minutesBefore: Int, val time: String, val date: String)

/** What the ongoing notification shows at a given moment. */
private class State(
  val day: Day,
  /** Date the current prayer belongs to: before imsak it is still the previous night's yatsı */
  val currentDate: String,
  val currentIndex: Int,
  val nextIndex: Int,
  val nextAt: Long,
  val inKerahat: Boolean,
  /** When the notification has to be rebuilt: the next prayer time, kerahat boundary or midnight. */
  val refreshAt: Long,
)

/**
 * Prayer time notifications: alerts (prayer times, Cuma, sahur/iftar, kaza reminders) and the
 * ongoing notification with today's six times and a live countdown to the next one. The countdown
 * is a Chronometer the system ticks on its own, so nothing runs in the background; alarms rebuild
 * the notification when it changes and fire the alerts one after another. The times and settings
 * come from JS (see src/services/prayerTimes.ts) and are kept in SharedPreferences so the receiver
 * can rebuild everything after a reboot without starting the app.
 */
object PrayerNotifier {
  fun start(context: Context, configJson: String) {
    parseConfig(configJson) // reject a bad config before replacing the stored one
    prefs(context).edit().putString(KEY_CONFIG, configJson).apply()
    refresh(context)
  }

  fun stop(context: Context) {
    prefs(context).edit().remove(KEY_CONFIG).apply()
    stopOngoing(context)
    alarmManager(context).cancel(alertIntent(context, null))
  }

  /** Whether the ongoing notification is on */
  fun isActive(context: Context) = loadConfig(context)?.ongoing == true

  /** Rebuilds the ongoing notification and schedules the next alert, e.g. after a reboot or a clock change. */
  fun refresh(context: Context) {
    val config = loadConfig(context) ?: run {
      stopOngoing(context)
      alarmManager(context).cancel(alertIntent(context, null))
      return
    }
    val notification = if (config.ongoing) currentNotification(context, config) else null
    if (notification == null) {
      // Turned off, or no times stored for today (the year's data ran out); JS sends new ones when the app opens
      stopOngoing(context)
    } else {
      notificationManager(context).notify(NOTIFICATION_ID, notification)
      if (!PrayerForegroundService.isRunning) startService(context)
    }
    removeUnusedAlertChannels(context, config)
    scheduleNextAlert(context, config, System.currentTimeMillis())
  }

  /** The ongoing notification for this moment (scheduling its next rebuild), or null when there is nothing to show. */
  fun currentNotification(context: Context): Notification? =
    loadConfig(context)?.takeIf { it.ongoing }?.let { currentNotification(context, it) }

  private fun currentNotification(context: Context, config: Config): Notification? {
    val now = System.currentTimeMillis()
    val state = computeState(config, now) ?: return null
    ensureOngoingChannel(context)
    scheduleRefresh(context, state.refreshAt)
    return buildNotification(context, config, state, now)
  }

  private fun stopOngoing(context: Context) {
    context.stopService(Intent(context, PrayerForegroundService::class.java))
    notificationManager(context).cancel(NOTIFICATION_ID)
    alarmManager(context).cancel(refreshIntent(context))
  }

  private fun loadConfig(context: Context): Config? {
    val json = prefs(context).getString(KEY_CONFIG, null) ?: return null
    return try {
      parseConfig(json)
    } catch (e: Exception) {
      prefs(context).edit().remove(KEY_CONFIG).apply()
      null
    }
  }

  /**
   * The foreground service only holds the notification: launchers (Samsung's among them) list
   * foreground service notifications above all others, and Android keeps it from being cleared.
   * Starting it can be refused while the app is in the background (Android 12+); the notification
   * is then shown on its own and the service starts the next time the app is opened.
   */
  private fun startService(context: Context) {
    val intent = Intent(context, PrayerForegroundService::class.java)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
    } catch (e: Exception) {
      Log.w("PrayerNotifier", "Couldn't start the foreground service", e)
    }
  }

  /** Brings the notification back a minute after the user swipes it away; it is only turned off from the app. */
  fun onDismissed(context: Context) {
    if (!isActive(context)) return
    scheduleRefresh(context, System.currentTimeMillis() + RESHOW_DELAY_MS)
  }

  fun canScheduleExactAlarms(context: Context) =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager(context).canScheduleExactAlarms()

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun notificationManager(context: Context) = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun alarmManager(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun parseConfig(json: String): Config {
    val obj = JSONObject(json)
    val labels = obj.getJSONArray("labels").let { arr -> List(arr.length()) { arr.getString(it) } }
    require(labels.size == PRAYER_COUNT) { "Expected $PRAYER_COUNT labels" }
    val daysArr = obj.getJSONArray("days")
    val days = HashMap<String, Day>(daysArr.length())
    for (i in 0 until daysArr.length()) {
      val d = daysArr.getJSONObject(i)
      val times = d.getJSONArray("times").let { arr -> List(arr.length()) { arr.getString(it) } }
      require(times.size == PRAYER_COUNT) { "Expected $PRAYER_COUNT times" }
      val day = Day(d.getString("date"), times, d.optString("info"), d.optBoolean("ramadan"))
      days[day.date] = day
    }
    val alerts = obj.optJSONArray("alerts")
    val texts = obj.optJSONObject("texts") ?: JSONObject()
    val kazaLabels = texts.optJSONArray("kazaLabels")?.let { arr -> List(arr.length()) { arr.getString(it) } }
    val cuma = obj.optJSONObject("cuma")
    val kaza = obj.optJSONObject("kaza")
    val fasting = obj.optJSONObject("fasting")
    val kerahat = obj.optJSONObject("kerahat")
    return Config(
      location = obj.getString("location"),
      labels = labels,
      untilFormat = obj.getString("untilFormat"),
      ongoing = obj.optBoolean("ongoing", true),
      collapsedTimes = obj.optBoolean("collapsedTimes"),
      alertAt = BooleanArray(PRAYER_COUNT) { alerts?.optJSONObject(it)?.optBoolean("atTime") ?: false },
      alertBefore = IntArray(PRAYER_COUNT) { alerts?.optJSONObject(it)?.optInt("before") ?: 0 },
      alertSound = List(PRAYER_COUNT) { alerts?.optJSONObject(it)?.optString("sound").orEmpty().ifEmpty { "default" } },
      cumaBefore = if (cuma?.optBoolean("enabled") == true) cuma.optInt("before") else 0,
      kaza = kaza?.optBoolean("enabled") == true,
      fastingRamadan = fasting?.optBoolean("ramadan") ?: false,
      fastingMode = fasting?.optBoolean("mode") ?: false,
      sahurBefore = fasting?.optInt("sahurBefore") ?: 0,
      iftar = fasting?.optBoolean("iftar") ?: false,
      kerahatAfterSunrise = kerahat?.optInt("afterSunrise") ?: 0,
      kerahatBeforeOgle = kerahat?.optInt("beforeOgle") ?: 0,
      kerahatBeforeAksam = kerahat?.optInt("beforeAksam") ?: 0,
      texts = Texts(
        alertAt = texts.optString("alertAt", "%1"),
        alertBefore = texts.optString("alertBefore", "%1 (%2)"),
        cuma = texts.optString("cuma", "%2"),
        kaza = texts.optString("kaza", "%1"),
        sahur = texts.optString("sahur", "%2"),
        iftar = texts.optString("iftar", "%1"),
        prayed = texts.optString("prayed", "OK"),
        notPrayed = texts.optString("notPrayed", "No"),
        madeUp = texts.optString("madeUp", "OK"),
        kerahat = texts.optString("kerahat"),
        kazaLabels = if (kazaLabels?.size == PRAYER_COUNT) kazaLabels else labels,
      ),
      days = days,
    )
  }

  private fun dateKey(cal: Calendar) =
    "%04d-%02d-%02d".format(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH))

  private fun startOfDay(millis: Long, offsetDays: Int = 0) = Calendar.getInstance().apply {
    timeInMillis = millis
    set(Calendar.HOUR_OF_DAY, 0)
    set(Calendar.MINUTE, 0)
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
    add(Calendar.DAY_OF_MONTH, offsetDays)
  }

  /** Epoch millis of "HH:mm" on the day of `dayStart` (local midnight). */
  private fun timeOn(dayStart: Calendar, hhmm: String): Long {
    val (h, m) = hhmm.split(":").map { it.trim().toInt() }
    return (dayStart.clone() as Calendar).apply {
      set(Calendar.HOUR_OF_DAY, h)
      set(Calendar.MINUTE, m)
    }.timeInMillis
  }

  /** Kerahat windows of a day: after güneş, before öğle (istiva) and before akşam. */
  private fun kerahatWindows(config: Config, dayStart: Calendar, day: Day): List<LongRange> {
    if (config.texts.kerahat.isEmpty()) return emptyList()
    val gunes = timeOn(dayStart, day.times[GUNES])
    val ogle = timeOn(dayStart, day.times[OGLE])
    val aksam = timeOn(dayStart, day.times[AKSAM])
    return listOf(
      gunes until gunes + config.kerahatAfterSunrise * 60_000L,
      ogle - config.kerahatBeforeOgle * 60_000L until ogle,
      aksam - config.kerahatBeforeAksam * 60_000L until aksam,
    ).filter { !it.isEmpty() }
  }

  private fun computeState(config: Config, now: Long): State? {
    val todayStart = startOfDay(now)
    val tomorrowStart = startOfDay(now, 1)
    val today = config.days[dateKey(todayStart)] ?: return null
    val todayTimes = today.times.map { timeOn(todayStart, it) }

    val nextToday = todayTimes.indexOfFirst { it > now }
    val (nextIndex, nextAt) = if (nextToday >= 0) {
      nextToday to todayTimes[nextToday]
    } else {
      // After yatsı: count down to tomorrow's imsak
      val tomorrow = config.days[dateKey(tomorrowStart)] ?: return null
      0 to timeOn(tomorrowStart, tomorrow.times[0])
    }
    // Before imsak it is still the previous night's yatsı
    val currentIndex = if (nextToday == 0) PRAYER_COUNT - 1 else (if (nextToday < 0) PRAYER_COUNT else nextToday) - 1
    val currentDate = if (nextToday == 0) dateKey(startOfDay(now, -1)) else today.date

    val kerahat = kerahatWindows(config, todayStart, today)
    val inKerahat = kerahat.any { now in it }
    val boundaries = kerahat.flatMap { listOf(it.first, it.last + 1) }.filter { it > now }
    val refreshAt = (boundaries + nextAt + tomorrowStart.timeInMillis).min()
    return State(today, currentDate, currentIndex, nextIndex, nextAt, inKerahat, refreshAt)
  }

  // --- Kaza tracking ---

  private fun prayerKey(date: String, index: Int) = "$date:$index"

  private fun marks(context: Context, key: String) = prefs(context).getStringSet(key, emptySet())!!

  private fun isAnswered(context: Context, date: String, index: Int) = marks(context, KEY_ANSWERED).contains(prayerKey(date, index))

  private fun isMissed(context: Context, date: String, index: Int) = marks(context, KEY_MISSED).contains(prayerKey(date, index))

  private fun answer(context: Context, date: String, index: Int, prayed: Boolean) {
    val oldest = dateKey(startOfDay(System.currentTimeMillis(), -ANSWERED_KEEP_DAYS))
    val answered = marks(context, KEY_ANSWERED).filter { it.substringBefore(':') >= oldest }.toMutableSet()
    answered.add(prayerKey(date, index))
    val missed = marks(context, KEY_MISSED).toMutableSet()
    if (prayed) missed.remove(prayerKey(date, index)) else missed.add(prayerKey(date, index))
    prefs(context).edit().putStringSet(KEY_ANSWERED, answered).putStringSet(KEY_MISSED, missed).apply()
  }

  /** The kaza list: prayers answered "Kılmadım" and not made up, as "yyyy-MM-dd:index" */
  fun missedPrayers(context: Context): List<String> = marks(context, KEY_MISSED).sorted()

  fun makeUp(context: Context, date: String, index: Int) {
    val missed = marks(context, KEY_MISSED).toMutableSet()
    missed.remove(prayerKey(date, index))
    prefs(context).edit().putStringSet(KEY_MISSED, missed).apply()
  }

  /**
   * The "Kıldım" / "Kılmadım" buttons and the kaza reminder's "Kaza kıldım": records the answer,
   * closes the notification it was on and updates the ongoing one.
   */
  fun onAnswer(context: Context, intent: Intent) {
    val date = intent.getStringExtra(EXTRA_DATE) ?: return
    val index = intent.getIntExtra(EXTRA_INDEX, -1)
    if (index !in 0 until PRAYER_COUNT) return
    when (intent.action) {
      ACTION_PRAYED -> answer(context, date, index, prayed = true)
      ACTION_MISSED -> answer(context, date, index, prayed = false)
      ACTION_MADE_UP -> makeUp(context, date, index)
    }
    val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION, 0)
    if (notificationId != 0 && notificationId != NOTIFICATION_ID) notificationManager(context).cancel(notificationId)
    refresh(context)
  }

  private fun answerAction(context: Context, action: String, title: String, date: String, index: Int, notificationId: Int): Notification.Action {
    val intent = Intent(context, PrayerAlarmReceiver::class.java)
      .setAction(action)
      .putExtra(EXTRA_DATE, date)
      .putExtra(EXTRA_INDEX, index)
      .putExtra(EXTRA_NOTIFICATION, notificationId)
    // A distinct request code per notification and button, or the PendingIntents would share their extras
    val requestCode = 1000 + notificationId * 4 + listOf(ACTION_PRAYED, ACTION_MISSED, ACTION_MADE_UP).indexOf(action)
    val pending = PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    @Suppress("DEPRECATION")
    return Notification.Action.Builder(null, title, pending).build()
  }

  /** "Kıldım" and "Kılmadım" on a prayer's notification, unless it was already answered */
  private fun addQuestion(context: Context, builder: Notification.Builder, config: Config, date: String, index: Int, notificationId: Int) {
    if (!tracksKaza(config, index) || isAnswered(context, date, index)) return
    builder.addAction(answerAction(context, ACTION_PRAYED, config.texts.prayed, date, index, notificationId))
    builder.addAction(answerAction(context, ACTION_MISSED, config.texts.notPrayed, date, index, notificationId))
  }

  /** Güneş isn't a prayer, so it is never asked about */
  private fun tracksKaza(config: Config, index: Int) = config.kaza && index != GUNES

  // --- Ongoing notification ---

  private fun ensureOngoingChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = notificationManager(context)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    // Default importance keeps it with the regular notifications at the top of the shade (low
    // importance would move it to the silent section); sound and vibration are off
    val channel = NotificationChannel(CHANNEL_ID, context.getString(R.string.prayer_notification_channel), NotificationManager.IMPORTANCE_DEFAULT).apply {
      setSound(null, null)
      enableVibration(false)
      enableLights(false)
      setShowBadge(false)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    manager.createNotificationChannel(channel)
  }

  private fun bindViews(views: RemoteViews, config: Config, state: State, now: Long, withLabels: Boolean) {
    views.setTextViewText(R.id.prayer_next_label, config.untilFormat.replace("%s", config.labels[state.nextIndex]))
    views.setChronometer(R.id.prayer_countdown, SystemClock.elapsedRealtime() + (state.nextAt - now), null, true)
    views.setChronometerCountDown(R.id.prayer_countdown, true)
    views.setTextViewText(R.id.prayer_location, config.location)
    views.setTextViewText(R.id.prayer_kerahat, config.texts.kerahat)
    views.setViewVisibility(R.id.prayer_kerahat, if (state.inKerahat) View.VISIBLE else View.GONE)
    for (i in 0 until PRAYER_COUNT) {
      views.setTextViewText(TIME_IDS[i], state.day.times[i])
      if (withLabels) views.setTextViewText(LABEL_IDS[i], config.labels[i])
      views.setInt(CELL_IDS[i], "setBackgroundResource", if (i == state.currentIndex) R.drawable.prayer_cell_current else 0)
    }
  }

  private fun buildNotification(context: Context, config: Config, state: State, now: Long): Notification {
    val collapsed = RemoteViews(context.packageName, R.layout.prayer_notification).also {
      bindViews(it, config, state, now, false)
      it.setViewVisibility(R.id.prayer_times_row, if (config.collapsedTimes) View.VISIBLE else View.GONE)
    }
    val expanded = RemoteViews(context.packageName, R.layout.prayer_notification_big).also {
      bindViews(it, config, state, now, true)
      it.setTextViewText(R.id.prayer_date, state.day.info)
    }

    @Suppress("DEPRECATION")
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(context, CHANNEL_ID) else Notification.Builder(context).setPriority(Notification.PRIORITY_DEFAULT)
    builder
      .setSmallIcon(R.drawable.ic_stat_prayer)
      .setColor(0xFF2E7D32.toInt())
      .setContentTitle(config.untilFormat.replace("%s", config.labels[state.nextIndex]))
      .setContentText(config.location)
      .setStyle(Notification.DecoratedCustomViewStyle())
      .setCustomContentView(collapsed)
      .setCustomBigContentView(expanded)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(false)
      // Not shown, but the shade sorts ongoing notifications by it, newest first: the next prayer
      // time (in the future) keeps it above ones that are reposted every few minutes
      .setWhen(state.nextAt)
      .setCategory(Notification.CATEGORY_STATUS)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setContentIntent(launchIntent(context))
      .setDeleteIntent(dismissIntent(context))
    addQuestion(context, builder, config, state.currentDate, state.currentIndex, NOTIFICATION_ID)
    return builder.build()
  }

  // --- Alerts ---

  /** Every alert of the day starting at `dayStart`, unordered. */
  private fun alertsOf(context: Context, config: Config, dayStart: Calendar, day: Day): List<Alert> {
    val result = mutableListOf<Alert>()
    val times = day.times.map { timeOn(dayStart, it) }
    for (i in 0 until PRAYER_COUNT) {
      if (config.alertAt[i]) result.add(Alert(times[i], AlertKind.PRAYER, i, 0, day.times[i], day.date))
      if (config.alertBefore[i] > 0) {
        result.add(Alert(times[i] - config.alertBefore[i] * 60_000L, AlertKind.PRAYER, i, config.alertBefore[i], day.times[i], day.date))
      }
      // At each prayer time, remind of the same prayer of the day before if it was answered "Kılmadım"
      if (tracksKaza(config, i)) {
        val yesterday = dateKey(startOfDay(dayStart.timeInMillis, -1))
        if (isMissed(context, yesterday, i)) result.add(Alert(times[i], AlertKind.KAZA_CHECK, i, 0, day.times[i], yesterday))
      }
    }
    if (config.cumaBefore > 0 && dayStart.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY) {
      result.add(Alert(times[OGLE] - config.cumaBefore * 60_000L, AlertKind.CUMA, OGLE, config.cumaBefore, day.times[OGLE], day.date))
    }
    if ((day.ramadan && config.fastingRamadan) || config.fastingMode) {
      if (config.sahurBefore > 0) {
        result.add(Alert(times[IMSAK] - config.sahurBefore * 60_000L, AlertKind.SAHUR, IMSAK, config.sahurBefore, day.times[IMSAK], day.date))
      }
      if (config.iftar) result.add(Alert(times[AKSAM], AlertKind.IFTAR, AKSAM, 0, day.times[AKSAM], day.date))
    }
    return result
  }

  /** The first alert due after `from`, looking at today and the next two days. */
  private fun nextAlert(context: Context, config: Config, from: Long): Alert? {
    for (offset in 0..2) {
      val dayStart = startOfDay(from, offset)
      val day = config.days[dateKey(dayStart)] ?: continue
      alertsOf(context, config, dayStart, day).filter { it.at > from }.minByOrNull { it.at }?.let { return it }
    }
    return null
  }

  /** One alarm at a time: the next alert, which schedules the one after it when it fires. */
  private fun scheduleNextAlert(context: Context, config: Config, from: Long) {
    val manager = alarmManager(context)
    val alert = nextAlert(context, config, from) ?: run {
      manager.cancel(alertIntent(context, null))
      return
    }
    val pending = alertIntent(context, alert)
    // Alerts have to sound on time even while the phone sleeps, unlike the ongoing notification's refresh
    if (canScheduleExactAlarms(context)) {
      manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alert.at, pending)
    } else {
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alert.at, pending)
    }
  }

  /** Shows the alerts due at the time the alarm was set for (several can share it) and schedules the next one. */
  fun onAlert(context: Context, intent: Intent) {
    val config = loadConfig(context) ?: return
    val at = intent.getLongExtra(EXTRA_AT, 0L)
    val now = System.currentTimeMillis()
    if (now - at < ALERT_MAX_DELAY_MS) {
      for (offset in -1..0) {
        val dayStart = startOfDay(at, offset)
        val day = config.days[dateKey(dayStart)] ?: continue
        // alertsOf leaves out kaza reminders for prayers made up since the alarm was set
        val due = alertsOf(context, config, dayStart, day).filter { it.at == at }
        // On Fridays the Cuma reminder replaces an öğle reminder set to the same time
        val cuma = due.any { it.kind == AlertKind.CUMA }
        due.filterNot { cuma && it.kind == AlertKind.PRAYER && it.index == OGLE && it.minutesBefore > 0 }
          .forEach { showAlert(context, config, it) }
      }
    }
    scheduleNextAlert(context, config, maxOf(now, at))
  }

  private fun showAlert(context: Context, config: Config, alert: Alert) {
    val texts = config.texts
    val label = config.labels[alert.index]
    fun format(template: String, name: String = label) = template.replace("%1", name).replace("%2", alert.minutesBefore.toString())
    val (title, notificationId) = when (alert.kind) {
      AlertKind.PRAYER -> (if (alert.minutesBefore > 0) format(texts.alertBefore) else format(texts.alertAt)) to ALERT_NOTIFICATION_ID + alert.index
      AlertKind.CUMA -> format(texts.cuma) to OTHER_NOTIFICATION_ID
      AlertKind.SAHUR -> format(texts.sahur) to OTHER_NOTIFICATION_ID + 1
      AlertKind.IFTAR -> format(texts.iftar) to OTHER_NOTIFICATION_ID + 2
      AlertKind.KAZA_CHECK -> format(texts.kaza, texts.kazaLabels[alert.index]) to KAZA_NOTIFICATION_ID + alert.index
    }
    // Cuma, sahur and iftar sound like öğle, imsak and akşam
    val sound = config.alertSound[alert.index]
    @Suppress("DEPRECATION")
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, ensureAlertChannel(context, sound))
    } else {
      Notification.Builder(context).setPriority(Notification.PRIORITY_HIGH).also { legacySound(context, it, sound) }
    }
    builder
      .setSmallIcon(R.drawable.ic_stat_prayer)
      .setColor(0xFF2E7D32.toInt())
      .setContentTitle(title)
      .setContentText("${config.location} · ${alert.time}")
      .setCategory(Notification.CATEGORY_REMINDER)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setContentIntent(launchIntent(context))
    when {
      alert.kind == AlertKind.KAZA_CHECK -> builder.addAction(answerAction(context, ACTION_MADE_UP, texts.madeUp, alert.date, alert.index, notificationId))
      alert.kind == AlertKind.PRAYER && alert.minutesBefore == 0 -> addQuestion(context, builder, config, alert.date, alert.index, notificationId)
    }
    notificationManager(context).notify(notificationId, builder.build())
  }

  private fun customSoundUri(context: Context, sound: String): Uri? =
    if (sound in listOf("default", "vibrate", "silent")) null else PrayerSoundProvider.uri(context, sound)

  private fun alertChannelId(sound: String) = ALERT_CHANNEL_PREFIX + sound.replace(Regex("[^A-Za-z0-9_.-]"), "_")

  /** Android fixes a channel's sound when it is created, so each sound gets its own channel; drops the ones no prayer uses any more. */
  private fun removeUnusedAlertChannels(context: Context, config: Config) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val used = config.alertSound.map { alertChannelId(it) }.toSet()
    val manager = notificationManager(context)
    manager.notificationChannels
      .filter { (it.id.startsWith(ALERT_CHANNEL_PREFIX) || it.id == "prayer_times_alerts") && it.id !in used }
      .forEach { manager.deleteNotificationChannel(it.id) }
  }

  /** The alert channel for `sound`, created on first use */
  private fun ensureAlertChannel(context: Context, sound: String): String {
    val manager = notificationManager(context)
    val id = alertChannelId(sound)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return id
    if (manager.getNotificationChannel(id) != null) return id
    val channel = NotificationChannel(id, context.getString(R.string.prayer_alerts_channel), NotificationManager.IMPORTANCE_HIGH).apply {
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      val attributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()
      when (sound) {
        "default" -> enableVibration(true)
        "vibrate" -> {
          setSound(null, null)
          enableVibration(true)
        }
        "silent" -> {
          setSound(null, null)
          enableVibration(false)
        }
        else -> {
          setSound(customSoundUri(context, sound), attributes)
          enableVibration(true)
        }
      }
    }
    manager.createNotificationChannel(channel)
    return id
  }

  @Suppress("DEPRECATION")
  private fun legacySound(context: Context, builder: Notification.Builder, sound: String) {
    when (sound) {
      "default" -> builder.setDefaults(Notification.DEFAULT_ALL)
      "vibrate" -> builder.setDefaults(Notification.DEFAULT_VIBRATE)
      "silent" -> Unit
      else -> builder.setSound(customSoundUri(context, sound)).setDefaults(Notification.DEFAULT_VIBRATE)
    }
  }

  private fun launchIntent(context: Context): PendingIntent? =
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

  /** The alert alarm's intent, carrying the time it is due; with `alert` null only to cancel it (extras don't matter for matching). */
  private fun alertIntent(context: Context, alert: Alert?): PendingIntent {
    val intent = Intent(context, PrayerAlarmReceiver::class.java).setAction(ACTION_ALERT)
    if (alert != null) intent.putExtra(EXTRA_AT, alert.at)
    return PendingIntent.getBroadcast(context, 2, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun refreshIntent(context: Context): PendingIntent {
    val intent = Intent(context, PrayerAlarmReceiver::class.java).setAction(ACTION_REFRESH)
    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun dismissIntent(context: Context): PendingIntent {
    val intent = Intent(context, PrayerAlarmReceiver::class.java).setAction(ACTION_DISMISSED)
    return PendingIntent.getBroadcast(context, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  /**
   * Non-wakeup alarm: while the screen is off nobody sees the notification, so it is rebuilt when
   * the device wakes up instead of waking it. Exact when the user allows it, otherwise the system
   * may deliver it a few minutes late.
   */
  private fun scheduleRefresh(context: Context, at: Long) {
    val manager = alarmManager(context)
    val pending = refreshIntent(context)
    if (canScheduleExactAlarms(context)) {
      manager.setExact(AlarmManager.RTC, at, pending)
    } else {
      manager.setWindow(AlarmManager.RTC, at, 60_000L, pending)
    }
  }
}
