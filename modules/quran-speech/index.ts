import { requireOptionalNativeModule } from 'expo';

/** Samples held natively, passed around by handle (see QuranSpeechModule.kt). */
export interface NativeSamples {
    handle: number;
    length: number;
    truncated: boolean;
}

interface QuranSpeechModule {
    startRecording(): Promise<void>;
    stopRecording(): Promise<NativeSamples>;
    cancelRecording(): void;
    decodeFile(uri: string, maxSeconds: number): Promise<NativeSamples>;
    putSamples(data: Float32Array): number;
    takeSamples(handle: number, out: Float32Array): void;
    releaseSamples(handle: number): void;
    play(handle: number): Promise<void>;
    loadModel(dir: string): Promise<void>;
    unloadModel(): Promise<void>;
    transcribe(handle: number): Promise<{ text: string; ms: number }>;
}

/** Android only; null elsewhere. */
export const QuranSpeech = requireOptionalNativeModule<QuranSpeechModule>('QuranSpeech');

/** Copies natively held samples into a Float32Array. */
export const takeSamples = (samples: NativeSamples): Float32Array => {
    const out = new Float32Array(samples.length);
    QuranSpeech!.takeSamples(samples.handle, out);
    return out;
};
