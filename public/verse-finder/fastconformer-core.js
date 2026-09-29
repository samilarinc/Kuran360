// Feature extraction and greedy RNN-T decoding for the FastConformer Quran model
// (voidwaveDev/fastconformer-quran, CC-BY-4.0). Plain JS with no dependencies so the
// verse finder worker and offline checks share it; the ONNX runtime is passed in.
//
// Features match NeMo's AudioToMelSpectrogramPreprocessor: 0.97 pre-emphasis, 25 ms Hann
// window / 10 ms hop, n_fft 512, 80 slaney mel filters, log(x + 2^-24), then per-feature
// normalisation (required: without it the model emits nothing).

const SAMPLE_RATE = 16000;
const N_FFT = 512;
const WIN = 400;
const HOP = 160;
const N_MELS = 80;
const PREEMPH = 0.97;
const LOG_GUARD = 2 ** -24;
const BLANK = 1024;
const PRED_HIDDEN = 640;
const MAX_SYMBOLS_PER_FRAME = 5;

const hzToMel = hz => (hz < 1000 ? (3 * hz) / 200 : 15 + Math.log(hz / 1000) / (Math.log(6.4) / 27));
const melToHz = mel => (mel < 15 ? (200 * mel) / 3 : 1000 * Math.exp((Math.log(6.4) / 27) * (mel - 15)));

// librosa.filters.mel(sr=16000, n_fft=512, n_mels=80, fmin=0, fmax=8000, norm='slaney')
const buildMelFilters = () => {
  const bins = N_FFT / 2 + 1;
  const maxMel = hzToMel(SAMPLE_RATE / 2);
  const melF = Array.from({ length: N_MELS + 2 }, (_, i) => melToHz((maxMel * i) / (N_MELS + 1)));
  const filters = [];
  for (let m = 0; m < N_MELS; m++) {
    const row = new Float32Array(bins);
    const enorm = 2 / (melF[m + 2] - melF[m]);
    for (let k = 0; k < bins; k++) {
      const f = (k * SAMPLE_RATE) / N_FFT;
      const lower = (f - melF[m]) / (melF[m + 1] - melF[m]);
      const upper = (melF[m + 2] - f) / (melF[m + 2] - melF[m + 1]);
      row[k] = Math.max(0, Math.min(lower, upper)) * enorm;
    }
    filters.push(row);
  }
  return filters;
};

// Symmetric Hann window (torch.hann_window(400, periodic=False)), centred in the 512-point frame
const buildWindow = () => {
  const window = new Float32Array(N_FFT);
  const offset = (N_FFT - WIN) / 2;
  for (let i = 0; i < WIN; i++) window[offset + i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1));
  return window;
};

// In-place iterative radix-2 FFT (bit-reversal needs bitwise ops)
/* eslint-disable no-bitwise */
const fft = (re, im) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(angle * k);
        const wi = Math.sin(angle * k);
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
};
/* eslint-enable no-bitwise */

let melFilters = null;
let hannWindow = null;

/** 16 kHz mono samples → normalised log-mel features, laid out [80, frames] row-major. */
export const computeFeatures = audio => {
  melFilters ??= buildMelFilters();
  hannWindow ??= buildWindow();

  const emphasized = new Float32Array(audio.length);
  emphasized[0] = audio[0] ?? 0;
  for (let i = 1; i < audio.length; i++) emphasized[i] = audio[i] - PREEMPH * audio[i - 1];

  // center=True with zero padding of n_fft/2 on both sides
  const pad = N_FFT / 2;
  const padded = new Float32Array(audio.length + 2 * pad);
  padded.set(emphasized, pad);
  const frames = 1 + Math.floor(audio.length / HOP);
  const bins = N_FFT / 2 + 1;

  const features = new Float32Array(N_MELS * frames);
  const re = new Float32Array(N_FFT);
  const im = new Float32Array(N_FFT);
  const power = new Float32Array(bins);
  for (let t = 0; t < frames; t++) {
    const start = t * HOP;
    for (let i = 0; i < N_FFT; i++) {
      re[i] = (padded[start + i] ?? 0) * hannWindow[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < bins; k++) power[k] = re[k] * re[k] + im[k] * im[k];
    for (let m = 0; m < N_MELS; m++) {
      const filter = melFilters[m];
      let sum = 0;
      for (let k = 0; k < bins; k++) sum += filter[k] * power[k];
      features[m * frames + t] = Math.log(sum + LOG_GUARD);
    }
  }

  // Per-feature normalisation: zero mean, unit (unbiased) std per mel bin
  for (let m = 0; m < N_MELS; m++) {
    const row = features.subarray(m * frames, (m + 1) * frames);
    let mean = 0;
    for (const v of row) mean += v;
    mean /= frames;
    let variance = 0;
    for (const v of row) variance += (v - mean) ** 2;
    const std = Math.sqrt(variance / Math.max(1, frames - 1)) + 1e-5;
    for (let i = 0; i < frames; i++) row[i] = (row[i] - mean) / std;
  }
  return { features, frames };
};

/** Parses tokens.txt ("<token> <id>" per line) into an id-indexed array. */
export const parseTokens = text => {
  const tokens = [];
  for (const line of text.split('\n')) {
    const at = line.lastIndexOf(' ');
    if (at > 0) tokens[Number(line.slice(at + 1))] = line.slice(0, at);
  }
  return tokens;
};

/** Runs the encoder, then greedy transducer decoding with the fused decoder+joint network. */
export const transcribe = async (ort, encoder, decoder, tokens, audio) => {
  const { features, frames } = computeFeatures(audio);
  const encoded = await encoder.run({
    audio_signal: new ort.Tensor('float32', features, [1, N_MELS, frames]),
    length: new ort.Tensor('int64', BigInt64Array.from([BigInt(frames)]), [1]),
  });
  const out = encoded.outputs;
  const dim = out.dims[1];
  const steps = Number(encoded.encoded_lengths.data[0]);
  const total = out.dims[2];

  let state1 = new ort.Tensor('float32', new Float32Array(PRED_HIDDEN), [1, 1, PRED_HIDDEN]);
  let state2 = new ort.Tensor('float32', new Float32Array(PRED_HIDDEN), [1, 1, PRED_HIDDEN]);
  let previous = BLANK;
  const targetLength = new ort.Tensor('int32', Int32Array.from([1]), [1]);
  const ids = [];

  for (let t = 0; t < steps; t++) {
    const frame = new Float32Array(dim);
    for (let c = 0; c < dim; c++) frame[c] = out.data[c * total + t];
    const frameTensor = new ort.Tensor('float32', frame, [1, dim, 1]);

    for (let s = 0; s < MAX_SYMBOLS_PER_FRAME; s++) {
      const result = await decoder.run({
        encoder_outputs: frameTensor,
        targets: new ort.Tensor('int32', Int32Array.from([previous]), [1, 1]),
        target_length: targetLength,
        input_states_1: state1,
        input_states_2: state2,
      });
      const logits = result.outputs.data;
      let best = 0;
      for (let k = 1; k < logits.length; k++) if (logits[k] > logits[best]) best = k;
      if (best === BLANK) break;
      // The returned states are the predictor's state after consuming `previous`
      ids.push(best);
      previous = best;
      state1 = result.output_states_1;
      state2 = result.output_states_2;
    }
  }

  return ids
    .map(id => tokens[id] ?? '')
    .filter(token => token && token !== '<unk>')
    .join('')
    .replace(/▁/g, ' ')
    .trim();
};
