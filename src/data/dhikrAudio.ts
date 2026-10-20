import { Platform } from 'react-native';

/**
 * Recordings the zikirmatik can follow, keyed by preset id.
 *
 * The timeline is in seconds and keyed by step id. Steps missing from it aren't recited in the
 * recording and are passed over while it plays.
 */
export interface DhikrAudio {
    url: string;
    reciter: string;
    timeline: Record<string, {
        start: number;
        /** When each repetition of a counted step ends, i.e. when the counter goes up. */
        counts?: number[];
    }>;
}

const BASE_URL = Platform.OS === 'web' ? '' : 'https://kuran360.com';

export const DHIKR_AUDIO: Record<string, DhikrAudio> = {
    kucukTesbihat: {
        url: `${BASE_URL}/audio/kucuk-tesbihat.m4a`,
        reciter: 'Ömer Arslan',
        // The recording starts at "Fâ'lem ennehû"; the steps before it are read silently
        timeline: {
            faalem: { start: 11.3, counts: [14.6] },
            tevhidKucuk: {
                start: 14.8,
                counts: [
                    18.4, 21.7, 24.9, 28.0, 31.2, 34.5, 37.7, 40.9, 44.0, 47.3, 50.5,
                    53.7, 56.8, 60.1, 63.3, 66.4, 69.6, 72.9, 76.1, 79.1, 82.4, 85.7,
                    88.9, 92.0, 95.2, 98.5, 101.7, 104.8, 108.0, 111.1, 114.5, 118.2, 124.8,
                ],
            },
            muhammedurResulullah: { start: 126.4, counts: [133.0] },
            innallahe: { start: 134.0 },
            kesira: { start: 182.9, counts: [201.8, 225.6, 252.6] },
            salliVeSellim: { start: 252.8 },
            elfuElfi: { start: 280.7 },
            resailiNur: { start: 322.6 },
            esma: { start: 369.5 },
            sonDua: { start: 516.8 },
        },
    },
};
