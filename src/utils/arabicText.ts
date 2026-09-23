import { Verse } from '@/types';

/**
 * The source `arabic_text` has no spaces between words, so it is split at the
 * boundaries of the word-by-word entries. Words missing from that list stay as
 * their own segment instead of being dropped.
 */
export const getSpacedArabicText = (verse: Pick<Verse, 'arabicText' | 'wordTranslations'>): string => {
    const text = verse.arabicText;
    if (!text || /\s/.test(text.trim())) return text;

    const cuts = new Set<number>();
    let pos = 0;
    for (const { arabic } of verse.wordTranslations ?? []) {
        if (!arabic) continue;
        const index = text.indexOf(arabic, pos);
        if (index < 0) continue;
        cuts.add(index);
        cuts.add(index + arabic.length);
        pos = index + arabic.length;
    }

    const segments: string[] = [];
    let prev = 0;
    [...cuts].filter(c => c > 0 && c < text.length).sort((a, b) => a - b).forEach(cut => {
        segments.push(text.slice(prev, cut));
        prev = cut;
    });
    segments.push(text.slice(prev));
    return segments.filter(s => s.trim()).join(' ');
};
