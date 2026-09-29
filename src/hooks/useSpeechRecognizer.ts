import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    checkDeviceSupport,
    DeviceSupport,
    isModelSupported,
    MAX_RECORDING_SECONDS,
    playRecording,
    Recording,
    speechModel,
    startRecording,
} from '@/services/verseFinder';
import {
    getDownloadedModels,
    getSelectedModelId,
    getVerseModel,
    setSelectedModelId,
    VERSE_MODELS,
    VerseModelId,
} from '@/services/verseModels';

export type ModelState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready' }
    | { status: 'error'; message: string };

export type RecognizerPhase = 'idle' | 'recording' | 'recognizing' | 'done';

/**
 * Microphone + speech model plumbing for screens that turn a recitation into text
 * (device checks, the selected model, recording, playback). `onTranscript` gets the text
 * once recognition finishes; what to do with it is up to the screen.
 */
export const useSpeechRecognizer = (onTranscript: (text: string) => void | Promise<void>) => {
    const { t } = useTranslation();
    const [support, setSupport] = useState<DeviceSupport | null>(null);
    const [downloaded, setDownloaded] = useState<Set<VerseModelId>>(new Set());
    const [selectedId, setSelectedId] = useState<VerseModelId | null>(null);
    const [modelState, setModelState] = useState<ModelState>(() =>
        speechModel.ready ? { status: 'ready' } : { status: 'idle' },
    );
    const [phase, setPhase] = useState<RecognizerPhase>('idle');
    const [elapsed, setElapsed] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [lastAudio, setLastAudio] = useState<Float32Array | null>(null);
    const [playing, setPlaying] = useState(false);
    const recordingRef = useRef<Recording | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;

    // The model the mic uses: the selected one, if it's downloaded and runs on this device
    const activeModel = selectedId && downloaded.has(selectedId) && (!support || isModelSupported(getVerseModel(selectedId), support))
        ? getVerseModel(selectedId)
        : null;
    const activeModelRef = useRef(activeModel);
    activeModelRef.current = activeModel;

    const refreshDownloaded = useCallback(async () => {
        setDownloaded(await getDownloadedModels());
    }, []);

    useEffect(() => {
        (async () => {
            const [deviceSupport, saved, available] = await Promise.all([
                checkDeviceSupport(),
                getSelectedModelId(),
                getDownloadedModels(),
            ]);
            setSupport(deviceSupport);
            setDownloaded(available);
            // Fall back to the first usable downloaded model if the saved one is gone
            const usable = VERSE_MODELS.filter(m => available.has(m.id) && isModelSupported(m, deviceSupport));
            setSelectedId(saved && usable.some(m => m.id === saved) ? saved : usable[0]?.id ?? saved);
        })();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            recordingRef.current?.cancel();
        };
    }, []);

    // Reflect a model that's no longer loaded (switched or deleted in the manager)
    useEffect(() => {
        if (speechModel.modelId !== activeModel?.id) setModelState({ status: 'idle' });
    }, [activeModel?.id, downloaded]);

    const loadModel = useCallback(async () => {
        const model = activeModelRef.current;
        if (!model) throw new Error(t('verseFinder.noModel'));
        if (!(speechModel.ready && speechModel.modelId === model.id)) setModelState({ status: 'loading' });
        try {
            await speechModel.load(model);
            setModelState({ status: 'ready' });
        } catch (e: any) {
            setModelState({ status: 'error', message: String(e?.message ?? e) });
            throw e;
        }
    }, [t]);

    const recognize = useCallback(async (recording: Recording) => {
        setPhase('recognizing');
        try {
            const audio = await recording.stop();
            setLastAudio(audio);
            await loadModel();
            const { text } = await speechModel.transcribe(audio);
            await onTranscriptRef.current(text.trim());
        } catch (e: any) {
            setError(t('verseFinder.errors.recognition', { message: String(e?.message ?? e) }));
        } finally {
            setPhase('done');
        }
    }, [loadModel, t]);

    const stopRecording = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        const recording = recordingRef.current;
        recordingRef.current = null;
        if (recording) recognize(recording);
    }, [recognize]);

    /** Starts recording, or stops it and recognizes what was said. */
    const toggleRecording = useCallback(async () => {
        if (phase === 'recording') {
            stopRecording();
            return;
        }
        if (phase === 'recognizing') return;
        setError(null);
        try {
            recordingRef.current = await startRecording();
        } catch {
            setError(t('verseFinder.errors.microphone'));
            return;
        }
        // Start the model while the user is reciting, so it's ready when they stop
        loadModel().catch(() => { /* shown by the screen through modelState */ });
        setPhase('recording');
        setElapsed(0);
        const startedAt = Date.now();
        timerRef.current = setInterval(() => {
            const seconds = Math.floor((Date.now() - startedAt) / 1000);
            setElapsed(seconds);
            if (seconds >= MAX_RECORDING_SECONDS) stopRecording();
        }, 250);
    }, [phase, stopRecording, loadModel, t]);

    const play = useCallback(async () => {
        if (!lastAudio || playing) return;
        setPlaying(true);
        try {
            await playRecording(lastAudio);
        } finally {
            setPlaying(false);
        }
    }, [lastAudio, playing]);

    const selectModel = useCallback((id: VerseModelId) => {
        setSelectedId(id);
        setSelectedModelId(id);
    }, []);

    /** Back to the start: forgets the last recording and error. */
    const reset = useCallback(() => {
        setPhase('idle');
        setError(null);
        setLastAudio(null);
    }, []);

    return {
        support,
        downloaded,
        selectedId,
        activeModel,
        modelState,
        phase,
        elapsed,
        error,
        lastAudio,
        playing,
        canRecord: !!support?.microphone && support.worker && !!activeModel,
        busy: phase === 'recording' || phase === 'recognizing' || modelState.status === 'loading',
        toggleRecording,
        play,
        selectModel,
        refreshDownloaded,
        reset,
    };
};
