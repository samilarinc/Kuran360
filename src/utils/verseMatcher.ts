/**
 * Finds which verses a recited passage comes from, given a speech-to-text transcript.
 *
 * The transcript is in plain (imla'i) spelling while the stored text is Uthmani, and the
 * speech model makes small mistakes, so both sides are reduced to a consonant skeleton
 * (no harakat, Quranic marks, alefs or hamzas) and compared with a fuzzy search over the
 * whole Quran as one continuous string. A recitation can start mid-verse and run into the
 * next one, so a match may span several verses.
 */

export interface MatcherVerse {
    surahNumber: number;
    verseNumber: number;
    arabicText: string;
}

export interface VerseMatch {
    surahNumber: number;
    /** First and last verse the recited passage covers (the same verse for a single-verse match). */
    fromVerse: number;
    toVerse: number;
    /** 0–1, how closely the transcript matches the text (1 = identical skeletons). */
    score: number;
}

export interface VerseIndex {
    text: string;
    /** starts[i] is where verse i begins in `text`; starts has one extra entry for the end. */
    starts: number[];
    verses: { surahNumber: number; verseNumber: number }[];
    grams: Map<string, number[]>;
    /** Whole-verse lookup for very short recitations like يس or طه, which n-grams can't place. */
    exact: Map<string, number[]>;
}

const GRAM = 3;
const BUCKET = 16;
const MAX_GRAM_HITS = 3000;
const CANDIDATES = 24;
const MIN_SCORE = 0.55;

const MARKS = /[ً-ٰٟ۔ۖ-ۭـ‌‍\s]/g;
const DROPPED = /[اأإآٱءٔ]/g;

/** Reduces Arabic text to a comparable consonant skeleton. */
const toSkeleton = (text: string): string =>
    text
        .replace(MARKS, '')
        .replace(DROPPED, '')
        .replace(/ى/g, 'ي')
        .replace(/ئ/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ة/g, 'ه')
        .replace(/[^ء-ي]/g, '');

export const buildVerseIndex = (verses: MatcherVerse[]): VerseIndex => {
    const parts: string[] = [];
    const starts: number[] = [];
    const exact = new Map<string, number[]>();
    let pos = 0;
    verses.forEach((verse, i) => {
        const skeleton = toSkeleton(verse.arabicText);
        starts.push(pos);
        parts.push(skeleton);
        pos += skeleton.length;
        if (skeleton.length <= 8) exact.set(skeleton, [...(exact.get(skeleton) ?? []), i]);
    });
    starts.push(pos);
    const text = parts.join('');

    const grams = new Map<string, number[]>();
    for (let i = 0; i + GRAM <= text.length; i++) {
        const gram = text.slice(i, i + GRAM);
        const list = grams.get(gram);
        if (list) list.push(i);
        else grams.set(gram, [i]);
    }

    return {
        text,
        starts,
        verses: verses.map(v => ({ surahNumber: v.surahNumber, verseNumber: v.verseNumber })),
        grams,
        exact,
    };
};

/** Index of the verse containing text position `pos`. */
const verseAt = (index: VerseIndex, pos: number): number => {
    let lo = 0;
    let hi = index.verses.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (index.starts[mid] <= pos) lo = mid;
        else hi = mid - 1;
    }
    return lo;
};

/**
 * Edit distance of `query` against the best-matching substring of text[from, to).
 * Returns the distance and the matched substring's bounds.
 */
const alignInWindow = (query: string, text: string, from: number, to: number) => {
    const width = to - from;
    // prev/cur[j] = distance of query[0..i) ending at text[from + j); start[j] = where that alignment began
    let prev = new Int32Array(width + 1);
    let cur = new Int32Array(width + 1);
    let prevStart = new Int32Array(width + 1);
    let curStart = new Int32Array(width + 1);
    for (let j = 0; j <= width; j++) prevStart[j] = j;

    for (let i = 1; i <= query.length; i++) {
        cur[0] = i;
        curStart[0] = 0;
        const q = query.charCodeAt(i - 1);
        for (let j = 1; j <= width; j++) {
            const sub = prev[j - 1] + (text.charCodeAt(from + j - 1) === q ? 0 : 1);
            const del = prev[j] + 1;
            const ins = cur[j - 1] + 1;
            if (sub <= del && sub <= ins) {
                cur[j] = sub;
                curStart[j] = prevStart[j - 1];
            } else if (del <= ins) {
                cur[j] = del;
                curStart[j] = prevStart[j];
            } else {
                cur[j] = ins;
                curStart[j] = curStart[j - 1];
            }
        }
        [prev, cur] = [cur, prev];
        [prevStart, curStart] = [curStart, prevStart];
    }

    let best = 0;
    for (let j = 1; j <= width; j++) if (prev[j] < prev[best]) best = j;
    return { distance: prev[best], start: from + prevStart[best], end: from + best };
};

export const findVerses = (index: VerseIndex, transcript: string, limit = 3): VerseMatch[] => {
    const query = toSkeleton(transcript);
    if (query.length < 2) return [];

    const exactHits = (index.exact.get(query) ?? []).map(i => ({
        surahNumber: index.verses[i].surahNumber,
        fromVerse: index.verses[i].verseNumber,
        toVerse: index.verses[i].verseNumber,
        score: 1,
    }));
    if (exactHits.length) return exactHits.slice(0, limit);

    // Vote for alignments: a shared n-gram at query[i] and text[p] suggests the query starts near p - i
    const gram = Math.min(GRAM, query.length);
    const votes = new Map<number, number>();
    for (let i = 0; i + gram <= query.length; i++) {
        const hits = gram === GRAM ? index.grams.get(query.slice(i, i + gram)) : undefined;
        if (!hits || hits.length > MAX_GRAM_HITS) continue;
        for (const p of hits) {
            const bucket = Math.floor((p - i) / BUCKET);
            votes.set(bucket, (votes.get(bucket) ?? 0) + 1);
        }
    }
    const candidates = [...votes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, CANDIDATES)
        .map(([bucket]) => bucket);

    const slack = BUCKET + Math.ceil(query.length * 0.3);
    const matches: (VerseMatch & { firstVerse: number })[] = [];
    for (const bucket of candidates) {
        const from = Math.max(0, bucket * BUCKET - slack);
        const to = Math.min(index.text.length, bucket * BUCKET + BUCKET + query.length + slack);
        const { distance, start, end } = alignInWindow(query, index.text, from, to);
        const score = 1 - distance / query.length;
        if (score < MIN_SCORE || end <= start) continue;
        const first = verseAt(index, start);
        const last = verseAt(index, end - 1);
        matches.push({
            firstVerse: first,
            surahNumber: index.verses[first].surahNumber,
            fromVerse: index.verses[first].verseNumber,
            // A match never runs past the end of its surah into the next one
            toVerse: index.verses[last].surahNumber === index.verses[first].surahNumber
                ? index.verses[last].verseNumber
                : index.verses[first].verseNumber,
            score,
        });
    }

    const seen = new Set<number>();
    return matches
        .sort((a, b) => b.score - a.score)
        .filter(m => !seen.has(m.firstVerse) && seen.add(m.firstVerse))
        .slice(0, limit)
        .map(({ firstVerse: _, ...m }) => m);
};
