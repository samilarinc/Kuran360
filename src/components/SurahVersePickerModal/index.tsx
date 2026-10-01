import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, TextInput, StyleSheet } from 'react-native';
import { Minus, Plus, Play } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { getSurahsList } from '@/data/quranData';
import { getSurahName } from '@/utils/surahName';
import { useTheme, useThemedStyles, Theme, CommonStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADIUS, SPACING } from '@/theme';

/** One verse, a run of verses, or the whole surah, read in order. */
export type MemorizationScope = 'single' | 'range' | 'surah';

export interface MemorizationSelection {
    surahNumber: number;
    scope: MemorizationScope;
    fromVerse: number;
    /** Equal to fromVerse for a single verse. */
    toVerse: number;
}

interface SurahVersePickerModalProps {
    visible: boolean;
    selection: MemorizationSelection;
    onSelect: (selection: MemorizationSelection) => void;
    onClose: () => void;
}

const ROW_HEIGHT = 60;
const BADGE_SIZE = 36;
const STEP_BUTTON_SIZE = 36;
const SCOPES: MemorizationScope[] = ['single', 'range', 'surah'];
/** A new range starts this long, so it can be tightened instead of built up verse by verse. */
const DEFAULT_RANGE = 5;

/** Keeps a selection valid for its surah: verses inside the surah, from ≤ to, a whole surah spanning it all. */
const normalize = (selection: MemorizationSelection, verseCount: number): MemorizationSelection => {
    const clamp = (verse: number) => Math.max(1, Math.min(verseCount, verse));
    const fromVerse = clamp(selection.fromVerse);
    switch (selection.scope) {
        case 'single':
            return { ...selection, fromVerse, toVerse: fromVerse };
        case 'surah':
            return { ...selection, fromVerse: 1, toVerse: verseCount };
        case 'range':
            return { ...selection, fromVerse, toVerse: Math.max(fromVerse, clamp(selection.toVerse)) };
    }
};

interface VerseStepperProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

/** A verse number with −/+ buttons; it can also be typed, and is clamped when typing ends. */
const VerseStepper: React.FC<VerseStepperProps> = ({ label, value, min, max, onChange }) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const [draft, setDraft] = useState(String(value));

    useEffect(() => setDraft(String(value)), [value]);

    const commit = () => {
        const typed = parseInt(draft, 10);
        const next = Number.isNaN(typed) ? value : Math.max(min, Math.min(max, typed));
        setDraft(String(next));
        if (next !== value) onChange(next);
    };

    return (
        <View style={styles.stepper}>
            <Text style={common.sectionLabel}>{label}</Text>
            <View style={styles.stepperRow}>
                <TouchableOpacity
                    style={[styles.stepButton, value <= min && common.disabled]}
                    onPress={() => onChange(value - 1)}
                    disabled={value <= min}
                    accessibilityLabel="-"
                >
                    <Minus size={18} color={theme.primary} />
                </TouchableOpacity>
                <TextInput
                    style={styles.stepInput}
                    value={draft}
                    onChangeText={text => setDraft(text.replace(/[^0-9]/g, ''))}
                    onBlur={commit}
                    onSubmitEditing={commit}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    maxLength={3}
                />
                <TouchableOpacity
                    style={[styles.stepButton, value >= max && common.disabled]}
                    onPress={() => onChange(value + 1)}
                    disabled={value >= max}
                    accessibilityLabel="+"
                >
                    <Plus size={18} color={theme.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

/**
 * Picks what to recite in one screen: a searchable surah list, and below it the scope
 * (one verse, a range, the whole surah) with the verse numbers to start from.
 */
export const SurahVersePickerModal: React.FC<SurahVersePickerModalProps> = ({ visible, selection, onSelect, onClose }) => {
    const { t } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const surahs = getSurahsList();
    const [draft, setDraft] = useState(selection);
    const [search, setSearch] = useState('');
    const listRef = useRef<ScrollView>(null);

    // Every opening starts from the current selection, scrolled to its surah
    useEffect(() => {
        if (!visible) return;
        setDraft(selection);
        setSearch('');
        const index = surahs.findIndex(s => s.number === selection.surahNumber);
        setTimeout(() => listRef.current?.scrollTo({ y: Math.max(0, index - 1) * ROW_HEIGHT, animated: false }), 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const surah = surahs.find(s => s.number === draft.surahNumber);
    const verseCount = surah?.verseCount ?? 1;
    const update = (changes: Partial<MemorizationSelection>, count = verseCount) => setDraft(current => normalize({ ...current, ...changes }, count));

    const pickSurah = (number: number) => {
        const count = surahs.find(s => s.number === number)?.verseCount ?? 1;
        update({ surahNumber: number, fromVerse: 1, toVerse: DEFAULT_RANGE }, count);
    };

    const pickScope = (scope: MemorizationScope) => {
        // Widening a single verse into a range keeps where it starts
        update(scope === 'range' && draft.scope !== 'range'
            ? { scope, toVerse: draft.fromVerse + DEFAULT_RANGE - 1 }
            : { scope });
    };

    const query = search.trim().toLocaleLowerCase('tr');
    const filtered = surahs.filter(s => !query || String(s.number).startsWith(query) || getSurahName(t, s).toLocaleLowerCase('tr').includes(query));
    const count = draft.toVerse - draft.fromVerse + 1;

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={common.pickerOverlay}>
                <SafeAreaView style={[common.modalContainerCentered, styles.container]}>
                    <View style={common.pickerHeader}>
                        <Text style={common.pickerHeaderTitle}>{t('memorization.picker.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={common.pickerSearchContainer}>
                        <View style={common.pickerSearchInputContainer}>
                            <TextInput
                                style={common.pickerSearchInput}
                                value={search}
                                onChangeText={setSearch}
                                placeholder={t('memorization.picker.searchPlaceholder')}
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {search ? (
                                <TouchableOpacity onPress={() => setSearch('')} style={common.pickerClearButton}>
                                    <Text style={common.smallText}>✕</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    <ScrollView ref={listRef} style={common.pickerList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {filtered.map(s => {
                            const selected = s.number === draft.surahNumber;
                            return (
                                <TouchableOpacity
                                    key={s.number}
                                    style={[styles.surahRow, selected && common.pickerOptionSelected]}
                                    onPress={() => pickSurah(s.number)}
                                >
                                    <View style={[styles.badge, selected && common.selected]}>
                                        <Text style={[styles.badgeText, selected && common.buttonTextPrimary]}>{s.number}</Text>
                                    </View>
                                    <View style={common.flex1}>
                                        <Text style={common.textStrong}>{getSurahName(t, s)}</Text>
                                        <Text style={common.smallText}>{t('memorization.picker.verseCount', { count: s.verseCount })}</Text>
                                    </View>
                                    <Text style={styles.arabicName}>{s.arabicName}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.panel}>
                        <View style={styles.segments}>
                            {SCOPES.map(scope => (
                                <TouchableOpacity
                                    key={scope}
                                    style={[styles.segment, draft.scope === scope && styles.segmentSelected]}
                                    onPress={() => pickScope(scope)}
                                >
                                    <Text style={[styles.segmentText, draft.scope === scope && styles.segmentTextSelected]}>
                                        {t(`memorization.scope.${scope}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {draft.scope === 'single' && (
                            <VerseStepper label={t('memorization.picker.verse')} value={draft.fromVerse} min={1} max={verseCount} onChange={v => update({ fromVerse: v })} />
                        )}
                        {draft.scope === 'range' && (
                            <View style={styles.stepperPair}>
                                <VerseStepper label={t('memorization.picker.from')} value={draft.fromVerse} min={1} max={verseCount} onChange={v => update({ fromVerse: v })} />
                                <VerseStepper label={t('memorization.picker.to')} value={draft.toVerse} min={draft.fromVerse} max={verseCount} onChange={v => update({ toVerse: v })} />
                            </View>
                        )}

                        <Text style={[common.smallText, common.textCenter]}>
                            {surah ? `${getSurahName(t, surah)} · ` : ''}
                            {draft.scope === 'single'
                                ? t('memorization.picker.summarySingle', { verse: draft.fromVerse })
                                : t('memorization.picker.summaryRange', { from: draft.fromVerse, to: draft.toVerse, count })}
                        </Text>

                        <AppButton
                            title={t('memorization.picker.start')}
                            icon={<Play size={16} color="#FFFFFF" />}
                            onPress={() => {
                                onSelect(draft);
                                onClose();
                            }}
                        />
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        container: {
            height: '85%',
        },
        surahRow: {
            ...common.row,
            height: ROW_HEIGHT,
            gap: SPACING.md,
            paddingHorizontal: SPACING.sm,
            borderRadius: RADIUS.sm,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        badge: {
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: BADGE_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primary + '20',
        },
        badgeText: {
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
            color: theme.primary,
        },
        arabicName: {
            ...common.arabicText,
            fontSize: FONT_SIZES.large,
            lineHeight: FONT_SIZES.large * 1.5,
        },
        panel: {
            gap: SPACING.md,
            padding: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        // Segmented control: one rounded track with the chosen option filled in
        segments: {
            flexDirection: 'row',
            padding: 3,
            borderRadius: RADIUS.md,
            backgroundColor: theme.background,
        },
        segment: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            borderRadius: RADIUS.md - 2,
        },
        segmentSelected: {
            backgroundColor: theme.primary,
        },
        segmentText: {
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
            color: theme.textSecondary,
        },
        segmentTextSelected: {
            color: '#FFFFFF',
        },
        stepperPair: {
            flexDirection: 'row',
            gap: SPACING.md,
        },
        stepper: {
            flex: 1,
            alignItems: 'center',
            gap: SPACING.xs,
        },
        stepperRow: {
            ...common.row,
            gap: SPACING.sm,
        },
        stepButton: {
            width: STEP_BUTTON_SIZE,
            height: STEP_BUTTON_SIZE,
            borderRadius: STEP_BUTTON_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.primary,
        },
        stepInput: {
            width: 56,
            paddingVertical: SPACING.xs,
            borderRadius: RADIUS.sm,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            color: theme.text,
            fontSize: FONT_SIZES.large,
            fontWeight: '600',
            textAlign: 'center',
        },
    });
};
