import i18n from '@/i18n';
import { VerseShareData } from '@/types';
import { loadSurah, getSurahsList } from '@/data/quranData';
import { formatVerseNumber, VerseNumberStyle } from './numerals';

/** Upper bound for a shared verse range, so the text still fits on one image. */
export const MAX_SHARE_VERSES = 10;

/** Last verse that may be selected when a range starts at `start`. */
export const getMaxRangeEnd = (surahNumber: number, start: number): number => {
    const verseCount = getSurahsList().find(s => s.number === surahNumber)?.verseCount ?? start;
    return Math.min(verseCount, start + MAX_SHARE_VERSES - 1);
};

/** "Bakara Suresi, 5. Ayet" / "Bakara Suresi, 5-7. Ayetler" */
export const getVerseLabel = (data: VerseShareData, style: VerseNumberStyle = 'latin'): string => {
    const start = formatVerseNumber(data.verseNumber, style);
    if (data.verseNumberEnd && data.verseNumberEnd > data.verseNumber) {
        return i18n.t('share.verseRangeLabel', {
            surah: data.surahName,
            start,
            end: formatVerseNumber(data.verseNumberEnd, style),
        });
    }
    return i18n.t('share.verseLabel', { surah: data.surahName, verse: start });
};

/**
 * Merges verses `base.verseNumber..endVerse` of the same surah into one share payload.
 * Each verse is followed by its number (﴿n﴾ in Arabic, (n) before the translation).
 */
export const buildVerseRangeShareData = async (
    base: VerseShareData,
    endVerse: number,
    translationKey?: string,
): Promise<VerseShareData> => {
    if (endVerse <= base.verseNumber) {
        return { ...base, verseNumberEnd: undefined };
    }

    const surah = await loadSurah(base.surahNumber);
    const verses = (surah?.verses ?? [])
        .filter(v => v.number >= base.verseNumber && v.number <= endVerse)
        .sort((a, b) => a.number - b.number);
    if (verses.length < 2) {
        return { ...base, verseNumberEnd: undefined };
    }

    const arabicText = verses
        .map(v => `${v.arabicText} ﴿${formatVerseNumber(v.number, 'arabic')}﴾`)
        .join(' ');
    const translation = verses
        .map(v => {
            // Keep the caller's translation for the first verse (it may come from a picked meal)
            const text = v.number === base.verseNumber
                ? base.translation
                : (translationKey && v.allTranslations?.[translationKey]) || v.translation || '';
            return `(${v.number}) ${text}`;
        })
        .join(' ');

    return {
        ...base,
        arabicText,
        translation,
        verseNumberEnd: verses[verses.length - 1].number,
    };
};
