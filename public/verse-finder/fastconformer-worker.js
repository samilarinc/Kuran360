// Runs the FastConformer Quran model (voidwaveDev/fastconformer-quran, CC-BY-4.0, based on
// mohammed/fastconformer-quran-ar) with onnxruntime-web on the CPU.
// Files come from the 'transformers-cache' browser cache, which the model manager fills.
import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.wasm.min.mjs';
import { parseTokens, transcribe } from './fastconformer-core.js';

const BASE = 'https://huggingface.co/voidwaveDev/fastconformer-quran/resolve/main/';
const CACHE_NAME = 'transformers-cache';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';

let model = null;

const getFile = async name => {
  const url = BASE + name;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  await cache.put(url, response.clone());
  return response;
};

const load = async () => {
  const [encoderBytes, decoderBytes, tokensText] = await Promise.all([
    getFile('encoder.int8.onnx').then(r => r.arrayBuffer()),
    getFile('decoder.int8.onnx').then(r => r.arrayBuffer()),
    getFile('tokens.txt').then(r => r.text()),
  ]);
  const options = { executionProviders: ['wasm'] };
  return {
    encoder: await ort.InferenceSession.create(new Uint8Array(encoderBytes), options),
    decoder: await ort.InferenceSession.create(new Uint8Array(decoderBytes), options),
    tokens: parseTokens(tokensText),
  };
};

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      model ??= await load();
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'transcribe') {
      const started = performance.now();
      const text = await transcribe(ort, model.encoder, model.decoder, model.tokens, data.audio);
      self.postMessage({ type: 'result', text, ms: Math.round(performance.now() - started) });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message ?? error) });
  }
};
