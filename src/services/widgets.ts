import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TFunction } from 'i18next';
import { getSurahsList, loadVerse } from '@/data/quranData';
import { getSurahNameByNumber } from '@/utils/surahName';
import { WidgetVerseMode } from '@/types';
import { PrayerNotification, PrayerWidgetVerses } from '../../modules/prayer-notification';

/**
 * The verses of the home screen verse widgets (Android). The widgets go through a pool of random short
 * verses (a new one each prayer time, or on every tap) or show one fixed verse; the pool's verse numbers
 * are kept so the widgets keep their place, and a new pool is drawn every two weeks.
 */

const POOL_KEY = 'widgetVersePool';
const POOL_SIZE = 60;
const POOL_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
/** Longer verses don't fit a widget */
const MAX_ARABIC_LENGTH = 220;
const MAX_MEAL_LENGTH = 260;
/** Draws per pool verse before giving up (only when most draws are too long or the data is missing) */
const MAX_DRAWS = POOL_SIZE * 4;

interface StoredPool {
    id: string;
    createdAt: number;
    verses: { surah: number; verse: number }[];
}

export interface VerseWidgetSettings {
    mode: WidgetVerseMode;
    fixedVerse: { surah: number; verse: number };
    /** Shown under the Arabic text; the verse's default translation when it lacks this one */
    translation: string;
}

/** A random verse, every verse equally likely. */
const randomVerseRef = () => {
    const surahs = getSurahsList();
    let index = Math.floor(Math.random() * surahs.reduce((sum, s) => sum + s.verseCount, 0));
    for (const surah of surahs) {
        if (index < surah.verseCount) return { surah: surah.number, verse: index + 1 };
        index -= surah.verseCount;
    }
    return { surah: 1, verse: 1 };
};

const toWidgetVerse = async (ref: { surah: number; verse: number }, translation: string, t: TFunction) => {
    const verse = await loadVerse(ref.surah, ref.verse);
    if (!verse) return null;
    return {
        surah: ref.surah,
        verse: ref.verse,
        ref: t('widgets.verseRef', { surah: getSurahNameByNumber(t, ref.surah), verse: ref.verse }),
        arabic: verse.arabicText,
        meal: verse.allTranslations?.[translation] || verse.translation,
    };
};

const fits = (verse: { arabic: string; meal: string }) => verse.arabic.length <= MAX_ARABIC_LENGTH && verse.meal.length <= MAX_MEAL_LENGTH;

/** The stored pool, or a new one when it is missing or old; empty while the Quran data isn't downloaded. */
const getPool = async (translation: string, t: TFunction): Promise<StoredPool> => {
    try {
        const stored = await AsyncStorage.getItem(POOL_KEY);
        const pool: StoredPool | null = stored ? JSON.parse(stored) : null;
        if (pool && pool.verses.length > 0 && Date.now() - pool.createdAt < POOL_MAX_AGE_MS) return pool;
    } catch { }

    const verses: StoredPool['verses'] = [];
    const seen = new Set<string>();
    for (let draw = 0; draw < MAX_DRAWS && verses.length < POOL_SIZE; draw++) {
        const ref = randomVerseRef();
        const key = `${ref.surah}:${ref.verse}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const verse = await toWidgetVerse(ref, translation, t);
        // No verse at all: the data isn't downloaded, try again on the next sync
        if (!verse && verses.length === 0 && draw >= 3) break;
        if (verse && fits(verse)) verses.push(ref);
    }
    const pool: StoredPool = { id: String(Date.now()), createdAt: Date.now(), verses };
    if (verses.length > 0) await AsyncStorage.setItem(POOL_KEY, JSON.stringify(pool)).catch(() => { });
    return pool;
};

let syncing: Promise<void> = Promise.resolve();

/** Sends the verse widgets their verses for the current settings and language; one sync at a time. */
export const syncVerseWidget = (settings: VerseWidgetSettings, t: TFunction): Promise<void> => {
    const native = PrayerNotification;
    if (!native) return Promise.resolve();
    const run = async () => {
        const { mode, fixedVerse, translation } = settings;
        const pool = mode === 'fixed'
            ? { id: `fixed:${fixedVerse.surah}:${fixedVerse.verse}`, verses: [fixedVerse] }
            : await getPool(translation, t);
        const verses = (await Promise.all(pool.verses.map(ref => toWidgetVerse(ref, translation, t))))
            .filter((verse): verse is NonNullable<typeof verse> => verse !== null);
        const data: PrayerWidgetVerses = { mode, poolId: pool.id, hint: t('widgets.tapHint'), verses };
        await native.setWidgetVerses(JSON.stringify(data));
    };
    syncing = syncing.catch(() => { }).then(run);
    return syncing;
};
