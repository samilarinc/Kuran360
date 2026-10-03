package expo.modules.quranspeech

import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.Float32Array
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/** Longest recording kept; the app stops earlier (MAX_RECORDING_SECONDS in src/services/verseFinder.ts). */
private const val MAX_RECORDING_SECONDS = 60

/**
 * Speech recognition for the verse finder and memorization check on Android: microphone
 * recording, audio file decoding, playback and the FastConformer model.
 *
 * Samples cross to JS only through the synchronous putSamples/takeSamples, since a typed array
 * can only be read on the JS thread; the async functions take or return a handle to them.
 */
class QuranSpeechModule : Module() {
  private val buffers = ConcurrentHashMap<Int, FloatArray>()
  private val nextHandle = AtomicInteger(1)
  @Volatile
  private var recorder: Recorder? = null
  private var model: FastConformer? = null
  private var modelDir: String? = null
  private val modelLock = Mutex()

  private fun store(samples: FloatArray): Int = nextHandle.getAndIncrement().also { buffers[it] = samples }

  private fun take(handle: Int): FloatArray = buffers.remove(handle) ?: throw IllegalArgumentException("Unknown audio handle")

  private fun samplesResult(samples: FloatArray, truncated: Boolean = false) =
    mapOf("handle" to store(samples), "length" to samples.size, "truncated" to truncated)

  override fun definition() = ModuleDefinition {
    Name("QuranSpeech")

    OnDestroy {
      recorder?.stop()
      model?.close()
    }

    AsyncFunction("startRecording") {
      recorder?.stop()
      recorder = Recorder(MAX_RECORDING_SECONDS)
    }

    AsyncFunction("stopRecording") {
      val samples = recorder?.stop() ?: throw IllegalStateException("Not recording")
      recorder = null
      samplesResult(samples)
    }

    Function("cancelRecording") {
      recorder?.stop()
      recorder = null
    }

    AsyncFunction("decodeFile") Coroutine { uri: String, maxSeconds: Int ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val decoded = withContext(Dispatchers.IO) { decodeAudioFile(context, Uri.parse(uri), maxSeconds) }
      samplesResult(decoded.samples, decoded.truncated)
    }

    /** Copies samples from JS into a new handle. */
    Function("putSamples") { data: Float32Array ->
      val samples = FloatArray(data.length)
      data.toDirectBuffer().asFloatBuffer().get(samples)
      store(samples)
    }

    /** Copies a handle's samples into `out` (sized from the handle's length) and frees it. */
    Function("takeSamples") { handle: Int, out: Float32Array ->
      out.toDirectBuffer().asFloatBuffer().put(take(handle))
    }

    Function("releaseSamples") { handle: Int ->
      buffers.remove(handle)
    }

    AsyncFunction("play") Coroutine { handle: Int ->
      playSamples(take(handle))
    }

    /** Loads the model from a folder holding encoder.int8.onnx, decoder.int8.onnx and tokens.txt. */
    AsyncFunction("loadModel") Coroutine { dir: String ->
      modelLock.withLock {
        if (model == null || modelDir != dir) {
          model?.close()
          model = null
          model = withContext(Dispatchers.Default) { FastConformer(File(dir)) }
          modelDir = dir
        }
      }
    }

    AsyncFunction("unloadModel") Coroutine { ->
      modelLock.withLock {
        model?.close()
        model = null
        modelDir = null
      }
    }

    AsyncFunction("transcribe") Coroutine { handle: Int ->
      val audio = take(handle)
      modelLock.withLock {
        val loaded = model ?: throw IllegalStateException("Model not loaded")
        val started = System.currentTimeMillis()
        val text = withContext(Dispatchers.Default) { loaded.transcribe(audio) }
        mapOf("text" to text, "ms" to (System.currentTimeMillis() - started))
      }
    }
  }
}
