import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Downloads that outlive the screen that started them: a download keeps running when the user leaves the page,
 * and any screen showing the same item picks up its progress again.
 */

export interface DownloadProgress {
    /** 0–100 */
    progress: number;
    /** Optional status line, e.g. "Downloading translations…" */
    status?: string;
    downloadedBytes?: number;
    totalBytes?: number;
}

export interface DownloadState extends DownloadProgress {
    running: boolean;
    /** Set when the last run failed; cleared when the item is downloaded again */
    error: string | null;
    /** When the last run failed (ms), so the download pill can flag it for a moment */
    failedAt?: number;
}

export type DownloadTask = (onProgress: (update: DownloadProgress) => void, signal: AbortSignal) => Promise<void>;

/** Download keys shared by the screens that show the same item */
export const DOWNLOAD_KEYS = {
    quran: 'quran',
    topic: 'topic',
    tafsir: (edition: string) => `tafsir:${edition}`,
    model: (id: string) => `model:${id}`,
};

interface Entry {
    state: DownloadState;
    controller: AbortController | null;
    promise: Promise<boolean> | null;
}

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
/** Bumped whenever a download ends, so screens can re-check what's on the device */
let finishedCount = 0;

const IDLE: DownloadState = { running: false, progress: 0, error: null };

/** Changes on every state change, for useDownloads */
let version = 0;

const emit = () => {
    version++;
    listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const setState = (key: string, state: DownloadState) => {
    const entry = entries.get(key) ?? { state, controller: null, promise: null };
    entry.state = state;
    entries.set(key, entry);
    emit();
};

export const getDownloadState = (key: string): DownloadState => entries.get(key)?.state ?? IDLE;

/**
 * Starts a download, or joins the one already running under the same key.
 * Resolves true when it finished, false when it failed or was cancelled.
 */
export const startDownload = (key: string, task: DownloadTask): Promise<boolean> => {
    const running = entries.get(key);
    if (running?.state.running && running.promise) return running.promise;

    const controller = new AbortController();
    setState(key, { running: true, progress: 0, error: null });
    const entry = entries.get(key)!;
    entry.controller = controller;

    entry.promise = (async () => {
        try {
            await task(update => {
                if (!controller.signal.aborted) setState(key, { ...getDownloadState(key), ...update, running: true });
            }, controller.signal);
            setState(key, { ...IDLE });
            return true;
        } catch (e: any) {
            const failed = !controller.signal.aborted;
            setState(key, { ...IDLE, error: failed ? String(e?.message ?? e) : null, failedAt: failed ? Date.now() : undefined });
            return false;
        } finally {
            entry.controller = null;
            entry.promise = null;
            finishedCount++;
            emit();
        }
    })();
    return entry.promise;
};

export const cancelDownload = (key: string) => entries.get(key)?.controller?.abort();

/** Progress of one download; `progress` is null while it isn't running. */
export const useDownload = (key: string) => {
    const state = useSyncExternalStore(subscribe, () => getDownloadState(key), () => getDownloadState(key));
    const start = useCallback((task: DownloadTask) => startDownload(key, task), [key]);
    const cancel = useCallback(() => cancelDownload(key), [key]);
    return { ...state, progressOrNull: state.running ? state.progress : null, start, cancel };
};

/** Every running download, for screens that list several items. */
export const useDownloads = () => {
    useSyncExternalStore(subscribe, () => version, () => version);
    return {
        get: getDownloadState,
        progressOf: (key: string) => (getDownloadState(key).running ? getDownloadState(key).progress : null),
        errorOf: (key: string) => getDownloadState(key).error,
        start: startDownload,
        cancel: cancelDownload,
    };
};

/** Runs `onFinished` whenever any download ends, e.g. to re-check downloaded files. */
export const useDownloadFinished = (onFinished: () => void) => {
    const count = useSyncExternalStore(subscribe, () => finishedCount, () => finishedCount);
    useEffect(() => {
        if (count > 0) onFinished();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count]);
};

/** Running downloads, plus those that failed within `recentMs`, for the app-wide download pill. */
export const useActiveDownloads = (recentMs: number) => {
    useSyncExternalStore(subscribe, () => version, () => version);
    const now = Date.now();
    const list = [...entries.entries()].map(([key, entry]) => ({ key, ...entry.state }));
    return {
        running: list.filter(item => item.running),
        failed: list.filter(item => !item.running && item.failedAt !== undefined && now - item.failedAt < recentMs),
    };
};
