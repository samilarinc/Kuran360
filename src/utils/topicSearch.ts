/**
 * Ranking for the topic search: embedding similarity (multilingual-e5-small vectors, averaged over
 * many translations and stored as int8) combined with a keyword score, so both "sabır" and a topic
 * described in other words find their verses. Pure functions; the model and data live in
 * services/topicSearch.ts.
 */

/** Translations the keyword index is built from (the embeddings average many more). */
export const KEYWORD_MEALS = [
    'Diyanet İşleri Meali (Yeni)',
    'Ali Bulaç Meali',
    'Süleyman Ateş Meali',
    'Elmalılı Hamdi Yazır Meali',
];

/** A dense hit must be at least this similar; with e5 unrelated queries top out around 0.81. */
export const MIN_DENSE_SCORE = 0.83;
/** ...and within this of the best hit, so results stay a tight set instead of a long tail. */
export const DENSE_WINDOW = 0.03;
/** Query words found in more than this share of verses ("ve", "yapmak") say nothing about the topic. */
const COMMON_WORD_SHARE = 0.05;
const STEM_LENGTH = 5;
const RRF_K = 60;
const CANDIDATES = 50;

export interface DenseIndex {
    /** count × dim int8 values; row i is verse i in Qur'an order. */
    vectors: Int8Array;
    dim: number;
    count: number;
    scale: number;
}

export interface KeywordIndex {
    postings: Map<string, [verse: number, count: number][]>;
    docLength: number[];
    averageLength: number;
    size: number;
}

/** Lowercased words of 3+ letters cut to a 5-letter stem, so Turkish suffixes still match. */
export const stemWords = (text: string): string[] =>
    text
        .toLocaleLowerCase('tr')
        .replace(/[^\p{L}\s]/gu, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .map(word => word.slice(0, STEM_LENGTH));

export const buildKeywordIndex = (docs: string[]): KeywordIndex => {
    const postings: KeywordIndex['postings'] = new Map();
    const docLength: number[] = [];
    docs.forEach((doc, verse) => {
        const stems = stemWords(doc);
        docLength.push(stems.length);
        const counts = new Map<string, number>();
        for (const stem of stems) counts.set(stem, (counts.get(stem) ?? 0) + 1);
        counts.forEach((count, stem) => {
            const list = postings.get(stem);
            if (list) list.push([verse, count]);
            else postings.set(stem, [[verse, count]]);
        });
    });
    const total = docLength.reduce((sum, length) => sum + length, 0);
    return { postings, docLength, averageLength: total / Math.max(1, docs.length), size: docs.length };
};

/** BM25 score per verse for the query's topical words. */
export const keywordScores = (index: KeywordIndex, query: string): Map<number, number> => {
    const scores = new Map<number, number>();
    for (const stem of new Set(stemWords(query))) {
        const list = index.postings.get(stem);
        if (!list || list.length > index.size * COMMON_WORD_SHARE) continue;
        const idf = Math.log(1 + (index.size - list.length + 0.5) / (list.length + 0.5));
        for (const [verse, count] of list) {
            const lengthNorm = 0.25 + (0.75 * index.docLength[verse]) / index.averageLength;
            const score = (idf * count * 2.2) / (count + 1.2 * lengthNorm);
            scores.set(verse, (scores.get(verse) ?? 0) + score);
        }
    }
    return scores;
};

/** Similarity of a normalized query vector to every verse. */
export const denseScores = (index: DenseIndex, query: Float32Array): Float32Array => {
    const scores = new Float32Array(index.count);
    const { vectors, dim } = index;
    for (let verse = 0; verse < index.count; verse++) {
        let sum = 0;
        const row = verse * dim;
        for (let k = 0; k < dim; k++) sum += vectors[row + k] * query[k];
        scores[verse] = sum * index.scale;
    }
    return scores;
};

const topBy = (entries: [number, number][], limit: number) =>
    entries.sort((a, b) => b[1] - a[1]).slice(0, limit).map(([verse]) => verse);

/** Verse indexes best first: dense and keyword rankings merged by reciprocal rank fusion. */
export const rankTopics = (
    dense: Float32Array,
    keyword: Map<number, number>,
    { limit = 30, minScore = MIN_DENSE_SCORE, window = DENSE_WINDOW } = {},
): number[] => {
    let best = -Infinity;
    for (const score of dense) if (score > best) best = score;
    const floor = Math.max(minScore, best - window);
    const denseHits: [number, number][] = [];
    dense.forEach((score, verse) => {
        if (score >= floor) denseHits.push([verse, score]);
    });

    const fused = new Map<number, number>();
    for (const ranking of [topBy(denseHits, CANDIDATES), topBy([...keyword], CANDIDATES)]) {
        ranking.forEach((verse, position) => {
            fused.set(verse, (fused.get(verse) ?? 0) + 1 / (RRF_K + position));
        });
    }
    return topBy([...fused], limit);
};
