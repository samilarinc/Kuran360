import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform, Animated, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
    BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, Plus, RotateCcw, Target, Trash2, Undo2,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { DhikrForm } from '@/components/DhikrForm';
import { DhikrAudioBar } from '@/components/DhikrAudioBar';
import { DhikrTargetPicker } from '@/components/DhikrTargetPicker';
import { LoadingView } from '@/components/LoadingView';
import { ProgressRing } from '@/components/ProgressRing';
import { SearchFilterPill } from '@/components/SearchFilterPill';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { DHIKR_AUDIO } from '@/data/dhikrAudio';
import { DHIKR_PRESETS, DhikrStep, FREE_COUNTER_ID } from '@/data/dhikrPresets';
import { useDhikrAudio } from '@/hooks/useDhikrAudio';
import {
    advance,
    clampProgress,
    CUSTOM_PREFIX,
    DhikrProgress,
    EMPTY_PROGRESS,
    EMPTY_STATE,
    getProgressFraction,
    loadState,
    previous,
    reset,
    progressAtTime,
    resolvePreset,
    saveState,
    tap,
    timeAtProgress,
    undo,
    ZikirmatikState,
} from '@/services/zikirmatik';
import { createStyles, RING_STROKE, TAP_RING } from './ZikirmatikScreen.styles';

interface ZikirmatikScreenProps {
    navigation: any;
}

export const ZikirmatikScreen: React.FC<ZikirmatikScreenProps> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { goToSurahVerse } = useNavigationHelpers();
    const verseAudio = useGlobalAudio();

    const [state, setState] = useState<ZikirmatikState>(EMPTY_STATE);
    const [loaded, setLoaded] = useState(false);
    const [creating, setCreating] = useState(false);
    const [targetOpen, setTargetOpen] = useState(false);
    // Tapping can outrun re-rendering, so taps build on the latest state held here
    const stateRef = useRef(state);
    // The counter bead sinks a little while pressed
    const pressScale = useRef(new Animated.Value(1)).current;
    const pressTo = (toValue: number) =>
        Animated.spring(pressScale, { toValue, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 6 }).start();

    useEffect(() => {
        loadState().then(saved => {
            stateRef.current = saved;
            setState(saved);
            setLoaded(true);
        });
    }, []);

    const commit = useCallback((next: ZikirmatikState) => {
        stateRef.current = next;
        setState(next);
        saveState(next);
    }, []);

    const activeId = state.activeId;
    const preset = useMemo(() => (activeId ? resolvePreset(activeId, state) : null), [activeId, state]);
    const progress: DhikrProgress = (activeId && state.progress[activeId]) || EMPTY_PROGRESS;
    const step: DhikrStep | undefined = preset?.steps[progress.step];

    const setProgress = (id: string, next: DhikrProgress) => {
        const current = stateRef.current;
        commit({ ...current, progress: { ...current.progress, [id]: next } });
    };

    const audio = activeId ? DHIKR_AUDIO[activeId] : undefined;
    // Where the recording last moved the counter, so it only writes when it moves on
    const followedRef = useRef<DhikrProgress | null>(null);

    const followAudio = (seconds: number) => {
        if (!preset || !activeId || !audio) return;
        const next = progressAtTime(preset, audio, seconds);
        const last = followedRef.current;
        if (last && last.step === next.step && last.count === next.count) return;
        followedRef.current = next;
        if (last && next.count > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        setProgress(activeId, next);
    };

    const finishWithAudio = () => {
        if (!preset || !activeId) return;
        const lastStep = preset.steps.length - 1;
        setProgress(activeId, { step: lastStep, count: preset.steps[lastStep].count ?? 0, done: true });
    };

    const player = useDhikrAudio(audio?.url ?? null, state.audioRate, followAudio, finishWithAudio);

    const toggleAudio = () => {
        if (!preset || !audio) return;
        if (player.state.isPlaying) {
            player.pause();
            return;
        }
        if (verseAudio.audioState.isPlaying) verseAudio.pause();
        // Resume where it paused if the counter is still there; otherwise start from where the counter is
        const atPause = player.state.duration > 0 ? progressAtTime(preset, audio, player.state.position) : null;
        const inSync = atPause && atPause.step === progress.step && atPause.count === progress.count;
        followedRef.current = null;
        player.play(inSync ? undefined : (progress.done ? 0 : timeAtProgress(preset, audio, progress) ?? 0));
    };

    /** Sets progress from a button (previous, next, reset...), taking the recording along to that step. */
    const moveTo = (next: DhikrProgress) => {
        if (!preset || !activeId) return;
        setProgress(activeId, next);
        const at = audio && !next.done ? timeAtProgress(preset, audio, next) : null;
        if (at !== null && player.state.duration > 0) {
            followedRef.current = next;
            player.seek(at);
        }
    };

    const open = (id: string) => {
        setTargetOpen(false);
        commit({ ...stateRef.current, activeId: id });
    };

    const closePreset = () => {
        setTargetOpen(false);
        commit({ ...stateRef.current, activeId: null });
    };

    const handleBack = () => {
        if (creating) setCreating(false);
        else if (activeId) closePreset();
        else navigation.goBack();
    };

    const getName = (id: string) => {
        const custom = id.startsWith(CUSTOM_PREFIX) ? state.custom.find(c => CUSTOM_PREFIX + c.id === id) : null;
        return custom ? custom.text : t(`zikirmatik.presets.${id}.name`);
    };

    /** A translated text for a step, or '' when there is none for it. */
    const stepText = (id: string, part: 'meaning' | 'note') => {
        const key = `zikirmatik.texts.${id}.${part}`;
        return i18n.exists(key) ? t(key) : '';
    };

    const handleTap = () => {
        if (!preset || !activeId) return;
        const result = tap(preset, progress);
        if (result.reachedTarget) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        setProgress(activeId, result.progress);
    };

    const handleTargetChange = (target: number) => {
        if (!activeId) return;
        const current = stateRef.current;
        const next = { ...current, targets: { ...current.targets, [activeId]: target } };
        const resized = resolvePreset(activeId, next);
        commit({
            ...next,
            progress: resized
                ? { ...next.progress, [activeId]: clampProgress(resized, current.progress[activeId] ?? EMPTY_PROGRESS) }
                : next.progress,
        });
    };

    const handleSaveCustom = ({ text, target }: { text: string; target: number }) => {
        const current = stateRef.current;
        const id = Date.now().toString(36);
        setCreating(false);
        commit({ ...current, custom: [...current.custom, { id, text, target }], activeId: CUSTOM_PREFIX + id });
    };

    const deleteCustom = () => {
        if (!activeId) return;
        const remove = () => {
            const current = stateRef.current;
            const { [activeId]: _progress, ...progressRest } = current.progress;
            const { [activeId]: _target, ...targetsRest } = current.targets;
            commit({
                ...current,
                activeId: null,
                custom: current.custom.filter(c => CUSTOM_PREFIX + c.id !== activeId),
                progress: progressRest,
                targets: targetsRest,
            });
        };
        if (Platform.OS === 'web') {
            if ((globalThis as any).confirm?.(t('zikirmatik.deleteConfirm'))) remove();
            return;
        }
        Alert.alert(t('zikirmatik.deleteTitle'), t('zikirmatik.deleteConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: remove },
        ]);
    };

    /** Right side of a list row: done, how far along, or the target count. */
    const renderRowStatus = (id: string) => {
        const rowPreset = resolvePreset(id, state);
        if (!rowPreset) return null;
        const rowProgress = state.progress[id];
        if (rowProgress?.done) return <CheckCircle2 size={22} color={theme.success} />;
        const fraction = rowProgress ? getProgressFraction(rowPreset, rowProgress) : 0;
        if (fraction > 0) {
            return (
                <ProgressRing progress={fraction * 100} size={34} strokeWidth={3}>
                    <Text style={styles.rowPercent}>{Math.floor(fraction * 100)}</Text>
                </ProgressRing>
            );
        }
        const total = rowPreset.steps.length === 1 ? rowPreset.steps[0].count : undefined;
        return total
            ? <Text style={styles.rowCount}>{total}</Text>
            : <ChevronRight size={20} color={theme.textSecondary} />;
    };

    const rowStatusLabel = (id: string) => {
        const rowPreset = resolvePreset(id, state);
        const rowProgress = state.progress[id];
        if (!rowPreset || !rowProgress) return '';
        if (rowProgress.done) return t('zikirmatik.completed');
        const percent = Math.floor(getProgressFraction(rowPreset, rowProgress) * 100);
        return percent > 0 ? t('zikirmatik.inProgress', { percent }) : '';
    };

    const renderGroup = (ids: string[], footer?: React.ReactNode) => (
        <View style={styles.group}>
            {ids.map((id, index) => {
                const isCustom = id.startsWith(CUSTOM_PREFIX);
                const subtitle = isCustom ? t('zikirmatik.customDescription') : t(`zikirmatik.presets.${id}.description`);
                return (
                    <React.Fragment key={id}>
                        {index > 0 && <View style={styles.rowDivider} />}
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => open(id)}
                            activeOpacity={0.6}
                            accessibilityRole="button"
                            accessibilityLabel={[getName(id), subtitle, rowStatusLabel(id)].filter(Boolean).join(', ')}
                        >
                            <View style={styles.rowText}>
                                <Text style={styles.rowTitle} numberOfLines={2}>{getName(id)}</Text>
                                <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>
                            </View>
                            {renderRowStatus(id)}
                        </TouchableOpacity>
                    </React.Fragment>
                );
            })}
            {footer && (
                <>
                    {ids.length > 0 && <View style={styles.rowDivider} />}
                    {footer}
                </>
            )}
        </View>
    );

    const renderFeatured = () => {
        const freeProgress = state.progress[FREE_COUNTER_ID];
        const freePreset = resolvePreset(FREE_COUNTER_ID, state);
        const freeTarget = freePreset?.steps[0].count ?? 0;
        return (
            <TouchableOpacity
                style={styles.featured}
                onPress={() => open(FREE_COUNTER_ID)}
                activeOpacity={0.8}
                accessibilityRole="button"
            >
                <View style={styles.featuredIcon}>
                    <CircleDot size={24} color={theme.featuredIcon} />
                </View>
                <View style={styles.featuredText}>
                    <Text style={styles.featuredTitle}>{getName(FREE_COUNTER_ID)}</Text>
                    <Text style={styles.featuredSubtitle}>{t(`zikirmatik.presets.${FREE_COUNTER_ID}.description`)}</Text>
                </View>
                {freeProgress && freeProgress.count > 0 && !freeProgress.done ? (
                    <Text style={styles.featuredCount}>{freeProgress.count} / {freeTarget}</Text>
                ) : (
                    <ChevronRight size={22} color={theme.featuredMuted} />
                )}
            </TouchableOpacity>
        );
    };

    if (!loaded) {
        return (
            <SafeAreaView style={common.container}>
                <AppHeader title={t('zikirmatik.title')} showBackButton onBackPress={() => navigation.goBack()} />
                <LoadingView />
            </SafeAreaView>
        );
    }

    if (creating) {
        return (
            <SafeAreaView style={common.container}>
                <AppHeader title={t('zikirmatik.form.title')} showBackButton onBackPress={handleBack} />
                <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                    <DhikrForm onSave={handleSaveCustom} onCancel={() => setCreating(false)} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!preset || !activeId || !step) {
        return (
            <SafeAreaView style={common.container}>
                <AppHeader
                    title={t('zikirmatik.title')}
                    showBackButton
                    onBackPress={handleBack}
                    showHomeButton
                    onHomePress={() => navigation.navigate('Main')}
                />
                <ScrollView contentContainerStyle={styles.listContent}>
                    {renderFeatured()}
                    <Text style={styles.sectionTitle} accessibilityRole="header">{t('zikirmatik.sections.tesbihat')}</Text>
                    {renderGroup(DHIKR_PRESETS.filter(p => p.id === 'postPrayer' || p.id === 'kucukTesbihat').map(p => p.id))}
                    <Text style={styles.sectionTitle} accessibilityRole="header">{t('zikirmatik.sections.counts')}</Text>
                    {renderGroup(DHIKR_PRESETS.filter(p => p.adjustableTarget && p.id !== FREE_COUNTER_ID).map(p => p.id))}
                    <Text style={styles.sectionTitle} accessibilityRole="header">{t('zikirmatik.sections.custom')}</Text>
                    {renderGroup(
                        state.custom.map(c => CUSTOM_PREFIX + c.id),
                        <TouchableOpacity style={styles.row} onPress={() => setCreating(true)} activeOpacity={0.6} accessibilityRole="button">
                            <Plus size={20} color={theme.primary} />
                            <Text style={[styles.addRowTitle, common.flex1]}>{t('zikirmatik.newDhikr')}</Text>
                        </TouchableOpacity>,
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    const isCustomActive = activeId.startsWith(CUSTOM_PREFIX);
    const multiStep = preset.steps.length > 1;
    const target = step.count ?? 0;
    const meaning = stepText(step.id, 'meaning');
    const note = stepText(step.id, 'note');
    const shown = step.last && target > 0 && progress.count === target - 1 ? { ...step, ...step.last } : step;
    // One script at a time, falling back to the other when a step is written only in that
    const showArabic = !!shown.arabic && (state.textMode === 'arabic' || !shown.transliteration);
    const transliteration = showArabic ? undefined : shown.transliteration;
    const hasText = !!(shown.arabic || shown.transliteration || meaning || note || step.verse);
    const hasBothScripts = preset.steps.some(s => s.arabic && s.transliteration);
    const isLast = progress.step === preset.steps.length - 1;
    const atStart = progress.step === 0 && progress.count === 0;
    // The recording covers part of the preset: its player shows on those steps, a note before them
    const firstRecordedStep = audio ? preset.steps.findIndex(s => audio.timeline[s.id]) : -1;
    const showPlayer = !!audio && !progress.done && !!audio.timeline[step.id];
    const beforeRecording = !!audio && !progress.done && progress.step < firstRecordedStep;
    // While the recording plays it drives the counter; pausing hands it back
    const locked = player.state.isPlaying;
    const overall = getProgressFraction(preset, progress) * 100;

    const stepTotal = preset.steps.length;
    const stepNumber = Math.min(progress.step + 1, stepTotal);
    // Previous/next flank the counter on multi-step presets
    const sideButton = (direction: 'previous' | 'next') => {
        if (!multiStep) return null;
        const isPrevious = direction === 'previous';
        const disabled = locked || (isPrevious && progress.step === 0);
        const Icon = isPrevious ? ChevronLeft : ChevronRight;
        return (
            <TouchableOpacity
                style={[styles.sideButton, disabled && common.disabled]}
                onPress={() => moveTo(isPrevious ? previous(progress) : advance(preset, progress))}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={t(`zikirmatik.${direction}`)}
            >
                <Icon size={22} color={theme.primary} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={getName(activeId)}
                showBackButton
                onBackPress={handleBack}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />
            <View style={styles.counterContainer}>
                {(multiStep || hasBothScripts) && (
                    <View style={styles.topRow}>
                        {multiStep && (
                            <Text style={styles.stepCaption}>
                                {t('zikirmatik.step', { current: stepNumber, total: stepTotal })}
                            </Text>
                        )}
                        {hasBothScripts && (
                            <View style={styles.textModeRow}>
                                {(['arabic', 'transliteration'] as const).map(mode => (
                                    <SearchFilterPill
                                        key={mode}
                                        label={t(`zikirmatik.textMode.${mode}`)}
                                        selected={state.textMode === mode}
                                        onPress={() => commit({ ...stateRef.current, textMode: mode })}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )}
                {multiStep && (
                    <View
                        style={styles.segments}
                        accessibilityRole="progressbar"
                        accessibilityValue={{ min: 0, max: 100, now: Math.floor(overall) }}
                    >
                        {preset.steps.map((s, index) => (
                            <View
                                key={s.id + index}
                                style={[
                                    styles.segment,
                                    (progress.done || index < progress.step) && styles.segmentDone,
                                    !progress.done && index === progress.step && styles.segmentCurrent,
                                ]}
                            />
                        ))}
                    </View>
                )}
                {showPlayer && (
                    <DhikrAudioBar
                        title={t('zikirmatik.audio.title', { reciter: audio.reciter })}
                        hint={t('zikirmatik.audio.hint')}
                        state={player.state}
                        rate={state.audioRate}
                        onToggle={toggleAudio}
                        onSeek={player.seek}
                        onRateChange={audioRate => commit({ ...stateRef.current, audioRate })}
                    />
                )}
                {beforeRecording && (
                    <Text style={common.smallText}>
                        {t('zikirmatik.audio.startsAt', { reciter: audio.reciter, step: firstRecordedStep + 1 })}
                    </Text>
                )}

                {progress.done ? (
                    <View style={[common.flex1, styles.textScroll]}>
                        <CheckCircle2 size={44} color={theme.accent} />
                        <Text style={styles.doneTitle}>{t('zikirmatik.doneTitle')}</Text>
                        <Text style={styles.doneText}>
                            {multiStep ? t('zikirmatik.doneSequence') : t('zikirmatik.doneCount', { count: target })}
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={common.flex1} contentContainerStyle={styles.textScroll} showsVerticalScrollIndicator={false}>
                        {showArabic && <ArabicText style={styles.arabic}>{shown.arabic}</ArabicText>}
                        {transliteration && <Text style={styles.transliteration}>{transliteration}</Text>}
                        {meaning ? <Text style={styles.meaning}>{meaning}</Text> : null}
                        {note ? <Text style={styles.note}>{note}</Text> : null}
                        {step.verse && (
                            <AppButton
                                title={t('zikirmatik.openVerse')}
                                icon={<BookOpen size={16} color={theme.primary} />}
                                variant="outline"
                                size="small"
                                onPress={() => goToSurahVerse(step.verse!.surah, step.verse!.verseIndex)}
                            />
                        )}
                        {!hasText && <Text style={styles.placeholder}>{t('zikirmatik.noText')}</Text>}
                    </ScrollView>
                )}

                <View style={styles.controls}>
                    {progress.done ? (
                        <View style={styles.buttonRow}>
                            <AppButton
                                title={t('zikirmatik.restart')}
                                icon={<RotateCcw size={16} color="#FFFFFF" />}
                                onPress={() => moveTo(EMPTY_PROGRESS)}
                            />
                            <AppButton title={t('zikirmatik.backToList')} variant="outline" onPress={closePreset} />
                        </View>
                    ) : target > 0 ? (
                        <>
                            <View style={styles.tapRow}>
                                {sideButton('previous') ?? <View style={styles.sideButtonPlaceholder} />}
                                <ProgressRing
                                    progress={(progress.count / target) * 100}
                                    size={TAP_RING}
                                    strokeWidth={RING_STROKE}
                                >
                                    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
                                        <Pressable
                                            style={[styles.tapButton, locked && common.disabled]}
                                            onPress={handleTap}
                                            onPressIn={() => pressTo(0.95)}
                                            onPressOut={() => pressTo(1)}
                                            disabled={locked}
                                            accessibilityRole="button"
                                            accessibilityLabel={t('zikirmatik.tapToCount')}
                                            accessibilityValue={{ text: `${progress.count} / ${target}` }}
                                        >
                                            <Text style={styles.tapCount}>{progress.count}</Text>
                                            <Text style={styles.tapTarget}>/ {target}</Text>
                                        </Pressable>
                                    </Animated.View>
                                </ProgressRing>
                                {sideButton('next') ?? <View style={styles.sideButtonPlaceholder} />}
                            </View>
                            {preset.adjustableTarget && targetOpen && (
                                <DhikrTargetPicker value={target} onChange={handleTargetChange} />
                            )}
                            <View style={styles.actionRow}>
                                <AppButton
                                    title={t('zikirmatik.undo')}
                                    icon={<Undo2 size={16} color={theme.primary} />}
                                    variant="ghost"
                                    size="small"
                                    onPress={() => setProgress(activeId, undo(preset, progress))}
                                    disabled={locked || progress.count === 0}
                                />
                                <AppButton
                                    title={t('zikirmatik.reset')}
                                    icon={<RotateCcw size={16} color={theme.primary} />}
                                    variant="ghost"
                                    size="small"
                                    onPress={() => moveTo(reset(progress))}
                                    disabled={locked || atStart}
                                />
                                {preset.adjustableTarget && (
                                    <AppButton
                                        title={t('zikirmatik.target', { count: target })}
                                        icon={<Target size={16} color={theme.primary} />}
                                        variant="ghost"
                                        size="small"
                                        onPress={() => setTargetOpen(open => !open)}
                                    />
                                )}
                            </View>
                        </>
                    ) : (
                        <View style={styles.buttonRow}>
                            <AppButton
                                title={t('zikirmatik.previous')}
                                icon={<ChevronLeft size={18} color={theme.primary} />}
                                variant="outline"
                                onPress={() => moveTo(previous(progress))}
                                disabled={locked || progress.step === 0}
                                style={common.flex1}
                            />
                            <AppButton
                                title={isLast ? t('zikirmatik.finish') : t('zikirmatik.next')}
                                icon={<ChevronRight size={18} color="#FFFFFF" />}
                                iconPosition="right"
                                onPress={() => moveTo(advance(preset, progress))}
                                disabled={locked}
                                style={common.flex1}
                            />
                        </View>
                    )}
                    {locked && <Text style={styles.lockedText}>{t('zikirmatik.audio.locked')}</Text>}
                    {isCustomActive && (
                        <AppButton
                            title={t('zikirmatik.deleteDhikr')}
                            icon={<Trash2 size={14} color={theme.error} />}
                            variant="ghost"
                            size="small"
                            textStyle={{ color: theme.error }}
                            onPress={deleteCustom}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};
