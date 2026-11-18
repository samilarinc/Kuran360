import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import type { CommonStyles } from '@/contexts/ThemeContext';
import { Theme, SPACING, RADIUS, FONT_SIZES } from '@/theme';
import { TRANSLATION_FONT_FAMILY, TRANSLATION_FONT_FAMILY_SEMIBOLD } from '@/constants/fonts';
import { AppButton } from '@/components/AppButton';
import { MoonPhase } from '@/components/MoonPhase';
import { HijriNoteEntry, SpecialDayDef, h2jd, hijriToDate, moonPhase, phaseKey } from '@/utils/hijriCalendar';
import { dateLocale } from '@/utils/hijriFormat';

interface HijriDayCardProps {
    year: number;
    month: number;
    day: number;
    special?: SpecialDayDef;
    notes: HijriNoteEntry[];
    onAddNote: (text: string) => void;
    onDeleteNote: (id: string) => void;
}

/** The selected day: its moon, both dates, the special day if any, and the user's notes */
export const HijriDayCard: React.FC<HijriDayCardProps> = ({ year, month, day, special, notes, onAddNote, onDeleteNote }) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [draft, setDraft] = useState('');
    const locale = dateLocale(i18n.language);

    const date = hijriToDate(year, month, day);
    const phase = moonPhase(h2jd(year, month, day));
    const monthName = (t('hijriCalendar.months', { returnObjects: true }) as string[])[month - 1];
    const nightStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);

    const submit = () => {
        if (!draft.trim()) return;
        onAddNote(draft);
        setDraft('');
    };

    return (
        <View style={styles.card}>
            <View style={styles.head}>
                <MoonPhase phase={phase} size={56} litColor={theme.accent} darkColor={theme.border} />
                <View style={styles.headText}>
                    <Text style={styles.title}>{`${day} ${monthName} ${year}`}</Text>
                    <Text style={styles.subtitle}>
                        {date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    <Text style={styles.phase}>
                        {t(`hijriCalendar.phases.${phaseKey(phase)}`)}, {t('hijriCalendar.illumination', { percent: Math.round(phase.illum * 100) })}
                    </Text>
                </View>
            </View>

            {special && (
                <View style={styles.special}>
                    <Text style={styles.specialName}>{t(`specialDays.names.${special.id}`)}</Text>
                    {special.night && (
                        <Text style={styles.specialNote}>
                            {t('hijriCalendar.nightStarts', { date: nightStart.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) })}
                        </Text>
                    )}
                </View>
            )}

            <View style={styles.notes}>
                {notes.map(note => (
                    <View key={note.id} style={styles.note}>
                        <Text style={styles.noteText} selectable>{note.text}</Text>
                        <TouchableOpacity
                            onPress={() => onDeleteNote(note.id)}
                            hitSlop={8}
                            accessibilityLabel={t('hijriCalendar.deleteNote')}
                        >
                            <X size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('hijriCalendar.addNotePlaceholder')}
                        placeholderTextColor={theme.textSecondary}
                        value={draft}
                        onChangeText={setDraft}
                        onSubmitEditing={submit}
                        multiline
                    />
                    {draft.trim().length > 0 && (
                        <AppButton title={t('hijriCalendar.add')} onPress={submit} size="small" />
                    )}
                </View>
                <Text style={styles.hint}>{t('hijriCalendar.savedOnDevice')}</Text>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    card: {
        ...common.card,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    headText: { flex: 1 },
    title: {
        fontFamily: TRANSLATION_FONT_FAMILY_SEMIBOLD,
        fontSize: FONT_SIZES.large,
        color: theme.text,
    },
    subtitle: { fontSize: FONT_SIZES.small, color: theme.text, marginTop: 2 },
    phase: { fontSize: FONT_SIZES.small, color: theme.textSecondary, marginTop: 2 },
    special: {
        marginTop: SPACING.md,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.sm,
        backgroundColor: theme.accent + '24',
    },
    specialName: {
        fontFamily: TRANSLATION_FONT_FAMILY_SEMIBOLD,
        fontSize: FONT_SIZES.medium + 1,
        color: theme.text,
    },
    specialNote: { fontSize: FONT_SIZES.small, color: theme.textSecondary, marginTop: 2 },
    notes: {
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
        gap: SPACING.sm,
    },
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
    noteText: {
        flex: 1,
        fontFamily: TRANSLATION_FONT_FAMILY,
        fontSize: FONT_SIZES.medium,
        lineHeight: FONT_SIZES.medium * 1.55,
        color: theme.text,
    },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    input: {
        flex: 1,
        minHeight: 40,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.background,
        color: theme.text,
        fontSize: FONT_SIZES.medium,
    },
    hint: { fontSize: FONT_SIZES.small - 2, color: theme.textSecondary },
});
