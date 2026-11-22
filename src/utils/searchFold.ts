// Arabic short vowels, tanween, shadda, sukun and the superscript alif
const ARABIC_MARKS = /[ً-ٰٟ]/g;
// Latin accents (â, î, û, ā, ...) after NFD decomposition
const LATIN_MARKS = /[̀-ͯ]/g;
// Apostrophes, ayn/hamza signs and hyphens in transliterations (el-Mü’min, Al-‘Azīz)
const PUNCTUATION = /[’‘'`´ʼʻ\-]/g;

/**
 * Folds text for forgiving search: lowercase, accents and Arabic vowel marks removed,
 * Turkish dotless ı treated as i, transliteration punctuation dropped.
 * "er-Rahmân", "rahman" and "ER RAHMAN" all fold to a string containing "rahman".
 */
export const foldForSearch = (text: string): string =>
    text
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i')
        .toLowerCase()
        .replace(/ı/g, 'i')
        .normalize('NFD')
        .replace(LATIN_MARKS, '')
        .replace(ARABIC_MARKS, '')
        .replace(PUNCTUATION, '')
        .replace(/\s+/g, ' ')
        .trim();

/** True when every word of the query appears in one of the fields (all folded). */
export const matchesSearch = (query: string, fields: string[]): boolean => {
    const words = foldForSearch(query).split(' ').filter(Boolean);
    if (words.length === 0) return true;
    const haystack = fields.map(foldForSearch).join(' ');
    return words.every(word => haystack.includes(word));
};
