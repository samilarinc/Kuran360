package expo.modules.prayernotification

import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

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
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
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
