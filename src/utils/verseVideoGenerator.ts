import { ImageSize, VerseShareData } from '@/types';

export interface VerseVideoOptions {
    /** Reciter audio folder on the server; defaults to the default reciter. */
    reciterFolder?: string;
    /** Called with 0..1 while audio is downloaded and the video is encoded. */
    onProgress?: (progress: number) => void;
}

// Native builds use this stub; the browser implementation lives in verseVideoGenerator.web.ts
// so the encoder library never ends up in the native bundle.
export const isVideoGenerationSupported = (): boolean => false;

export const generateVerseVideo = async (
    _imageUrl: string,
    _verseData: VerseShareData,
    _size: ImageSize,
    _options?: VerseVideoOptions,
): Promise<string> => {
    throw new Error('Video generation is only available on web');
};
