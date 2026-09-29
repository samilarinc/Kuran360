import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Play, RotateCcw, Boxes, TriangleAlert, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { DownloadRequired } from '@/components/DownloadRequired';
import { ProgressBar } from '@/components/ProgressBar';
import { SurahVersePickerModal } from '@/components/SurahVersePickerModal';
import { VerseModelManager } from '@/components/VerseModelManager';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useDownloadData } from '@/hooks/useDownloadData';
import { useSpeechRecognizer } from '@/hooks/useSpeechRecognizer';
import { getSurahsList, loadSurah } from '@/data/quranData';
import { getSurahName } from '@/utils/surahName';
import { getWordSegments } from '@/utils/arabicText';
import { checkRecitation, RecitationResult, WordStatus } from '@/utils/recitationCheck';
import { toSkeleton } from '@/utils/verseMatcher';
import { MAX_RECORDING_SECONDS } from '@/services/verseFinder';
import { createStyles as createFinderStyles } from './VerseFinderScreen.styles';
import { createStyles } from './MemorizationScreen.styles';

interface MemorizationScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

export const MemorizationScreen: React.FC<MemorizationScreenProps> = ({ navigation, isDataAvailable }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    // The microphone button and its hint are shared with the verse finder
    const micStyles = useThemedStyles(createFinderStyles);
    const download = useDownloadData({ isDataAvailable, navigation });
    const surahs = getSurahsList();

    const [surahNumber, setSurahNumber] = useState(1);
    const [verseNumber, setVerseNumber] = useState(1);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [words, setWords] = useState<string[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [result, setResult] = useState<RecitationResult | null>(null);
    const [transcript, setTranscript] = useState('');
    const [managerVisible, setManagerVisible] = useState(false);
    const wordsRef = useRef(words);
    wordsRef.current = words;

    const handleTranscript = useCallback((text: string) => {
        // Nothing usable was heard (silence, noise): there's nothing to mark
        if (toSkeleton(text).length === 0) {
            setTranscript('');
            setResult(null);
            return;
        }
        setTranscript(text);
        setResult(checkRecitation(wordsRef.current, text));
    }, []);

    const recognizer = useSpeechRecognizer(handleTranscript);
    const { support, activeModel, modelState, phase, elapsed, error, lastAudio, playing, canRecord, busy } = recognizer;

    useEffect(() => {
        if (!isDataAvailable) return;
        let cancelled = false;
        loadSurah(surahNumber).then(surah => {
            if (cancelled || !surah) return;
            const verse = surah.verses[verseNumber - 1];
            setWords(verse ? getWordSegments(verse).map(segment => segment.arabic) : []);
        });
        return () => { cancelled = true; };
    }, [isDataAvailable, surahNumber, verseNumber]);

    /** Moves to another verse and forgets the previous attempt. */
    const goToVerse = (surah: number, verse: number) => {
        setSurahNumber(surah);
        setVerseNumber(verse);
        setRevealed(false);
        setResult(null);
        setTranscript('');
        recognizer.reset();
    };

    const handleRetry = () => {
        setResult(null);
        setTranscript('');
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

    const currentSurah = surahs.find(s => s.number === surahNumber);
    const verseCount = currentSurah?.verseCount ?? 0;
    const count = (status: WordStatus) => result?.words.filter(w => w.status === status).length ?? 0;
    const wordStyles = { ok: styles.wordOk, wrong: styles.wordWrong, missed: styles.wordMissed };
    const legend: { status: WordStatus; color: string }[] = [
        { status: 'ok', color: theme.success },
        { status: 'wrong', color: theme.error },
        { status: 'missed', color: theme.error + '55' },
    ];

    const micHint = !activeModel
        ? t('verseFinder.noModel')
        : phase === 'recording'
            ? t('verseFinder.listening', { seconds: elapsed, max: MAX_RECORDING_SECONDS })
            : phase === 'recognizing'
                ? modelState.status === 'loading' ? t('verseFinder.loadingModel') : t('memorization.checking')
                : t('memorization.tapToStart');

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

                <View style={[common.sectionCard, styles.selectionCard]}>
                    <AppButton
                        icon={<ChevronLeft size={20} color={theme.primary} />}
                        variant="outline"
                        shape="circle"
                        size="small"
                        onPress={() => goToVerse(surahNumber, verseNumber - 1)}
                        disabled={busy || verseNumber <= 1}
                    />
                    <TouchableOpacity style={styles.selectionCenter} onPress={() => setPickerVisible(true)} disabled={busy} activeOpacity={0.7}>
                        <Text style={common.title}>{currentSurah ? `${currentSurah.number}. ${getSurahName(t, currentSurah)}` : ''}</Text>
                        <Text style={common.subtitle}>{t('memorization.verseOf', { verse: verseNumber, count: verseCount })}</Text>
                        <Text style={common.textAccent}>{t('memorization.change')}</Text>
                    </TouchableOpacity>
                    <AppButton
                        icon={<ChevronRight size={20} color={theme.primary} />}
                        variant="outline"
                        shape="circle"
                        size="small"
                        onPress={() => goToVerse(surahNumber, verseNumber + 1)}
                        disabled={busy || verseNumber >= verseCount}
                    />
                </View>

                <View style={common.sectionCard}>
                    {!result && (
                        <AppButton
                            title={t(revealed ? 'memorization.hideVerse' : 'memorization.showVerse')}
                            icon={revealed ? <EyeOff size={16} color={theme.primary} /> : <Eye size={16} color={theme.primary} />}
                            variant="ghost"
                            size="small"
                            style={styles.revealButton}
                            onPress={() => setRevealed(shown => !shown)}
                        />
                    )}
                    {result ? (
                        <>
                            <ArabicText style={styles.verseArabic}>
                                {result.words.map((word, i) => (
                                    <Text key={i} style={wordStyles[word.status]}>{word.text}{' '}</Text>
                                ))}
                            </ArabicText>
                            <View style={styles.legendRow}>
                                {legend.map(({ status, color }) => (
                                    <View key={status} style={styles.legendItem}>
                                        <View style={[styles.legendSwatch, { backgroundColor: color }]} />
                                        <Text style={common.smallText}>{t(`memorization.legend.${status}`, { count: count(status) })}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    ) : revealed ? (
                        <ArabicText style={styles.verseArabic}>{words.join(' ')}</ArabicText>
                    ) : (
                        <Text style={styles.hiddenVerse}>{t('memorization.hiddenVerse')}</Text>
                    )}
                </View>

                {result && (
                    <View style={common.sectionCard}>
                        <View style={common.rowBetween}>
                            <Text style={common.title}>{t('memorization.accuracy', { percent: Math.round(result.accuracy * 100) })}</Text>
                        </View>
                        <Text style={[common.text, common.mtSm]}>
                            {count('wrong') + count('missed') === 0
                                ? t('memorization.allCorrect')
                                : t('memorization.summary', { wrong: count('wrong'), missed: count('missed') })}
                        </Text>
                        <Text style={[common.sectionLabel, common.mtMd, common.mbXs]}>{t('verseFinder.heard')}</Text>
                        <ArabicText style={styles.transcript}>{transcript}</ArabicText>
                    </View>
                )}

                {phase === 'done' && !error && !result && (
                    <Text style={[common.note, common.textCenter]}>{t('memorization.nothingHeard')}</Text>
                )}
                {error && <Text style={[common.note, common.textCenter]}>{error}</Text>}
                {modelState.status === 'error' && <Text style={[common.smallText, common.textCenter]}>{modelState.message}</Text>}

                <View style={micStyles.micArea}>
                    <TouchableOpacity
                        style={[micStyles.micButton, phase === 'recording' && micStyles.micButtonRecording, (!canRecord || phase === 'recognizing') && common.disabled]}
                        onPress={recognizer.toggleRecording}
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
                        {phase === 'done' && (
                            <AppButton
                                title={t('memorization.retry')}
                                icon={<RotateCcw size={16} color={theme.primary} />}
                                variant="outline"
                                size="small"
                                onPress={handleRetry}
                            />
                        )}
                        {result && verseNumber < verseCount && (
                            <AppButton
                                title={t('memorization.nextVerse')}
                                icon={<ChevronRight size={16} color="#FFFFFF" />}
                                iconPosition="right"
                                size="small"
                                onPress={() => goToVerse(surahNumber, verseNumber + 1)}
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
            </ScrollView>

            <SurahVersePickerModal
                visible={pickerVisible}
                surahNumber={surahNumber}
                verseNumber={verseNumber}
                onSelect={goToVerse}
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
