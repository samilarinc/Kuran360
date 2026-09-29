/**
 * Checks a verse recited from memory: compares the speech-to-text transcript with the verse
 * and says which words were skipped or read wrong.
 *
 * Both sides are reduced to the same consonant skeleton the verse matcher uses, then aligned
 * character by character (edit distance with a traceback). Characters are aligned instead of
 * words because the transcript's word breaks rarely match the verse's (مالك / ما لك), and the
 * verse's own words come from getWordSegments, which folds particles into the next word.
 * Each word is then judged by how many of its characters the alignment matched.
 */

import { toSkeleton } from '@/utils/verseMatcher';

export type WordStatus = 'ok' | 'wrong' | 'missed';

export interface WordResult {
    /** The word as displayed (Uthmani, with harakat). */
    text: string;
    status: WordStatus;
}

export interface RecitationResult {
    words: WordResult[];
    /** 0–1, share of the verse's characters that were read correctly. */
    accuracy: number;
    /** Transcript characters that match nothing in the verse (added words, noise). */
    extraChars: number;
}

/** Costlier than a skipped letter: unsaid tails are free anyway, so extra letters are more likely a mid-verse gap misread. */
const INSERT_COST = 2;

type Op = 'match' | 'sub' | 'del' | 'ins';

/** Errors a word of this many characters can have and still count as read correctly. */
const allowedErrors = (length: number): number => (length <= 2 ? 0 : Math.floor(length * 0.3));

/**
 * Aligns `query` (transcript) against `target` (verse). Verse characters after the recited
 * part are free, so an unsaid tail can't pull a said word's letters onto it.
 * Returns, for every target character, whether it was matched, substituted or deleted,
 * plus the number of query characters that were inserted (matched nothing).
 */
const align = (query: string, target: string): { ops: Op[]; inserted: number } => {
    const n = query.length;
    const m = target.length;
    const width = m + 1;
    const cost = new Int32Array((n + 1) * width);
    // The recitation starts at the verse's start: leading skipped words count as errors
    for (let j = 0; j <= m; j++) cost[j] = j;
    for (let i = 1; i <= n; i++) {
        cost[i * width] = i * INSERT_COST;
        for (let j = 1; j <= m; j++) {
            const sub = cost[(i - 1) * width + j - 1] + (query[i - 1] === target[j - 1] ? 0 : 1);
            const ins = cost[(i - 1) * width + j] + INSERT_COST;
            const del = cost[i * width + j - 1] + 1;
            cost[i * width + j] = Math.min(sub, ins, del);
        }
    }

    // It may end anywhere; on equal cost prefer covering more of the verse
    let end = m;
    for (let j = m - 1; j >= 0; j--) if (cost[n * width + j] < cost[n * width + end]) end = j;

    const ops: Op[] = new Array(m).fill('del');
    let inserted = 0;
    let i = n;
    let j = end;
    while (i > 0) {
        const here = cost[i * width + j];
        const same = i > 0 && j > 0 && query[i - 1] === target[j - 1];
        // On equal cost prefer a match, then a deletion, then a substitution, so a skipped word
        // is blamed on its own letters instead of being smeared onto the neighbour's
        if (same && cost[(i - 1) * width + j - 1] === here) {
            ops[j - 1] = 'match';
            i--;
            j--;
        } else if (j > 0 && cost[i * width + j - 1] + 1 === here) {
            ops[j - 1] = 'del';
            j--;
        } else if (i > 0 && j > 0 && cost[(i - 1) * width + j - 1] + 1 === here) {
            ops[j - 1] = 'sub';
            i--;
            j--;
        } else if (i > 0 && cost[(i - 1) * width + j] + INSERT_COST === here) {
            inserted++;
            i--;
        } else {
            throw new Error('alignment traceback lost its path');
        }
    }
    return { ops, inserted };
};

/** `words` are the verse's words in order (see getWordSegments); `transcript` is what the user said. */
export const checkRecitation = (words: string[], transcript: string): RecitationResult => {
    const skeletons = words.map(toSkeleton);
    const { ops, inserted } = align(toSkeleton(transcript), skeletons.join(''));

    let pos = 0;
    let correct = 0;
    let total = 0;
    const results = words.map((text, w): WordResult => {
        const length = skeletons[w].length;
        const own = ops.slice(pos, pos + length);
        pos += length;
        const matched = own.filter(op => op === 'match').length;
        const deleted = own.filter(op => op === 'del').length;
        correct += matched;
        total += length;
        // A word with no letters left after reduction can't be judged
        if (length === 0) return { text, status: 'ok' };
        if (length - matched <= allowedErrors(length)) return { text, status: 'ok' };
        return { text, status: deleted === length ? 'missed' : 'wrong' };
    });

    return { words: results, accuracy: total ? correct / total : 0, extraChars: inserted };
};
