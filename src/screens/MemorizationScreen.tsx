import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Play, RotateCcw, Boxes, TriangleAlert, ChevronLeft, ChevronRight, Eye, EyeOff, ChevronDown, Flag, Volume2, Lightbulb } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { DownloadRequired } from '@/components/DownloadRequired';
import { MemorizationAttempt, MemorizationSummary } from '@/components/MemorizationSummary';
import { ProgressBar } from '@/components/ProgressBar';
import { LETTER_WRONG_COLOR, RecitedVerse } from '@/components/RecitedVerse';
import { MemorizationSelection, SurahVersePickerModal } from '@/components/SurahVersePickerModal';
import { VerseModelManager } from '@/components/VerseModelManager';
import { SpeechStatusRows, getSpeechEngineRows } from '@/components/SpeechStatusRows';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useDownloadData } from '@/hooks/useDownloadData';
import { useSpeechRecognizer } from '@/hooks/useSpeechRecognizer';
import { getSurahsList, loadSurah } from '@/data/quranData';
import { getSurahName } from '@/utils/surahName';
import { getWordSegments } from '@/utils/arabicText';
import { checkRecitation, isFlawless, WordStatus } from '@/utils/recitationCheck';
import { toSkeleton } from '@/utils/verseMatcher';
import { MAX_RECORDING_SECONDS } from '@/services/verseFinder';
import { createStyles as createFinderStyles } from './VerseFinderScreen.styles';
import { createStyles } from './MemorizationScreen.styles';

interface MemorizationScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

/** How long a correctly read verse stays on screen before a sequential session moves on. */
const AUTO_ADVANCE_MS = 1500;

const versesOf = (selection: MemorizationSelection): number[] =>
    Array.from({ length: selection.toVerse - selection.fromVerse + 1 }, (_, i) => selection.fromVerse + i);

export const MemorizationScreen: React.FC<MemorizationScreenProps> = ({ navigation, isDataAvailable }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    // The microphone button and its hint are shared with the verse finder
    const micStyles = useThemedStyles(createFinderStyles);
    const download = useDownloadData({ isDataAvailable, navigation });
    const surahs = getSurahsList();

    const [selection, setSelection] = useState<MemorizationSelection>({ surahNumber: 1, scope: 'single', fromVerse: 1, toVerse: 1 });
    const [verseNumber, setVerseNumber] = useState(1);
    // Verses still to recite in a sequential session; "retry mistakes" narrows it to the ones that went wrong
    const [queue, setQueue] = useState<number[]>([]);
    const [attempts, setAttempts] = useState<Record<number, MemorizationAttempt>>({});
    const [finished, setFinished] = useState(false);
    const [autoAdvance, setAutoAdvance] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [words, setWords] = useState<string[]>([]);
    const [revealed, setRevealed] = useState(false);
    // How many of the verse's first words the hint button has shown
    const [hintCount, setHintCount] = useState(0);
    const [managerVisible, setManagerVisible] = useState(false);
    const sequential = selection.scope !== 'single';
    const current = useRef({ words, verseNumber, sequential, hintCount });
    current.current = { words, verseNumber, sequential, hintCount };

    const handleTranscript = useCallback((text: string) => {
        const { words: verseWords, verseNumber: verse, sequential: inSession, hintCount: hints } = current.current;
        // Nothing usable was heard (silence, noise): there's nothing to mark
        if (toSkeleton(text).length === 0) {
            setAttempts(({ [verse]: _, ...rest }) => rest);
            return;
        }
        const result = checkRecitation(verseWords, text);
        setAttempts(previous => ({ ...previous, [verse]: { result, transcript: text, hints } }));
        if (inSession && isFlawless(result)) setAutoAdvance(true);
    }, []);

    const recognizer = useSpeechRecognizer(handleTranscript);
    const { support, activeModel, modelState, phase, elapsed, error, lastAudio, playing, canRecord, busy } = recognizer;
    const audio = useGlobalAudio();
    const listening = (audio.audioState.isPlaying || audio.audioState.isLoading)
        && audio.audioState.currentVerse?.surahNumber === selection.surahNumber
        && audio.audioState.currentVerse?.number === verseNumber;

    const stopListening = () => {
        if (!listening) return;
        audio.cancelMemorization();
        audio.stop();
    };

    /** Plays the current verse once in the selected reciter's voice, or stops it. */
    const toggleListen = () => {
        if (listening) stopListening();
        // A one-verse, one-repeat memorization range stops by itself after the verse
        else audio.startMemorization(selection.surahNumber, verseNumber, verseNumber, 1, 'individual');
    };

    useEffect(() => {
        if (!isDataAvailable) return;
        let cancelled = false;
        loadSurah(selection.surahNumber).then(surah => {
            if (cancelled || !surah) return;
            const verse = surah.verses[verseNumber - 1];
            setWords(verse ? getWordSegments(verse).map(segment => segment.arabic) : []);
        });
        return () => { cancelled = true; };
    }, [isDataAvailable, selection.surahNumber, verseNumber]);

    /** Moves to another verse; outside a session the previous verse's check is forgotten. */
    const goToVerse = (verse: number) => {
        stopListening();
        setVerseNumber(verse);
        setRevealed(false);
        setHintCount(0);
        setAutoAdvance(false);
        if (!sequential) setAttempts({});
        recognizer.reset();
    };

    const startSelection = (next: MemorizationSelection) => {
        setSelection(next);
        setQueue(next.scope === 'single' ? [] : versesOf(next));
        setAttempts({});
        setFinished(false);
        setVerseNumber(next.fromVerse);
        setRevealed(false);
        setHintCount(0);
        setAutoAdvance(false);
        recognizer.reset();
    };

    const finish = () => {
        setFinished(true);
        setAutoAdvance(false);
        recognizer.reset();
    };

    /** The next verse of the session after this one, or the summary after the last. */
    const advance = () => {
        const next = queue.find(verse => verse > verseNumber);
        if (next) goToVerse(next);
        else finish();
    };

    useEffect(() => {
        if (!autoAdvance) return;
        const timer = setTimeout(advance, AUTO_ADVANCE_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoAdvance]);

    const handleRetry = () => {
        setAttempts(({ [verseNumber]: _, ...rest }) => rest);
        setAutoAdvance(false);
        recognizer.reset();
    };

    const retryMistakes = () => {
        const remaining = versesOf(selection).filter(verse => !attempts[verse] || !isFlawless(attempts[verse].result));
        setAttempts(previous => Object.fromEntries(Object.entries(previous).filter(([verse]) => !remaining.includes(Number(verse)))));
        setQueue(remaining);
        setFinished(false);
        setVerseNumber(remaining[0]);
        setRevealed(false);
        setHintCount(0);
        recognizer.reset();
    };

    const header = (
        <AppHeader
            title={t('memorization.title')}
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
                    title={t('memorization.downloadTitle')}
                    description={t('memorization.downloadDescription')}
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

    const currentSurah = surahs.find(s => s.number === selection.surahNumber);
    const surahTitle = currentSurah ? `${currentSurah.number}. ${getSurahName(t, currentSurah)}` : '';
    const verseCount = currentSurah?.verseCount ?? 0;
    // Prev/next stay inside the session's verses, or the surah for a single verse
    const [firstVerse, lastVerse] = sequential ? [selection.fromVerse, selection.toVerse] : [1, verseCount];
    const sessionVerses = versesOf(selection);
    const readCount = sessionVerses.filter(verse => attempts[verse]).length;
    const isLastInSession = !queue.some(verse => verse > verseNumber);

    const attempt = attempts[verseNumber];
    const result = attempt?.result;
    const count = (status: WordStatus) => result?.words.filter(w => w.status === status).length ?? 0;
    const legend: { status: WordStatus; color: string }[] = [
        { status: 'ok', color: theme.success },
        { status: 'wrong', color: theme.error },
        { status: 'missed', color: theme.error + '55' },
    ];

    const engineRows = getSpeechEngineRows(t, theme, support, activeModel, modelState);

    const micHint = !activeModel
        ? t('verseFinder.noModel')
        : phase === 'recording'
            ? t('verseFinder.listening', { seconds: elapsed, max: MAX_RECORDING_SECONDS })
            : phase === 'recognizing'
                ? modelState.status === 'loading' ? t('verseFinder.loadingModel') : t('memorization.checking')
                : t('memorization.tapToStart');

    const selectionCard = (
        <View style={common.sectionCard}>
            <TouchableOpacity
                style={[styles.selectionChip, busy && common.disabled]}
                onPress={() => setPickerVisible(true)}
                disabled={busy}
                activeOpacity={0.7}
                accessibilityLabel={t('memorization.change')}
            >
                <Text style={common.title}>{surahTitle}</Text>
                <ChevronDown size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            {!finished && (
                <>
                    <View style={styles.navRow}>
                        <AppButton
                            icon={<ChevronLeft size={20} color={theme.primary} />}
                            variant="outline"
                            shape="circle"
                            size="small"
                            onPress={() => goToVerse(verseNumber - 1)}
                            disabled={busy || verseNumber <= firstVerse}
                        />
                        <View style={styles.navCenter}>
                            <Text style={common.title}>{t('memorization.verseOf', { verse: verseNumber, count: verseCount })}</Text>
                            {sequential && (
                                <Text style={common.smallText}>{t('memorization.progress', { read: readCount, count: sessionVerses.length })}</Text>
                            )}
                        </View>
                        <AppButton
                            icon={<ChevronRight size={20} color={theme.primary} />}
                            variant="outline"
                            shape="circle"
                            size="small"
                            onPress={() => goToVerse(verseNumber + 1)}
                            disabled={busy || verseNumber >= lastVerse}
                        />
                    </View>
                    {sequential && <ProgressBar progress={(readCount / sessionVerses.length) * 100} height={6} />}
                </>
            )}
        </View>
    );

    return (
        <SafeAreaView style={common.container}>
            {header}
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {support && !support.secureContext && (
                    <View style={[common.sectionCard, styles.warningCard]}>
                        <TriangleAlert size={20} color={theme.warning} />
                        <Text style={[common.text, common.flex1]}>{t('verseFinder.insecureWarning')}</Text>
                    </View>
                )}

                {selectionCard}

                {finished ? (
                    <MemorizationSummary
                        title={surahTitle}
                        verses={sessionVerses}
                        attempts={attempts}
                        onOpenVerse={verse => {
                            setFinished(false);
                            goToVerse(verse);
                        }}
                        onRetryMistakes={retryMistakes}
                        onRestart={() => startSelection(selection)}
                        onNewSelection={() => setPickerVisible(true)}
                    />
                ) : (
                    <>
                        <View style={common.sectionCard}>
                            <View style={styles.verseActions}>
                                <AppButton
                                    title={t(listening ? 'memorization.stopListening' : 'memorization.listen')}
                                    icon={listening ? <Square size={14} color={theme.primary} fill={theme.primary} /> : <Volume2 size={16} color={theme.primary} />}
                                    variant="ghost"
                                    size="small"
                                    onPress={toggleListen}
                                    disabled={phase === 'recording'}
                                />
                                {!result && (
                                    <View style={common.row}>
                                        <AppButton
                                            title={t('memorization.hint')}
                                            icon={<Lightbulb size={16} color={theme.primary} />}
                                            variant="ghost"
                                            size="small"
                                            onPress={() => setHintCount(shown => shown + 1)}
                                            disabled={revealed || hintCount >= words.length}
                                        />
                                        <AppButton
                                            title={t(revealed ? 'memorization.hideVerse' : 'memorization.showVerse')}
                                            icon={revealed ? <EyeOff size={16} color={theme.primary} /> : <Eye size={16} color={theme.primary} />}
                                            variant="ghost"
                                            size="small"
                                            onPress={() => setRevealed(shown => !shown)}
                                        />
                                    </View>
                                )}
                            </View>
                            {result ? (
                                <>
                                    <RecitedVerse result={result} />
                                    <View style={styles.legendRow}>
                                        {legend.map(({ status, color }) => (
                                            <View key={status} style={styles.legendItem}>
                                                <View style={[styles.legendSwatch, { backgroundColor: color }]} />
                                                <Text style={common.smallText}>{t(`memorization.legend.${status}`, { count: count(status) })}</Text>
                                            </View>
                                        ))}
                                        {result.words.some(w => w.parts?.some(p => p.error)) && (
                                            <View style={styles.legendItem}>
                                                <View style={[styles.legendSwatch, { backgroundColor: LETTER_WRONG_COLOR }]} />
                                                <Text style={common.smallText}>{t('memorization.legend.letter')}</Text>
                                            </View>
                                        )}
                                    </View>
                                </>
                            ) : revealed ? (
                                <ArabicText style={styles.verseArabic}>{words.join(' ')}</ArabicText>
                            ) : hintCount > 0 ? (
                                <ArabicText style={styles.verseArabic}>
                                    {words.slice(0, hintCount).join(' ')}{hintCount < words.length ? ' …' : ''}
                                </ArabicText>
                            ) : (
                                <Text style={styles.hiddenVerse}>{t('memorization.hiddenVerse')}</Text>
                            )}
                        </View>

                        {result && attempt && (
                            <View style={common.sectionCard}>
                                <Text style={common.title}>{t('memorization.accuracy', { percent: Math.round(result.accuracy * 100) })}</Text>
                                <Text style={[common.text, common.mtSm]}>
                                    {count('wrong') + count('missed') === 0
                                        ? t('memorization.allCorrect')
                                        : t('memorization.summary', { wrong: count('wrong'), missed: count('missed') })}
                                </Text>
                                {autoAdvance && (
                                    <Text style={[common.textAccent, common.mtSm]}>
                                        {t(isLastInSession ? 'memorization.autoFinish' : 'memorization.autoAdvance')}
                                    </Text>
                                )}
                                <Text style={[common.sectionLabel, common.mtMd, common.mbXs]}>{t('verseFinder.heard')}</Text>
                                <ArabicText style={styles.transcript}>{attempt.transcript}</ArabicText>
                            </View>
                        )}

                        {phase === 'done' && !error && !result && (
                            <Text style={[common.note, common.textCenter]}>{t('memorization.nothingHeard')}</Text>
                        )}
                        {error && <Text style={[common.note, common.textCenter]}>{error}</Text>}
                        {modelState.status === 'error' && <Text style={[common.smallText, common.textCenter]}>{modelState.message}</Text>}

                        <View style={common.sectionCard}>
                            <SpeechStatusRows rows={engineRows} />
                        </View>

                        <View style={micStyles.micArea}>
                            <TouchableOpacity
                                style={[micStyles.micButton, phase === 'recording' && micStyles.micButtonRecording, (!canRecord || phase === 'recognizing') && common.disabled]}
                                onPress={() => {
                                    setAutoAdvance(false);
                                    // The microphone would hear the reciter
                                    stopListening();
                                    recognizer.toggleRecording();
                                }}
                                disabled={!canRecord || phase === 'recognizing'}
                                activeOpacity={0.85}
                                accessibilityLabel={phase === 'recording' ? t('verseFinder.stop') : t('verseFinder.start')}
                            >
                                {phase === 'recording'
                                    ? <Square size={40} color="#fff" fill="#fff" />
                                    : <Mic size={48} color="#fff" />}
                            </TouchableOpacity>
                            <Text style={micStyles.micHint}>{support && !support.microphone ? t('verseFinder.errors.unsupported') : micHint}</Text>
                            {phase === 'recording' && (
                                <ProgressBar progress={(elapsed / MAX_RECORDING_SECONDS) * 100} style={micStyles.recordingProgress} />
                            )}
                            <View style={styles.buttonRow}>
                                {lastAudio && (
                                    <AppButton
                                        title={playing ? t('verseFinder.playing') : t('verseFinder.playRecording')}
                                        icon={<Play size={16} color={theme.primary} />}
                                        variant="outline"
                                        size="small"
                                        onPress={recognizer.play}
                                        disabled={playing || phase === 'recording'}
                                    />
                                )}
                                {(phase === 'done' || result) && (
                                    <AppButton
                                        title={t('memorization.retry')}
                                        icon={<RotateCcw size={16} color={theme.primary} />}
                                        variant="outline"
                                        size="small"
                                        onPress={handleRetry}
                                        disabled={busy}
                                    />
                                )}
                                {result && !autoAdvance && (sequential || verseNumber < verseCount) && (
                                    <AppButton
                                        title={t(sequential && isLastInSession ? 'memorization.showSummary' : 'memorization.nextVerse')}
                                        icon={<ChevronRight size={16} color="#FFFFFF" />}
                                        iconPosition="right"
                                        size="small"
                                        onPress={sequential ? advance : () => goToVerse(verseNumber + 1)}
                                        disabled={busy}
                                    />
                                )}
                                {sequential && !(result && isLastInSession) && (
                                    <AppButton
                                        title={t('memorization.finish')}
                                        icon={<Flag size={16} color={theme.primary} />}
                                        variant="ghost"
                                        size="small"
                                        onPress={finish}
                                        disabled={busy}
                                    />
                                )}
                                <AppButton
                                    title={t('verseFinder.manageModels')}
                                    icon={<Boxes size={16} color={activeModel ? theme.primary : '#FFFFFF'} />}
                                    variant={activeModel ? 'ghost' : 'primary'}
                                    size="small"
                                    onPress={() => setManagerVisible(true)}
                                    disabled={busy}
                                />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            <SurahVersePickerModal
                visible={pickerVisible}
                selection={selection}
                onSelect={startSelection}
                onClose={() => setPickerVisible(false)}
            />
            <VerseModelManager
                visible={managerVisible}
                onClose={() => setManagerVisible(false)}
                support={support}
                selectedId={recognizer.selectedId}
                downloaded={recognizer.downloaded}
                onSelect={recognizer.selectModel}
                onChanged={recognizer.refreshDownloaded}
            />
        </SafeAreaView>
    );
};
