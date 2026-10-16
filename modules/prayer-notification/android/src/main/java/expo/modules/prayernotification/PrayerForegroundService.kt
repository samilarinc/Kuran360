package expo.modules.prayernotification

import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log

/**
 * Holds the prayer times notification as a foreground service notification (see
 * PrayerNotifier.startService). It does no work of its own: the countdown ticks in the system UI
 * and PrayerAlarmReceiver updates the notification at each prayer time.
 */
class PrayerForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = PrayerNotifier.currentNotification(this)
    if (notification == null) {
      stopSelf()
      return START_NOT_STICKY
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      } else {
        startForeground(NOTIFICATION_ID, notification)
      }
    } catch (e: Exception) {
      // Android 12+ refuses it while the app is in the background, e.g. when the system restarts this
      // sticky service after killing the process. Uncaught, that crashes the app on every restart, so
      // show the notification on its own instead; the service starts the next time the app is opened.
      Log.w("PrayerForegroundService", "Couldn't start in the foreground", e)
      getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
      stopSelf()
      return START_NOT_STICKY
    }
    isRunning = true
    // Recreated by the system if its process is killed
    return START_STICKY
  }

  override fun onDestroy() {
    isRunning = false
    super.onDestroy()
  }

  companion object {
    @Volatile
    var isRunning = false
      private set
  }
}
