import { loadSurah, quranData } from '@/data/quranData';
import {
    buildKeywordIndex,
    denseScores,
    DenseIndex,
    KEYWORD_MEALS,
    keywordScores,
    KeywordIndex,
    rankTopics,
} from '@/utils/topicSearch';
import { areFilesCached, downloadFiles } from '@/services/verseModels';

/**
 * Web-only plumbing for the topic search: the embedding model (multilingual-e5-small), which runs in
 * a worker under public/workers/, the precomputed verse vectors in public/embeddings/, and the keyword
 * index built from the downloaded translations. The ranking itself is in utils/topicSearch.ts.
 */

const g = globalThis as any;

const MODEL = 'https://huggingface.co/Xenova/multilingual-e5-small/resolve/main/';
export const TOPIC_MODEL_FILES = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'].map(
    file => MODEL + file,
);
export const TOPIC_MODEL_SIZE_MB = 136;
/** e5 was trained with these prefixes: queries are "query: ...", verses were embedded as "passage: ...". */
const QUERY_PREFIX = 'query: ';

export interface TopicHit {
    surahNumber: number;
    verseNumber: number;
}

export const isTopicModelDownloaded = (): Promise<boolean> => areFilesCached(TOPIC_MODEL_FILES);
export const downloadTopicModel = (onProgress: (fraction: number) => void, signal?: AbortSignal) =>
    downloadFiles(TOPIC_MODEL_FILES, TOPIC_MODEL_SIZE_MB, onProgress, signal);

type Pending = { resolve: (vector: Float32Array) => void; reject: (error: Error) => void };

/** Keeps the embedding model loaded in its worker across screen visits. */
class EmbeddingModel {
    private worker: any = null;
    private loadPromise: Promise<void> | null = null;
    private pending = new Map<number, Pending>();
    private nextId = 0;
    ready = false;

    private failAll(error: Error) {
        this.pending.forEach(({ reject }) => reject(error));
        this.pending.clear();
    }

    /** Stops the worker and frees the model, e.g. before its files are deleted. */
    unload() {
        this.worker?.terminate();
        this.worker = null;
        this.loadPromise = null;
        this.ready = false;
        this.failAll(new Error('Model unloaded'));
    }

    /** Starts the model in its worker from the downloaded files; reuses it if already loaded. */
    load(): Promise<void> {
        if (this.loadPromise) return this.loadPromise;
        // Not under /topic-search/: a folder named like the page route makes the server answer the page URL with it
        const worker = new g.Worker('/workers/embedding-worker.js', { type: 'module' });
        this.worker = worker;
        this.loadPromise = new Promise<void>((resolve, reject) => {
            const fail = (error: Error) => {
                if (this.ready) this.failAll(error);
                else {
                    this.unload();
                    reject(error);
                }
            };
            worker.onerror = (event: any) => fail(new Error(event?.message || 'Worker error'));
            worker.onmessage = ({ data }: any) => {
                if (data.type === 'ready') {
                    this.ready = true;
                    resolve();
                } else if (data.type === 'result') {
                    this.pending.get(data.id)?.resolve(data.vector);
                    this.pending.delete(data.id);
                } else if (data.type === 'error') {
                    if (data.id === undefined) return fail(new Error(data.message));
                    this.pending.get(data.id)?.reject(new Error(data.message));
                    this.pending.delete(data.id);
                }
            };
            worker.postMessage({ type: 'load' });
        });
        return this.loadPromise;
    }

    async embed(text: string): Promise<Float32Array> {
        if (!this.loadPromise) throw new Error('Model not loaded');
        await this.loadPromise;
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.worker.postMessage({ type: 'embed', id, text });
        });
    }
}

export const embeddingModel = new EmbeddingModel();

let denseIndexPromise: Promise<DenseIndex> | null = null;

/** Loads the precomputed verse vectors once: 6236 int8 rows in Qur'an order. */
const getDenseIndex = (): Promise<DenseIndex> => {
    denseIndexPromise ??= (async () => {
        const [meta, bin] = await Promise.all([
            fetch('/embeddings/topics-e5-small.json').then(response => response.json()),
            fetch('/embeddings/topics-e5-small.bin').then(response => response.arrayBuffer()),
        ]);
        return { vectors: new Int8Array(bin), dim: meta.dim, count: meta.count, scale: meta.scale };
    })().catch(error => {
        denseIndexPromise = null;
        throw error;
    });
    return denseIndexPromise;
};

interface VerseTable {
    keywords: KeywordIndex;
    /** Verse row (Qur'an order, as in the vectors) → surah and verse number. */
    hits: TopicHit[];
}

let tablePromise: Promise<VerseTable> | null = null;

/** Builds the keyword index over every verse once; later calls reuse it. */
const getVerseTable = (): Promise<VerseTable> => {
    tablePromise ??= (async () => {
        const docs: string[] = [];
        const hits: TopicHit[] = [];
        for (const { number } of [...quranData.surahs].sort((a, b) => a.number - b.number)) {
            const surah = await loadSurah(number);
            surah?.verses.forEach(verse => {
                const texts = KEYWORD_MEALS.map(meal => verse.allTranslations?.[meal]).filter(Boolean);
                docs.push(texts.length ? texts.join(' ') : verse.translation);
                hits.push({ surahNumber: number, verseNumber: verse.number });
            });
        }
        return { keywords: buildKeywordIndex(docs), hits };
    })().catch(error => {
        tablePromise = null;
        throw error;
    });
    return tablePromise;
};

/** Warms up the index and verse data so the first search is quick. */
export const prepareTopicSearch = (): Promise<void> =>
    Promise.all([getDenseIndex(), getVerseTable()]).then(() => undefined);

/** Verses about the query's topic, best first. The model must be loaded. */
export const searchTopics = async (query: string): Promise<TopicHit[]> => {
    const [index, table, vector] = await Promise.all([
        getDenseIndex(),
        getVerseTable(),
        embeddingModel.embed(QUERY_PREFIX + query),
    ]);
    if (table.hits.length !== index.count) throw new Error('Verse data does not match the topic index');
    const ranking = rankTopics(denseScores(index, vector), keywordScores(table.keywords, query));
    return ranking.map(row => table.hits[row]);
};
