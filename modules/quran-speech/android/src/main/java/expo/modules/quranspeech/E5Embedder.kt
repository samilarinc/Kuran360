package expo.modules.quranspeech

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import java.io.File
import java.nio.LongBuffer
import java.text.Normalizer
import kotlin.math.sqrt

/**
 * The topic search's embedding model (Xenova/multilingual-e5-small, MIT, ONNX q8) on ONNX Runtime.
 * The web app runs it through Transformers.js in public/workers/embedding-worker.js; this matches
 * that tokenizer step for step (its Precompiled normalizer is NFKC, its Unigram is a Viterbi over the
 * whole text) so a query gets the same vector on both, comparable to the precomputed verse vectors.
 */
class E5Embedder(dir: File) : AutoCloseable {
  private val env = OrtEnvironment.getEnvironment()
  private val session: OrtSession
  private val tokenizer = UnigramTokenizer(File(dir, "tokenizer.json").readText())

  init {
    session = env.createSession(File(dir, "onnx/model_quantized.onnx").path, OrtSession.SessionOptions())
  }

  override fun close() {
    session.close()
  }

  /** Mean-pooled, L2-normalised vector of `text`. */
  fun embed(text: String): FloatArray {
    val ids = tokenizer.encode(text)
    val shape = longArrayOf(1, ids.size.toLong())
    OnnxTensor.createTensor(env, LongBuffer.wrap(ids), shape).use { inputIds ->
      OnnxTensor.createTensor(env, LongBuffer.wrap(LongArray(ids.size) { 1 }), shape).use { mask ->
        OnnxTensor.createTensor(env, LongBuffer.wrap(LongArray(ids.size)), shape).use { types ->
          val inputs = mapOf("input_ids" to inputIds, "attention_mask" to mask, "token_type_ids" to types)
          session.run(inputs).use { result ->
            val hidden = result.get("last_hidden_state").get() as OnnxTensor
            val dim = hidden.info.shape[2].toInt()
            val data = hidden.floatBuffer
            val vector = FloatArray(dim)
            for (t in ids.indices) for (c in 0 until dim) vector[c] += data.get(t * dim + c)
            var norm = 0.0
            for (c in 0 until dim) {
              vector[c] /= ids.size
              norm += vector[c] * vector[c]
            }
            val scale = 1 / sqrt(norm).coerceAtLeast(1e-12)
            for (c in 0 until dim) vector[c] = (vector[c] * scale).toFloat()
            return vector
          }
        }
      }
    }
  }
}

/**
 * XLM-RoBERTa's SentencePiece Unigram tokenizer, read from a Hugging Face tokenizer.json.
 * A port of Transformers.js (Precompiled + Replace normalizers, Metaspace, Unigram with fused
 * unknowns, <s> ... </s> template) rather than of the Rust tokenizers, since the web app uses it.
 */
class UnigramTokenizer(json: String) {
  private val ids = HashMap<String, Int>()
  private val scores: DoubleArray
  private val unkId: Int
  private val unkScore: Double
  /** Longest vocabulary piece, in code points. */
  private val maxPieceLength: Int

  init {
    val model = json.indexOf("\"model\"").also { require(it >= 0) { "No model in tokenizer.json" } }
    unkId = Regex("\"unk_id\"\\s*:\\s*(\\d+)").find(json, model)!!.groupValues[1].toInt()
    val reader = JsonCursor(json, json.indexOf("\"vocab\"", model) + "\"vocab\"".length)
    reader.expect(':')
    reader.expect('[')
    val vocabScores = ArrayList<Double>(260_000)
    var longest = 1
    var index = 0
    while (!reader.consume(']')) {
      if (index > 0) reader.expect(',')
      reader.expect('[')
      val piece = reader.string()
      reader.expect(',')
      vocabScores.add(reader.number())
      reader.expect(']')
      // A repeated piece maps to its last id, like the Map Transformers.js builds
      ids[piece] = index++
      longest = maxOf(longest, piece.codePointCount(0, piece.length))
    }
    scores = vocabScores.toDoubleArray()
    unkScore = scores.min() - 10
    scores[unkId] = unkScore
    maxPieceLength = longest
  }

  /** Token ids with <s> and </s> around them, at most MAX_TOKENS. */
  fun encode(text: String): LongArray {
    val pieces = tokenize(preTokenize(normalize(text)))
    val out = ArrayList<Long>(pieces.size + 2)
    out.add(BOS_ID)
    var previousUnknown = false
    for (piece in pieces) {
      val id = ids[piece]
      // Consecutive unknown pieces become a single <unk>
      if (id == null || id == unkId) {
        if (!previousUnknown) out.add(unkId.toLong())
        previousUnknown = true
      } else {
        out.add(id.toLong())
        previousUnknown = false
      }
    }
    if (out.size > MAX_TOKENS - 1) out.subList(MAX_TOKENS - 1, out.size).clear()
    out.add(EOS_ID)
    return out.toLongArray()
  }

  private fun normalize(text: String): String {
    var normalized = text.replace(CONTROL_CHARS, "").replace(SPACE_CHARS, " ")
    normalized = normalized.split(FULLWIDTH_TILDE).joinToString(FULLWIDTH_TILDE) { Normalizer.normalize(it, Normalizer.Form.NFKC) }
    return normalized.replace(REPEATED_SPACES, " ")
  }

  private fun preTokenize(text: String): String {
    val replaced = text.replace(' ', METASPACE)
    return if (replaced.startsWith(METASPACE)) replaced else METASPACE + replaced
  }

  /** Viterbi over every vocabulary piece found in `text`; a character with no piece of its own is unknown. */
  private fun tokenize(text: String): List<String> {
    val chars = text.codePoints().toArray().map { String(Character.toChars(it)) }
    val length = chars.size
    // Best path ending at each position: its score, and the piece (start, id) that ends it there
    val bestScore = DoubleArray(length + 1) { Double.NEGATIVE_INFINITY }
    val bestStart = IntArray(length + 1) { -1 }
    bestScore[0] = 0.0
    for (start in 0 until length) {
      if (bestStart[start] < 0 && start > 0) continue
      val base = bestScore[start]
      var hasSingle = false
      val piece = StringBuilder()
      for (end in start + 1..minOf(length, start + maxPieceLength)) {
        piece.append(chars[end - 1])
        val id = ids[piece.toString()] ?: continue
        if (end == start + 1) hasSingle = true
        relax(start, end, base + scores[id], bestScore, bestStart)
      }
      if (!hasSingle) relax(start, start + 1, base + unkScore, bestScore, bestStart)
    }
    val pieces = ArrayList<String>()
    var end = length
    while (end > 0) {
      val start = bestStart[end]
      pieces.add(chars.subList(start, end).joinToString(""))
      end = start
    }
    pieces.reverse()
    return pieces
  }

  /**
   * Keeps the first best path into `end`. Transformers.js visits the paths ending at a position in the
   * order of their start, and so do the callers, so ties resolve the same way.
   */
  private fun relax(start: Int, end: Int, score: Double, bestScore: DoubleArray, bestStart: IntArray) {
    if (bestStart[end] < 0 || score > bestScore[end]) {
      bestScore[end] = score
      bestStart[end] = start
    }
  }

  private companion object {
    const val BOS_ID = 0L
    const val EOS_ID = 2L
    const val MAX_TOKENS = 512
    const val METASPACE = '▁'
    const val FULLWIDTH_TILDE = "～"
    val CONTROL_CHARS = Regex("[\u0001-\u0008\u000B\u000E-\u001F\u007F\u008F\u009F]")
    val SPACE_CHARS = Regex("[\u0009\u000A\u000C\u000D   -‏    ▁　﻿�]")
    val REPEATED_SPACES = Regex(" {2,}")
  }
}

/** Just enough of a JSON reader to stream tokenizer.json's 250k-entry vocabulary without building a tree. */
private class JsonCursor(private val text: String, private var pos: Int) {
  private fun skipSpace() {
    while (pos < text.length && text[pos].isWhitespace()) pos++
  }

  fun consume(char: Char): Boolean {
    skipSpace()
    if (pos < text.length && text[pos] == char) {
      pos++
      return true
    }
    return false
  }

  fun expect(char: Char) {
    if (!consume(char)) throw IllegalArgumentException("Expected '$char' at $pos in tokenizer.json")
  }

  fun string(): String {
    expect('"')
    val out = StringBuilder()
    while (true) {
      when (val c = text[pos++]) {
        '"' -> return out.toString()
        '\\' -> when (val escaped = text[pos++]) {
          'n' -> out.append('\n')
          't' -> out.append('\t')
          'r' -> out.append('\r')
          'b' -> out.append('\b')
          'f' -> out.append('\u000C')
          'u' -> {
            out.append(text.substring(pos, pos + 4).toInt(16).toChar())
            pos += 4
          }
          else -> out.append(escaped)
        }
        else -> out.append(c)
      }
    }
  }

  fun number(): Double {
    skipSpace()
    val start = pos
    while (pos < text.length && text[pos] !in ",]} \n\r\t") pos++
    return text.substring(start, pos).toDouble()
  }
}
