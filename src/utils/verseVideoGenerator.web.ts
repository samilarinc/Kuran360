import {
    AudioBufferSource,
    BufferTarget,
    CanvasSource,
    Mp4OutputFormat,
    Output,
    QUALITY_HIGH,
    getFirstEncodableAudioCodec,
    getFirstEncodableVideoCodec,
} from 'mediabunny';
import { ImageSize, VerseShareData } from '@/types';
import { getVerseAudioUrl } from './audioUrls';
import type { VerseVideoOptions } from './verseVideoGenerator';

// Web globals
declare const document: any;
declare const Image: any;
declare const OfflineAudioContext: any;
declare const AudioBuffer: any;

export type { VerseVideoOptions } from './verseVideoGenerator';

/** Silence between consecutive verses, in seconds. */
const VERSE_GAP_SECONDS = 0.4;
/** A still image only needs a frame every second. */
const FRAME_SECONDS = 1;
const SAMPLE_RATE = 48000;

/** Video encoding runs in the browser (WebCodecs), so check support up front. */
export const isVideoGenerationSupported = (): boolean =>
    typeof (globalThis as any).VideoEncoder !== 'undefined' && typeof (globalThis as any).AudioEncoder !== 'undefined';

const loadImage = (url: string): Promise<any> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image could not be loaded'));
    img.src = url;
});

/** Downloads each verse's recitation and joins them into one buffer with short gaps. */
const loadRecitation = async (verseData: VerseShareData, reciterFolder: string | undefined, onProgress: (p: number) => void) => {
    const start = verseData.verseNumber;
    const end = verseData.verseNumberEnd ?? start;
    const decoder = new OfflineAudioContext(2, 1, SAMPLE_RATE);

    const buffers: any[] = [];
    for (let verse = start; verse <= end; verse++) {
        const response = await fetch(getVerseAudioUrl(verseData.surahNumber, verse, reciterFolder));
        if (!response.ok) throw new Error(`Audio not found for verse ${verse}`);
        buffers.push(await decoder.decodeAudioData(await response.arrayBuffer()));
        onProgress((verse - start + 1) / (end - start + 1));
    }

    const gap = Math.round(VERSE_GAP_SECONDS * SAMPLE_RATE);
    const length = buffers.reduce((sum, b) => sum + b.length, 0) + gap * (buffers.length - 1);
    const joined = new AudioBuffer({ length, numberOfChannels: 2, sampleRate: SAMPLE_RATE });
    let offset = 0;
    for (const buffer of buffers) {
        for (let ch = 0; ch < 2; ch++) {
            // Mono recitations are copied to both channels
            joined.copyToChannel(buffer.getChannelData(Math.min(ch, buffer.numberOfChannels - 1)), ch, offset);
        }
        offset += buffer.length + gap;
    }
    return joined;
};

/**
 * Turns an already rendered verse image into an MP4 with the verse recitation.
 * Everything happens in the browser; the server only serves the existing mp3 files.
 * Returns an object URL for the video.
 */
export const generateVerseVideo = async (
    imageUrl: string,
    verseData: VerseShareData,
    size: ImageSize,
    { reciterFolder, onProgress }: VerseVideoOptions = {},
): Promise<string> => {
    const report = (p: number) => onProgress?.(Math.min(1, Math.max(0, p)));

    const [image, audio] = await Promise.all([
        loadImage(imageUrl),
        // Downloading the audio is roughly the first 40% of the work
        loadRecitation(verseData, reciterFolder, p => report(p * 0.4)),
    ]);

    // The image canvas is rendered at devicePixelRatio; the video uses the chosen size (always even, as H.264 needs)
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext('2d').drawImage(image, 0, 0, size.width, size.height);

    const [videoCodec, audioCodec] = await Promise.all([
        getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'], { width: size.width, height: size.height }),
        getFirstEncodableAudioCodec(['aac', 'opus'], { numberOfChannels: 2, sampleRate: SAMPLE_RATE }),
    ]);
    if (!videoCodec || !audioCodec) throw new Error('Video encoding is not supported in this browser');

    const output = new Output({
        format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
        target: new BufferTarget(),
    });
    const videoSource = new CanvasSource(canvas, { codec: videoCodec, bitrate: QUALITY_HIGH });
    const audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: QUALITY_HIGH });
    output.addVideoTrack(videoSource, { frameRate: 1 / FRAME_SECONDS });
    output.addAudioTrack(audioSource);

    try {
        await output.start();
        await audioSource.add(audio);
        const duration = audio.duration;
        for (let t = 0; t < duration; t += FRAME_SECONDS) {
            await videoSource.add(t, Math.min(FRAME_SECONDS, duration - t));
            report(0.4 + 0.6 * ((t + FRAME_SECONDS) / duration));
        }
        await output.finalize();
    } catch (error) {
        await output.cancel();
        throw error;
    }

    const buffer = (output.target as BufferTarget).buffer;
    if (!buffer) throw new Error('Video could not be created');
    report(1);
    return URL.createObjectURL(new Blob([buffer], { type: output.format.mimeType }));
};
