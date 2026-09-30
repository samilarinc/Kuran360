import { getWordTimingsUrl } from '@/utils/audioUrls';

/** Start (ms) of every displayed word in a verse's audio, in getWordSegments order. */
type VerseWordStarts = number[];
type ReciterWordTimings = Record<string, VerseWordStarts>;

// One download per reciter; a reciter without a timing file (404, or the web app's index.html) stays null
const cache = new Map<string, Promise<ReciterWordTimings | null>>();

const loadReciterTimings = (reciterId: string): Promise<ReciterWordTimings | null> => {
    let pending = cache.get(reciterId);
    if (!pending) {
        pending = fetch(getWordTimingsUrl(reciterId))
            .then(response => (response.ok ? response.json() : null))
            .catch(() => null);
        cache.set(reciterId, pending);
    }
    return pending;
};

/** When each word starts in this reciter's recording of the verse; null if the reciter has no word timings. */
export const getVerseWordStarts = async (reciterId: string, surahNumber: number, verseNumber: number): Promise<VerseWordStarts | null> => {
    const timings = await loadReciterTimings(reciterId);
    return timings?.[`${surahNumber}:${verseNumber}`] ?? null;
};

/** Index of the word being recited at `positionMs`: the last word that has started (the first one before any has). */
export const getActiveWordIndex = (starts: VerseWordStarts, positionMs: number): number => {
    let index = 0;
    for (let i = 1; i < starts.length && starts[i] <= positionMs; i++) index = i;
    return index;
};
