package expo.modules.prayernotification

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileNotFoundException

/**
 * Serves the user's own alert sounds (filesDir/prayer_sounds) to the system, which plays
 * notification sounds from its own process and can't open the app's files directly. Read only,
 * and only files in that folder.
 */
class PrayerSoundProvider : ContentProvider() {
  override fun onCreate() = true

  override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor {
    val context = context ?: throw FileNotFoundException()
    val name = uri.lastPathSegment ?: throw FileNotFoundException()
    val file = soundFile(context, name)
    if (!file.isFile) throw FileNotFoundException(name)
    return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
  }

  override fun getType(uri: Uri) = "audio/*"

  override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?): Cursor? = null

  override fun insert(uri: Uri, values: ContentValues?): Uri? = null

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?) = 0

  override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?) = 0

  companion object {
    fun soundsDir(context: Context) = File(context.filesDir, "prayer_sounds")

    /** `name` without any path, so nothing outside the folder can be reached */
    fun soundFile(context: Context, name: String) = File(soundsDir(context), File(name).name)

    fun uri(context: Context, name: String): Uri = Uri.parse("content://${context.packageName}.prayersounds/${Uri.encode(File(name).name)}")
  }
}
