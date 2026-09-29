// Embeds topic-search queries with multilingual-e5-small (Xenova/multilingual-e5-small, MIT, ONNX q8)
// off the main thread. Files come from the 'transformers-cache' browser cache, which the topic search
// screen fills. Vectors match the precomputed verse embeddings in /embeddings/.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';

const MODEL_ID = 'Xenova/multilingual-e5-small';

env.allowLocalModels = false;

let extractor = null;

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      extractor ??= await pipeline('feature-extraction', MODEL_ID, { device: 'wasm', dtype: 'q8' });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'embed') {
      const output = await extractor(data.text, { pooling: 'mean', normalize: true });
      self.postMessage({ type: 'result', id: data.id, vector: output.data });
    }
  } catch (error) {
    self.postMessage({ type: 'error', id: data.id, message: String(error?.message ?? error) });
  }
};
