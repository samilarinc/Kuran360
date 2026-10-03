package expo.modules.quranspeech

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaRecorder
import android.net.Uri
import kotlinx.coroutines.delay
import java.nio.ByteOrder
import kotlin.math.max
import kotlin.math.min

/** What the speech models expect: 16 kHz mono. */
const val SAMPLE_RATE = 16000

/** Records 16 kHz mono PCM from the microphone on its own thread. */
class Recorder(maxSeconds: Int) {
  private val samples = ShortArray(maxSeconds * SAMPLE_RATE)
  private var count = 0
  private val record: AudioRecord
  private val thread: Thread

  @Volatile
  private var running = true
  private var result: FloatArray? = null

  init {
    val minBuffer = AudioRecord.getMinBufferSize(SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
    // The caller checks RECORD_AUDIO first; AudioRecord fails to initialise without it
    @SuppressLint("MissingPermission")
    val created = AudioRecord(
      // MIC keeps the device's gain control, like autoGainControl on the web
      MediaRecorder.AudioSource.MIC,
      SAMPLE_RATE,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      max(minBuffer, SAMPLE_RATE / 5 * 2),
    )
    record = created
    if (record.state != AudioRecord.STATE_INITIALIZED) {
      record.release()
      throw IllegalStateException("Microphone unavailable")
    }
    record.startRecording()
    thread = Thread {
      while (running && count < samples.size) {
        val read = record.read(samples, count, min(SAMPLE_RATE / 10, samples.size - count))
        if (read < 0) break
        count += read
      }
    }.apply { start() }
  }

  /** Stops recording and returns the samples as floats in -1..1; later calls return the same samples. */
  @Synchronized
  fun stop(): FloatArray = result ?: run {
    running = false
    thread.join()
    record.stop()
    record.release()
    FloatArray(count) { samples[it] / 32768f }.also { result = it }
  }
}

class DecodedAudio(val samples: FloatArray, val truncated: Boolean)

/**
 * Decodes the audio track of an audio or video file into 16 kHz mono samples,
 * keeping at most its first `maxSeconds`.
 */
fun decodeAudioFile(context: Context, uri: Uri, maxSeconds: Int): DecodedAudio {
  val extractor = MediaExtractor()
  try {
    extractor.setDataSource(context, uri, null)
    val track = (0 until extractor.trackCount).firstOrNull {
      extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("audio/") == true
    } ?: throw IllegalArgumentException("No audio track")
    extractor.selectTrack(track)
    val inputFormat = extractor.getTrackFormat(track)
    var sampleRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
    var channels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
    var floatPcm = false

    val codec = MediaCodec.createDecoderByType(inputFormat.getString(MediaFormat.KEY_MIME)!!)
    val mono = FloatList()
    var truncated = false
    try {
      codec.configure(inputFormat, null, null, 0)
      codec.start()
      val info = MediaCodec.BufferInfo()
      var inputDone = false
      while (true) {
        if (!inputDone) {
          val index = codec.dequeueInputBuffer(10_000)
          if (index >= 0) {
            val size = extractor.readSampleData(codec.getInputBuffer(index)!!, 0)
            if (size < 0) {
              codec.queueInputBuffer(index, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              inputDone = true
            } else {
              codec.queueInputBuffer(index, 0, size, extractor.sampleTime, 0)
              extractor.advance()
            }
          }
        }
        val index = codec.dequeueOutputBuffer(info, 10_000)
        if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
          val format = codec.outputFormat
          sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
          channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
          floatPcm = format.containsKey(MediaFormat.KEY_PCM_ENCODING) &&
            format.getInteger(MediaFormat.KEY_PCM_ENCODING) == AudioFormat.ENCODING_PCM_FLOAT
        } else if (index >= 0) {
          val buffer = codec.getOutputBuffer(index)!!.order(ByteOrder.nativeOrder())
          buffer.position(info.offset)
          buffer.limit(info.offset + info.size)
          // Downmix to mono
          if (floatPcm) {
            val pcm = buffer.asFloatBuffer()
            while (pcm.remaining() >= channels) {
              var sum = 0f
              repeat(channels) { sum += pcm.get() }
              mono.add(sum / channels)
            }
          } else {
            val pcm = buffer.asShortBuffer()
            while (pcm.remaining() >= channels) {
              var sum = 0f
              repeat(channels) { sum += pcm.get() / 32768f }
              mono.add(sum / channels)
            }
          }
          codec.releaseOutputBuffer(index, false)
          if (mono.size > maxSeconds * sampleRate) {
            truncated = true
            break
          }
          if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) break
        }
      }
    } finally {
      codec.stop()
      codec.release()
    }
    val samples = resample(mono.toArray(), sampleRate)
    return DecodedAudio(if (truncated) samples.copyOf(maxSeconds * SAMPLE_RATE) else samples, truncated)
  } finally {
    extractor.release()
  }
}

/**
 * Converts samples at `fromRate` to 16 kHz: each output sample averages the input samples it
 * covers (a simple low-pass against aliasing when downsampling) or interpolates between two.
 */
private fun resample(input: FloatArray, fromRate: Int): FloatArray {
  if (fromRate == SAMPLE_RATE || input.isEmpty()) return input
  val ratio = fromRate.toDouble() / SAMPLE_RATE
  val output = FloatArray((input.size / ratio).toInt())
  for (i in output.indices) {
    val start = i * ratio
    if (ratio > 1) {
      val from = start.toInt()
      val to = min(input.size, (start + ratio).toInt().coerceAtLeast(from + 1))
      var sum = 0f
      for (k in from until to) sum += input[k]
      output[i] = sum / (to - from)
    } else {
      val k = start.toInt()
      val frac = (start - k).toFloat()
      output[i] = input[k] * (1 - frac) + input[min(k + 1, input.size - 1)] * frac
    }
  }
  return output
}

/** Plays 16 kHz mono samples; returns when playback ends. */
suspend fun playSamples(samples: FloatArray) {
  if (samples.isEmpty()) return
  val track = AudioTrack.Builder()
    .setAudioAttributes(
      AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build(),
    )
    .setAudioFormat(
      AudioFormat.Builder()
        .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
        .setSampleRate(SAMPLE_RATE)
        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
        .build(),
    )
    .setTransferMode(AudioTrack.MODE_STATIC)
    .setBufferSizeInBytes(samples.size * 4)
    .build()
  try {
    track.write(samples, 0, samples.size, AudioTrack.WRITE_BLOCKING)
    track.play()
    while (track.playbackHeadPosition < samples.size && track.playState == AudioTrack.PLAYSTATE_PLAYING) delay(50)
  } finally {
    track.release()
  }
}

/** Growable float array, so decoding doesn't box every sample. */
private class FloatList {
  private var data = FloatArray(SAMPLE_RATE * 10)
  var size = 0
    private set

  fun add(value: Float) {
    if (size == data.size) data = data.copyOf(data.size * 2)
    data[size++] = value
  }

  fun toArray(): FloatArray = data.copyOf(size)
}
