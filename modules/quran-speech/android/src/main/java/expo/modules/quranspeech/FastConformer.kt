package expo.modules.quranspeech

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import java.io.File
import java.nio.FloatBuffer
import java.nio.IntBuffer
import java.nio.LongBuffer
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * The FastConformer Quran model (voidwaveDev/fastconformer-quran, CC-BY-4.0) on ONNX Runtime.
 * A Kotlin port of public/workers/fastconformer-core.js, which the web app runs: keep the two in step.
 *
 * Features match NeMo's AudioToMelSpectrogramPreprocessor: 0.97 pre-emphasis, 25 ms Hann
 * window / 10 ms hop, n_fft 512, 80 slaney mel filters, log(x + 2^-24), then per-feature
 * normalisation (required: without it the model emits nothing).
 */
class FastConformer(dir: File) : AutoCloseable {
  private val env = OrtEnvironment.getEnvironment()
  private val encoder: OrtSession
  private val decoder: OrtSession
  private val tokens: Array<String?>

  init {
    val options = OrtSession.SessionOptions()
    encoder = env.createSession(File(dir, "encoder.int8.onnx").path, options)
    decoder = env.createSession(File(dir, "decoder.int8.onnx").path, options)
    tokens = parseTokens(File(dir, "tokens.txt").readText())
  }

  override fun close() {
    encoder.close()
    decoder.close()
  }

  /** Runs the encoder, then greedy transducer decoding with the fused decoder+joint network. */
  fun transcribe(audio: FloatArray): String {
    val (features, frames) = computeFeatures(audio)
    val ids = mutableListOf<Int>()

    OnnxTensor.createTensor(env, FloatBuffer.wrap(features), longArrayOf(1, N_MELS.toLong(), frames.toLong())).use { signal ->
      OnnxTensor.createTensor(env, LongBuffer.wrap(longArrayOf(frames.toLong())), longArrayOf(1)).use { length ->
        encoder.run(mapOf("audio_signal" to signal, "length" to length)).use { encoded ->
          val out = encoded.get("outputs").get() as OnnxTensor
          val dim = out.info.shape[1].toInt()
          val total = out.info.shape[2].toInt()
          val steps = (encoded.get("encoded_lengths").get() as OnnxTensor).longBuffer.get(0).toInt()
          val data = out.floatBuffer

          var state1 = FloatArray(PRED_HIDDEN)
          var state2 = FloatArray(PRED_HIDDEN)
          var previous = BLANK
          val stateShape = longArrayOf(1, 1, PRED_HIDDEN.toLong())

          OnnxTensor.createTensor(env, IntBuffer.wrap(intArrayOf(1)), longArrayOf(1)).use { targetLength ->
            val frame = FloatArray(dim)
            for (t in 0 until steps) {
              for (c in 0 until dim) frame[c] = data.get(c * total + t)
              OnnxTensor.createTensor(env, FloatBuffer.wrap(frame), longArrayOf(1, dim.toLong(), 1)).use { frameTensor ->
                for (s in 0 until MAX_SYMBOLS_PER_FRAME) {
                  val inputs = mapOf(
                    "encoder_outputs" to frameTensor,
                    "targets" to OnnxTensor.createTensor(env, IntBuffer.wrap(intArrayOf(previous)), longArrayOf(1, 1)),
                    "target_length" to targetLength,
                    "input_states_1" to OnnxTensor.createTensor(env, FloatBuffer.wrap(state1), stateShape),
                    "input_states_2" to OnnxTensor.createTensor(env, FloatBuffer.wrap(state2), stateShape),
                  )
                  val emitted = try {
                    decoder.run(inputs).use { result ->
                      val logits = (result.get("outputs").get() as OnnxTensor).floatBuffer
                      var best = 0
                      for (k in 1 until logits.limit()) if (logits.get(k) > logits.get(best)) best = k
                      if (best == BLANK) {
                        false
                      } else {
                        // The returned states are the predictor's state after consuming `previous`
                        ids.add(best)
                        previous = best
                        state1 = (result.get("output_states_1").get() as OnnxTensor).floatBuffer.toArray()
                        state2 = (result.get("output_states_2").get() as OnnxTensor).floatBuffer.toArray()
                        true
                      }
                    }
                  } finally {
                    inputs["targets"]?.close()
                    inputs["input_states_1"]?.close()
                    inputs["input_states_2"]?.close()
                  }
                  if (!emitted) break
                }
              }
            }
          }
        }
      }
    }

    return ids
      .mapNotNull { tokens.getOrNull(it) }
      .filter { it.isNotEmpty() && it != "<unk>" }
      .joinToString("")
      .replace('▁', ' ')
      .trim()
  }

  companion object {
    private const val SAMPLE_RATE = 16000
    private const val N_FFT = 512
    private const val WIN = 400
    private const val HOP = 160
    private const val N_MELS = 80
    private const val PREEMPH = 0.97f
    private val LOG_GUARD = 2.0.pow(-24)
    private const val BLANK = 1024
    private const val PRED_HIDDEN = 640
    private const val MAX_SYMBOLS_PER_FRAME = 5

    private fun hzToMel(hz: Double) = if (hz < 1000) 3 * hz / 200 else 15 + ln(hz / 1000) / (ln(6.4) / 27)
    private fun melToHz(mel: Double) = if (mel < 15) 200 * mel / 3 else 1000 * exp((ln(6.4) / 27) * (mel - 15))

    // librosa.filters.mel(sr=16000, n_fft=512, n_mels=80, fmin=0, fmax=8000, norm='slaney')
    private val melFilters: Array<FloatArray> by lazy {
      val bins = N_FFT / 2 + 1
      val maxMel = hzToMel(SAMPLE_RATE / 2.0)
      val melF = DoubleArray(N_MELS + 2) { melToHz(maxMel * it / (N_MELS + 1)) }
      Array(N_MELS) { m ->
        val enorm = 2 / (melF[m + 2] - melF[m])
        FloatArray(bins) { k ->
          val f = k.toDouble() * SAMPLE_RATE / N_FFT
          val lower = (f - melF[m]) / (melF[m + 1] - melF[m])
          val upper = (melF[m + 2] - f) / (melF[m + 2] - melF[m + 1])
          (max(0.0, min(lower, upper)) * enorm).toFloat()
        }
      }
    }

    // Symmetric Hann window (torch.hann_window(400, periodic=False)), centred in the 512-point frame
    private val hannWindow: FloatArray by lazy {
      val window = FloatArray(N_FFT)
      val offset = (N_FFT - WIN) / 2
      for (i in 0 until WIN) window[offset + i] = (0.5 - 0.5 * cos(2 * PI * i / (WIN - 1))).toFloat()
      window
    }

    /** Parses tokens.txt ("<token> <id>" per line) into an id-indexed array. */
    private fun parseTokens(text: String): Array<String?> {
      val entries = text.lines().mapNotNull { line ->
        val at = line.lastIndexOf(' ')
        if (at > 0) line.substring(at + 1).toIntOrNull()?.let { it to line.substring(0, at) } else null
      }
      val tokens = arrayOfNulls<String>((entries.maxOfOrNull { it.first } ?: -1) + 1)
      for ((id, token) in entries) tokens[id] = token
      return tokens
    }

    /** In-place iterative radix-2 FFT. */
    private fun fft(re: DoubleArray, im: DoubleArray) {
      val n = re.size
      var j = 0
      for (i in 1 until n) {
        var bit = n shr 1
        while (j and bit != 0) {
          j = j xor bit
          bit = bit shr 1
        }
        j = j xor bit
        if (i < j) {
          re[i] = re[j].also { re[j] = re[i] }
          im[i] = im[j].also { im[j] = im[i] }
        }
      }
      var len = 2
      while (len <= n) {
        val angle = -2 * PI / len
        for (i in 0 until n step len) {
          for (k in 0 until len / 2) {
            val wr = cos(angle * k)
            val wi = sin(angle * k)
            val a = i + k
            val b = a + len / 2
            val tr = re[b] * wr - im[b] * wi
            val ti = re[b] * wi + im[b] * wr
            re[b] = re[a] - tr
            im[b] = im[a] - ti
            re[a] += tr
            im[a] += ti
          }
        }
        len = len shl 1
      }
    }

    /** 16 kHz mono samples → normalised log-mel features, laid out [80, frames] row-major. */
    private fun computeFeatures(audio: FloatArray): Pair<FloatArray, Int> {
      // center=True with zero padding of n_fft/2 on both sides
      val pad = N_FFT / 2
      val padded = FloatArray(audio.size + 2 * pad)
      if (audio.isNotEmpty()) padded[pad] = audio[0]
      for (i in 1 until audio.size) padded[pad + i] = audio[i] - PREEMPH * audio[i - 1]
      val frames = 1 + audio.size / HOP
      val bins = N_FFT / 2 + 1

      val features = FloatArray(N_MELS * frames)
      val re = DoubleArray(N_FFT)
      val im = DoubleArray(N_FFT)
      val power = DoubleArray(bins)
      for (t in 0 until frames) {
        val start = t * HOP
        for (i in 0 until N_FFT) {
          val index = start + i
          re[i] = (if (index < padded.size) padded[index] else 0f).toDouble() * hannWindow[i]
          im[i] = 0.0
        }
        fft(re, im)
        for (k in 0 until bins) power[k] = re[k] * re[k] + im[k] * im[k]
        for (m in 0 until N_MELS) {
          val filter = melFilters[m]
          var sum = 0.0
          for (k in 0 until bins) sum += filter[k] * power[k]
          features[m * frames + t] = ln(sum + LOG_GUARD).toFloat()
        }
      }

      // Per-feature normalisation: zero mean, unit (unbiased) std per mel bin
      for (m in 0 until N_MELS) {
        val offset = m * frames
        var mean = 0.0
        for (i in 0 until frames) mean += features[offset + i]
        mean /= frames
        var variance = 0.0
        for (i in 0 until frames) variance += (features[offset + i] - mean).pow(2)
        val std = sqrt(variance / max(1, frames - 1)) + 1e-5
        for (i in 0 until frames) features[offset + i] = ((features[offset + i] - mean) / std).toFloat()
      }
      return features to frames
    }

    private fun FloatBuffer.toArray(): FloatArray = FloatArray(limit()).also { duplicate().apply { rewind() }.get(it) }
  }
}
