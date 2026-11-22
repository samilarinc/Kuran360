import { readFileSync } from 'fs';
import { join } from 'path';
import { buildVerseIndex, findVerses, toSkeleton } from '@/utils/verseMatcher';
import { checkRecitation, isFlawless } from '@/utils/recitationCheck';
import { formatVerseNumber } from '@/utils/numerals';

type RawVerse = { surah_number: number; verse_number: number; arabic_text: string; word_translations: { arabic: string }[] };
const all: Record<string, RawVerse> = JSON.parse(readFileSync(join(__dirname, '../../public/allVerses.json'), 'utf8'));
const verses = Object.keys(all).sort().map(k => all[k]);
const index = buildVerseIndex(verses.map(v => ({ surahNumber: v.surah_number, verseNumber: v.verse_number, arabicText: v.arabic_text })));
const words = (surah: number, verse: number) =>
    verses.find(v => v.surah_number === surah && v.verse_number === verse)!.word_translations.map(w => w.arabic);

describe('verse finder', () => {
    it('reduces Uthmani and plain spelling to the same skeleton', () => {
        expect(toSkeleton('قُلْ هُوَ اللّٰهُ اَحَدٌۚ')).toBe(toSkeleton('قل هو الله أحد'));
    });

    it('finds a recited verse in the whole Quran', () => {
        const [best] = findVerses(index, 'قل هو الله أحد');
        expect([best.surahNumber, best.fromVerse]).toEqual([112, 1]);
    });

    it('finds a passage running across verses', () => {
        const matches = findVerses(index, 'الرحمن الرحيم مالك يوم الدين اياك نعبد');
        expect(matches.some(m => m.surahNumber === 1 && m.fromVerse === 3 && m.toVerse === 5)).toBe(true);
    });

    it('returns every verse a common phrase occurs in', () => {
        const matches = findVerses(index, 'الحمد لله رب العالمين');
        const places = matches.map(m => `${m.surahNumber}:${m.fromVerse}`);
        expect(places).toEqual(expect.arrayContaining(['1:2', '10:10', '37:182']));
    });
});

describe('memorization check', () => {
    it('accepts a correct recitation', () => {
        expect(isFlawless(checkRecitation(words(1, 2), 'الحمد لله رب العالمين'))).toBe(true);
    });

    it('marks a skipped word', () => {
        const result = checkRecitation(words(1, 2), 'الحمد لله العالمين');
        expect(result.words.map(w => w.status)).toEqual(['ok', 'ok', 'missed', 'ok']);
        expect(isFlawless(result)).toBe(false);
    });
});

describe('verse numbers', () => {
    it('writes Arabic-Indic digits', () => {
        expect(formatVerseNumber(286, 'arabic')).toBe('٢٨٦');
        expect(formatVerseNumber(286, 'latin')).toBe('286');
    });
});
