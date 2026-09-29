import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Play, RotateCcw, Boxes, TriangleAlert, FileUp } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { DownloadRequired } from '@/components/DownloadRequired';
import { ProgressBar } from '@/components/ProgressBar';
import { VerseModelManager } from '@/components/VerseModelManager';
import { SpeechStatusRows, getSpeechEngineRows } from '@/components/SpeechStatusRows';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useDownloadData } from '@/hooks/useDownloadData';
import { loadSurah } from '@/data/quranData';
import { getSurahNameByNumber } from '@/utils/surahName';
import { getWordSegments } from '@/utils/arabicText';
import { markMatchedWords, VerseMatch } from '@/utils/verseMatcher';
import {
    checkDeviceSupport,
    DeviceSupport,
    FILE_TOO_LARGE,
    getPeakLevel,
    isModelSupported,
    matchTranscript,
    MAX_FILE_MB,
    MAX_FILE_SECONDS,
    MAX_RECORDING_SECONDS,
    pickAudioFile,
    prepareVerseIndex,
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
import { createStyles } from './VerseFinderScreen.styles';

interface VerseFinderScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

type ModelState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready' }
    | { status: 'error'; message: string };

type Phase = 'idle' | 'recording' | 'recognizing' | 'done';

// Chrome flags that make WebGPU use the graphics card where it's off or falls back to SwiftShader
// (typically Linux: Dawn reaches the GPU driver only through Vulkan)
const GPU_FLAGS = [
    'chrome://flags/#enable-unsafe-webgpu',
    'chrome://flags/#ignore-gpu-blocklist',
    'chrome://flags/#enable-vulkan',
];

interface ResultItem extends VerseMatch {
    /** Each verse of the match with its words, flagged when they were heard. */
    verses: { number: number; words: { text: string; matched: boolean }[] }[];
}

export const VerseFinderScreen: React.FC<VerseFinderScreenProps> = ({ navigation, isDataAvailable }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { goToSurahVerse } = useNavigationHelpers();
    const download = useDownloadData({ isDataAvailable, navigation });

    const [support, setSupport] = useState<DeviceSupport | null>(null);
    const [downloaded, setDownloaded] = useState<Set<VerseModelId>>(new Set());
    const [selectedId, setSelectedId] = useState<VerseModelId | null>(null);
    const [managerVisible, setManagerVisible] = useState(false);
    const [modelState, setModelState] = useState<ModelState>(() =>
        speechModel.ready ? { status: 'ready' } : { status: 'idle' },
    );
    const [phase, setPhase] = useState<Phase>('idle');
    const [elapsed, setElapsed] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const [inferenceMs, setInferenceMs] = useState<number | null>(null);
    const [results, setResults] = useState<ResultItem[]>([]);
    const [lastAudio, setLastAudio] = useState<Float32Array | null>(null);
    const [playing, setPlaying] = useState(false);
    const [gpuHelpVisible, setGpuHelpVisible] = useState(false);
    const [fileTruncated, setFileTruncated] = useState(false);
    const recordingRef = useRef<Recording | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    useEffect(() => {
        if (isDataAvailable) prepareVerseIndex().catch(() => { /* retried when matching */ });
    }, [isDataAvailable]);

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

    const recognizeAudio = useCallback(async (audio: Float32Array) => {
        setPhase('recognizing');
        setError(null);
        setTranscript('');
        setResults([]);
        try {
            await loadModel();
            const { text, ms } = await speechModel.transcribe(audio);
            setTranscript(text.trim());
            setInferenceMs(ms);
            const matches = await matchTranscript(text);
            const items = await Promise.all(matches.map(async match => {
                const surah = await loadSurah(match.surahNumber);
                const verses = match.ranges.map(range => {
                    const verse = surah?.verses[range.verse - 1];
                    const words = verse ? getWordSegments(verse).map(segment => segment.arabic) : [];
                    const matched = markMatchedWords(words, range);
                    return { number: range.verse, words: words.map((wordText, i) => ({ text: wordText, matched: matched[i] })) };
                });
                return { ...match, verses };
            }));
            setResults(items);
        } catch (e: any) {
            setError(t('verseFinder.errors.recognition', { message: String(e?.message ?? e) }));
        } finally {
            setPhase('done');
        }
    }, [loadModel, t]);

    const recognize = useCallback(async (recording: Recording) => {
        setPhase('recognizing');
        let audio: Float32Array;
        try {
            audio = await recording.stop();
        } catch (e: any) {
            setError(t('verseFinder.errors.recognition', { message: String(e?.message ?? e) }));
            setPhase('done');
            return;
        }
        setLastAudio(audio);
        await recognizeAudio(audio);
    }, [recognizeAudio, t]);

    const stopRecording = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        const recording = recordingRef.current;
        recordingRef.current = null;
        if (recording) recognize(recording);
    }, [recognize]);

    const handleMicPress = async () => {
        if (phase === 'recording') {
            stopRecording();
            return;
        }
        if (phase === 'recognizing') return;
        setError(null);
        setTranscript('');
        setResults([]);
        setFileTruncated(false);
        try {
            recordingRef.current = await startRecording();
        } catch {
            setError(t('verseFinder.errors.microphone'));
            return;
        }
        // Start the model while the user is reciting, so it's ready when they stop
        loadModel().catch(() => { /* shown in the status card */ });
        setPhase('recording');
        setElapsed(0);
        const startedAt = Date.now();
        timerRef.current = setInterval(() => {
            const seconds = Math.floor((Date.now() - startedAt) / 1000);
            setElapsed(seconds);
            if (seconds >= MAX_RECORDING_SECONDS) stopRecording();
        }, 250);
    };

    const handlePickFile = async () => {
        setError(null);
        let picked;
        try {
            picked = await pickAudioFile();
        } catch (e: any) {
            setError(t(e?.message === FILE_TOO_LARGE ? 'verseFinder.errors.fileTooLarge' : 'verseFinder.errors.fileUnreadable', { size: MAX_FILE_MB }));
            return;
        }
        if (!picked) return;
        setLastAudio(picked.audio);
        setFileTruncated(picked.truncated);
        await recognizeAudio(picked.audio);
    };

    const handleSelectModel = (id: VerseModelId) => {
        setSelectedId(id);
        setSelectedModelId(id);
        setInferenceMs(null);
    };

    const handlePlay = async () => {
        if (!lastAudio || playing) return;
        setPlaying(true);
        try {
            await playRecording(lastAudio);
        } finally {
            setPlaying(false);
        }
    };

    const header = (
        <AppHeader
            title={t('verseFinder.title')}
            subtitle={t('verseFinder.subtitle')}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
            showHomeButton={true}
            onHomePress={() => navigation.navigate('Main')}
        />
    );

    if (!isDataAvailable) {
        return (
            <SafeAreaView style={common.container}>
                {header}
                <DownloadRequired
                    title={t('verseFinder.downloadTitle')}
                    description={t('verseFinder.downloadDescription')}
                    totalBytes={download.totalBytes}
                    downloading={download.downloading}
                    downloadProgress={download.downloadProgress}
                    downloadStatus={download.downloadStatus}
                    downloadedBytes={download.downloadedBytes}
                    onDownloadPress={download.handleDownloadData}
                />
            </SafeAreaView>
        );
    }

    const canRecord = !!support?.microphone && support.worker && !!activeModel;
    const busy = phase === 'recording' || phase === 'recognizing' || modelState.status === 'loading';
    const ok = theme.success;
    const warn = theme.warning;
    const bad = theme.error;
    const muted = theme.textSecondary;
    const peakPercent = lastAudio ? Math.round(getPeakLevel(lastAudio) * 100) : 0;

    const statusRows = [
        ...getSpeechEngineRows(t, theme, support, activeModel, modelState),
        {
            label: t('verseFinder.status.microphone'),
            color: !support ? muted : support.microphone ? ok : bad,
            value: t(!support ? 'verseFinder.status.checking' : support.microphone ? 'verseFinder.status.yes' : 'verseFinder.status.no'),
        },
        ...(lastAudio
            ? [{
                label: t('verseFinder.status.recording'),
                // Under ~5% peak the microphone most likely recorded silence
                color: peakPercent < 5 ? bad : peakPercent < 20 ? warn : ok,
                value: t(`verseFinder.status.recordingLevel.${peakPercent < 5 ? 'silent' : peakPercent < 20 ? 'quiet' : 'good'}`),
            }]
            : []),
        ...(inferenceMs !== null
            ? [{ label: t('verseFinder.status.lastRun'), color: ok, value: t('verseFinder.status.seconds', { value: (inferenceMs / 1000).toFixed(1) }) }]
            : []),
    ];

    const micHint = !activeModel
        ? t('verseFinder.noModel')
        : phase === 'recording'
            ? t('verseFinder.listening', { seconds: elapsed, max: MAX_RECORDING_SECONDS })
            : phase === 'recognizing'
                ? modelState.status === 'loading' ? t('verseFinder.loadingModel') : t('verseFinder.recognizing')
                : t('verseFinder.tapToStart');

    return (
        <SafeAreaView style={common.container}>
            {header}
            <ScrollView contentContainerStyle={styles.content}>
                {support && !support.secureContext && (
                    <View style={[common.sectionCard, styles.warningCard]}>
                        <TriangleAlert size={20} color={theme.warning} />
                        <Text style={[common.text, common.flex1]}>{t('verseFinder.insecureWarning')}</Text>
                    </View>
                )}

                <View style={common.sectionCard}>
                    <Text style={[common.sectionLabel, common.mbSm]}>{t('verseFinder.status.title')}</Text>
                    <SpeechStatusRows rows={statusRows} />
                    {(support?.webgpu === 'noAdapter' || support?.softwareGpu) && (
                        <>
                            <TouchableOpacity onPress={() => setGpuHelpVisible(v => !v)} style={common.mtSm}>
                                <Text style={common.textAccent}>{t(gpuHelpVisible ? 'verseFinder.gpuHelp.hide' : 'verseFinder.gpuHelp.show')}</Text>
                            </TouchableOpacity>
                            {gpuHelpVisible && (
                                <View style={styles.helpBox}>
                                    <Text style={common.text}>{t('verseFinder.gpuHelp.intro')}</Text>
                                    {GPU_FLAGS.map((flag, i) => (
                                        <View key={flag} style={common.mtSm}>
                                            <Text style={common.text}>{t(`verseFinder.gpuHelp.step${i + 1}`)}</Text>
                                            <Text style={styles.flagText} selectable>{flag}</Text>
                                        </View>
                                    ))}
                                    <Text style={[common.text, common.mtSm]}>{t('verseFinder.gpuHelp.relaunch', { step: GPU_FLAGS.length + 1 })}</Text>
                                    <Text style={[common.smallText, common.mtSm]}>{t('verseFinder.gpuHelp.note')}</Text>
                                </View>
                            )}
                        </>
                    )}
                    {modelState.status === 'error' && <Text style={[common.smallText, common.mtSm]}>{modelState.message}</Text>}
                    <View style={[styles.buttonRow, common.mtMd]}>
                        <AppButton
                            title={t('verseFinder.manageModels')}
                            icon={<Boxes size={16} color={activeModel ? theme.primary : '#FFFFFF'} />}
                            variant={activeModel ? 'outline' : 'primary'}
                            size="small"
                            onPress={() => setManagerVisible(true)}
                            disabled={busy}
                        />
                        {lastAudio && (
                            <>
                                <AppButton
                                    title={playing ? t('verseFinder.playing') : t('verseFinder.playRecording')}
                                    icon={<Play size={16} color={theme.primary} />}
                                    variant="outline"
                                    size="small"
                                    onPress={handlePlay}
                                    disabled={playing || phase === 'recording'}
                                />
                                <AppButton
                                    title={t('verseFinder.rerun')}
                                    icon={<RotateCcw size={16} color={theme.primary} />}
                                    variant="outline"
                                    size="small"
                                    onPress={() => recognizeAudio(lastAudio)}
                                    disabled={busy || !activeModel}
                                />
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.micArea}>
                    <TouchableOpacity
                        style={[styles.micButton, phase === 'recording' && styles.micButtonRecording, (!canRecord || phase === 'recognizing') && common.disabled]}
                        onPress={handleMicPress}
                        disabled={!canRecord || phase === 'recognizing'}
                        activeOpacity={0.85}
                        accessibilityLabel={phase === 'recording' ? t('verseFinder.stop') : t('verseFinder.start')}
                    >
                        {phase === 'recording'
                            ? <Square size={40} color="#fff" fill="#fff" />
                            : <Mic size={48} color="#fff" />}
                    </TouchableOpacity>
                    <Text style={styles.micHint}>{support && !support.microphone ? t('verseFinder.errors.unsupported') : micHint}</Text>
                    {phase === 'recording' && (
                        <ProgressBar progress={(elapsed / MAX_RECORDING_SECONDS) * 100} style={styles.recordingProgress} />
                    )}
                    <AppButton
                        title={t('verseFinder.pickFile')}
                        icon={<FileUp size={16} color={theme.primary} />}
                        variant="ghost"
                        size="small"
                        onPress={handlePickFile}
                        disabled={busy || !activeModel}
                    />
                </View>

                {error && <Text style={[common.note, common.textCenter]}>{error}</Text>}

                {phase === 'done' && !error && (
                    <>
                        {!!transcript && (
                            <View style={common.sectionCard}>
                                <Text style={[common.sectionLabel, common.mbSm]}>{t('verseFinder.heard')}</Text>
                                <ArabicText style={styles.transcript}>{transcript}</ArabicText>
                            </View>
                        )}
                        {fileTruncated && (
                            <Text style={[common.smallText, common.textCenter]}>{t('verseFinder.fileTruncated', { seconds: MAX_FILE_SECONDS })}</Text>
                        )}
                        {results.length === 0 ? (
                            <Text style={[common.subtitle, common.textCenter]}>{t('verseFinder.noMatch')}</Text>
                        ) : (
                            results.map((result, i) => (
                                <TouchableOpacity
                                    key={`${result.surahNumber}:${result.fromVerse}`}
                                    style={common.sectionCard}
                                    onPress={() => goToSurahVerse(result.surahNumber, result.fromVerse - 1)}
                                    activeOpacity={0.8}
                                >
                                    <View style={common.rowBetween}>
                                        <Text style={i === 0 ? common.title : common.textStrong}>
                                            {getSurahNameByNumber(t, result.surahNumber)}{' '}
                                            {result.toVerse > result.fromVerse
                                                ? t('verseFinder.verseRange', { from: result.fromVerse, to: result.toVerse })
                                                : t('verseFinder.verse', { verse: result.fromVerse })}
                                        </Text>
                                        <Text style={common.smallText}>{t('verseFinder.match', { percent: Math.round(result.score * 100) })}</Text>
                                    </View>
                                    {result.verses.map(verse => (
                                        <View key={verse.number}>
                                            {result.verses.length > 1 && (
                                                <Text style={[common.smallText, common.mtSm]}>{t('verseFinder.verse', { verse: verse.number })}</Text>
                                            )}
                                            <ArabicText style={styles.resultArabic} numberOfLines={i === 0 ? undefined : 2}>
                                                {verse.words.map((word, w) => (
                                                    <Text key={w} style={word.matched ? styles.matchedWord : styles.unmatchedWord}>
                                                        {word.text}{' '}
                                                    </Text>
                                                ))}
                                            </ArabicText>
                                        </View>
                                    ))}
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}
            </ScrollView>

            <VerseModelManager
                visible={managerVisible}
                onClose={() => setManagerVisible(false)}
                support={support}
                selectedId={selectedId}
                downloaded={downloaded}
                onSelect={handleSelectModel}
                onChanged={refreshDownloaded}
            />
        </SafeAreaView>
    );
};
