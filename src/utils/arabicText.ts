import { Verse, WordTranslation } from '@/types';

/**
 * The source `arabic_text` has no spaces between words, and the word-by-word list skips
 * particles like اَلَمْ, لَا, مِنْ: their meaning is folded into the next word's translation
 * (e.g. اَلَمْ نَشْرَحْ → "açmadık mı?"). So the text is cut at the listed words, and any
 * skipped part is joined to the word after it instead of being dropped.
 */
export const getWordSegments = (verse: Pick<Verse, 'arabicText' | 'wordTranslations'>): WordTranslation[] => {
    const text = verse.arabicText ?? '';
    const segments: WordTranslation[] = [];
    let pos = 0;
    for (const word of verse.wordTranslations ?? []) {
        if (!word.arabic) continue;
        const index = text.indexOf(word.arabic, pos);
        if (index < 0) continue;
        const skipped = text.slice(pos, index).trim();
        segments.push({ ...word, arabic: skipped ? `${skipped} ${word.arabic}` : word.arabic });
        pos = index + word.arabic.length;
    }
    const rest = text.slice(pos).trim();
    if (rest) segments.push({ arabic: rest, translation: '' });
    return segments;
};

/** Root letters spaced out for display (كتب → ك ت ب). */
export const formatRoot = (root: string): string => Array.from(root).join(' ');

// Latin spelling of each root letter for URLs (/root/k-t-b). Letters are joined with '-', so
// the multi-letter ones (sh, kh...) can't be confused with two letters.
const ROOT_LETTER_SLUGS: Record<string, string> = {
    'ا': 'a', 'أ': 'e', 'ؤ': 'ew', 'ء': 'ee', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'c', 'ح': 'hh', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 'ss', 'ض': 'dd', 'ط': 'tt', 'ظ': 'zz',
    'ع': 'ay', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
};
const ROOT_SLUG_LETTERS = Object.fromEntries(Object.entries(ROOT_LETTER_SLUGS).map(([letter, slug]) => [slug, letter]));

/** Root letters as a URL slug (كتب → k-t-b). */
export const rootToSlug = (root: string): string =>
    Array.from(root).map(letter => ROOT_LETTER_SLUGS[letter] ?? letter).join('-');

/** Back from a URL slug (k-t-b → كتب); null if it isn't a valid root slug. */
export const slugToRoot = (slug: string): string | null => {
    const letters = slug.split('-').map(part => ROOT_SLUG_LETTERS[part]);
    return letters.length > 0 && letters.every(Boolean) ? letters.join('') : null;
};

/** Arabic text with spaces between words (the source text has none). */
export const getSpacedArabicText = (verse: Pick<Verse, 'arabicText' | 'wordTranslations'>): string => {
    const text = verse.arabicText;
    if (!text || /\s/.test(text.trim())) return text;
    return getWordSegments(verse).map(s => s.arabic).join(' ');
};
