import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Catalog of speech models the verse finder can use, and management of their files in the
 * browser's Cache Storage. Files are stored under their Hugging Face URLs in the
 * 'transformers-cache' cache, which is where Transformers.js looks for them, so the Whisper
 * worker finds a model downloaded here without fetching it again.
 */

export type VerseModelId = 'fastconformer' | 'whisper-webgpu' | 'whisper-webgpu-fp16' | 'whisper-cpu';
export type WorkerKind = 'whisper' | 'fastconformer';
export type Engine = 'webgpu-fp32' | 'webgpu-fp16' | 'wasm';

export interface VerseModel {
    id: VerseModelId;
    worker: WorkerKind;
    engine: Engine;
    /** Device feature the model needs beyond WebAssembly. */
    requires?: 'webgpu' | 'shader-f16';
    files: string[];
    sizeMb: number;
}

const CACHE_NAME = 'transformers-cache';
const SELECTED_KEY = 'verseFinder.selectedModel';

const WHISPER = 'https://huggingface.co/YunusZJ/whisper-base-ar-quran-ONNX/resolve/main/';
const FASTCONFORMER = 'https://huggingface.co/voidwaveDev/fastconformer-quran/resolve/main/';
const WHISPER_CONFIG = [
    'config.json',
    'generation_config.json',
    'preprocessor_config.json',
    'tokenizer.json',
    'tokenizer_config.json',
].map(file => WHISPER + file);

export const VERSE_MODELS: VerseModel[] = [
    {
        id: 'fastconformer',
        worker: 'fastconformer',
        engine: 'wasm',
        files: ['encoder.int8.onnx', 'decoder.int8.onnx', 'tokens.txt'].map(file => FASTCONFORMER + file),
        sizeMb: 137,
    },
    {
        id: 'whisper-webgpu',
        worker: 'whisper',
        engine: 'webgpu-fp32',
        requires: 'webgpu',
        files: [...WHISPER_CONFIG, WHISPER + 'onnx/encoder_model.onnx', WHISPER + 'onnx/decoder_model_merged_q4.onnx'],
        sizeMb: 226,
    },
    {
        id: 'whisper-webgpu-fp16',
        worker: 'whisper',
        engine: 'webgpu-fp16',
        requires: 'shader-f16',
        files: [...WHISPER_CONFIG, WHISPER + 'onnx/encoder_model_fp16.onnx', WHISPER + 'onnx/decoder_model_merged_q4.onnx'],
        sizeMb: 185,
    },
    {
        id: 'whisper-cpu',
        worker: 'whisper',
        engine: 'wasm',
        files: [...WHISPER_CONFIG, WHISPER + 'onnx/encoder_model_quantized.onnx', WHISPER + 'onnx/decoder_model_merged_quantized.onnx'],
        sizeMb: 342,
    },
];

export const getVerseModel = (id: VerseModelId): VerseModel =>
    VERSE_MODELS.find(model => model.id === id) ?? VERSE_MODELS[0];

const g = globalThis as any;
const openCache = () => g.caches.open(CACHE_NAME);

/** Which models have every file in the cache. */
export const getDownloadedModels = async (): Promise<Set<VerseModelId>> => {
    const downloaded = new Set<VerseModelId>();
    if (!g.caches) return downloaded;
    const cache = await openCache();
    for (const model of VERSE_MODELS) {
        const hits = await Promise.all(model.files.map(url => cache.match(url)));
        if (hits.every(Boolean)) downloaded.add(model.id);
    }
    return downloaded;
};

/** Whether every file is in the model cache. */
export const areFilesCached = async (files: string[]): Promise<boolean> => {
    if (!g.caches) return false;
    const cache = await openCache();
    const hits = await Promise.all(files.map(url => cache.match(url)));
    return hits.every(Boolean);
};

/** Downloads the files missing from the cache, reporting overall progress 0–1 against the expected size. */
export const downloadFiles = async (
    files: string[],
    sizeMb: number,
    onProgress: (fraction: number) => void,
    signal?: AbortSignal,
): Promise<void> => {
    const cache = await openCache();
    const missing: string[] = [];
    for (const url of files) if (!(await cache.match(url))) missing.push(url);

    const expected = sizeMb * 1e6;
    let received = 0;
    for (const url of missing) {
        const response = await fetch(url, { signal });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            onProgress(Math.min(0.99, received / expected));
        }
        const headers = new Headers(response.headers);
        await cache.put(url, new Response(new Blob(chunks as BlobPart[]), { headers }));
    }
    onProgress(1);
};

export const downloadModel = (
    model: VerseModel,
    onProgress: (fraction: number) => void,
    signal?: AbortSignal,
): Promise<void> => downloadFiles(model.files, model.sizeMb, onProgress, signal);

/** Removes a model's files, keeping any that another downloaded model still uses. */
export const deleteModel = async (model: VerseModel): Promise<void> => {
    const cache = await openCache();
    const downloaded = await getDownloadedModels();
    const stillUsed = new Set(
        VERSE_MODELS.filter(other => other.id !== model.id && downloaded.has(other.id)).flatMap(other => other.files),
    );
    await Promise.all(model.files.filter(url => !stillUsed.has(url)).map(url => cache.delete(url)));
};

export const getSelectedModelId = async (): Promise<VerseModelId | null> => {
    try {
        const id = await AsyncStorage.getItem(SELECTED_KEY);
        return VERSE_MODELS.some(model => model.id === id) ? (id as VerseModelId) : null;
    } catch {
        return null;
    }
};

export const setSelectedModelId = async (id: VerseModelId): Promise<void> => {
    try {
        await AsyncStorage.setItem(SELECTED_KEY, id);
    } catch {
        // selection just won't be remembered
    }
};
