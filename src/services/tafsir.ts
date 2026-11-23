import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Tafsir texts, built by scripts/build_tafsir.py into public/tafsir-data/<edition>/ and served from kuran360.com.
 * Used live, a surah's file is fetched when one of its verses is opened. Downloaded, the edition's all.json is
 * kept on the device (Cache Storage on the web, the documents folder on Android) and read from there instead.
 * A block may explain a range of verses (from..to); the block covering the tapped verse is shown.
 */

export type TafsirSourceId =
    | 'muhtasar' | 'saadi' | 'kuranyolu' | 'elmalili' | 'bilmen' | 'tefhim'
    | 'saadiArabic' | 'celaleyn' | 'ibnkesir' | 'taberi' | 'kurtubi';
export type TafsirLanguage = 'tr' | 'en';

export interface TafsirSource {
    id: TafsirSourceId;
    /** Edition per UI language; a language without one falls back to Turkish. */
    editions: Partial<Record<TafsirLanguage, string>> & { tr: string };
    /** Size of one edition's whole-Quran download. */
    sizeMb: number;
    /** Where the text comes from, linked in the credit line; none when it's not online. */
    sourceUrl?: string;
}

export const TAFSIR_SOURCES: TafsirSource[] = [
    {
        id: 'muhtasar',
        editions: { tr: 'muhtasar-tr', en: 'muhtasar-en' },
        sizeMb: 2,
        sourceUrl: 'https://quranenc.com',
    },
    {
        id: 'saadi',
        editions: { tr: 'saadi-tr' },
        sizeMb: 6,
        sourceUrl: 'https://quranenc.com',
    },
    {
        id: 'kuranyolu',
        editions: { tr: 'kuranyolu-tr' },
        sizeMb: 6,
        sourceUrl: 'https://kuran.diyanet.gov.tr/tefsir',
    },
    {
        id: 'elmalili',
        editions: { tr: 'elmalili-tr' },
        sizeMb: 10,
    },
    {
        id: 'bilmen',
        editions: { tr: 'bilmen-tr' },
        sizeMb: 8,
    },
    {
        id: 'tefhim',
        editions: { tr: 'tefhim-tr' },
        sizeMb: 7,
    },
];

/**
 * The classical tafsirs in their Arabic original (Celâleyn and İbn Kesîr also in English), built but not offered
 * until their use is cleared: their data stays out of the web build too.
 */
export const PENDING_TAFSIR_SOURCES: TafsirSource[] = [
    {
        id: 'saadiArabic',
        editions: { tr: 'saadi-ar' },
        sizeMb: 6,
        sourceUrl: 'https://quranenc.com',
    },
    {
        id: 'celaleyn',
        editions: { tr: 'celaleyn-ar', en: 'celaleyn-en' },
        sizeMb: 3,
        sourceUrl: 'https://qul.tarteel.ai',
    },
    {
        id: 'ibnkesir',
        editions: { tr: 'ibnkesir-ar', en: 'ibnkesir-en' },
        sizeMb: 23,
        sourceUrl: 'https://qul.tarteel.ai',
    },
    {
        id: 'taberi',
        editions: { tr: 'taberi-ar' },
        sizeMb: 30,
        sourceUrl: 'https://qul.tarteel.ai',
    },
    {
        id: 'kurtubi',
        editions: { tr: 'kurtubi-ar' },
        sizeMb: 31,
        sourceUrl: 'https://qul.tarteel.ai',
    },
];

/** Edition ids end in their language; Arabic ones are shown right to left in an Arabic font. */
export const isArabicEdition = (edition: string): boolean => edition.endsWith('-ar');

export const DEFAULT_TAFSIR_SOURCE: TafsirSourceId = 'muhtasar';

export interface TafsirBlock {
    from: number;
    to: number;
    text: string;
}

type SurahBlocks = Record<string, TafsirBlock[]>;

const isWeb = Platform.OS === 'web';
const g = globalThis as any;
const BASE_URL = isWeb ? '' : 'https://kuran360.com';
/** Not 'kuran360-…': the service worker deletes those caches when its version changes. */
const WEB_CACHE = 'tafsir-cache';
const DIR = `${FileSystem.documentDirectory}tafsir/`;

export const getTafsirSource = (id: string): TafsirSource =>
    TAFSIR_SOURCES.find(source => source.id === id) ?? TAFSIR_SOURCES[0];

export const getEdition = (source: TafsirSource, language: string): string =>
    source.editions[language as TafsirLanguage] ?? source.editions.tr;

const surahUrl = (edition: string, surah: number) => `${BASE_URL}/tafsir-data/${edition}/${surah}.json`;
const allUrl = (edition: string) => `${BASE_URL}/tafsir-data/${edition}/all.json`;
const localPath = (edition: string) => `${DIR}${edition}.json`;

/** Surahs loaded so far, per edition; a downloaded edition is loaded whole on first use. */
const memory = new Map<string, SurahBlocks>();

const readDownloaded = async (edition: string): Promise<SurahBlocks | null> => {
    try {
        if (isWeb) {
            if (!g.caches) return null;
            const response = await (await g.caches.open(WEB_CACHE)).match(allUrl(edition));
            return response ? (await response.json()).surahs : null;
        }
        const path = localPath(edition);
        if (!(await FileSystem.getInfoAsync(path)).exists) return null;
        return JSON.parse(await FileSystem.readAsStringAsync(path)).surahs;
    } catch {
        return null;
    }
};

const loadSurah = async (edition: string, surah: number): Promise<TafsirBlock[]> => {
    let loaded = memory.get(edition);
    if (!loaded) {
        loaded = (await readDownloaded(edition)) ?? {};
        memory.set(edition, loaded);
    }
    const cached = loaded[surah];
    if (cached) return cached;
    const response = await fetch(surahUrl(edition, surah));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blocks: TafsirBlock[] = await response.json();
    loaded[surah] = blocks;
    return blocks;
};

/** A surah's tafsir blocks in verse order. Throws when it can't be fetched. */
export const getSurahTafsir = (edition: string, surah: number): Promise<TafsirBlock[]> => loadSurah(edition, surah);

/**
 * The commentary on the verse, or null when the edition has none for it (As-Sa'di leaves a few verses out).
 * Blocks covering the verse are joined into one spanning all their verses. Throws when it can't be fetched.
 */
export const getTafsir = async (edition: string, surah: number, verse: number): Promise<TafsirBlock | null> => {
    const covering = (await loadSurah(edition, surah)).filter(block => block.from <= verse && verse <= block.to);
    if (covering.length <= 1) return covering[0] ?? null;
    return {
        from: Math.min(...covering.map(block => block.from)),
        to: Math.max(...covering.map(block => block.to)),
        text: covering.map(block => block.text).join('\n\n'),
    };
};

export const isEditionDownloaded = async (edition: string): Promise<boolean> => {
    try {
        if (isWeb) return !!g.caches && !!(await (await g.caches.open(WEB_CACHE)).match(allUrl(edition)));
        return (await FileSystem.getInfoAsync(localPath(edition))).exists;
    } catch {
        return false;
    }
};

/** Saves the edition's whole-Quran file, reporting progress 0–1 against the expected size. */
export const downloadEdition = async (
    edition: string,
    sizeMb: number,
    onProgress: (fraction: number) => void,
    signal?: AbortSignal,
): Promise<void> => {
    const expected = sizeMb * 1e6;
    if (isWeb) {
        const response = await fetch(allUrl(edition), { signal, cache: 'no-store' });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            onProgress(Math.min(0.99, received / expected));
        }
        const cache = await g.caches.open(WEB_CACHE);
        await cache.put(allUrl(edition), new Response(new Blob(chunks as BlobPart[]), { headers: { 'Content-Type': 'application/json' } }));
    } else {
        await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
        // Download next to the target and move it once complete, so a cancelled download never counts as saved
        const target = localPath(edition);
        const partial = `${target}.part`;
        const task = FileSystem.createDownloadResumable(allUrl(edition), partial, {}, ({ totalBytesWritten }) =>
            onProgress(Math.min(0.99, totalBytesWritten / expected)),
        );
        const abort = () => task.cancelAsync();
        signal?.addEventListener('abort', abort);
        try {
            const result = await task.downloadAsync();
            if (signal?.aborted) throw new Error('Aborted');
            if (!result || result.status !== 200) throw new Error(`HTTP ${result?.status}`);
            await FileSystem.moveAsync({ from: partial, to: target });
        } catch (error) {
            await FileSystem.deleteAsync(partial, { idempotent: true });
            throw error;
        } finally {
            signal?.removeEventListener('abort', abort);
        }
    }
    memory.delete(edition);
    onProgress(1);
};

export const deleteEdition = async (edition: string): Promise<void> => {
    if (isWeb) {
        if (g.caches) await (await g.caches.open(WEB_CACHE)).delete(allUrl(edition));
    } else {
        await FileSystem.deleteAsync(localPath(edition), { idempotent: true });
    }
    memory.delete(edition);
};
