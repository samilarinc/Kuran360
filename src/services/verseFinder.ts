import { Platform } from 'react-native';
import { loadSurah, quranData } from '@/data/quranData';
import { buildVerseIndex, findVerses, MatcherVerse, VerseIndex, VerseMatch } from '@/utils/verseMatcher';
import type { VerseModel, VerseModelId } from '@/services/verseModels';

/**
 * Web-only plumbing for the verse finder: device capability checks, microphone recording,
 * and the speech model, which runs in a worker under public/workers/ so the UI stays responsive.
 */

export const SAMPLE_RATE = 16000;
export const MAX_RECORDING_SECONDS = 15;

const g = globalThis as any;

export type WebGpuStatus = 'available' | 'noAdapter' | 'unsupported';

export interface DeviceSupport {
    isWeb: boolean;
    /** WebGPU and the microphone are only exposed on HTTPS (or localhost) pages. */
    secureContext: boolean;
    webgpu: WebGpuStatus;
    gpuName?: string;
    /** The adapter is a CPU emulation (e.g. SwiftShader), not the device's graphics card. */
    softwareGpu: boolean;
    shaderF16: boolean;
    microphone: boolean;
    worker: boolean;
}

export const checkDeviceSupport = async (): Promise<DeviceSupport> => {
    const isWeb = Platform.OS === 'web';
    const nav = g.navigator;
    const support: DeviceSupport = {
        isWeb,
        secureContext: isWeb && g.isSecureContext !== false,
        webgpu: 'unsupported',
        softwareGpu: false,
        shaderF16: false,
        microphone: isWeb && !!nav?.mediaDevices?.getUserMedia && typeof g.MediaRecorder !== 'undefined',
        worker: isWeb && typeof g.Worker !== 'undefined',
    };
    if (!isWeb || !nav?.gpu) return support;
    try {
        const adapter = await nav.gpu.requestAdapter();
        if (!adapter) {
            support.webgpu = 'noAdapter';
            return support;
        }
        support.webgpu = 'available';
        support.shaderF16 = adapter.features.has('shader-f16');
        const info = adapter.info;
        const name = [info?.vendor, info?.architecture || info?.description].filter(Boolean).join(' ');
        if (name) support.gpuName = name;
        support.softwareGpu = !!(info?.isFallbackAdapter ?? adapter.isFallbackAdapter) || /swiftshader/i.test(name);
    } catch {
        support.webgpu = 'noAdapter';
    }
    return support;
};

/** Why a model can't run on this device, or null if it can. */
export const getUnsupportedReason = (model: VerseModel, support: DeviceSupport): 'webgpu' | 'shader-f16' | 'software' | null => {
    if (!model.requires) return null;
    if (support.webgpu !== 'available') return 'webgpu';
    // SwiftShader runs WebGPU on the CPU, slower than the WASM models
    if (support.softwareGpu) return 'software';
    if (model.requires === 'shader-f16' && !support.shaderF16) return 'shader-f16';
    return null;
};

export const isModelSupported = (model: VerseModel, support: DeviceSupport): boolean =>
    getUnsupportedReason(model, support) === null;

type Pending = { resolve: (value: any) => void; reject: (error: Error) => void };

/** Keeps one speech model loaded in its worker (public/workers/) across screen visits. */
class SpeechModel {
    private worker: any = null;
    private loadPromise: Promise<void> | null = null;
    private pendingTranscribe: Pending | null = null;
    /** The model loaded (or loading) in the worker. */
    modelId: VerseModelId | null = null;
    ready = false;

    private failAll(error: Error) {
        this.pendingTranscribe?.reject(error);
        this.pendingTranscribe = null;
    }

    /** Stops the worker and frees the model, e.g. before its files are deleted. */
    unload() {
        this.worker?.terminate();
        this.worker = null;
        this.loadPromise = null;
        this.modelId = null;
        this.ready = false;
        this.failAll(new Error('Model unloaded'));
    }

    /** Starts the model in its worker from the downloaded files; reuses it if already loaded. */
    load(model: VerseModel): Promise<void> {
        if (this.modelId !== model.id) this.unload();
        if (this.loadPromise) return this.loadPromise;
        this.modelId = model.id;

        // Not under /verse-finder/: a folder named like the page route makes the server answer
        // the page URL with that folder (403) instead of the app
        const worker = new g.Worker(`/workers/${model.worker}-worker.js`, { type: 'module' });
        this.worker = worker;
        this.loadPromise = new Promise<void>((resolve, reject) => {
            const fail = (error: Error) => {
                if (this.pendingTranscribe) this.failAll(error);
                else {
                    this.unload();
                    reject(error);
                }
            };
            worker.onerror = (event: any) => fail(new Error(event?.message || 'Worker error'));
            worker.onmessage = ({ data }: any) => {
                if (data.type === 'ready') {
                    this.ready = true;
                    resolve();
                } else if (data.type === 'result') {
                    this.pendingTranscribe?.resolve({ text: data.text, ms: data.ms });
                    this.pendingTranscribe = null;
                } else if (data.type === 'error') {
                    fail(new Error(data.message));
                }
            };
            worker.postMessage({ type: 'load', engine: model.engine });
        });
        return this.loadPromise;
    }

    async transcribe(audio: Float32Array): Promise<{ text: string; ms: number }> {
        if (!this.loadPromise) throw new Error('Model not loaded');
        await this.loadPromise;
        // Send a copy: transferring detaches the buffer, and the caller keeps the audio for playback
        const copy = audio.slice();
        return new Promise((resolve, reject) => {
            this.pendingTranscribe = { resolve, reject };
            this.worker.postMessage({ type: 'transcribe', audio: copy }, [copy.buffer]);
        });
    }
}

export const speechModel = new SpeechModel();

export interface Recording {
    /** Stops recording and returns 16 kHz mono samples. */
    stop: () => Promise<Float32Array>;
    cancel: () => void;
}

export const startRecording = async (): Promise<Recording> => {
    const stream = await g.navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: true },
    });
    const recorder = new g.MediaRecorder(stream);
    const chunks: any[] = [];
    recorder.ondataavailable = (event: any) => {
        if (event.data?.size) chunks.push(event.data);
    };
    const stopped = new Promise<void>(resolve => {
        recorder.onstop = () => resolve();
    });
    const release = () => stream.getTracks().forEach((track: any) => track.stop());
    recorder.start();

    return {
        stop: async () => {
            if (recorder.state !== 'inactive') recorder.stop();
            await stopped;
            release();
            const blob = new g.Blob(chunks, { type: recorder.mimeType });
            // Decoding through a 16 kHz context resamples to what the model expects
            const context = new g.AudioContext({ sampleRate: SAMPLE_RATE });
            try {
                const buffer = await context.decodeAudioData(await blob.arrayBuffer());
                return new Float32Array(buffer.getChannelData(0));
            } finally {
                context.close();
            }
        },
        cancel: () => {
            if (recorder.state !== 'inactive') recorder.stop();
            release();
        },
    };
};

/** Loudest sample, 0–1: near 0 means the microphone picked up silence. */
export const getPeakLevel = (audio: Float32Array): number => {
    let peak = 0;
    for (let i = 0; i < audio.length; i++) peak = Math.max(peak, Math.abs(audio[i]));
    return Math.min(1, peak);
};

/** Plays recorded 16 kHz samples back; resolves when playback ends. */
export const playRecording = async (audio: Float32Array): Promise<void> => {
    const context = new g.AudioContext();
    const buffer = context.createBuffer(1, audio.length, SAMPLE_RATE);
    buffer.copyToChannel(audio, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    await new Promise<void>(resolve => {
        source.onended = () => resolve();
        source.start();
    });
    context.close();
};

let indexPromise: Promise<VerseIndex> | null = null;

/** Builds the search index over every verse once; later calls reuse it. */
const getVerseIndex = (): Promise<VerseIndex> => {
    indexPromise ??= (async () => {
        const verses: MatcherVerse[] = [];
        for (const { number } of quranData.surahs) {
            const surah = await loadSurah(number);
            surah?.verses.forEach(verse =>
                verses.push({ surahNumber: number, verseNumber: verse.number, arabicText: verse.arabicText }),
            );
        }
        return buildVerseIndex(verses);
    })().catch(error => {
        indexPromise = null;
        throw error;
    });
    return indexPromise;
};

export const prepareVerseIndex = () => getVerseIndex().then(() => undefined);

export const matchTranscript = async (transcript: string): Promise<VerseMatch[]> =>
    findVerses(await getVerseIndex(), transcript);
