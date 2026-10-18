import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
    BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, ListChecks, PenLine, Plus, Repeat, RotateCcw, SkipForward, Target, Trash2, Undo2,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { DhikrForm } from '@/components/DhikrForm';
import { DhikrTargetPicker } from '@/components/DhikrTargetPicker';
import { LoadingView } from '@/components/LoadingView';
import { MenuListRow } from '@/components/MenuListRow';
import { ProgressBar } from '@/components/ProgressBar';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { DHIKR_PRESETS, DhikrStep, FREE_COUNTER_ID } from '@/data/dhikrPresets';
import {
    advance,
    clampProgress,
    CUSTOM_PREFIX,
    DhikrProgress,
    EMPTY_PROGRESS,
    EMPTY_STATE,
    getProgressFraction,
    loadState,
    resolvePreset,
    saveState,
    tap,
    undo,
    ZikirmatikState,
} from '@/services/zikirmatik';
import { createStyles } from './ZikirmatikScreen.styles';

interface ZikirmatikScreenProps {
    navigation: any;
}

const PRESET_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    [FREE_COUNTER_ID]: CircleDot,
    postPrayer: ListChecks,
    kucukTesbihat: BookOpen,
};

export const ZikirmatikScreen: React.FC<ZikirmatikScreenProps> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { goToSurahVerse } = useNavigationHelpers();

    const [state, setState] = useState<ZikirmatikState>(EMPTY_STATE);
    const [loaded, setLoaded] = useState(false);
    const [creating, setCreating] = useState(false);
    const [targetOpen, setTargetOpen] = useState(false);
    // Tapping can outrun re-rendering, so taps build on the latest state held here
    const stateRef = useRef(state);

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

    const renderRow = (id: string) => {
        const rowPreset = resolvePreset(id, state);
        if (!rowPreset) return null;
        const rowProgress = state.progress[id];
        const fraction = rowProgress ? getProgressFraction(rowPreset, rowProgress) : 0;
        const isCustom = id.startsWith(CUSTOM_PREFIX);
        const Icon = isCustom ? PenLine : PRESET_ICONS[id] ?? Repeat;
        const total = rowPreset.steps.length === 1 ? rowPreset.steps[0].count : undefined;
        const subtitle = isCustom
            ? t('zikirmatik.customDescription', { count: total })
            : t(`zikirmatik.presets.${id}.description`);
        const caption = rowProgress?.done
            ? t('zikirmatik.completed')
            : fraction > 0
                ? t('zikirmatik.inProgress', { percent: Math.floor(fraction * 100) })
                : undefined;
        return (
            <MenuListRow
                key={id}
                variant="card"
                icon={<Icon size={26} color={theme.primary} />}
                iconColor={theme.primary + '15'}
                title={getName(id)}
                subtitle={subtitle}
                caption={caption}
                onPress={() => open(id)}
            />
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
                    {renderRow(FREE_COUNTER_ID)}
                    <Text style={styles.sectionLabel}>{t('zikirmatik.sections.tesbihat')}</Text>
                    {DHIKR_PRESETS.filter(p => p.id === 'postPrayer' || p.id === 'kucukTesbihat').map(p => renderRow(p.id))}
                    <Text style={styles.sectionLabel}>{t('zikirmatik.sections.counts')}</Text>
                    {DHIKR_PRESETS.filter(p => p.adjustableTarget && p.id !== FREE_COUNTER_ID).map(p => renderRow(p.id))}
                    <Text style={styles.sectionLabel}>{t('zikirmatik.sections.custom')}</Text>
                    {state.custom.map(c => renderRow(CUSTOM_PREFIX + c.id))}
                    <AppButton
                        title={t('zikirmatik.newDhikr')}
                        icon={<Plus size={18} color={theme.primary} />}
                        variant="outline"
                        onPress={() => setCreating(true)}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }

    const isCustomActive = activeId.startsWith(CUSTOM_PREFIX);
    const multiStep = preset.steps.length > 1;
    const target = step.count ?? 0;
    const meaning = stepText(step.id, 'meaning');
    const note = stepText(step.id, 'note');
    const hasText = !!(step.arabic || step.transliteration || meaning || note || step.verse);
    const isLast = progress.step === preset.steps.length - 1;
    const overall = getProgressFraction(preset, progress) * 100;

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
                {multiStep && (
                    <View>
                        <View style={styles.stepRow}>
                            <Text style={common.smallText}>
                                {t('zikirmatik.step', { current: Math.min(progress.step + 1, preset.steps.length), total: preset.steps.length })}
                            </Text>
                            <Text style={common.smallText}>%{Math.floor(overall)}</Text>
                        </View>
                        <ProgressBar progress={overall} style={common.mtSm} />
                    </View>
                )}

                <ScrollView style={common.flex1} contentContainerStyle={styles.textScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.textCard}>
                        {step.arabic && <ArabicText style={styles.arabic}>{step.arabic}</ArabicText>}
                        {step.transliteration && <Text style={styles.transliteration}>{step.transliteration}</Text>}
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
                        {!hasText && <Text style={common.note}>{t('zikirmatik.noText')}</Text>}
                    </View>
                </ScrollView>

                <View style={styles.controls}>
                    {progress.done ? (
                        <View style={styles.doneCard}>
                            <CheckCircle2 size={40} color={theme.success} />
                            <Text style={styles.doneTitle}>{t('zikirmatik.doneTitle')}</Text>
                            <Text style={common.smallText}>
                                {multiStep ? t('zikirmatik.doneSequence') : t('zikirmatik.doneCount', { count: target })}
                            </Text>
                            <View style={styles.buttonRow}>
                                <AppButton
                                    title={t('zikirmatik.restart')}
                                    icon={<RotateCcw size={16} color="#FFFFFF" />}
                                    onPress={() => setProgress(activeId, EMPTY_PROGRESS)}
                                />
                                <AppButton title={t('zikirmatik.backToList')} variant="outline" onPress={closePreset} />
                            </View>
                        </View>
                    ) : target > 0 ? (
                        <>
                            {preset.adjustableTarget && (
                                <>
                                    <View style={styles.targetRow}>
                                        <AppButton
                                            title={t('zikirmatik.target', { count: target })}
                                            icon={<Target size={14} color={theme.primary} />}
                                            variant="ghost"
                                            size="small"
                                            onPress={() => setTargetOpen(open => !open)}
                                        />
                                    </View>
                                    {targetOpen && <DhikrTargetPicker value={target} onChange={handleTargetChange} />}
                                </>
                            )}
                            <TouchableOpacity
                                style={styles.tapButton}
                                onPress={handleTap}
                                activeOpacity={0.85}
                                accessibilityLabel={t('zikirmatik.tapToCount')}
                            >
                                <Text style={styles.tapCount}>{progress.count}</Text>
                                <Text style={styles.tapTarget}>/ {target}</Text>
                            </TouchableOpacity>
                            <ProgressBar progress={(progress.count / target) * 100} style={{ alignSelf: 'stretch' }} />
                            <View style={styles.buttonRow}>
                                <AppButton
                                    title={t('zikirmatik.undo')}
                                    icon={<Undo2 size={16} color={theme.primary} />}
                                    variant="outline"
                                    size="small"
                                    onPress={() => setProgress(activeId, undo(preset, progress))}
                                    disabled={progress.step === 0 && progress.count === 0}
                                />
                                <AppButton
                                    title={t('zikirmatik.reset')}
                                    icon={<RotateCcw size={16} color={theme.primary} />}
                                    variant="outline"
                                    size="small"
                                    onPress={() => setProgress(activeId, EMPTY_PROGRESS)}
                                    disabled={progress.step === 0 && progress.count === 0}
                                />
                                {multiStep && (
                                    <AppButton
                                        title={t('zikirmatik.skip')}
                                        icon={<SkipForward size={16} color={theme.primary} />}
                                        variant="ghost"
                                        size="small"
                                        onPress={() => setProgress(activeId, advance(preset, progress))}
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
                                onPress={() => setProgress(activeId, undo(preset, progress))}
                                disabled={progress.step === 0}
                            />
                            <AppButton
                                title={isLast ? t('zikirmatik.finish') : t('zikirmatik.next')}
                                icon={<ChevronRight size={18} color="#FFFFFF" />}
                                iconPosition="right"
                                onPress={() => setProgress(activeId, advance(preset, progress))}
                            />
                        </View>
                    )}
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
