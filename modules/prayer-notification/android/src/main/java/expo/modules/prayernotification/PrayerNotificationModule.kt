package expo.modules.prayernotification

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import java.io.File
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Starts and stops the prayer time notifications (see PrayerNotifier). */
class PrayerNotificationModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("PrayerNotification")

    /** Stores the times and settings (JSON, see PrayerNotificationConfig in index.ts) and shows, updates or schedules the notifications. */
    AsyncFunction("start") { configJson: String ->
      PrayerNotifier.start(context, configJson)
    }

    /** Stores the times for the home screen widgets (location, labels and days, as in the config) and updates them. */
    AsyncFunction("setWidgetData") { json: String ->
      PrayerWidgets.setData(context, json)
    }

    /** Stores the verses for the verse widgets (the mode, and a pool to go through or the one fixed verse) and updates them. */
    AsyncFunction("setWidgetVerses") { json: String ->
      PrayerWidgets.setVerses(context, json)
    }

    AsyncFunction("stop") {
      PrayerNotifier.stop(context)
    }

    Function("isActive") {
      PrayerNotifier.isActive(context)
    }

    /**
     * Copies a sound the user picked (content:// or file:// uri) into the app's sound library and
     * returns its file name, to use as a prayer's `sound` in the config.
     */
    AsyncFunction("importSound") Coroutine { uri: String, extension: String ->
      val context = context
      withContext(Dispatchers.IO) {
        val dir = PrayerSoundProvider.soundsDir(context).apply { mkdirs() }
        val ext = extension.lowercase().filter { it.isLetterOrDigit() }.take(5).ifEmpty { "mp3" }
        val file = File(dir, "sound_${System.currentTimeMillis()}.$ext")
        val input = context.contentResolver.openInputStream(Uri.parse(uri)) ?: throw IllegalArgumentException("Can't open $uri")
        input.use { source -> file.outputStream().use { source.copyTo(it) } }
        file.name
      }
    }

    /** Removes a sound from the library; prayers still set to it fall back to the default (JS updates the config) */
    Function("deleteSound") { name: String ->
      PrayerSoundProvider.soundFile(context, name).delete()
    }

    /** The kaza list: prayers answered "Kılmadım" and not made up, as "yyyy-MM-dd:index" */
    Function("getMissedPrayers") {
      PrayerNotifier.missedPrayers(context)
    }

    /** Takes a prayer off the kaza list once it is made up */
    Function("makeUpPrayer") { date: String, index: Int ->
      PrayerNotifier.makeUp(context, date, index)
    }

    Function("canScheduleExactAlarms") {
      PrayerNotifier.canScheduleExactAlarms(context)
    }

    /** Opens the "Alarms & reminders" permission screen (Android 12+), which lets the countdown switch to the next prayer on time. */
    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }
  }
}
