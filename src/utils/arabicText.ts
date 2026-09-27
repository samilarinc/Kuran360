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

/** Arabic text with spaces between words (the source text has none). */
export const getSpacedArabicText = (verse: Pick<Verse, 'arabicText' | 'wordTranslations'>): string => {
    const text = verse.arabicText;
    if (!text || /\s/.test(text.trim())) return text;
    return getWordSegments(verse).map(s => s.arabic).join(' ');
};
