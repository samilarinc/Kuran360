import { Platform } from 'react-native';
import { AUDIO_FILE_FORMAT } from '@/theme';

export const DEFAULT_RECITER_FOLDER = 'sudais_all_verse';

/** Web serves the audio from its own origin; native apps fetch it from the site. */
const getAudioBaseUrl = (): string => {
    if (Platform.OS !== 'web') return 'https://kuran360.com';
    const win = (globalThis as any).window;
    return win?.location ? `${win.location.protocol}//${win.location.host}` : 'http://localhost:8081';
};

/** e.g. https://kuran360.com/sudais_all_verse/002255.mp3 */
export const getVerseAudioUrl = (surahNumber: number, verseNumber: number, reciterFolder: string = DEFAULT_RECITER_FOLDER): string =>
    `${getAudioBaseUrl()}/${reciterFolder}/${AUDIO_FILE_FORMAT(surahNumber, verseNumber)}`;
