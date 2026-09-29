// Runs Tarteel's Quran Whisper model (tarteel-ai/whisper-base-ar-quran, Apache-2.0, ONNX export
// for Transformers.js) off the main thread for the verse finder screen.
// Files come from the 'transformers-cache' browser cache, which the model manager fills.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';

const MODEL_ID = 'YunusZJ/whisper-base-ar-quran-ONNX';

env.allowLocalModels = false;

// Must match the files listed for each Whisper entry in src/services/verseModels.ts
const OPTIONS = {
  'webgpu-fp32': { device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } },
  'webgpu-fp16': { device: 'webgpu', dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' } },
  wasm: { device: 'wasm', dtype: 'q8' },
};

let transcriber = null;

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      transcriber ??= await pipeline('automatic-speech-recognition', MODEL_ID, OPTIONS[data.engine]);
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'transcribe') {
      const started = performance.now();
      const result = await transcriber(data.audio, { language: 'arabic', task: 'transcribe' });
      self.postMessage({ type: 'result', text: result.text, ms: Math.round(performance.now() - started) });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message ?? error) });
  }
};
